import { createNodeListener, nodeTimers } from "../node/adapter";
import { SocketServer } from "../src/server";
import type { HttpResponder, WsLimits, WsServerHooks } from "../src/types";

export const AUTOBAHN_LIMITS: WsLimits = {
  maxHttpHeaderBytes: 8 * 1024,
  handshakeTimeoutMs: 5_000,
  maxFramePayloadBytes: 32 * 1024 * 1024,
  maxMessageBytes: 32 * 1024 * 1024,
  maxFragments: 1_000_000,
  idleTimeoutMs: 300_000,
  closeGraceMs: 1_000,
};

const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Zeyn WS Server</title>
  </head>
  <body>
    <h1>zeyn ws-server</h1>
  </body>
</html>
`;

export const staticPageResponder: HttpResponder = {
  respond(request) {
    if (request.method !== "GET") return null;
    if (request.path !== "/") return null;
    return {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: PAGE,
    };
  },
};

export async function startEchoServer(
  port: number,
  limits: Partial<WsLimits> = AUTOBAHN_LIMITS,
): Promise<{ port: number; server: SocketServer }> {
  const listener = createNodeListener();

  const hooks: WsServerHooks = {
    onOpen() {},
    onMessage(id, data) {
      server.send(id, data);
    },
    onBinaryMessage(id, data) {
      server.sendBinary(id, data);
    },
    onClose() {},
  };

  const server = new SocketServer({
    listener,
    hooks,
    timers: nodeTimers,
    responder: staticPageResponder,
    limits,
    maxConnections: 64,
  });

  const boundPort = await listener.listen(port, "127.0.0.1");
  return { port: boundPort, server };
}
