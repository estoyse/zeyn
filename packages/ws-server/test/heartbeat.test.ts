import { afterEach, describe, expect, it } from "vitest";
import { createNodeListener, nodeTimers } from "../node/adapter";
import { SocketServer } from "../src/server";
import type { WsServerHooks } from "../src/types";

const IDLE_TIMEOUT_MS = 600;
const HEARTBEAT_MS = 150;

const servers: SocketServer[] = [];

afterEach(() => {
  while (servers.length > 0) servers.pop()?.stop();
});

async function startServer(heartbeatIntervalMs: number) {
  const listener = createNodeListener();
  const closed: Array<{ code: number; reason: string }> = [];
  const hooks: WsServerHooks = {
    onOpen(id) {
      server.send(id, "ready");
    },
    onMessage(id, data) {
      server.send(id, `echo:${data}`);
    },
    onBinaryMessage() {},
    onClose(_id, code, reason) {
      closed.push({ code, reason });
    },
  };
  const server = new SocketServer({
    listener,
    hooks,
    timers: nodeTimers,
    limits: { idleTimeoutMs: IDLE_TIMEOUT_MS },
    heartbeatIntervalMs,
  });
  servers.push(server);
  const port = await listener.listen(0, "127.0.0.1");
  return { server, port, closed };
}

function openSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.addEventListener("open", () => resolve(socket));
    socket.addEventListener("error", () => reject(new Error(`failed to open ${url}`)));
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("idle heartbeat", () => {
  it("keeps a silent player connected far past the idle timeout", async () => {
    const { server, port, closed } = await startServer(HEARTBEAT_MS);
    const socket = await openSocket(`ws://127.0.0.1:${port}/play`);

    await sleep(IDLE_TIMEOUT_MS * 3);

    expect(closed).toEqual([]);
    expect(socket.readyState).toBe(WebSocket.OPEN);
    expect(server.connectionCount).toBe(1);

    const pending = new Promise<string>((resolve) => {
      socket.addEventListener(
        "message",
        (event) => resolve((event as MessageEvent).data as string),
        { once: true },
      );
    });
    socket.send("still here");
    expect(await pending).toBe("echo:still here");

    socket.close();
  });

  it("drops a silent player once the idle timeout lapses with no heartbeat", async () => {
    const { port, closed } = await startServer(0);
    await openSocket(`ws://127.0.0.1:${port}/play`);

    await sleep(IDLE_TIMEOUT_MS * 3);

    expect(closed.length).toBe(1);
  });
});
