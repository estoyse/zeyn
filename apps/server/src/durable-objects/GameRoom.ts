import { DurableObject } from "cloudflare:workers";
import type { Env } from "@shaxsiy-oyin/env/server";
import {
  platformMessageSchema,
  type BaseGameState,
  type EngineDirectives,
  type PlatformMessage,
} from "@shaxsiy-oyin/api/game-types";
import { getGameMeta } from "@shaxsiy-oyin/api/games";
import type { RoomGame } from "../games/contract";
import {
  createRoomGame,
  getRoomGameType,
  updateRoomStatus,
  DEFAULT_GAME_TYPE,
} from "../games/registry";

// Attachment stored on each accepted WebSocket so we can attribute close events.
// Persisted via serializeAttachment so it survives DO hibernation (in-memory
// properties on the socket would be lost when the DO is evicted between events).
type SocketMeta = { playerId: string; joinTime: number };
function readMeta(ws: WebSocket): SocketMeta | null {
  const attachment = ws.deserializeAttachment();
  return attachment && typeof attachment === "object"
    ? (attachment as SocketMeta)
    : null;
}

/**
 * Durable Object that owns one game room, regardless of game type. It is a thin
 * transport shell: it accepts sockets, validates client messages, routes them to
 * the room's game engine (resolved from the registry by the room's `gameType`),
 * carries out the side effects those return, and broadcasts the serialized public
 * state. It knows no game's rules — those live behind the `RoomGame` interface.
 */
export class GameRoom extends DurableObject<Env> {
  private game: RoomGame;
  private state: BaseGameState;
  private gameType: string;
  private gameTypeResolved = false;
  private gamePassword: string | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Start from the default game so `state`/`game` are always non-null; the
    // real type is resolved from storage (on wake) or the room row (first join).
    this.gameType = DEFAULT_GAME_TYPE;
    this.game = createRoomGame(this.gameType, env.DB);
    this.state = this.game.createInitialState();

    this.ctx.blockConcurrencyWhile(async () => {
      const savedType = await this.ctx.storage.get<string>("gameType");
      if (savedType) {
        this.gameType = savedType;
        this.gameTypeResolved = true;
        if (savedType !== DEFAULT_GAME_TYPE) {
          this.game = createRoomGame(savedType, env.DB);
        }
      }
      const saved = await this.ctx.storage.get<BaseGameState>("state");
      if (saved) this.state = saved;
      // Persisted so a password-protected room stays protected if the DO is
      // evicted after hydration (empty string means "no password").
      const secret = await this.ctx.storage.get<string>("gamePassword");
      if (secret) this.gamePassword = secret;
    });
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") === "websocket") {
      const gameId = new URL(request.url).pathname.match(
        /\/game\/([^/]+)\/ws/
      )?.[1];
      if (gameId) await this.resolveGameType(gameId);
      return this.handleWebSocket();
    }
    return new Response("Not found", { status: 404 });
  }

  /**
   * Pin this room to its real game type. Looked up from the room row once per DO
   * lifetime, then persisted; a no-op after the first resolution or on wake from
   * hibernation (where the type is restored from storage).
   */
  private async resolveGameType(gameId: string) {
    if (this.gameTypeResolved) return;
    const gameType = (await getRoomGameType(this.env.DB, gameId)) ?? this.gameType;
    if (gameType !== this.gameType) {
      this.gameType = gameType;
      this.game = createRoomGame(gameType, this.env.DB);
      // Safe: a fresh, unhydrated room hasn't started, so no state is lost.
      if (!this.state.gameId) this.state = this.game.createInitialState();
    }
    this.gameTypeResolved = true;
    await this.ctx.storage.put("gameType", this.gameType);
  }

  private handleWebSocket(): Response {
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);

    server.send(
      JSON.stringify({
        type: "STATE_UPDATE",
        state: this.game.toPublic(this.state, true),
        serverTime: Date.now(),
      })
    );

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;

    // Validate the untrusted client payload before it reaches any handler: parse
    // JSON, then check the shape against the platform schema first and, failing
    // that, the room game's own action schema. Anything malformed is rejected.
    let raw: unknown;
    try {
      raw = JSON.parse(message);
    } catch {
      ws.send(
        JSON.stringify({ type: "ERROR", message: "Invalid message format" })
      );
      return;
    }

    const now = Date.now();
    let playerId: string;
    let directives: EngineDirectives;

    const platform = platformMessageSchema.safeParse(raw);
    if (platform.success) {
      const action = platform.data;
      playerId = action.playerId;
      directives =
        action.type === "JOIN"
          ? await this.onJoin(action)
          : await this.onStart(action, now);
    } else {
      const meta = getGameMeta(this.gameType);
      const parsed = meta?.actionSchema.safeParse(raw);
      if (!parsed?.success) {
        ws.send(
          JSON.stringify({ type: "ERROR", message: "Invalid message format" })
        );
        return;
      }
      const action = parsed.data as { playerId: string };
      playerId = action.playerId;
      directives = this.game.handleAction(this.state, action, now);
    }

    await this.applyDirectives(directives, ws, playerId);
    await this.saveState();
    this.broadcast();
  }

  /** Resolve the game type, then hand off to the room game's hydrate/join. */
  private async onJoin(
    action: Extract<PlatformMessage, { type: "JOIN" }>
  ): Promise<EngineDirectives> {
    await this.resolveGameType(action.gameId);

    if (!this.state.gameId) {
      const { directives, roomPassword } = await this.game.hydrate(
        this.state,
        action.gameId
      );
      if (directives.reply) return directives;
      this.gamePassword = roomPassword;
      await this.ctx.storage.put("gamePassword", roomPassword ?? "");
    }

    return this.game.join(this.state, {
      playerId: action.playerId,
      name: action.name,
      password: action.password,
      roomPassword: this.gamePassword,
    });
  }

  private async onStart(
    action: Extract<PlatformMessage, { type: "START" }>,
    now: number
  ): Promise<EngineDirectives> {
    return this.game.start(this.state, action.playerId, now);
  }

  /** Execute the side effects a transition asked for. */
  private async applyDirectives(
    d: EngineDirectives,
    ws?: WebSocket,
    playerId?: string
  ) {
    if (ws && d.reply) ws.send(JSON.stringify(d.reply));
    if (ws && playerId && d.accepted) {
      ws.serializeAttachment({
        playerId,
        joinTime: Date.now(),
      } satisfies SocketMeta);
    }

    if (d.updateRoomStatus && this.state.gameId) {
      const gameId = this.state.gameId;
      const status = d.updateRoomStatus;
      await this.guard(
        () => updateRoomStatus(this.env.DB, gameId, status),
        "update room status"
      );
    }
    if (d.persistResults) {
      await this.guard(
        () => this.game.persistResults(this.state),
        "persist results"
      );
    }

    if (d.cancelAlarm) {
      await this.ctx.storage.deleteAlarm();
    } else if (d.alarmAt !== undefined) {
      await this.ctx.storage.setAlarm(d.alarmAt);
    }

    if (ws && d.closeSocket) ws.close();
  }

  // Fired by the runtime when a scheduled phase deadline elapses. Durable Object
  // alarms are persisted and survive hibernation/eviction, so a game can't stall
  // mid-question if the DO is evicted between events.
  async alarm() {
    const directives = this.game.handleTimeout(this.state, Date.now());
    await this.applyDirectives(directives);
    await this.saveState();
    this.broadcast();
  }

  async webSocketClose(
    ws: WebSocket,
    _code: number,
    _reason: string,
    _wasClean: boolean
  ) {
    const self = readMeta(ws);
    const player = self && this.state.players[self.playerId];
    if (!self || !player) return;

    // Only mark disconnected if no newer connection for this player exists.
    const hasNewerConnection = this.ctx.getWebSockets().some(s => {
      const other = readMeta(s);
      return other?.playerId === self.playerId && other.joinTime > self.joinTime;
    });

    if (!hasNewerConnection) {
      player.connected = false;
      await this.saveState();
      this.broadcast();
    }
  }

  async webSocketError(ws: WebSocket) {
    await this.webSocketClose(ws, 1011, "Error", false);
  }

  private broadcast() {
    const data = JSON.stringify({
      type: "STATE_UPDATE",
      state: this.game.toPublic(this.state),
      serverTime: Date.now(),
    });
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(data);
      } catch {
        // Socket may be closing; the next broadcast / close event handles it.
      }
    }
  }

  private async saveState() {
    await this.guard(
      () => this.ctx.storage.put("state", this.state),
      "save state"
    );
  }

  /** Run a side effect, logging (but not throwing on) failures. */
  private async guard(fn: () => Promise<unknown>, label: string) {
    try {
      await fn();
    } catch (e) {
      console.error(`GameRoom failed to ${label}:`, e);
    }
  }
}
