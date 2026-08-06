import { ByteQueue, concatBytes } from "./bytes";
import { encodeCloseFrame, encodeFrame, isKnownOpcode, OPCODE, readFrame } from "./frame";
import {
  computeAcceptValue,
  isUpgradeRequest,
  sameOriginOnly,
  validateHandshake,
  type OriginPolicy,
} from "./handshake";
import {
  buildHttpResponse,
  buildUpgradeResponse,
  findHeaderEnd,
  parseHttpRequest,
  splitHeaderList,
  type ParsedHttpRequest,
} from "./http";
import {
  CLOSE_CODE,
  DEFAULT_LIMITS,
  isValidCloseCode,
  type HttpResponder,
  type SocketPort,
  type Timers,
  type WsLimits,
  type WsServerHooks,
} from "./types";
import { decodeUtf8, encodeUtf8, isValidUtf8, Utf8Validator } from "./utf8";

type Phase = "handshake" | "open" | "closing" | "closed";

function truncateUtf8(bytes: Uint8Array, maxBytes: number): Uint8Array {
  if (bytes.length <= maxBytes) return bytes;
  let end = maxBytes;
  while (end > 0 && (bytes[end]! & 0xc0) === 0x80) end -= 1;
  return bytes.subarray(0, end);
}

export interface WsConnectionOptions {
  id: string;
  socket: SocketPort;
  hooks: WsServerHooks;
  timers: Timers;
  limits?: Partial<WsLimits>;
  responder?: HttpResponder | null;
  originPolicy?: OriginPolicy;
  selectSubprotocol?: (offered: string[]) => string | null;
  onFinished?: (id: string) => void;
}

interface MessageState {
  opcode: number;
  parts: Uint8Array[];
  size: number;
  fragments: number;
  validator: Utf8Validator;
}

export class WsConnection {
  readonly id: string;

  private readonly socket: SocketPort;
  private readonly hooks: WsServerHooks;
  private readonly timers: Timers;
  private readonly limits: WsLimits;
  private readonly responder: HttpResponder | null;
  private readonly originPolicy: OriginPolicy;
  private readonly selectSubprotocol: (offered: string[]) => string | null;
  private readonly onFinished: (id: string) => void;

  private phase: Phase = "handshake";
  private handshakeBuffer: Uint8Array[] = [];
  private handshakeBufferSize = 0;
  private handshakeScanned = 0;
  private readonly frames = new ByteQueue();
  private message: MessageState | null = null;

  private sentClose = false;
  private reportedClose = false;
  private openReported = false;
  private pendingCloseCode: number = CLOSE_CODE.NORMAL;
  private pendingCloseReason = "";

  private handshakeTimer: unknown = null;
  private idleTimer: unknown = null;
  private closeTimer: unknown = null;

  constructor(options: WsConnectionOptions) {
    this.id = options.id;
    this.socket = options.socket;
    this.hooks = options.hooks;
    this.timers = options.timers;
    this.limits = { ...DEFAULT_LIMITS, ...options.limits };
    this.responder = options.responder ?? null;
    this.originPolicy = options.originPolicy ?? sameOriginOnly;
    this.selectSubprotocol = options.selectSubprotocol ?? (() => null);
    this.onFinished = options.onFinished ?? (() => {});

    this.socket.onData((bytes) => this.feed(bytes));
    this.socket.onClose(() => this.handleSocketClosed());
    this.socket.onError(() => this.handleSocketClosed());

    if (this.limits.handshakeTimeoutMs > 0) {
      this.handshakeTimer = this.timers.setTimeout(() => {
        this.handshakeTimer = null;
        if (this.phase !== "handshake") return;
        this.socket.write(buildHttpResponse(408, {}, "Handshake timeout"));
        this.destroy(CLOSE_CODE.ABNORMAL, "handshake timeout");
      }, this.limits.handshakeTimeoutMs);
    }
  }

  get isOpen(): boolean {
    return this.phase === "open";
  }

  feed(bytes: Uint8Array): void {
    if (this.phase === "closed") return;
    this.armIdleTimer();
    if (this.phase === "handshake") {
      this.feedHandshake(bytes);
      return;
    }
    this.frames.push(bytes);
    this.processFrames();
  }

  sendText(text: string): void {
    if (this.phase !== "open") return;
    this.socket.write(encodeFrame(OPCODE.TEXT, encodeUtf8(text)));
  }

  sendBinary(data: Uint8Array): void {
    if (this.phase !== "open") return;
    this.socket.write(encodeFrame(OPCODE.BINARY, data));
  }

  ping(payload: Uint8Array = new Uint8Array(0)): void {
    if (this.phase !== "open") return;
    this.socket.write(encodeFrame(OPCODE.PING, payload));
  }

  close(code: number = CLOSE_CODE.NORMAL, reason = ""): void {
    if (this.phase !== "open") {
      this.destroy(code, reason);
      return;
    }
    this.writeClose(code, reason);
    this.phase = "closing";
    this.pendingCloseCode = code;
    this.pendingCloseReason = reason;
    this.closeTimer = this.timers.setTimeout(() => {
      this.closeTimer = null;
      this.destroy(code, reason);
    }, this.limits.closeGraceMs);
  }

  private feedHandshake(bytes: Uint8Array): void {
    this.handshakeBuffer.push(bytes);
    this.handshakeBufferSize += bytes.length;

    const buffered = concatBytes(this.handshakeBuffer, this.handshakeBufferSize);
    this.handshakeBuffer = [buffered];

    const end = findHeaderEnd(buffered, this.handshakeScanned);
    if (end === -1) {
      this.handshakeScanned = buffered.length;
      if (this.handshakeBufferSize > this.limits.maxHttpHeaderBytes) {
        this.socket.write(buildHttpResponse(431, {}, "Header block too large"));
        this.destroy(CLOSE_CODE.ABNORMAL, "http header block too large");
      }
      return;
    }

    if (end > this.limits.maxHttpHeaderBytes) {
      this.socket.write(buildHttpResponse(431, {}, "Header block too large"));
      this.destroy(CLOSE_CODE.ABNORMAL, "http header block too large");
      return;
    }

    const headerBlock = buffered.subarray(0, end);
    const remainder = buffered.subarray(end);
    this.handshakeBuffer = [];
    this.handshakeBufferSize = 0;
    this.clearHandshakeTimer();

    const request = parseHttpRequest(headerBlock);
    if (request === null) {
      this.socket.write(buildHttpResponse(400, {}, "Malformed request"));
      this.destroy(CLOSE_CODE.ABNORMAL, "malformed http request");
      return;
    }

    if (!isUpgradeRequest(request)) {
      this.serveHttp(request);
      return;
    }

    const check = validateHandshake(request, this.originPolicy);
    if (!check.ok) {
      const headers: Record<string, string> =
        check.status === 426 ? { "Sec-WebSocket-Version": "13" } : {};
      this.socket.write(buildHttpResponse(check.status, headers, check.reason));
      this.destroy(CLOSE_CODE.ABNORMAL, check.reason);
      return;
    }

    const offered = splitHeaderList(request.headers["sec-websocket-protocol"]);
    const chosen = offered.length > 0 ? this.selectSubprotocol(offered) : null;
    const accept = computeAcceptValue(check.key);
    this.socket.write(buildUpgradeResponse(accept, chosen));

    this.phase = "open";
    this.openReported = true;
    this.hooks.onOpen(this.id, {
      path: request.path,
      query: request.query,
      headers: request.headers,
      remoteAddress: this.socket.remoteAddress,
    });

    if (remainder.length > 0 && this.phase === "open") {
      this.frames.push(new Uint8Array(remainder));
      this.processFrames();
    }
  }

  private serveHttp(request: ParsedHttpRequest): void {
    const response =
      this.responder === null
        ? null
        : this.responder.respond({
            method: request.method,
            path: request.path,
            query: request.query,
            headers: request.headers,
          });

    if (response === null) {
      this.socket.write(buildHttpResponse(404, { "Content-Type": "text/plain" }, "Not Found"));
    } else {
      this.socket.write(buildHttpResponse(response.status, response.headers, response.body));
    }
    this.destroy(CLOSE_CODE.ABNORMAL, "http request served");
  }

  private processFrames(): void {
    while (this.phase === "open" || this.phase === "closing") {
      const result = readFrame(this.frames, {
        maxPayloadBytes: this.limits.maxFramePayloadBytes,
        requireMask: true,
      });
      if (result.status === "incomplete") return;
      if (result.status === "error") {
        this.failConnection(result.code, result.reason);
        return;
      }
      this.handleFrame(result.frame);
    }
  }

  private handleFrame(frame: {
    fin: boolean;
    rsv: number;
    opcode: number;
    payload: Uint8Array;
  }): void {
    if (this.phase === "closing") {
      if (frame.opcode === OPCODE.CLOSE) {
        this.destroy(this.pendingCloseCode, this.pendingCloseReason);
      }
      return;
    }

    if (frame.rsv !== 0) {
      this.failConnection(CLOSE_CODE.PROTOCOL_ERROR, "reserved bits set");
      return;
    }
    if (!isKnownOpcode(frame.opcode)) {
      this.failConnection(CLOSE_CODE.PROTOCOL_ERROR, "reserved opcode");
      return;
    }

    switch (frame.opcode) {
      case OPCODE.PING:
        this.socket.write(encodeFrame(OPCODE.PONG, frame.payload));
        return;
      case OPCODE.PONG:
        return;
      case OPCODE.CLOSE:
        this.handleCloseFrame(frame.payload);
        return;
      case OPCODE.CONTINUATION:
        this.handleContinuation(frame.fin, frame.payload);
        return;
      default:
        this.handleDataStart(frame.opcode, frame.fin, frame.payload);
    }
  }

  private handleDataStart(opcode: number, fin: boolean, payload: Uint8Array): void {
    if (this.message !== null) {
      this.failConnection(CLOSE_CODE.PROTOCOL_ERROR, "expected continuation frame");
      return;
    }

    const state: MessageState = {
      opcode,
      parts: [],
      size: 0,
      fragments: 0,
      validator: new Utf8Validator(),
    };
    this.message = state;
    this.appendFragment(state, fin, payload);
  }

  private handleContinuation(fin: boolean, payload: Uint8Array): void {
    const state = this.message;
    if (state === null) {
      this.failConnection(CLOSE_CODE.PROTOCOL_ERROR, "unexpected continuation frame");
      return;
    }
    this.appendFragment(state, fin, payload);
  }

  private appendFragment(state: MessageState, fin: boolean, payload: Uint8Array): void {
    state.fragments += 1;
    if (state.fragments > this.limits.maxFragments) {
      this.message = null;
      this.failConnection(CLOSE_CODE.MESSAGE_TOO_BIG, "too many fragments");
      return;
    }

    state.size += payload.length;
    if (state.size > this.limits.maxMessageBytes) {
      this.message = null;
      this.failConnection(CLOSE_CODE.MESSAGE_TOO_BIG, "message exceeds limit");
      return;
    }
    state.parts.push(payload);

    if (state.opcode === OPCODE.TEXT) {
      if (!state.validator.push(payload)) {
        this.message = null;
        this.failConnection(CLOSE_CODE.INVALID_PAYLOAD, "invalid utf-8");
        return;
      }
    }

    if (!fin) return;

    this.message = null;
    const body = concatBytes(state.parts, state.size);

    if (state.opcode === OPCODE.TEXT) {
      if (!state.validator.isComplete) {
        this.failConnection(CLOSE_CODE.INVALID_PAYLOAD, "invalid utf-8");
        return;
      }
      const text = decodeUtf8(body);
      if (text === null) {
        this.failConnection(CLOSE_CODE.INVALID_PAYLOAD, "invalid utf-8");
        return;
      }
      this.hooks.onMessage(this.id, text);
      return;
    }

    if (this.hooks.onBinaryMessage) this.hooks.onBinaryMessage(this.id, body);
  }

  private handleCloseFrame(payload: Uint8Array): void {
    if (payload.length === 1) {
      this.failConnection(CLOSE_CODE.PROTOCOL_ERROR, "invalid close payload");
      return;
    }

    if (payload.length === 0) {
      if (!this.sentClose) {
        this.sentClose = true;
        this.socket.write(encodeCloseFrame(null, new Uint8Array(0)));
      }
      this.destroy(CLOSE_CODE.NO_STATUS, "");
      return;
    }

    const code = (payload[0]! << 8) | payload[1]!;
    if (!isValidCloseCode(code)) {
      this.failConnection(CLOSE_CODE.PROTOCOL_ERROR, "invalid close code");
      return;
    }

    const reasonBytes = payload.subarray(2);
    if (!isValidUtf8(reasonBytes)) {
      this.failConnection(CLOSE_CODE.INVALID_PAYLOAD, "invalid utf-8 in close reason");
      return;
    }
    const reason = decodeUtf8(reasonBytes) ?? "";

    if (!this.sentClose) {
      this.sentClose = true;
      this.socket.write(encodeCloseFrame(code, new Uint8Array(0)));
    }
    this.destroy(code, reason);
  }

  private failConnection(code: number, reason: string): void {
    if (this.phase === "closed") return;
    this.writeClose(code, reason);
    this.destroy(code, reason);
  }

  private writeClose(code: number, reason: string): void {
    if (this.sentClose) return;
    this.sentClose = true;
    const onWire = isValidCloseCode(code) ? code : CLOSE_CODE.PROTOCOL_ERROR;
    this.socket.write(encodeCloseFrame(onWire, truncateUtf8(encodeUtf8(reason), 123)));
  }

  private handleSocketClosed(): void {
    this.destroy(CLOSE_CODE.ABNORMAL, "socket closed");
  }

  destroy(code: number, reason: string): void {
    if (this.phase === "closed") return;
    this.phase = "closed";
    this.clearHandshakeTimer();
    this.clearIdleTimer();
    if (this.closeTimer !== null) {
      this.timers.clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
    this.frames.clear();
    this.message = null;
    this.socket.close();
    if (this.openReported && !this.reportedClose) {
      this.reportedClose = true;
      this.hooks.onClose(this.id, code, reason);
    }
    this.onFinished(this.id);
  }

  private armIdleTimer(): void {
    if (this.limits.idleTimeoutMs <= 0) return;
    this.clearIdleTimer();
    this.idleTimer = this.timers.setTimeout(() => {
      this.idleTimer = null;
      if (this.phase === "open") {
        this.close(CLOSE_CODE.GOING_AWAY, "idle timeout");
        return;
      }
      this.destroy(CLOSE_CODE.ABNORMAL, "idle timeout");
    }, this.limits.idleTimeoutMs);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer === null) return;
    this.timers.clearTimeout(this.idleTimer);
    this.idleTimer = null;
  }

  private clearHandshakeTimer(): void {
    if (this.handshakeTimer === null) return;
    this.timers.clearTimeout(this.handshakeTimer);
    this.handshakeTimer = null;
  }
}
