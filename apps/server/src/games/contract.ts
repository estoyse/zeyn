import type {
  BaseGameState,
  BasePublicGameState,
  EngineDirectives,
} from "@zeyn/api/game-types";

/** Parameters the platform passes to a game when admitting a player. */
export interface JoinParams {
  playerId: string;
  name: string;
  isGuest: boolean;
  password?: string;
  /** The room's real password (never part of broadcast state); null if open. */
  roomPassword: string | null;
}

/** What `hydrate` reports back to the durable object after the first join. */
export interface HydrateResult {
  /** Error directives if the room can't be joined; otherwise an empty object. */
  directives: EngineDirectives;
  /** The room's secret password for the DO to persist; null if the room is open. */
  roomPassword: string | null;
}

/**
 * A live game instance owned by one GameRoom durable object. The durable object
 * is a transport shell: it owns the opaque state blob and the sockets, and routes
 * every message, alarm, and broadcast through this interface. All game rules —
 * state transitions, DB hydration, result persistence, and the public-state view
 * sent to clients — live behind it.
 *
 * State is typed as `BaseGameState` here because the DO treats it opaquely; each
 * implementation narrows to its own concrete state internally.
 */
export interface RoomGame {
  readonly type: string;

  /** The fresh, un-hydrated state a brand-new room starts from. */
  createInitialState(): BaseGameState;

  /**
   * First-join hydration: load the room row and any game content into `state`.
   * Returns error directives (with `closeSocket`) if the room can't be joined,
   * and the room's password for the DO to persist across hibernation.
   */
  hydrate(state: BaseGameState, gameId: string): Promise<HydrateResult>;

  /** Validate and admit a player, or reconnect an existing one. */
  join(state: BaseGameState, params: JoinParams): EngineDirectives;

  /** Host starts the match; content was already loaded at hydrate. */
  start(
    state: BaseGameState,
    playerId: string,
    now: number
  ): Promise<EngineDirectives>;

  /** A game-specific action, already validated against the module's schema. */
  handleAction(
    state: BaseGameState,
    action: unknown,
    now: number
  ): EngineDirectives;

  /** Fired when a scheduled phase deadline elapses. */
  handleTimeout(state: BaseGameState, now: number): EngineDirectives;

  /** Build the public view broadcast to clients. */
  toPublic(
    state: BaseGameState,
    forceFullPlayers?: boolean
  ): BasePublicGameState;

  /** Flush a finished match to the history tables. */
  persistResults(state: BaseGameState): Promise<void>;
}

/** Creates a per-room game instance for a given game type. */
export type RoomGameFactory = (db: D1Database) => RoomGame;
