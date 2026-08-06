import type { ByteQueue } from "./bytes";
import { CLOSE_CODE } from "./types";

export const OPCODE = {
  CONTINUATION: 0x0,
  TEXT: 0x1,
  BINARY: 0x2,
  CLOSE: 0x8,
  PING: 0x9,
  PONG: 0xa,
} as const;

export const MAX_CONTROL_PAYLOAD = 125;

export function isControlOpcode(opcode: number): boolean {
  return (opcode & 0x08) !== 0;
}

export function isKnownOpcode(opcode: number): boolean {
  return (
    opcode === OPCODE.CONTINUATION ||
    opcode === OPCODE.TEXT ||
    opcode === OPCODE.BINARY ||
    opcode === OPCODE.CLOSE ||
    opcode === OPCODE.PING ||
    opcode === OPCODE.PONG
  );
}

export interface WsFrame {
  fin: boolean;
  rsv: number;
  opcode: number;
  masked: boolean;
  payload: Uint8Array;
}

export type FrameReadResult =
  | { status: "incomplete" }
  | { status: "frame"; frame: WsFrame }
  | { status: "error"; code: number; reason: string };

export interface FrameReadOptions {
  maxPayloadBytes: number;
  requireMask: boolean;
}

export function applyMask(payload: Uint8Array, maskKey: Uint8Array): void {
  for (let i = 0; i < payload.length; i++) {
    payload[i] = payload[i]! ^ maskKey[i & 3]!;
  }
}

export function readFrame(queue: ByteQueue, options: FrameReadOptions): FrameReadResult {
  if (queue.length < 2) return { status: "incomplete" };

  const firstByte = queue.byteAt(0);
  const secondByte = queue.byteAt(1);
  const fin = (firstByte & 0x80) !== 0;
  const rsv = firstByte & 0x70;
  const opcode = firstByte & 0x0f;
  const masked = (secondByte & 0x80) !== 0;
  const shortLength = secondByte & 0x7f;

  let headerBytes = 2;
  let payloadLength = shortLength;

  if (shortLength === 126) {
    if (queue.length < 4) return { status: "incomplete" };
    payloadLength = (queue.byteAt(2) << 8) | queue.byteAt(3);
    headerBytes = 4;
  } else if (shortLength === 127) {
    if (queue.length < 10) return { status: "incomplete" };
    const high =
      queue.byteAt(2) * 0x1000000 +
      queue.byteAt(3) * 0x10000 +
      queue.byteAt(4) * 0x100 +
      queue.byteAt(5);
    const low =
      queue.byteAt(6) * 0x1000000 +
      queue.byteAt(7) * 0x10000 +
      queue.byteAt(8) * 0x100 +
      queue.byteAt(9);
    if (high !== 0) {
      return {
        status: "error",
        code: CLOSE_CODE.MESSAGE_TOO_BIG,
        reason: "frame payload exceeds limit",
      };
    }
    payloadLength = low;
    headerBytes = 10;
  }

  if (options.requireMask && !masked) {
    return { status: "error", code: CLOSE_CODE.PROTOCOL_ERROR, reason: "unmasked client frame" };
  }

  if (isControlOpcode(opcode)) {
    if (payloadLength > MAX_CONTROL_PAYLOAD) {
      return {
        status: "error",
        code: CLOSE_CODE.PROTOCOL_ERROR,
        reason: "control frame payload too long",
      };
    }
    if (!fin) {
      return {
        status: "error",
        code: CLOSE_CODE.PROTOCOL_ERROR,
        reason: "fragmented control frame",
      };
    }
  } else if (payloadLength > options.maxPayloadBytes) {
    return {
      status: "error",
      code: CLOSE_CODE.MESSAGE_TOO_BIG,
      reason: "frame payload exceeds limit",
    };
  }

  const maskBytes = masked ? 4 : 0;
  if (queue.length < headerBytes + maskBytes + payloadLength) return { status: "incomplete" };

  queue.discard(headerBytes);
  const maskKey = masked ? queue.read(4) : null;
  const payload = queue.read(payloadLength);
  if (maskKey) applyMask(payload, maskKey);

  return { status: "frame", frame: { fin, rsv, opcode, masked, payload } };
}

export interface EncodeFrameOptions {
  fin?: boolean;
  maskKey?: Uint8Array;
}

export function encodeFrame(
  opcode: number,
  payload: Uint8Array,
  options: EncodeFrameOptions = {},
): Uint8Array {
  const fin = options.fin ?? true;
  const maskKey = options.maskKey;
  const length = payload.length;

  let headerBytes = 2;
  if (length > 0xffff) headerBytes += 8;
  else if (length > 125) headerBytes += 2;
  if (maskKey) headerBytes += 4;

  const out = new Uint8Array(headerBytes + length);
  out[0] = (fin ? 0x80 : 0x00) | (opcode & 0x0f);

  let cursor = 2;
  if (length > 0xffff) {
    out[1] = 127;
    const high = Math.floor(length / 0x100000000);
    const low = length >>> 0;
    out[2] = (high >>> 24) & 0xff;
    out[3] = (high >>> 16) & 0xff;
    out[4] = (high >>> 8) & 0xff;
    out[5] = high & 0xff;
    out[6] = (low >>> 24) & 0xff;
    out[7] = (low >>> 16) & 0xff;
    out[8] = (low >>> 8) & 0xff;
    out[9] = low & 0xff;
    cursor = 10;
  } else if (length > 125) {
    out[1] = 126;
    out[2] = (length >>> 8) & 0xff;
    out[3] = length & 0xff;
    cursor = 4;
  } else {
    out[1] = length;
  }

  if (maskKey) {
    out[1] = out[1]! | 0x80;
    out.set(maskKey.subarray(0, 4), cursor);
    cursor += 4;
    out.set(payload, cursor);
    const masked = out.subarray(cursor, cursor + length);
    applyMask(masked, maskKey);
  } else {
    out.set(payload, cursor);
  }

  return out;
}

export function encodeCloseFrame(code: number | null, reasonBytes: Uint8Array): Uint8Array {
  if (code === null) return encodeFrame(OPCODE.CLOSE, new Uint8Array(0));
  const payload = new Uint8Array(2 + reasonBytes.length);
  payload[0] = (code >>> 8) & 0xff;
  payload[1] = code & 0xff;
  payload.set(reasonBytes, 2);
  return encodeFrame(OPCODE.CLOSE, payload);
}
