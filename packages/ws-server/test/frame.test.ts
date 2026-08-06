import { describe, expect, it } from "vitest";
import { ByteQueue } from "../src/bytes";
import { applyMask, encodeFrame, OPCODE, readFrame } from "../src/frame";
import { CLOSE_CODE } from "../src/types";
import { clientFrame, TEST_MASK } from "./helpers";

function queueOf(...chunks: Uint8Array[]): ByteQueue {
  const queue = new ByteQueue();
  for (const chunk of chunks) queue.push(chunk);
  return queue;
}

const SERVER_READ = { maxPayloadBytes: 64 * 1024, requireMask: true } as const;

function bytesOfLength(length: number): Uint8Array {
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) out[i] = (i * 31 + 7) & 0xff;
  return out;
}

describe("masking", () => {
  it("is its own inverse", () => {
    const payload = bytesOfLength(200);
    const original = payload.slice();
    applyMask(payload, TEST_MASK);
    expect([...payload]).not.toEqual([...original]);
    applyMask(payload, TEST_MASK);
    expect([...payload]).toEqual([...original]);
  });

  it("matches the RFC 6455 section 5.7 masked Hello vector", () => {
    const frame = encodeFrame(OPCODE.TEXT, new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]), {
      maskKey: new Uint8Array([0x37, 0xfa, 0x21, 0x3d]),
    });
    expect([...frame]).toEqual([
      0x81, 0x85, 0x37, 0xfa, 0x21, 0x3d, 0x7f, 0x9f, 0x4d, 0x51, 0x58,
    ]);
  });

  it("matches the RFC 6455 section 5.7 unmasked Hello vector", () => {
    const frame = encodeFrame(OPCODE.TEXT, new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
    expect([...frame]).toEqual([0x81, 0x05, 0x48, 0x65, 0x6c, 0x6c, 0x6f]);
  });
});

describe("frame round-trips", () => {
  const lengths = [0, 1, 125, 126, 127, 255, 65535, 65536, 70000];

  for (const length of lengths) {
    it(`round-trips a ${length} byte payload`, () => {
      const payload = bytesOfLength(length);
      const encoded = clientFrame(OPCODE.BINARY, payload);
      const result = readFrame(queueOf(encoded), {
        maxPayloadBytes: 1024 * 1024,
        requireMask: true,
      });
      expect(result.status).toBe("frame");
      if (result.status !== "frame") return;
      expect(result.frame.opcode).toBe(OPCODE.BINARY);
      expect(result.frame.fin).toBe(true);
      expect(result.frame.masked).toBe(true);
      expect([...result.frame.payload]).toEqual([...payload]);
    });
  }

  it("uses 7-bit, 16-bit and 64-bit length encodings", () => {
    expect(encodeFrame(OPCODE.BINARY, bytesOfLength(125))[1]).toBe(125);
    expect(encodeFrame(OPCODE.BINARY, bytesOfLength(126))[1]).toBe(126);
    expect(encodeFrame(OPCODE.BINARY, bytesOfLength(65535))[1]).toBe(126);
    expect(encodeFrame(OPCODE.BINARY, bytesOfLength(65536))[1]).toBe(127);
  });

  it("never masks server frames", () => {
    expect(encodeFrame(OPCODE.TEXT, bytesOfLength(10))[1]! & 0x80).toBe(0);
    expect(encodeFrame(OPCODE.TEXT, bytesOfLength(300))[1]! & 0x80).toBe(0);
    expect(encodeFrame(OPCODE.TEXT, bytesOfLength(70000))[1]! & 0x80).toBe(0);
  });

  it("reassembles a frame split across many chunks", () => {
    const payload = bytesOfLength(1000);
    const encoded = clientFrame(OPCODE.BINARY, payload);
    const queue = new ByteQueue();
    let final: ReturnType<typeof readFrame> = { status: "incomplete" };
    for (let i = 0; i < encoded.length; i += 7) {
      queue.push(encoded.subarray(i, Math.min(i + 7, encoded.length)));
      final = readFrame(queue, SERVER_READ);
      if (i + 7 < encoded.length) expect(final.status).toBe("incomplete");
    }
    expect(final.status).toBe("frame");
    if (final.status !== "frame") return;
    expect([...final.frame.payload]).toEqual([...payload]);
  });

  it("does not consume bytes when the frame is incomplete", () => {
    const encoded = clientFrame(OPCODE.TEXT, bytesOfLength(50));
    const queue = queueOf(encoded.subarray(0, 20));
    expect(readFrame(queue, SERVER_READ).status).toBe("incomplete");
    expect(queue.length).toBe(20);
  });

  it("reads two frames from one chunk", () => {
    const first = clientFrame(OPCODE.TEXT, bytesOfLength(3));
    const second = clientFrame(OPCODE.BINARY, bytesOfLength(4));
    const queue = queueOf(first, second);
    expect(readFrame(queue, SERVER_READ).status).toBe("frame");
    expect(readFrame(queue, SERVER_READ).status).toBe("frame");
    expect(queue.length).toBe(0);
  });
});

describe("frame validation", () => {
  it("rejects unmasked client frames", () => {
    const frame = clientFrame(OPCODE.TEXT, bytesOfLength(4), { mask: false });
    expect(readFrame(queueOf(frame), SERVER_READ)).toMatchObject({
      status: "error",
      code: CLOSE_CODE.PROTOCOL_ERROR,
    });
  });

  it("rejects control frames with more than 125 bytes", () => {
    const frame = clientFrame(OPCODE.PING, bytesOfLength(126));
    expect(readFrame(queueOf(frame), SERVER_READ)).toMatchObject({
      status: "error",
      code: CLOSE_CODE.PROTOCOL_ERROR,
    });
  });

  it("rejects fragmented control frames", () => {
    const frame = clientFrame(OPCODE.PING, bytesOfLength(2), { fin: false });
    expect(readFrame(queueOf(frame), SERVER_READ)).toMatchObject({
      status: "error",
      code: CLOSE_CODE.PROTOCOL_ERROR,
    });
  });

  it("rejects payloads over the configured cap with 1009", () => {
    const frame = clientFrame(OPCODE.BINARY, bytesOfLength(70000));
    expect(readFrame(queueOf(frame), SERVER_READ)).toMatchObject({
      status: "error",
      code: CLOSE_CODE.MESSAGE_TOO_BIG,
    });
  });

  it("rejects a 64-bit length with the high word set", () => {
    const header = new Uint8Array([0x82, 0xff, 0x80, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4]);
    expect(readFrame(queueOf(header), SERVER_READ)).toMatchObject({
      status: "error",
      code: CLOSE_CODE.MESSAGE_TOO_BIG,
    });
  });

  it("caps payload before the whole frame has arrived", () => {
    const header = new Uint8Array([0x82, 0xff, 0, 0, 0, 0, 0, 0x10, 0, 0, 1, 2, 3, 4]);
    expect(readFrame(queueOf(header), SERVER_READ)).toMatchObject({
      status: "error",
      code: CLOSE_CODE.MESSAGE_TOO_BIG,
    });
  });

  it("accepts a 16-bit length right at the cap", () => {
    const frame = clientFrame(OPCODE.BINARY, bytesOfLength(65535));
    expect(readFrame(queueOf(frame), SERVER_READ).status).toBe("frame");
  });
});
