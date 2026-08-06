import {
  livebuzzerActionSchema,
  platformMessageSchema,
  roomLimits,
  sanitizeName,
  type EngineDirectives,
  type PlatformMessage,
  type ServerMessage,
} from "@zeyn/api/game-types";
import { livebuzzerConfigSchema, type LivebuzzerState } from "@zeyn/api/games";
import {
  CLOSE_CODE,
  SocketServer,
  type HttpRequestInfo,
  type HttpResponseInfo,
  type TimerHandle,
  type WsRequestInfo,
} from "@zeyn/ws-server";
import { buildGuestPage } from "./guest-page";
import {
  createLivebuzzerLocalGame,
  type LocalRoomGame,
} from "./livebuzzer-game";
import { LOCAL_ERROR_CODE, localHelloSchema, localWelcome } from "./protocol";
import type { LocalGameHostOptions } from "./types";

const DEFAULT_HELLO_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_REPLAY_STEPS = 64;
const DEFAULT_MAX_FAILED_HELLOS_PER_PEER = 5;
const DEFAULT_FAILED_HELLO_WINDOW_MS = 30_000;
const MAX_TRACKED_PEERS = 256;

interface SocketMeta {
  playerId: string;
  deviceId: string;
  joinSeq: number;
}

function clampMaxPlayers(value: number | undefined): number {
  if (value === undefined) return roomLimits.maxPlayers;
  const whole = Math.trunc(value);
  if (whole < roomLimits.minPlayers) return roomLimits.minPlayers;
  if (whole > roomLimits.maxPlayers) return roomLimits.maxPlayers;
  return whole;
}

export class LocalGameHost {
  readonly nonce: string;
  readonly hostPlayerId: string;

  private readonly options: LocalGameHostOptions;
  private readonly now: () => number;
  private readonly helloTimeoutMs: number;
  private readonly maxFailedHellosPerPeer: number;
  private readonly failedHelloWindowMs: number;
  private readonly mintPlayerId: () => string;
  private readonly guestPage: string;
  private readonly game: LocalRoomGame;
  private readonly gameState: LivebuzzerState;
  private readonly server: SocketServer;

  private readonly sockets = new Map<string, SocketMeta>();
  private readonly pendingHello = new Map<string, TimerHandle>();
  private readonly playerIdByDevice = new Map<string, string>();
  private readonly socketAddresses = new Map<string, string>();
  private readonly failedHellos = new Map<string, number[]>();

  private alarmAt: number | null = null;
  private alarmHandle: TimerHandle | null = null;
  private nextPlayerNumber = 1;
  private nextJoinSeq = 1;

  constructor(options: LocalGameHostOptions) {
    this.options = options;
    this.now = options.now;
    this.nonce = options.nonce;
    this.helloTimeoutMs = options.helloTimeoutMs ?? DEFAULT_HELLO_TIMEOUT_MS;
    this.maxFailedHellosPerPeer =
      options.maxFailedHellosPerPeer ?? DEFAULT_MAX_FAILED_HELLOS_PER_PEER;
    this.failedHelloWindowMs =
      options.failedHelloWindowMs ?? DEFAULT_FAILED_HELLO_WINDOW_MS;
    this.mintPlayerId =
      options.createPlayerId ??
      (() => {
        const id = `p${this.nextPlayerNumber}`;
        this.nextPlayerNumber += 1;
        return id;
      });
    this.guestPage = options.guestPage ?? buildGuestPage();

    this.game = createLivebuzzerLocalGame();
    this.gameState = this.game.createInitialState();
    this.hostPlayerId = this.mintPlayerId();

    this.gameState.gameId = options.roomId ?? "local";
    this.gameState.gameName = options.roomName ?? "Local room";
    this.gameState.hostId = this.hostPlayerId;
    this.gameState.maxPlayers = clampMaxPlayers(options.maxPlayers);
    this.gameState.isPublic = false;
    this.gameState.hasPassword = false;
    this.gameState.allowGuests = true;
    this.gameState.config = livebuzzerConfigSchema.parse(options.config ?? {});
    this.playerIdByDevice.set(options.hostDeviceId, this.hostPlayerId);

    this.server = new SocketServer({
      listener: options.listener,
      timers: options.timers,
      hooks: {
        onOpen: (id, request) => this.onOpen(id, request),
        onMessage: (id, data) => this.onMessage(id, data),
        onClose: (id) => this.onClose(id),
      },
      responder: { respond: (request) => this.respondHttp(request) },
      limits: options.limits,
      maxConnections: options.maxConnections,
      heartbeatIntervalMs: options.heartbeatIntervalMs,
      originPolicy: options.originPolicy,
    });
  }

  get state(): Readonly<LivebuzzerState> {
    return this.gameState;
  }

  get playerCount(): number {
    return Object.keys(this.gameState.players).length;
  }

  get connectionCount(): number {
    return this.server.connectionCount;
  }

  get trackedFailedHelloPeers(): number {
    return this.failedHellos.size;
  }

  get alarmTime(): number | null {
    return this.alarmAt;
  }

  resume(): void {
    this.runDueTimeouts();
  }

  stop(): void {
    this.clearAlarmTimer();
    this.alarmAt = null;
    for (const handle of this.pendingHello.values()) {
      this.options.timers.clearTimeout(handle);
    }
    this.pendingHello.clear();
    this.sockets.clear();
    this.socketAddresses.clear();
    this.failedHellos.clear();
    this.server.stop();
  }

  private onOpen(id: string, request: WsRequestInfo): void {
    const address = request.remoteAddress;
    if (address !== undefined) {
      this.socketAddresses.set(id, address);
      if (this.isPeerThrottled(address)) {
        this.sendError(
          id,
          "Too many failed attempts, try again later",
          LOCAL_ERROR_CODE.THROTTLED
        );
        this.server.close(id, CLOSE_CODE.POLICY_VIOLATION, "throttled");
        return;
      }
    }

    if (this.helloTimeoutMs <= 0) return;
    const handle = this.options.timers.setTimeout(() => {
      this.pendingHello.delete(id);
      if (this.sockets.has(id)) return;
      this.recordFailedHello(id);
      this.sendError(id, "Handshake timed out", LOCAL_ERROR_CODE.HELLO_TIMEOUT);
      this.server.close(id, CLOSE_CODE.POLICY_VIOLATION, "hello timeout");
    }, this.helloTimeoutMs);
    this.pendingHello.set(id, handle);
  }

  private onMessage(id: string, data: string): void {
    const meta = this.sockets.get(id);
    if (meta === undefined) {
      this.handleHello(id, data);
      return;
    }
    this.handleAction(id, meta, data);
  }

  private onClose(id: string): void {
    this.clearHelloDeadline(id);
    this.socketAddresses.delete(id);
    const meta = this.sockets.get(id);
    if (meta === undefined) return;
    this.sockets.delete(id);

    const player = this.gameState.players[meta.playerId];
    if (player === undefined) return;

    for (const other of this.sockets.values()) {
      if (other.playerId === meta.playerId && other.joinSeq > meta.joinSeq) {
        return;
      }
    }

    player.connected = false;
    this.broadcast();
  }

  private handleHello(id: string, data: string): void {
    let raw: unknown;
    try {
      raw = JSON.parse(data);
    } catch {
      this.rejectHello(id, "Invalid message format", LOCAL_ERROR_CODE.BAD_HELLO);
      return;
    }

    const hello = localHelloSchema.safeParse(raw);
    if (!hello.success) {
      this.rejectHello(
        id,
        "Expected a HELLO handshake",
        LOCAL_ERROR_CODE.BAD_HELLO
      );
      return;
    }
    if (hello.data.nonce !== this.nonce) {
      this.rejectHello(
        id,
        "Incorrect room code",
        LOCAL_ERROR_CODE.BAD_NONCE
      );
      return;
    }

    const deviceId = hello.data.deviceId;
    const playerId = this.playerIdByDevice.get(deviceId) ?? this.mintPlayerId();
    const directives = this.game.join(this.gameState, {
      playerId,
      name: sanitizeName(hello.data.name),
      isGuest: true,
      roomPassword: null,
    });

    if (!directives.accepted) {
      if (directives.reply) {
        this.server.send(id, JSON.stringify(directives.reply));
      }
      this.clearHelloDeadline(id);
      this.server.close(id, CLOSE_CODE.POLICY_VIOLATION, "join rejected");
      return;
    }

    this.clearHelloDeadline(id);
    this.clearFailedHellos(id);
    this.playerIdByDevice.set(deviceId, playerId);
    this.sockets.set(id, { playerId, deviceId, joinSeq: this.nextJoinSeq });
    this.nextJoinSeq += 1;
    this.server.send(id, JSON.stringify(localWelcome(playerId)));

    this.applyDirectives(directives, id);
    if (!directives.noChange) this.broadcast();
    this.sendSnapshot(id);
  }

  private handleAction(id: string, meta: SocketMeta, data: string): void {
    let raw: unknown;
    try {
      raw = JSON.parse(data);
    } catch {
      this.sendError(id, "Invalid message format");
      return;
    }

    const now = this.now();
    const playerId = meta.playerId;
    let directives: EngineDirectives;

    const platform = platformMessageSchema.safeParse(raw);
    if (platform.success) {
      const action = { ...platform.data, playerId };
      directives =
        action.type === "JOIN"
          ? this.onJoin(action)
          : this.game.start(this.gameState, action.playerId, now);
    } else {
      const parsed = livebuzzerActionSchema.safeParse(raw);
      if (!parsed.success) {
        this.sendError(id, "Invalid message format");
        return;
      }
      const action = { ...(parsed.data as object), playerId };
      directives = this.game.handleAction(this.gameState, action, now);
    }

    this.applyDirectives(directives, id);
    if (!directives.noChange) this.broadcast();
    if (directives.accepted) this.sendSnapshot(id);
  }

  private onJoin(
    action: Extract<PlatformMessage, { type: "JOIN" }>
  ): EngineDirectives {
    return this.game.join(this.gameState, {
      playerId: action.playerId,
      name: sanitizeName(action.name),
      isGuest: true,
      roomPassword: null,
    });
  }

  private applyDirectives(directives: EngineDirectives, id?: string): void {
    if (id !== undefined && directives.reply) {
      this.server.send(id, JSON.stringify(directives.reply));
    }

    if (directives.cancelAlarm) {
      this.clearAlarm();
    } else if (directives.alarmAt !== undefined) {
      this.setAlarm(directives.alarmAt);
    }

    if (id !== undefined && directives.closeSocket) {
      this.server.close(id, CLOSE_CODE.NORMAL, "");
    }
  }

  private runDueTimeouts(): void {
    for (let step = 0; step < MAX_TIMEOUT_REPLAY_STEPS; step += 1) {
      const deadline = this.alarmAt;
      if (deadline === null) return;
      if (this.now() < deadline) break;

      this.clearAlarm();
      if (this.gameState.status === "FINISHED") return;

      const directives = this.game.handleTimeout(this.gameState, deadline);
      this.applyDirectives(directives);
      if (!directives.noChange) this.broadcast();
    }
    this.rearmAlarm();
  }

  private rearmAlarm(): void {
    if (this.alarmAt === null || this.alarmHandle !== null) return;
    this.setAlarm(this.alarmAt);
  }

  private setAlarm(at: number): void {
    this.clearAlarmTimer();
    this.alarmAt = at;
    const delay = Math.max(0, at - this.now());
    this.alarmHandle = this.options.timers.setTimeout(() => {
      this.alarmHandle = null;
      this.runDueTimeouts();
    }, delay);
  }

  private clearAlarm(): void {
    this.clearAlarmTimer();
    this.alarmAt = null;
  }

  private clearAlarmTimer(): void {
    if (this.alarmHandle === null) return;
    this.options.timers.clearTimeout(this.alarmHandle);
    this.alarmHandle = null;
  }

  private clearHelloDeadline(id: string): void {
    const handle = this.pendingHello.get(id);
    if (handle === undefined) return;
    this.options.timers.clearTimeout(handle);
    this.pendingHello.delete(id);
  }

  private rejectHello(id: string, message: string, code: string): void {
    this.recordFailedHello(id);
    this.sendError(id, message, code);
    this.clearHelloDeadline(id);
    this.server.close(id, CLOSE_CODE.POLICY_VIOLATION, code);
  }

  private isPeerThrottled(address: string): boolean {
    return this.pruneFailedHellos(address).length >= this.maxFailedHellosPerPeer;
  }

  private recordFailedHello(id: string): void {
    const address = this.socketAddresses.get(id);
    if (address === undefined) return;

    const attempts = this.pruneFailedHellos(address);
    attempts.push(this.now());
    this.failedHellos.set(address, attempts);
    this.evictOldestFailedHelloPeer(address);
  }

  private clearFailedHellos(id: string): void {
    const address = this.socketAddresses.get(id);
    if (address === undefined) return;
    this.failedHellos.delete(address);
  }

  private pruneFailedHellos(address: string): number[] {
    const attempts = this.failedHellos.get(address);
    if (attempts === undefined) return [];

    const cutoff = this.now() - this.failedHelloWindowMs;
    const fresh = attempts.filter((attemptAt) => attemptAt > cutoff);
    if (fresh.length === 0) {
      this.failedHellos.delete(address);
    } else if (fresh.length !== attempts.length) {
      this.failedHellos.set(address, fresh);
    }
    return fresh;
  }

  private evictOldestFailedHelloPeer(keepAddress: string): void {
    if (this.failedHellos.size <= MAX_TRACKED_PEERS) return;
    for (const address of this.failedHellos.keys()) {
      if (address === keepAddress) continue;
      this.failedHellos.delete(address);
      return;
    }
  }

  private sendError(id: string, message: string, code?: string): void {
    const error: ServerMessage = code
      ? { type: "ERROR", message, code }
      : { type: "ERROR", message };
    this.server.send(id, JSON.stringify(error));
  }

  private broadcast(): void {
    const payload = JSON.stringify({
      type: "STATE_UPDATE",
      state: this.game.toPublic(this.gameState),
      serverTime: this.now(),
    } satisfies ServerMessage);
    for (const id of this.sockets.keys()) {
      this.server.send(id, payload);
    }
  }

  private sendSnapshot(id: string): void {
    this.server.send(
      id,
      JSON.stringify({
        type: "STATE_UPDATE",
        state: this.game.toPublic(this.gameState, true),
        serverTime: this.now(),
      } satisfies ServerMessage)
    );
  }

  private respondHttp(request: HttpRequestInfo): HttpResponseInfo | null {
    if (request.method !== "GET" || request.path !== "/") return null;
    return {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
      body: this.guestPage,
    };
  }
}
