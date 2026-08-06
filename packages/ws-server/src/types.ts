export interface WsRequestInfo {
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  remoteAddress?: string;
}

export interface WsServerHooks {
  onOpen(id: string, req: WsRequestInfo): void;
  onMessage(id: string, data: string): void;
  onBinaryMessage?(id: string, data: Uint8Array): void;
  onClose(id: string, code: number, reason: string): void;
}

export interface HttpRequestInfo {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
}

export interface HttpResponseInfo {
  status: number;
  headers: Record<string, string>;
  body: string | Uint8Array;
}

export interface HttpResponder {
  respond(req: HttpRequestInfo): HttpResponseInfo | null;
}

export type TimerHandle = unknown;

export interface Timers {
  setTimeout(handler: () => void, delayMs: number): TimerHandle;
  clearTimeout(handle: TimerHandle): void;
}

export interface SocketPort {
  write(bytes: Uint8Array): void;
  close(): void;
  onData(handler: (bytes: Uint8Array) => void): void;
  onClose(handler: () => void): void;
  onError(handler: (error: unknown) => void): void;
  remoteAddress?: string;
}

export interface ListenerPort {
  onConnection(handler: (socket: SocketPort) => void): void;
  close(): void;
}

export interface WsLimits {
  maxHttpHeaderBytes: number;
  handshakeTimeoutMs: number;
  maxFramePayloadBytes: number;
  maxMessageBytes: number;
  maxFragments: number;
  idleTimeoutMs: number;
  closeGraceMs: number;
}

export const DEFAULT_LIMITS: WsLimits = {
  maxHttpHeaderBytes: 8 * 1024,
  handshakeTimeoutMs: 5_000,
  maxFramePayloadBytes: 64 * 1024,
  maxMessageBytes: 256 * 1024,
  maxFragments: 64,
  idleTimeoutMs: 60_000,
  closeGraceMs: 1_000,
};

export const DEFAULT_MAX_CONNECTIONS = 32;

export const DEFAULT_HEARTBEAT_INTERVAL_MS = 25_000;

export const CLOSE_CODE = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS: 1005,
  ABNORMAL: 1006,
  INVALID_PAYLOAD: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  INTERNAL_ERROR: 1011,
} as const;

export function isValidCloseCode(code: number): boolean {
  if (!Number.isInteger(code)) return false;
  if (code >= 3000 && code <= 4999) return true;
  if (code >= 1000 && code <= 1003) return true;
  if (code >= 1007 && code <= 1011) return true;
  if (code >= 1012 && code <= 1014) return true;
  return false;
}
