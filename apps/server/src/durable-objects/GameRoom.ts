import { DurableObject } from "cloudflare:workers";
import type { Env } from "@shaxsiy-oyin/env/server";
import type { ClientMessage, GameState } from "@shaxsiy-oyin/api/game-types";
import {
  buzz,
  createInitialState,
  hydrateRoom,
  join,
  start,
  submitAnswer,
  handleTimeout,
  type EngineDirectives,
} from "../game/engine";
import { GameRepository } from "../game/repository";
import { StateSerializer } from "../game/serializer";

// Attachment stored on each accepted WebSocket so we can attribute close events.
type SocketMeta = { playerId?: string; joinTime?: number };
const meta = (ws: WebSocket): SocketMeta => ws as unknown as SocketMeta;

/**
 * Durable Object that owns one game room. It is a thin transport shell: it
 * accepts sockets, routes client messages to the pure `engine` transitions,
 * carries out the side effects those return via the `repository`, and broadcasts
 * the serialized public state. All game rules live in `../game/engine`.
 */
export class GameRoom extends DurableObject<Env> {
  private state: GameState = createInitialState();
  private gamePassword: string | null = null;
  private readonly serializer = new StateSerializer();
  private readonly repo: GameRepository;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.repo = new GameRepository(env.DB);
    this.ctx.blockConcurrencyWhile(async () => {
      const saved = await this.ctx.storage.get<GameState>("state");
      if (saved) this.state = saved;
      // Persisted so a password-protected room stays protected if the DO is
      // evicted after hydration (empty string means "no password").
      const secret = await this.ctx.storage.get<string>("gamePassword");
      if (secret) this.gamePassword = secret;
    });
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket();
    }
    return new Response("Not found", { status: 404 });
  }

  private handleWebSocket(): Response {
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);

    server.send(
      JSON.stringify({
        type: "STATE_UPDATE",
        state: this.serializer.toPublic(this.state, true),
        serverTime: Date.now(),
      })
    );

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;

    let action: ClientMessage;
    try {
      action = JSON.parse(message);
    } catch {
      ws.send(
        JSON.stringify({ type: "ERROR", message: "Invalid message format" })
      );
      return;
    }

    const now = Date.now();
    let directives: EngineDirectives;
    switch (action.type) {
      case "JOIN":
        directives = await this.onJoin(action);
        break;
      case "START":
        directives = await this.onStart(action, now);
        break;
      case "BUZZ":
        directives = buzz(this.state, action.playerId, now);
        break;
      case "SUBMIT_ANSWER":
        directives = submitAnswer(
          this.state,
          action.playerId,
          action.answer,
          now
        );
        break;
      default:
        return;
    }

    await this.applyDirectives(directives, ws, action);
    await this.saveState();
    this.broadcast();
  }

  /** Hydrate the room from the DB on first join, then admit the player. */
  private async onJoin(
    action: Extract<ClientMessage, { type: "JOIN" }>
  ): Promise<EngineDirectives> {
    if (!this.state.gameId) {
      const room = await this.repo.getRoom(action.gameId);
      const hydrated = hydrateRoom(this.state, action.gameId, room);
      if (hydrated.reply) return hydrated;

      this.gamePassword = room!.password;
      await this.ctx.storage.put("gamePassword", room!.password ?? "");
      this.state.subjects = await this.repo.loadSubjects(room!.subjectIds);
    }

    return join(this.state, {
      playerId: action.playerId,
      name: action.name,
      password: action.password,
      roomPassword: this.gamePassword,
    });
  }

  /** Lazily load subjects if the host supplied ids, then start the match. */
  private async onStart(
    action: Extract<ClientMessage, { type: "START" }>,
    now: number
  ): Promise<EngineDirectives> {
    if (this.state.subjects.length === 0 && action.subjectIds?.length) {
      this.state.subjects = await this.repo.loadSubjects(action.subjectIds);
    }
    return start(this.state, action.playerId, now);
  }

  /** Execute the side effects a transition asked for. */
  private async applyDirectives(
    d: EngineDirectives,
    ws?: WebSocket,
    action?: ClientMessage
  ) {
    if (ws && d.reply) ws.send(JSON.stringify(d.reply));
    if (ws && action && d.accepted) {
      meta(ws).playerId = action.playerId;
      meta(ws).joinTime = Date.now();
    }

    if (d.updateRoomStatus && this.state.gameId) {
      const gameId = this.state.gameId;
      const status = d.updateRoomStatus;
      await this.guard(
        () => this.repo.updateRoomStatus(gameId, status),
        "update room status"
      );
    }
    if (d.persistResults) {
      await this.guard(
        () => this.repo.persistResults(this.state),
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
    const directives = handleTimeout(this.state, Date.now());
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
    const { playerId, joinTime } = meta(ws);
    if (!playerId || !this.state.players[playerId]) return;

    // Only mark disconnected if no newer connection for this player exists.
    const hasNewerConnection = this.ctx
      .getWebSockets()
      .some(
        s =>
          meta(s).playerId === playerId &&
          (meta(s).joinTime ?? 0) > (joinTime ?? 0)
      );

    if (!hasNewerConnection) {
      this.state.players[playerId].connected = false;
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
      state: this.serializer.toPublic(this.state),
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
