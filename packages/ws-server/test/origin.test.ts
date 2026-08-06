import net from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createNodeListener, nodeTimers } from "../node/adapter";
import { allowAnyOrigin, originAuthority, sameOriginOnly } from "../src/handshake";
import type { ParsedHttpRequest } from "../src/http";
import { SocketServer } from "../src/server";
import type { WsServerHooks } from "../src/types";

function request(headers: Record<string, string>): ParsedHttpRequest {
  return {
    method: "GET",
    path: "/play",
    query: {},
    httpVersion: "1.1",
    headers,
  } as ParsedHttpRequest;
}

describe("originAuthority", () => {
  it("extracts the authority from an origin", () => {
    expect(originAuthority("http://192.168.1.42:47801")).toBe("192.168.1.42:47801");
    expect(originAuthority("HTTPS://Zeyn.UZ")).toBe("zeyn.uz");
    expect(originAuthority("http://host:8080/path?q=1")).toBe("host:8080");
  });

  it("rejects a malformed origin", () => {
    expect(originAuthority("null")).toBeNull();
    expect(originAuthority("")).toBeNull();
    expect(originAuthority("http://")).toBeNull();
  });
});

describe("sameOriginOnly", () => {
  const host = "192.168.1.42:47801";

  it("allows a client that sends no Origin at all", () => {
    expect(sameOriginOnly(null, request({ host }))).toBe(true);
  });

  it("allows the page we served ourselves", () => {
    expect(sameOriginOnly(`http://${host}`, request({ host }))).toBe(true);
  });

  it("rejects a page served by any other host on the network", () => {
    expect(sameOriginOnly("http://192.168.1.99:3000", request({ host }))).toBe(false);
    expect(sameOriginOnly("https://evil.example.com", request({ host }))).toBe(false);
    expect(sameOriginOnly("null", request({ host }))).toBe(false);
  });

  it("rejects when the request carries no Host to compare against", () => {
    expect(sameOriginOnly("http://192.168.1.42:47801", request({}))).toBe(false);
  });

  it("allowAnyOrigin opts out", () => {
    expect(allowAnyOrigin("https://evil.example.com", request({ host }))).toBe(true);
  });
});

let server: SocketServer;
let port = 0;

beforeAll(async () => {
  const listener = createNodeListener();
  const hooks: WsServerHooks = {
    onOpen(id) {
      server.send(id, "ready");
    },
    onMessage() {},
    onBinaryMessage() {},
    onClose() {},
  };
  server = new SocketServer({ listener, hooks, timers: nodeTimers });
  port = await listener.listen(0, "127.0.0.1");
});

afterAll(() => {
  server.stop();
});

function upgrade(extraHeaders: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ port, host: "127.0.0.1" }, () => {
      socket.write(
        `GET /play HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nUpgrade: websocket\r\n` +
          "Connection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n" +
          `Sec-WebSocket-Version: 13\r\n${extraHeaders}\r\n`,
      );
    });
    let received = "";
    socket.setTimeout(3000, () => {
      socket.destroy();
      resolve(received);
    });
    socket.on("data", (chunk: Buffer) => {
      received += chunk.toString("latin1");
      if (received.includes("\r\n\r\n")) {
        socket.destroy();
        resolve(received);
      }
    });
    socket.on("error", reject);
  });
}

describe("cross-site websocket hijacking is refused at the handshake", () => {
  it("accepts a native client that sends no Origin", async () => {
    const response = await upgrade("");
    expect(response.startsWith("HTTP/1.1 101 ")).toBe(true);
  });

  it("accepts the guest page we served ourselves", async () => {
    const response = await upgrade(`Origin: http://127.0.0.1:${port}\r\n`);
    expect(response.startsWith("HTTP/1.1 101 ")).toBe(true);
  });

  it("refuses a hostile page hosted elsewhere on the LAN", async () => {
    const response = await upgrade("Origin: http://192.168.1.99:8080\r\n");
    expect(response.startsWith("HTTP/1.1 403 ")).toBe(true);
    expect(response).not.toContain("101 Switching Protocols");
  });

  it("refuses a hostile page on the public internet", async () => {
    const response = await upgrade("Origin: https://evil.example.com\r\n");
    expect(response.startsWith("HTTP/1.1 403 ")).toBe(true);
  });
});
