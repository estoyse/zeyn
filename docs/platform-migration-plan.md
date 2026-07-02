# Migration plan: buzzer game → multi-game platform

Turn the codebase from "a buzzer trivia app" into "a platform that hosts many
game types, of which buzzer is the first." Generalized from the buzzer game
alone — the interface is kept minimal and honest, with explicit notes on where
reshaping is likely once a real second game arrives.

---

## 1. Where the buzzer game leaks into otherwise-generic machinery

The stack is already mostly a platform. These are the only places game rules
bleed into the generic layer:

| # | Location | Buzzer-specific thing | Target |
|---|----------|-----------------------|--------|
| 1 | `db/schema/game.ts` `activeGames.subjectIds` | trivia-only column | generic `config` JSON + `gameType` |
| 2 | `db/schema/game.ts` `subjects`, `questions` | buzzer content bank | game-owned content tables |
| 3 | `apps/server/src/game/engine.ts` | buzz/answer/reveal state machine | one implementation behind a `GameModule` interface |
| 4 | `api/game-types.ts` `GameState`, `ClientMessage` | hardcodes subjects, `BUZZ`/`SUBMIT_ANSWER` | `BaseGameState` + per-game extension; per-game action schema |
| 5 | `db/schema/game.ts` `gameQuestionResults` | subject×question result grid | platform scoreboard + game-owned detail |
| 6 | `apps/web` `SubjectPicker`, `GamePlaying`, create form, `useGameState` merge | buzzer UI + buzzer public-state merge | client game registry |

Everything else — auth, rooms, room lifecycle, abandoned-room cron, the
`GameRoom` DO transport shell, WebSocket transport, `JOIN`/`START`, player
scoreboard persistence — is already generic.

---

## 2. Target architecture

### 2.1 The core abstraction: a `GameModule`

Each game type implements one contract. It splits cleanly into three homes so
the untrusted-client parts are shared and the server-only parts stay server-side:

- **Shared** (`packages/api`, imported by both server and web): `gameType` id,
  metadata (title, description, min/max players), `configSchema` (zod, validates
  room-creation config), `actionSchema` (zod discriminated union of the game's
  client messages), and the `BaseGameState` + per-game state-extension types.
- **Server** (`apps/server`): the pure engine (transitions), the serializer
  (state → public view), and DB hooks (content hydration, results persistence).
- **Client** (`apps/web`): React pieces — create-config form, in-lobby extras,
  the playing view, and a results view.

```ts
// packages/api — shared contract (types + schemas + meta only)
interface GameModuleShared<Config, Action, StateExt> {
  type: string;                       // "buzzer"
  meta: { title: string; description: string; minPlayers: number; maxPlayers: number };
  configSchema: ZodType<Config>;      // validates createRoom config
  actionSchema: ZodType<Action>;      // the game's client messages
}

// apps/server — server engine behind the same type id
interface GameEngine<Config, Action, StateExt> {
  createInitialState(base: BaseGameState, config: Config): StateExt;
  join(state: FullState, params: JoinParams): EngineDirectives;      // stays generic-ish
  start(state: FullState, playerId: string, now: number): EngineDirectives;
  handleAction(state: FullState, action: Action, playerId: string, now: number): EngineDirectives;
  handleTimeout(state: FullState, now: number): EngineDirectives;
  toPublicState(state: FullState, opts: { forceFullPlayers?: boolean }): unknown;
  needsHydration(state: FullState): boolean;                          // e.g. subjects not loaded
  hydrate(state: FullState, room: RoomRecord, db: Db): Promise<void>; // load content
  persistResults(state: FullState, db: Db): Promise<void>;
  loadResults(gameId: string, db: Db): Promise<unknown>;             // for the results endpoint
}
```

`EngineDirectives` (already exists) stays exactly as-is — it's already a clean,
game-agnostic side-effect description.

### 2.2 State shape

```ts
interface BaseGameState {
  status: "WAITING" | "PLAYING" | "FINISHED";
  gameType: string;
  gameId: string | null;
  gameName: string | null;
  hostId: string | null;
  maxPlayers: number;
  isPublic: boolean;
  hasPassword: boolean;
  players: Record<string, Player>;
}
type FullState<TExt> = BaseGameState & { game: TExt };
```

Buzzer's `TExt` holds `subjects`, `currentSubjectIndex`, `currentQuestionIndex`,
`phase`, `activeQuestionState`, `questionResults` — i.e. everything currently
flat on `GameState` that isn't in `BaseGameState`.

### 2.3 Message protocol

Platform owns `JOIN` / `START` (and later `LEAVE`). The game module owns the
rest. The DO validates against `union(platformSchema, module.actionSchema)`, so
existing flat messages (`BUZZ`, `SUBMIT_ANSWER`) keep working without an
envelope — the buzzer module's `actionSchema` is just the two of them lifted out
of today's `clientMessageSchema`.

### 2.4 The registries

- **Server registry** (`apps/server/src/games/registry.ts`): `Record<gameType, GameEngine>`.
- **Shared registry** (`packages/api/src/games/registry.ts`): `Record<gameType, GameModuleShared>`.
- **Client registry** (`apps/web/src/features/games/registry.ts`):
  `Record<gameType, { meta, CreateForm, PlayingView, ResultsView, useActions }>`.

Adding a game = one entry in each registry + one migration for its content
tables (if any). **No new Durable Object binding** — one `GameRoom` DO class
serves every game type, dispatching by the room's `gameType`.

### 2.5 The `GameRoom` DO becomes fully generic

On first hydration it reads `gameType` from the room row, looks up the engine in
the server registry, and routes every message/alarm through it. It stops
importing `../game/engine` directly. Serializer and repository calls become
module method calls.

---

## 3. Schema changes

```
activeGames:
  + gameType   text  NOT NULL DEFAULT 'buzzer'
  + config     text  NOT NULL DEFAULT '{}'   // game-specific room config
  - subjectIds                               // backfilled into config.subjectIds, then dropped

gameHistory:
  + gameType   text  NOT NULL DEFAULT 'buzzer'
  ~ subjects → keep for buzzer; detail becomes game-owned (see below)

gamePlayerResults:  unchanged — the universal per-player scoreboard (works for any scored game)
gameQuestionResults: becomes a buzzer-owned detail table (platform never touches it)
subjects / questions: buzzer-owned content tables (unchanged; namespace later if desired)
```

**Results split:** the platform owns `gameHistory` (+ `gameType`) and
`gamePlayerResults` (player → final score, universal). Detailed per-move results
stay game-owned: buzzer keeps `gameQuestionResults` and its indexes. The
`getResults` endpoint dispatches to the module's `loadResults`. This avoids a
speculative one-size-fits-all results table while keeping the common
"scoreboard" query fast and shared.

**Backfill migration:** copy each row's `subjectIds` into
`config = json('{"subjectIds": <ids>}')`, set `gameType='buzzer'`, then drop
`subjectIds`. Existing history rows default cleanly to `gameType='buzzer'`.

---

## 4. tRPC surface

- `roomRouter` (platform): `createRoom`, `getPublicRooms`, `getRoomConfig`,
  `getRoomStatus`, `getHistory`, `getResults`.
  - `createRoom` gains `gameType` + `config`; it validates `config` against
    `registry[gameType].configSchema` before insert.
  - `getResults` dispatches to `registry[gameType].loadResults`.
  - `getPublicRooms` / `getHistory` return `gameType` so the UI can badge/route.
- Per-game sub-router for game-specific content: `buzzer.getSubjects` (today's
  `getSubjects` moves here). Merged into `appRouter` from the registry.

---

## 5. Web changes

- **Game catalog:** a real games list (the landing `FeaturedGames` already
  gestures at this). Dashboard/landing surface available game types from the
  client registry.
- **Create flow:** `/game/create/$gameType` (or a game picker step first). The
  shared shell renders `GeneralConfigCard`; the game module renders its own
  config panel (buzzer → `SubjectPicker`). `useCreateGameForm` splits into a
  generic part (name/players/visibility/password) + a module-provided config
  part.
- **Play flow:** `game.$gameId` fetches room config → reads `gameType` → renders
  `registry[gameType].PlayingView`. The lobby, header, player list, connection
  handling, error/password views stay in the shared room shell.
- **Sockets/state:** `useSocket` is already generic. `useGameState`'s player-
  delta merge is generic (keep it); the buzzer-specific merge (`currentQuestion`,
  `currentSubjectName`) moves into the module's client code. `useGame` passes the
  module's action senders through unchanged.

---

## 6. Phasing (each phase ships independently; buzzer keeps working throughout)

- **Phase 0 — Schema prep. ✅ DONE.** Added `gameType` + `config` columns to
  `active_games` (+ `gameType` to `game_history`); migration `0007` backfills
  `config` from `subject_ids`. `subject_ids` kept in parallel (dropped in a later
  phase) so the repository/router keep working. No behavior change.
- **Phase 1 — Introduce the contract, buzzer as the sole module. ✅ DONE.**
  Introduced `BaseGameState` (`GameState extends` it, `gameType` added); moved
  `EngineDirectives` into `packages/api`; split the message schema into
  `platformMessageSchema` + `buzzerActionSchema`. Added the shared meta registry
  (`packages/api/src/games`), the server `RoomGame` contract + buzzer module
  (`apps/server/src/games/buzzer`, composing the moved engine/serializer/
  repository), and the server registry (`createRoomGame` / `getRoomGameType` /
  `updateRoomStatus`). The `GameRoom` DO is now fully generic: it resolves the
  engine from the registry by the room's `gameType` and dispatches all messages,
  alarms, serialization, and persistence through it. Validation is
  `platformMessageSchema` → the room game's `actionSchema`. 78 engine tests still
  pass; full workspace typechecks.
  - **Deferred within Phase 1 (intentionally, to keep blast radius small):**
    buzzer state is *not yet* physically nested under a `game` key — buzzer fields
    still sit flat on `GameState` (which extends `BaseGameState`). The DO only
    touches base fields, so this is invisible to it. Physical nesting can happen
    alongside Phase 2 when the web merge logic is touched anyway.

  **NOTE on remaining phases:** the tRPC `createRoom`/`getResults` and the web
  create/play flow still use `subjectIds` directly — untouched by Phase 1 and
  fully working. Those are Phase 3/4.
- **Phase 2 — Generalize protocol + results.** `union(platform, module.action)`
  validation; per-game `loadResults`; move `gameQuestionResults` to buzzer-owned.
- **Phase 3 — Generalize tRPC.** `createRoom` takes `gameType`+`config`;
  per-game sub-routers; list endpoints return `gameType`.
- **Phase 4 — Web registry + catalog.** Game picker, game-type-aware create/play
  routes, split `useCreateGameForm`/`useGameState`, module-rendered views.
- **Phase 5 — Second game (later).** Add one module across the three registries
  + its content migration. This is where the interface gets validated for real;
  expect minor reshaping of `GameEngine` then.

---

## 7. Risks & call-outs

- **DO persisted state shape changes** (buzzer fields move under `game`). The DO
  reads `ctx.storage.get<GameState>("state")` on wake. Add a `stateVersion` key;
  on mismatch, discard saved state. Rooms are ephemeral (30-min abandoned-room
  cron, short matches), and only `waiting` rooms re-hydrate cleanly — accept that
  the rare in-flight game at deploy time resets. Cheaper than writing a storage
  migration.
- **Single DO binding is a feature, not a limit.** Dispatching by `gameType`
  inside one `GameRoom` class means new games never touch
  `packages/infra/alchemy.run.ts` bindings.
- **Don't over-abstract from one game.** `join`/`start`/timeout are modeled on
  buzzer's turn-based, host-starts, scored shape. A real-time or non-scored game
  will bend `EngineDirectives`/`persistResults`. Keep Phase 5 in mind and resist
  generalizing beyond buzzer until then.
- **`fuzzy-match.ts`** is buzzer-only; it moves into the buzzer module.
- **Naming.** "room" vs "game" vs "arena" vs "match" is currently mixed
  (`activeGames`, "Arena" in UI, `gameId`). Worth settling a vocabulary in
  Phase 1 even if table names stay for migration-churn reasons.
