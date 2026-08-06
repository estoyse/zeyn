import { WsConnection } from "./connection";
import { buildHttpResponse } from "./http";
import type { OriginPolicy } from "./handshake";
import {
  CLOSE_CODE,
  DEFAULT_HEARTBEAT_INTERVAL_MS,
  DEFAULT_MAX_CONNECTIONS,
  type HttpResponder,
  type ListenerPort,
  type SocketPort,
  type TimerHandle,
  type Timers,
  type WsLimits,
  type WsServerHooks,
} from "./types";

export interface SocketServerOptions {
  listener: ListenerPort;
  hooks: WsServerHooks;
  timers: Timers;
  responder?: HttpResponder | null;
  limits?: Partial<WsLimits>;
  maxConnections?: number;
  heartbeatIntervalMs?: number;
  originPolicy?: OriginPolicy;
  selectSubprotocol?: (offered: string[]) => string | null;
}

export class SocketServer {
  private readonly options: SocketServerOptions;
  private readonly maxConnections: number;
  private readonly heartbeatIntervalMs: number;
  private readonly connections = new Map<string, WsConnection>();
  private heartbeat: TimerHandle | null = null;
  private nextId = 1;
  private stopped = false;

  constructor(options: SocketServerOptions) {
    this.options = options;
    this.maxConnections = options.maxConnections ?? DEFAULT_MAX_CONNECTIONS;
    this.heartbeatIntervalMs =
      options.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;
    options.listener.onConnection((socket) => this.accept(socket));
    this.scheduleHeartbeat();
  }

  get connectionCount(): number {
    return this.connections.size;
  }

  has(id: string): boolean {
    return this.connections.has(id);
  }

  send(id: string, text: string): void {
    this.connections.get(id)?.sendText(text);
  }

  sendBinary(id: string, data: Uint8Array): void {
    this.connections.get(id)?.sendBinary(data);
  }

  broadcast(text: string): void {
    for (const connection of this.connections.values()) {
      connection.sendText(text);
    }
  }

  close(id: string, code: number = CLOSE_CODE.NORMAL, reason = ""): void {
    this.connections.get(id)?.close(code, reason);
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    if (this.heartbeat !== null) {
      this.options.timers.clearTimeout(this.heartbeat);
      this.heartbeat = null;
    }
    this.options.listener.close();
    for (const connection of [...this.connections.values()]) {
      connection.close(CLOSE_CODE.GOING_AWAY, "server stopping");
      connection.destroy(CLOSE_CODE.GOING_AWAY, "server stopping");
    }
    this.connections.clear();
  }

  private scheduleHeartbeat(): void {
    if (this.stopped || this.heartbeatIntervalMs <= 0) return;
    this.heartbeat = this.options.timers.setTimeout(() => {
      this.heartbeat = null;
      for (const connection of this.connections.values()) {
        if (connection.isOpen) connection.ping();
      }
      this.scheduleHeartbeat();
    }, this.heartbeatIntervalMs);
  }

  private accept(socket: SocketPort): void {
    if (this.stopped || this.connections.size >= this.maxConnections) {
      socket.write(buildHttpResponse(503, {}, "Too many connections"));
      socket.close();
      return;
    }

    const id = `ws-${this.nextId}`;
    this.nextId += 1;

    const connection = new WsConnection({
      id,
      socket,
      hooks: this.options.hooks,
      timers: this.options.timers,
      limits: this.options.limits,
      responder: this.options.responder ?? null,
      originPolicy: this.options.originPolicy,
      selectSubprotocol: this.options.selectSubprotocol,
      onFinished: (finishedId) => {
        this.connections.delete(finishedId);
      },
    });

    this.connections.set(id, connection);
  }
}
