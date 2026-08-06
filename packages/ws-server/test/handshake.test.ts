import { describe, expect, it } from "vitest";
import { base64Decode, base64Encode } from "../src/base64";
import { latin1Encode } from "../src/bytes";
import { computeAcceptValue, validateHandshake, WEBSOCKET_GUID } from "../src/handshake";
import { parseHttpRequest } from "../src/http";
import { sha1 } from "../src/sha1";
import { buildHandshakeRequest, createHarness } from "./helpers";

function hex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

describe("sha1", () => {
  it("matches the FIPS 180-1 vectors", () => {
    expect(hex(sha1(latin1Encode("")))).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
    expect(hex(sha1(latin1Encode("abc")))).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    expect(
      hex(sha1(latin1Encode("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"))),
    ).toBe("84983e441c3bd26ebaae4aa1f95129e5e54670f1");
  });

  it("handles the 55/56/64 byte padding boundaries", () => {
    expect(hex(sha1(latin1Encode("a".repeat(55))))).toBe(
      "c1c8bbdc22796e28c0e15163d20899b65621d65a",
    );
    expect(hex(sha1(latin1Encode("a".repeat(56))))).toBe(
      "c2db330f6083854c99d4b5bfb6e8f29f201be699",
    );
    expect(hex(sha1(latin1Encode("a".repeat(64))))).toBe(
      "0098ba824b5c16427bd7a1122a5a442a25ec644d",
    );
    expect(hex(sha1(latin1Encode("a".repeat(1000))))).toBe(
      "291e9a6c66994949b57ba5e650361e98fc36b1ba",
    );
  });
});

describe("base64", () => {
  it("round-trips arbitrary byte lengths", () => {
    for (let length = 0; length < 64; length++) {
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i++) bytes[i] = (i * 37 + length) & 0xff;
      const encoded = base64Encode(bytes);
      const decoded = base64Decode(encoded);
      expect(decoded).not.toBeNull();
      expect([...decoded!]).toEqual([...bytes]);
    }
  });

  it("matches known vectors", () => {
    expect(base64Encode(latin1Encode("f"))).toBe("Zg==");
    expect(base64Encode(latin1Encode("fo"))).toBe("Zm8=");
    expect(base64Encode(latin1Encode("foo"))).toBe("Zm9v");
    expect(base64Encode(latin1Encode("foobar"))).toBe("Zm9vYmFy");
  });

  it("rejects malformed input", () => {
    expect(base64Decode("A")).toBeNull();
    expect(base64Decode("****")).toBeNull();
  });

  it("decodes a 16 byte websocket key", () => {
    expect(base64Decode("dGhlIHNhbXBsZSBub25jZQ==")?.length).toBe(16);
  });
});

describe("Sec-WebSocket-Accept", () => {
  it("matches the RFC 6455 section 1.3 vector", () => {
    expect(computeAcceptValue("dGhlIHNhbXBsZSBub25jZQ==")).toBe("s3pPLMBiTxaQ9kYGzzhZRbK+xOo=");
  });

  it("uses the RFC magic GUID", () => {
    expect(WEBSOCKET_GUID).toBe("258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
  });

  it("matches the RFC 6455 section 4.2.2 example", () => {
    expect(computeAcceptValue("x3JJHMbDL1EzLkh9GBhXDw==")).toBe("HSmrc0sMlYUkAGmm5OPpG2HaGWk=");
  });
});

describe("handshake validation", () => {
  function check(overrides: Record<string, string | null>, method = "GET") {
    const raw = buildHandshakeRequest("/", overrides);
    const text = new TextDecoder().decode(raw).replace(/^GET/, method);
    const parsed = parseHttpRequest(new TextEncoder().encode(text));
    expect(parsed).not.toBeNull();
    return validateHandshake(parsed!);
  }

  it("accepts a well-formed upgrade", () => {
    expect(check({}).ok).toBe(true);
  });

  it("accepts a comma-separated Connection header case-insensitively", () => {
    expect(check({ Connection: "keep-alive, UPGRADE" }).ok).toBe(true);
  });

  it("rejects a missing Connection: Upgrade", () => {
    const result = check({ Connection: "keep-alive" });
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects a non-GET upgrade", () => {
    const result = check({}, "POST");
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects a missing key", () => {
    const result = check({ "Sec-WebSocket-Key": null });
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects a key that does not decode to 16 bytes", () => {
    const result = check({ "Sec-WebSocket-Key": "c2hvcnQ=" });
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("rejects a wrong version with 426", () => {
    const result = check({ "Sec-WebSocket-Version": "8" });
    expect(result).toMatchObject({ ok: false, status: 426 });
  });
});

describe("connection handshake", () => {
  it("replies 101 with the computed accept value", () => {
    const harness = createHarness();
    harness.socket.emitData(buildHandshakeRequest("/game?room=abc&n=2"));
    const response = harness.socket.writtenText();
    expect(response.startsWith("HTTP/1.1 101 Switching Protocols\r\n")).toBe(true);
    expect(response).toContain("Upgrade: websocket\r\n");
    expect(response).toContain("Connection: Upgrade\r\n");
    expect(response).toContain("Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=\r\n");
    expect(harness.connection.isOpen).toBe(true);
    expect(harness.events[0]).toMatchObject({
      kind: "open",
      path: "/game",
      query: { room: "abc", n: "2" },
    });
  });

  it("replies 400 when Connection: Upgrade is missing", () => {
    const harness = createHarness();
    harness.socket.emitData(buildHandshakeRequest("/", { Connection: "keep-alive" }));
    expect(harness.socket.writtenText().startsWith("HTTP/1.1 400 ")).toBe(true);
    expect(harness.socket.closed).toBe(true);
    expect(harness.connection.isOpen).toBe(false);
  });

  it("replies 426 with an advertised version on a version mismatch", () => {
    const harness = createHarness();
    harness.socket.emitData(buildHandshakeRequest("/", { "Sec-WebSocket-Version": "8" }));
    const response = harness.socket.writtenText();
    expect(response.startsWith("HTTP/1.1 426 ")).toBe(true);
    expect(response).toContain("Sec-WebSocket-Version: 13\r\n");
  });

  it("accepts a handshake delivered one byte at a time", () => {
    const harness = createHarness();
    const request = buildHandshakeRequest("/");
    for (const byte of request) harness.socket.emitData(new Uint8Array([byte]));
    expect(harness.connection.isOpen).toBe(true);
  });
});
