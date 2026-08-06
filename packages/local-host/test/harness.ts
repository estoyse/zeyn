import {
  ByteQueue,
  concatBytes,
  decodeUtf8,
  encodeFrame,
  encodeUtf8,
  findHeaderEnd,
  latin1Decode,
  latin1Encode,
  OPCODE,
  readFrame,
  type ListenerPort,
  type SocketPort,
  type TimerHandle,
  type Timers,
} from "@zeyn/ws-server";

const CLIENT_MASK = new Uint8Array([0x37, 0xfa, 0x21, 0x3d]);
const START_TIME = 1_700_000_000_000;

interface Scheduled {
  at: number;
  handler: () => void;
}

export class FakeClock {
  readonly timers: Timers;

  private current: number;
  private readonly scheduled = new Map<number, Scheduled>();
  private nextHandle = 1;

  constructor(start: number = START_TIME) {
    this.current = start;
    this.timers = {
      setTimeout: (handler: () => void, delayMs: number): TimerHandle => {
        const handle = this.nextHandle;
        this.nextHandle += 1;
        this.scheduled.set(handle, {
          at: this.current + Math.max(0, delayMs),
          handler,
        });
        return handle;
      },
      clearTimeout: (handle: TimerHandle): void => {
        if (typeof handle === "number") this.scheduled.delete(handle);
      },
    };
  }

  now = (): number => this.current;

  advance(ms: number): void {
    const target = this.current + ms;
    for (let step = 0; step < 100_000; step += 1) {
      const due = this.earliestDue(target);
      if (due === null) break;
      this.scheduled.delete(due.handle);
      if (due.at > this.current) this.current = due.at;
      due.entry.handler();
    }
    this.current = target;
  }

  suspend(ms: number): void {
    this.current += ms;
  }

  fireEarly(withinMs: number): void {
    for (const [handle, entry] of [...this.scheduled]) {
      if (entry.at > this.current + withinMs) continue;
      this.scheduled.delete(handle);
      entry.handler();
    }
  }

  get pendingTimers(): number {
    return this.scheduled.size;
  }

  private earliestDue(
    target: number
  ): { handle: number; at: number; entry: Scheduled } | null {
    let bestHandle: number | null = null;
    let best: Scheduled | null = null;
    for (const [handle, entry] of this.scheduled) {
      if (entry.at > target) continue;
      if (best === null || entry.at < best.at) {
        best = entry;
        bestHandle = handle;
      }
    }
    if (best === null || bestHandle === null) return null;
    return { handle: bestHandle, at: best.at, entry: best };
  }
}

class FakeSocketPort implements SocketPort {
  closed = false;
  remoteAddress: string | undefined;

  private dataHandler: ((bytes: Uint8Array) => void) | null = null;
  private closeHandler: (() => void) | null = null;
  private errorHandler: ((error: unknown) => void) | null = null;
  private readonly onWrite: (bytes: Uint8Array) => void;

  constructor(onWrite: (bytes: Uint8Array) => void, remoteAddress?: string) {
    this.onWrite = onWrite;
    this.remoteAddress = remoteAddress;
  }

  write(bytes: Uint8Array): void {
    if (this.closed) return;
    this.onWrite(bytes);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.closeHandler?.();
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

  feed(bytes: Uint8Array): void {
    if (this.closed) return;
    this.dataHandler?.(bytes);
  }

  fail(error: unknown): void {
    this.errorHandler?.(error);
  }
}

export interface StateUpdate {
  type: "STATE_UPDATE";
  state: Record<string, unknown>;
  serverTime: number;
}

export interface ErrorMessage {
  type: "ERROR";
  message: string;
  code?: string;
}

export interface WelcomeMessage {
  type: "WELCOME";
  v: number;
  playerId: string;
}

export type ReceivedMessage = StateUpdate | ErrorMessage | WelcomeMessage;

export class FakeClient {
  readonly port: FakeSocketPort;
  readonly received: ReceivedMessage[] = [];

  closeCode: number | null = null;

  private handshakeComplete = false;
  private handshakeText = "";
  private readonly frames = new ByteQueue();
  private readonly writes: Uint8Array[] = [];
  private writeSize = 0;

  constructor(remoteAddress?: string) {
    this.port = new FakeSocketPort((bytes) => this.receive(bytes), remoteAddress);
  }

  get closed(): boolean {
    return this.port.closed;
  }

  get errors(): ErrorMessage[] {
    return this.received.filter(
      (message): message is ErrorMessage => message.type === "ERROR"
    );
  }

  get updates(): StateUpdate[] {
    return this.received.filter(
      (message): message is StateUpdate => message.type === "STATE_UPDATE"
    );
  }

  get playerId(): string | null {
    const welcome = this.received.find(
      (message): message is WelcomeMessage => message.type === "WELCOME"
    );
    return welcome ? welcome.playerId : null;
  }

  get lastState(): Record<string, unknown> | null {
    const updates = this.updates;
    const last = updates[updates.length - 1];
    return last ? last.state : null;
  }

  get httpResponse(): string {
    return latin1Decode(concatBytes(this.writes, this.writeSize));
  }

  get upgraded(): boolean {
    return this.handshakeComplete;
  }

  handshake(path = "/", headers: Record<string, string | null> = {}): void {
    const merged: Record<string, string | null> = {
      Host: "127.0.0.1",
      Upgrade: "websocket",
      Connection: "Upgrade",
      "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
      "Sec-WebSocket-Version": "13",
      ...headers,
    };
    let text = `GET ${path} HTTP/1.1\r\n`;
    for (const name of Object.keys(merged)) {
      const value = merged[name];
      if (value === null) continue;
      text += `${name}: ${value}\r\n`;
    }
    text += "\r\n";
    this.port.feed(latin1Encode(text));
  }

  request(method: string, path: string): void {
    this.port.feed(
      latin1Encode(`${method} ${path} HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n`)
    );
  }

  send(value: unknown): void {
    this.sendText(JSON.stringify(value));
  }

  sendText(text: string): void {
    this.sendFrame(OPCODE.TEXT, encodeUtf8(text));
  }

  sendFrame(opcode: number, payload: Uint8Array): void {
    this.port.feed(encodeFrame(opcode, payload, { maskKey: CLIENT_MASK }));
  }

  disconnect(): void {
    this.port.close();
  }

  private receive(bytes: Uint8Array): void {
    if (!this.handshakeComplete) {
      this.writes.push(bytes);
      this.writeSize += bytes.length;
      const buffered = concatBytes(this.writes, this.writeSize);
      const end = findHeaderEnd(buffered, 0);
      if (end < 0) return;
      this.handshakeText = latin1Decode(buffered.subarray(0, end));
      if (!this.handshakeText.startsWith("HTTP/1.1 101")) return;
      this.handshakeComplete = true;
      if (end < buffered.length) this.frames.push(buffered.subarray(end));
    } else {
      this.frames.push(bytes);
    }
    this.readFrames();
  }

  private readFrames(): void {
    for (;;) {
      const result = readFrame(this.frames, {
        maxPayloadBytes: 16 * 1024 * 1024,
        requireMask: false,
      });
      if (result.status !== "frame") return;
      const frame = result.frame;
      if (frame.opcode === OPCODE.TEXT) {
        const text = decodeUtf8(frame.payload);
        if (text !== null) {
          this.received.push(JSON.parse(text) as ReceivedMessage);
        }
        continue;
      }
      if (frame.opcode === OPCODE.PING) {
        this.sendFrame(OPCODE.PONG, frame.payload);
        continue;
      }
      if (frame.opcode === OPCODE.CLOSE) {
        this.closeCode =
          frame.payload.length >= 2
            ? ((frame.payload[0] ?? 0) << 8) | (frame.payload[1] ?? 0)
            : null;
        this.sendFrame(OPCODE.CLOSE, frame.payload);
        this.port.close();
        return;
      }
    }
  }
}

export class FakeNetwork implements ListenerPort {
  closed = false;

  private handler: ((socket: SocketPort) => void) | null = null;

  onConnection(handler: (socket: SocketPort) => void): void {
    this.handler = handler;
  }

  close(): void {
    this.closed = true;
  }

  open(remoteAddress?: string): FakeClient {
    const client = new FakeClient(remoteAddress);
    this.handler?.(client.port);
    return client;
  }

  connect(
    path = "/",
    headers: Record<string, string | null> = {},
    remoteAddress?: string
  ): FakeClient {
    const client = this.open(remoteAddress);
    client.handshake(path, headers);
    return client;
  }

  fetch(method: string, path: string): string {
    const client = this.open();
    client.request(method, path);
    return client.httpResponse;
  }
}
