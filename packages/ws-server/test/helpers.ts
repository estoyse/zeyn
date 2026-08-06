import { ByteQueue, concatBytes } from "../src/bytes";
import { encodeFrame, readFrame, type WsFrame } from "../src/frame";
import { latin1Encode } from "../src/bytes";
import { WsConnection } from "../src/connection";
import type { HttpResponder, SocketPort, TimerHandle, Timers, WsLimits } from "../src/types";

export class FakeSocket implements SocketPort {
  readonly writes: Uint8Array[] = [];
  closed = false;

  private dataHandler: ((bytes: Uint8Array) => void) | null = null;
  private closeHandler: (() => void) | null = null;
  private errorHandler: ((error: unknown) => void) | null = null;

  write(bytes: Uint8Array): void {
    this.writes.push(bytes);
  }

  close(): void {
    this.closed = true;
  }

  onData(handler: (bytes: Uint8Array) => void): void {
    this.dataHandler = handler;
  }

  onClose(handler: () => void): void {
    this.closeHandler = handler;
  }

  onError(handler: (error: unknown) => void): void {
    this.errorHandler = handler;
  }

  emitData(bytes: Uint8Array): void {
    this.dataHandler?.(bytes);
  }

  emitClose(): void {
    this.closeHandler?.();
  }

  emitError(error: unknown): void {
    this.errorHandler?.(error);
  }

  written(): Uint8Array {
    let total = 0;
    for (const chunk of this.writes) total += chunk.length;
    return concatBytes(this.writes, total);
  }

  writtenText(): string {
    const bytes = this.written();
    let out = "";
    for (const byte of bytes) out += String.fromCharCode(byte);
    return out;
  }
}

interface PendingTimer {
  handler: () => void;
  delayMs: number;
}

export class ManualTimers implements Timers {
  private readonly pending = new Map<number, PendingTimer>();
  private nextHandle = 1;

  setTimeout(handler: () => void, delayMs: number): TimerHandle {
    const handle = this.nextHandle;
    this.nextHandle += 1;
    this.pending.set(handle, { handler, delayMs });
    return handle;
  }

  clearTimeout(handle: TimerHandle): void {
    if (typeof handle === "number") this.pending.delete(handle);
  }

  get size(): number {
    return this.pending.size;
  }

  fireAll(): void {
    const entries = [...this.pending.entries()];
    this.pending.clear();
    for (const [, timer] of entries) timer.handler();
  }

  fireWithDelay(delayMs: number): void {
    for (const [handle, timer] of [...this.pending.entries()]) {
      if (timer.delayMs !== delayMs) continue;
      this.pending.delete(handle);
      timer.handler();
    }
  }
}

export interface RecordedEvent {
  kind: "open" | "message" | "binary" | "close";
  id: string;
  data?: string;
  bytes?: Uint8Array;
  code?: number;
  reason?: string;
  path?: string;
  query?: Record<string, string>;
}

export function buildHandshakeRequest(
  path = "/",
  overrides: Record<string, string | null> = {},
): Uint8Array {
  const headers: Record<string, string | null> = {
    Host: "127.0.0.1",
    Upgrade: "websocket",
    Connection: "Upgrade",
    "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
    "Sec-WebSocket-Version": "13",
    ...overrides,
  };
  let text = `GET ${path} HTTP/1.1\r\n`;
  for (const name of Object.keys(headers)) {
    const value = headers[name];
    if (value === null) continue;
    text += `${name}: ${value}\r\n`;
  }
  text += "\r\n";
  return latin1Encode(text);
}

export interface Harness {
  connection: WsConnection;
  socket: FakeSocket;
  timers: ManualTimers;
  events: RecordedEvent[];
  serverFrames(): WsFrame[];
}

export function createHarness(
  options: { limits?: Partial<WsLimits>; responder?: HttpResponder | null; path?: string } = {},
): Harness {
  const socket = new FakeSocket();
  const timers = new ManualTimers();
  const events: RecordedEvent[] = [];

  const connection = new WsConnection({
    id: "test",
    socket,
    timers,
    limits: options.limits,
    responder: options.responder ?? null,
    hooks: {
      onOpen(id, req) {
        events.push({ kind: "open", id, path: req.path, query: req.query });
      },
      onMessage(id, data) {
        events.push({ kind: "message", id, data });
      },
      onBinaryMessage(id, bytes) {
        events.push({ kind: "binary", id, bytes });
      },
      onClose(id, code, reason) {
        events.push({ kind: "close", id, code, reason });
      },
    },
  });

  return {
    connection,
    socket,
    timers,
    events,
    serverFrames() {
      return parseServerFrames(socket.written());
    },
  };
}

export function openHarness(
  options: { limits?: Partial<WsLimits>; path?: string } = {},
): Harness {
  const harness = createHarness(options);
  harness.socket.emitData(buildHandshakeRequest(options.path ?? "/"));
  harness.socket.writes.length = 0;
  return harness;
}

export function parseServerFrames(bytes: Uint8Array): WsFrame[] {
  const queue = new ByteQueue();
  queue.push(bytes);
  const frames: WsFrame[] = [];
  for (;;) {
    const result = readFrame(queue, {
      maxPayloadBytes: 64 * 1024 * 1024,
      requireMask: false,
    });
    if (result.status !== "frame") break;
    frames.push(result.frame);
  }
  return frames;
}

export const TEST_MASK = new Uint8Array([0x37, 0xfa, 0x21, 0x3d]);

export function clientFrame(
  opcode: number,
  payload: Uint8Array,
  options: { fin?: boolean; rsv?: number; mask?: boolean } = {},
): Uint8Array {
  const useMask = options.mask ?? true;
  const bytes = encodeFrame(opcode, payload, {
    fin: options.fin ?? true,
    maskKey: useMask ? TEST_MASK : undefined,
  });
  if (options.rsv) bytes[0] = bytes[0]! | (options.rsv & 0x70);
  return bytes;
}

export function closePayload(code: number, reason: Uint8Array = new Uint8Array(0)): Uint8Array {
  const payload = new Uint8Array(2 + reason.length);
  payload[0] = (code >>> 8) & 0xff;
  payload[1] = code & 0xff;
  payload.set(reason, 2);
  return payload;
}

export function closeCodeOf(frame: WsFrame): number | null {
  if (frame.payload.length < 2) return null;
  return (frame.payload[0]! << 8) | frame.payload[1]!;
}
