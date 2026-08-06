import net from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createNodeListener, nodeTimers } from "../node/adapter";
import { SocketServer } from "../src/server";
import type { HttpResponder, WsServerHooks } from "../src/types";

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>Zeyn</title></head><body><div id="app">join</div><script>const ws = new WebSocket("ws://" + location.host + "/play");</script></body></html>`;

const responder: HttpResponder = {
  respond(request) {
    if (request.method === "GET" && request.path === "/") {
      return { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" }, body: PAGE };
    }
    return null;
  },
};

let server: SocketServer;
let port = 0;
const opened: string[] = [];
const closed: Array<{ code: number; reason: string }> = [];

beforeAll(async () => {
  const listener = createNodeListener();
  const hooks: WsServerHooks = {
    onOpen(id, request) {
      opened.push(`${id} ${request.path} ${JSON.stringify(request.query)}`);
      server.send(id, `welcome:${request.query["name"] ?? "anon"}`);
    },
    onMessage(id, data) {
      server.send(id, `echo:${data}`);
    },
    onBinaryMessage(id, data) {
      server.sendBinary(id, data);
    },
    onClose(_id, code, reason) {
      closed.push({ code, reason });
    },
  };

  server = new SocketServer({
    listener,
    hooks,
    timers: nodeTimers,
    responder,
    limits: { idleTimeoutMs: 15_000 },
  });

  port = await listener.listen(0, "127.0.0.1");
});

afterAll(() => {
  server.stop();
});

function openSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";
    socket.addEventListener("open", () => resolve(socket));
    socket.addEventListener("error", () => reject(new Error(`failed to open ${url}`)));
  });
}

function nextMessage(socket: WebSocket): Promise<string | ArrayBuffer> {
  return new Promise((resolve) => {
    socket.addEventListener(
      "message",
      (event) => resolve((event as MessageEvent).data as string | ArrayBuffer),
      { once: true },
    );
  });
}

describe("browser guest path on a single port", () => {
  it("serves the static HTML page over plain HTTP", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    const body = await response.text();
    expect(body).toContain("<title>Zeyn</title>");
    expect(body).toContain("new WebSocket");
  });

  it("returns 404 for an unknown path", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/nope`);
    expect(response.status).toBe(404);
  });

  it("accepts a real RFC 6455 client on the same port and echoes text", async () => {
    const socket = await openSocket(`ws://127.0.0.1:${port}/play?name=ada`);
    expect(await nextMessage(socket)).toBe("welcome:ada");

    const pending = nextMessage(socket);
    socket.send("hello");
    expect(await pending).toBe("echo:hello");

    const unicode = nextMessage(socket);
    socket.send("κόσμε 😀");
    expect(await unicode).toBe("echo:κόσμε 😀");

    socket.close(1000, "done");
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(opened.some((entry) => entry.includes('/play {"name":"ada"}'))).toBe(true);
    expect(closed.at(-1)).toMatchObject({ code: 1000 });
  });

  it("round-trips a binary message", async () => {
    const socket = await openSocket(`ws://127.0.0.1:${port}/play`);
    await nextMessage(socket);
    const payload = new Uint8Array([0, 1, 2, 250, 251, 255]);
    const pending = nextMessage(socket);
    socket.send(payload);
    const received = await pending;
    expect(received).toBeInstanceOf(ArrayBuffer);
    expect([...new Uint8Array(received as ArrayBuffer)]).toEqual([...payload]);
    socket.close();
  });

  it("round-trips a fragmented-sized 60 KiB message", async () => {
    const socket = await openSocket(`ws://127.0.0.1:${port}/play`);
    await nextMessage(socket);
    const big = "z".repeat(60 * 1024);
    const pending = nextMessage(socket);
    socket.send(big);
    expect(await pending).toBe(`echo:${big}`);
    socket.close();
  });

  it("rejects an upgrade with a bad version", async () => {
    const response = await rawRequest(
      "GET /play HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n" +
        "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 8\r\n\r\n",
    );
    expect(response.startsWith("HTTP/1.1 426 ")).toBe(true);
    expect(response).toContain("Sec-WebSocket-Version: 13\r\n");
  });

  it("completes the RFC 6455 handshake byte for byte", async () => {
    const response = await rawRequest(
      "GET /play HTTP/1.1\r\nHost: x\r\nUpgrade: websocket\r\nConnection: keep-alive, Upgrade\r\n" +
        "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n\r\n",
    );
    expect(response.startsWith("HTTP/1.1 101 Switching Protocols\r\n")).toBe(true);
    expect(response).toContain("Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=\r\n");
  });
});

function rawRequest(request: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ port, host: "127.0.0.1" }, () => {
      socket.write(request);
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
