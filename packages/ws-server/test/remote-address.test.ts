import { afterEach, describe, expect, it } from "vitest";
import { createNodeListener, nodeTimers } from "../node/adapter";
import { SocketServer } from "../src/server";
import type { WsRequestInfo, WsServerHooks } from "../src/types";

const servers: SocketServer[] = [];

afterEach(() => {
  while (servers.length > 0) servers.pop()?.stop();
});

function openSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.addEventListener("open", () => resolve(socket));
    socket.addEventListener("error", () => reject(new Error(`failed to open ${url}`)));
  });
}

describe("remote address on open", () => {
  it("passes the real loopback remote address to onOpen for a live TCP connection", async () => {
    const listener = createNodeListener();
    const opened: WsRequestInfo[] = [];
    const hooks: WsServerHooks = {
      onOpen(id, request) {
        opened.push(request);
        server.send(id, "ready");
      },
      onMessage() {},
      onBinaryMessage() {},
      onClose() {},
    };
    const server = new SocketServer({ listener, hooks, timers: nodeTimers });
    servers.push(server);
    const port = await listener.listen(0, "127.0.0.1");

    const socket = await openSocket(`ws://127.0.0.1:${port}/play`);

    expect(opened.length).toBe(1);
    expect(opened[0]?.remoteAddress).toBeDefined();
    expect(["127.0.0.1", "::1", "::ffff:127.0.0.1"]).toContain(opened[0]?.remoteAddress);

    socket.close();
  });
});
