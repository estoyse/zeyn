import net from "node:net";
import type { ListenerPort, SocketPort, TimerHandle, Timers } from "../src/types";

export const nodeTimers: Timers = {
  setTimeout(handler: () => void, delayMs: number): TimerHandle {
    const handle = setTimeout(handler, delayMs);
    if (typeof handle === "object" && handle !== null && "unref" in handle) handle.unref();
    return handle;
  },
  clearTimeout(handle: TimerHandle): void {
    clearTimeout(handle as ReturnType<typeof setTimeout>);
  },
};

export function createNodeSocketPort(socket: net.Socket): SocketPort {
  socket.setNoDelay(true);
  return {
    remoteAddress: socket.remoteAddress,
    write(bytes: Uint8Array) {
      if (socket.destroyed || socket.writableEnded) return;
      socket.write(bytes);
    },
    close() {
      if (socket.destroyed || socket.writableEnded) return;
      socket.end();
    },
    onData(handler) {
      socket.on("data", (chunk: Buffer) => {
        handler(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      });
    },
    onClose(handler) {
      socket.on("close", () => handler());
    },
    onError(handler) {
      socket.on("error", (error) => handler(error));
    },
  };
}

export interface NodeListener extends ListenerPort {
  listen(port: number, host?: string): Promise<number>;
  readonly server: net.Server;
}

export function createNodeListener(): NodeListener {
  const server = net.createServer();
  let connectionHandler: ((socket: SocketPort) => void) | null = null;

  server.on("connection", (socket) => {
    connectionHandler?.(createNodeSocketPort(socket));
  });

  return {
    server,
    onConnection(handler) {
      connectionHandler = handler;
    },
    close() {
      server.close();
    },
    listen(port: number, host = "0.0.0.0") {
      return new Promise<number>((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, host, () => {
          const address = server.address();
          if (address === null || typeof address === "string") {
            reject(new Error("failed to bind socket"));
            return;
          }
          resolve(address.port);
        });
      });
    },
  };
}
