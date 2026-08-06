import { describe, expect, it } from "vitest";
import { OPCODE } from "../src/frame";
import { CLOSE_CODE, DEFAULT_LIMITS } from "../src/types";
import { encodeUtf8 } from "../src/utf8";
import {
  buildHandshakeRequest,
  clientFrame,
  closeCodeOf,
  closePayload,
  createHarness,
  openHarness,
  type Harness,
} from "./helpers";

function bytesOfLength(length: number): Uint8Array {
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) out[i] = (i * 17 + 3) & 0xff;
  return out;
}

function lastCloseFrame(harness: Harness) {
  const frames = harness.serverFrames();
  const close = frames.filter((frame) => frame.opcode === OPCODE.CLOSE);
  return close[close.length - 1];
}

function expectClosedWith(harness: Harness, code: number) {
  const frame = lastCloseFrame(harness);
  expect(frame, "expected a close frame").toBeDefined();
  expect(closeCodeOf(frame!)).toBe(code);
  expect(harness.socket.closed).toBe(true);
}

describe("echo and framing", () => {
  it("delivers a text message", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.TEXT, encodeUtf8("Hello")));
    expect(harness.events.at(-1)).toMatchObject({ kind: "message", data: "Hello" });
  });

  it("delivers an empty text message", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.TEXT, new Uint8Array(0)));
    expect(harness.events.at(-1)).toMatchObject({ kind: "message", data: "" });
  });

  it("delivers a binary message", () => {
    const harness = openHarness();
    const payload = bytesOfLength(300);
    harness.socket.emitData(clientFrame(OPCODE.BINARY, payload));
    const event = harness.events.at(-1)!;
    expect(event.kind).toBe("binary");
    expect([...event.bytes!]).toEqual([...payload]);
  });

  it("sends unmasked frames back to the client", () => {
    const harness = openHarness();
    harness.connection.sendText("pong-me");
    const frame = harness.serverFrames()[0]!;
    expect(frame.masked).toBe(false);
    expect(frame.opcode).toBe(OPCODE.TEXT);
  });

  it("handles frames pipelined in the same packet as the handshake", () => {
    const harness = createHarness();
    const request = buildHandshakeRequest("/");
    const frame = clientFrame(OPCODE.TEXT, encodeUtf8("early"));
    const combined = new Uint8Array(request.length + frame.length);
    combined.set(request, 0);
    combined.set(frame, request.length);
    harness.socket.emitData(combined);
    expect(harness.events.at(-1)).toMatchObject({ kind: "message", data: "early" });
  });
});

describe("fragmentation", () => {
  it("reassembles a fragmented text message", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.TEXT, encodeUtf8("frag"), { fin: false }));
    harness.socket.emitData(clientFrame(OPCODE.CONTINUATION, encodeUtf8("ment"), { fin: false }));
    harness.socket.emitData(clientFrame(OPCODE.CONTINUATION, encodeUtf8("ed")));
    expect(harness.events.at(-1)).toMatchObject({ kind: "message", data: "fragmented" });
  });

  it("reassembles a code point split across fragments", () => {
    const harness = openHarness();
    const full = encodeUtf8("κόσμε");
    harness.socket.emitData(clientFrame(OPCODE.TEXT, full.subarray(0, 3), { fin: false }));
    harness.socket.emitData(clientFrame(OPCODE.CONTINUATION, full.subarray(3)));
    expect(harness.events.at(-1)).toMatchObject({ kind: "message", data: "κόσμε" });
  });

  it("answers a ping interleaved in a fragmented message", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.TEXT, encodeUtf8("a"), { fin: false }));
    harness.socket.emitData(clientFrame(OPCODE.PING, encodeUtf8("ping")));
    harness.socket.emitData(clientFrame(OPCODE.CONTINUATION, encodeUtf8("b")));
    const frames = harness.serverFrames();
    expect(frames[0]!.opcode).toBe(OPCODE.PONG);
    expect([...frames[0]!.payload]).toEqual([...encodeUtf8("ping")]);
    expect(harness.events.at(-1)).toMatchObject({ kind: "message", data: "ab" });
  });

  it("rejects a continuation with no message in progress", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.CONTINUATION, encodeUtf8("x")));
    expectClosedWith(harness, CLOSE_CODE.PROTOCOL_ERROR);
  });

  it("rejects an orphan continuation after a completed message", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.TEXT, encodeUtf8("a"), { fin: false }));
    harness.socket.emitData(clientFrame(OPCODE.CONTINUATION, encodeUtf8("b")));
    harness.socket.emitData(clientFrame(OPCODE.CONTINUATION, encodeUtf8("c")));
    expectClosedWith(harness, CLOSE_CODE.PROTOCOL_ERROR);
  });

  it("rejects a new data frame during fragmentation", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.TEXT, encodeUtf8("a"), { fin: false }));
    harness.socket.emitData(clientFrame(OPCODE.TEXT, encodeUtf8("b")));
    expectClosedWith(harness, CLOSE_CODE.PROTOCOL_ERROR);
  });
});

describe("control frames", () => {
  it("answers ping with pong echoing the payload", () => {
    const harness = openHarness();
    const payload = bytesOfLength(125);
    harness.socket.emitData(clientFrame(OPCODE.PING, payload));
    const frame = harness.serverFrames()[0]!;
    expect(frame.opcode).toBe(OPCODE.PONG);
    expect(frame.fin).toBe(true);
    expect([...frame.payload]).toEqual([...payload]);
  });

  it("answers an empty ping", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.PING, new Uint8Array(0)));
    expect(harness.serverFrames()[0]!.opcode).toBe(OPCODE.PONG);
  });

  it("ignores unsolicited pong", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.PONG, encodeUtf8("hi")));
    expect(harness.serverFrames()).toHaveLength(0);
    expect(harness.connection.isOpen).toBe(true);
  });

  it("rejects a ping over 125 bytes", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.PING, bytesOfLength(126)));
    expectClosedWith(harness, CLOSE_CODE.PROTOCOL_ERROR);
  });

  it("rejects a fragmented ping", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.PING, encodeUtf8("x"), { fin: false }));
    expectClosedWith(harness, CLOSE_CODE.PROTOCOL_ERROR);
  });
});

describe("reserved bits and opcodes", () => {
  for (const rsv of [0x40, 0x20, 0x10, 0x70]) {
    it(`rejects rsv bits 0x${rsv.toString(16)}`, () => {
      const harness = openHarness();
      harness.socket.emitData(clientFrame(OPCODE.TEXT, encodeUtf8("x"), { rsv }));
      expectClosedWith(harness, CLOSE_CODE.PROTOCOL_ERROR);
    });
  }

  for (const opcode of [0x3, 0x4, 0x5, 0x6, 0x7]) {
    it(`rejects reserved data opcode 0x${opcode.toString(16)}`, () => {
      const harness = openHarness();
      harness.socket.emitData(clientFrame(opcode, encodeUtf8("x")));
      expectClosedWith(harness, CLOSE_CODE.PROTOCOL_ERROR);
    });
  }

  for (const opcode of [0xb, 0xc, 0xd, 0xe, 0xf]) {
    it(`rejects reserved control opcode 0x${opcode.toString(16)}`, () => {
      const harness = openHarness();
      harness.socket.emitData(clientFrame(opcode, encodeUtf8("x")));
      expectClosedWith(harness, CLOSE_CODE.PROTOCOL_ERROR);
    });
  }

  it("rejects an unmasked client frame", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.TEXT, encodeUtf8("x"), { mask: false }));
    expectClosedWith(harness, CLOSE_CODE.PROTOCOL_ERROR);
  });
});

describe("utf-8 enforcement", () => {
  it("closes 1007 on an invalid text frame", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.TEXT, new Uint8Array([0xce, 0xba, 0xed, 0xa0, 0x80])));
    expectClosedWith(harness, CLOSE_CODE.INVALID_PAYLOAD);
  });

  it("closes 1007 as soon as an invalid byte lands in a later fragment", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.TEXT, encodeUtf8("ok"), { fin: false }));
    expect(harness.connection.isOpen).toBe(true);
    harness.socket.emitData(
      clientFrame(OPCODE.CONTINUATION, new Uint8Array([0xf8, 0x88, 0x80, 0x80]), { fin: false }),
    );
    expectClosedWith(harness, CLOSE_CODE.INVALID_PAYLOAD);
  });

  it("closes 1007 when the message ends mid code point", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.TEXT, new Uint8Array([0x61, 0xc2])));
    expectClosedWith(harness, CLOSE_CODE.INVALID_PAYLOAD);
  });

  it("accepts invalid utf-8 in a binary frame", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.BINARY, new Uint8Array([0xff, 0xfe, 0x80])));
    expect(harness.connection.isOpen).toBe(true);
    expect(harness.events.at(-1)!.kind).toBe("binary");
  });

  it("closes 1007 on an invalid close reason", () => {
    const harness = openHarness();
    harness.socket.emitData(
      clientFrame(OPCODE.CLOSE, closePayload(1000, new Uint8Array([0xed, 0xa0, 0x80]))),
    );
    expectClosedWith(harness, CLOSE_CODE.INVALID_PAYLOAD);
  });
});

describe("close handshake", () => {
  it("echoes an empty close with an empty close", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.CLOSE, new Uint8Array(0)));
    const frame = lastCloseFrame(harness)!;
    expect(frame.payload.length).toBe(0);
    expect(harness.socket.closed).toBe(true);
    expect(harness.events.at(-1)).toMatchObject({ kind: "close", code: CLOSE_CODE.NO_STATUS });
  });

  it("echoes the peer close code", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.CLOSE, closePayload(1000, encodeUtf8("bye"))));
    expectClosedWith(harness, 1000);
    expect(harness.events.at(-1)).toMatchObject({ kind: "close", code: 1000, reason: "bye" });
  });

  it("rejects a close payload of exactly one byte", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.CLOSE, new Uint8Array([0x03])));
    expectClosedWith(harness, CLOSE_CODE.PROTOCOL_ERROR);
  });

  it("rejects a close frame with a 124 byte reason", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.CLOSE, closePayload(1000, bytesOfLength(124))));
    expectClosedWith(harness, CLOSE_CODE.PROTOCOL_ERROR);
  });

  for (const code of [1000, 1001, 1002, 1003, 1007, 1008, 1009, 1010, 1011, 3000, 3999, 4000, 4999]) {
    it(`accepts close code ${code}`, () => {
      const harness = openHarness();
      harness.socket.emitData(clientFrame(OPCODE.CLOSE, closePayload(code)));
      expectClosedWith(harness, code);
    });
  }

  for (const code of [0, 999, 1004, 1005, 1006, 1015, 1016, 1100, 2000, 2999, 5000, 65535]) {
    it(`rejects close code ${code}`, () => {
      const harness = openHarness();
      harness.socket.emitData(clientFrame(OPCODE.CLOSE, closePayload(code)));
      expectClosedWith(harness, CLOSE_CODE.PROTOCOL_ERROR);
    });
  }

  it("never puts 1005 or 1006 on the wire", () => {
    const harness = openHarness();
    harness.connection.close(CLOSE_CODE.ABNORMAL, "internal");
    expect(closeCodeOf(lastCloseFrame(harness)!)).toBe(CLOSE_CODE.PROTOCOL_ERROR);
  });

  it("ignores data frames after the peer close", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.CLOSE, closePayload(1000)));
    const before = harness.events.length;
    harness.socket.emitData(clientFrame(OPCODE.TEXT, encodeUtf8("late")));
    expect(harness.events.length).toBe(before);
  });

  it("reports 1006 when the socket drops without a close frame", () => {
    const harness = openHarness();
    harness.socket.emitClose();
    expect(harness.events.at(-1)).toMatchObject({ kind: "close", code: CLOSE_CODE.ABNORMAL });
  });

  it("finishes a server-initiated close when the peer echoes", () => {
    const harness = openHarness();
    harness.connection.close(1001, "going away");
    expect(closeCodeOf(lastCloseFrame(harness)!)).toBe(1001);
    harness.socket.emitData(clientFrame(OPCODE.CLOSE, closePayload(1001)));
    expect(harness.socket.closed).toBe(true);
    expect(harness.events.at(-1)).toMatchObject({ kind: "close", code: 1001 });
  });

  it("force-closes if the peer never echoes the close", () => {
    const harness = openHarness();
    harness.connection.close(1000, "done");
    expect(harness.socket.closed).toBe(false);
    harness.timers.fireWithDelay(DEFAULT_LIMITS.closeGraceMs);
    expect(harness.socket.closed).toBe(true);
  });
});

describe("shipping limits", () => {
  it("accepts a game-sized message comfortably under the shipping frame cap", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.BINARY, bytesOfLength(16 * 1024)));
    expect(harness.connection.isOpen).toBe(true);
  });

  it("rejects an oversized frame at the real shipping cap, with 1009", () => {
    const harness = openHarness();
    harness.socket.emitData(
      clientFrame(OPCODE.BINARY, bytesOfLength(DEFAULT_LIMITS.maxFramePayloadBytes + 1)),
    );
    expectClosedWith(harness, CLOSE_CODE.MESSAGE_TOO_BIG);
  });

  it("never buffers an attacker-declared huge payload it has not received", () => {
    const harness = openHarness();
    const header = new Uint8Array([0x82, 0xff, 0, 0, 0, 0, 0x01, 0, 0, 0, 0, 0, 0, 0]);
    harness.socket.emitData(header);
    expectClosedWith(harness, CLOSE_CODE.MESSAGE_TOO_BIG);
  });
});

describe("limits", () => {
  it("closes 1009 when a single frame exceeds maxFramePayloadBytes", () => {
    const harness = openHarness({ limits: { maxFramePayloadBytes: 1024 } });
    harness.socket.emitData(clientFrame(OPCODE.BINARY, bytesOfLength(1025)));
    expectClosedWith(harness, CLOSE_CODE.MESSAGE_TOO_BIG);
  });

  it("closes 1009 when reassembly exceeds maxMessageBytes", () => {
    const harness = openHarness({
      limits: { maxFramePayloadBytes: 1024, maxMessageBytes: 2048, maxFragments: 100 },
    });
    harness.socket.emitData(clientFrame(OPCODE.BINARY, bytesOfLength(1024), { fin: false }));
    harness.socket.emitData(clientFrame(OPCODE.CONTINUATION, bytesOfLength(1024), { fin: false }));
    expect(harness.connection.isOpen).toBe(true);
    harness.socket.emitData(clientFrame(OPCODE.CONTINUATION, bytesOfLength(1)));
    expectClosedWith(harness, CLOSE_CODE.MESSAGE_TOO_BIG);
  });

  it("closes 1009 when the fragment count exceeds maxFragments", () => {
    const harness = openHarness({ limits: { maxFragments: 3 } });
    harness.socket.emitData(clientFrame(OPCODE.TEXT, encodeUtf8("a"), { fin: false }));
    harness.socket.emitData(clientFrame(OPCODE.CONTINUATION, encodeUtf8("b"), { fin: false }));
    harness.socket.emitData(clientFrame(OPCODE.CONTINUATION, encodeUtf8("c"), { fin: false }));
    expect(harness.connection.isOpen).toBe(true);
    harness.socket.emitData(clientFrame(OPCODE.CONTINUATION, encodeUtf8("d"), { fin: false }));
    expectClosedWith(harness, CLOSE_CODE.MESSAGE_TOO_BIG);
  });

  it("accepts a message exactly at the default caps", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.BINARY, bytesOfLength(DEFAULT_LIMITS.maxFramePayloadBytes)));
    expect(harness.connection.isOpen).toBe(true);
    expect(harness.events.at(-1)!.kind).toBe("binary");
  });

  it("replies 431 when the header block exceeds maxHttpHeaderBytes", () => {
    const harness = createHarness({ limits: { maxHttpHeaderBytes: 256 } });
    harness.socket.emitData(
      buildHandshakeRequest("/", { "X-Pad": "p".repeat(400) }),
    );
    expect(harness.socket.writtenText().startsWith("HTTP/1.1 431 ")).toBe(true);
    expect(harness.socket.closed).toBe(true);
  });

  it("replies 431 to a slow-loris header stream before it completes", () => {
    const harness = createHarness({ limits: { maxHttpHeaderBytes: 128 } });
    harness.socket.emitData(new Uint8Array(200));
    expect(harness.socket.writtenText().startsWith("HTTP/1.1 431 ")).toBe(true);
    expect(harness.socket.closed).toBe(true);
  });

  it("replies 408 and closes when the handshake times out", () => {
    const harness = createHarness();
    harness.socket.emitData(new Uint8Array([0x47, 0x45, 0x54]));
    harness.timers.fireWithDelay(DEFAULT_LIMITS.handshakeTimeoutMs);
    expect(harness.socket.writtenText().startsWith("HTTP/1.1 408 ")).toBe(true);
    expect(harness.socket.closed).toBe(true);
  });

  it("closes an idle connection with 1001", () => {
    const harness = openHarness();
    harness.timers.fireWithDelay(DEFAULT_LIMITS.idleTimeoutMs);
    expect(closeCodeOf(lastCloseFrame(harness)!)).toBe(CLOSE_CODE.GOING_AWAY);
  });

  it("resets the idle timer on incoming data", () => {
    const harness = openHarness();
    harness.socket.emitData(clientFrame(OPCODE.TEXT, encodeUtf8("keepalive")));
    expect(harness.timers.size).toBe(1);
    harness.socket.emitData(clientFrame(OPCODE.TEXT, encodeUtf8("keepalive")));
    expect(harness.timers.size).toBe(1);
    expect(harness.connection.isOpen).toBe(true);
  });
});

describe("http responder", () => {
  it("serves a page for a non-upgrade request", () => {
    const harness = createHarness({
      responder: {
        respond(request) {
          if (request.path !== "/") return null;
          return {
            status: 200,
            headers: { "Content-Type": "text/html" },
            body: "<h1>hi</h1>",
          };
        },
      },
    });
    harness.socket.emitData(new TextEncoder().encode("GET / HTTP/1.1\r\nHost: x\r\n\r\n"));
    const response = harness.socket.writtenText();
    expect(response.startsWith("HTTP/1.1 200 OK\r\n")).toBe(true);
    expect(response).toContain("Content-Type: text/html\r\n");
    expect(response).toContain("Content-Length: 11\r\n");
    expect(response.endsWith("<h1>hi</h1>")).toBe(true);
  });

  it("returns 404 when the responder returns null", () => {
    const harness = createHarness({
      responder: {
        respond() {
          return null;
        },
      },
    });
    harness.socket.emitData(new TextEncoder().encode("GET /missing HTTP/1.1\r\nHost: x\r\n\r\n"));
    expect(harness.socket.writtenText().startsWith("HTTP/1.1 404 ")).toBe(true);
  });

  it("returns 404 when there is no responder at all", () => {
    const harness = createHarness();
    harness.socket.emitData(new TextEncoder().encode("GET / HTTP/1.1\r\nHost: x\r\n\r\n"));
    expect(harness.socket.writtenText().startsWith("HTTP/1.1 404 ")).toBe(true);
  });
});
