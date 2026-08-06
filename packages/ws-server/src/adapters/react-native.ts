import type { ListenerPort, SocketPort, Timers } from "../types";

export const WRITE_DRAIN_TIMEOUT_MS = 4000;

export interface RnTcpSocketLike {
  on(event: "data", listener: (data: unknown) => void): void;
  on(event: "close", listener: () => void): void;
  on(event: "error", listener: (error: unknown) => void): void;
  write(
    data: unknown,
    encoding?: unknown,
    callback?: (error?: unknown) => void
  ): void;
  destroy(): void;
  setNoDelay?(enable: boolean): void;
  remoteAddress?: string;
}

export interface RnTcpServerLike {
  on(event: "connection", listener: (socket: RnTcpSocketLike) => void): void;
  close(): void;
}

export interface ReactNativeSocketCodec {
  toBytes(chunk: unknown): Uint8Array;
  fromBytes(bytes: Uint8Array): unknown;
}

export interface ReactNativeSocketPortOptions {
  timers?: Timers;
  drainTimeoutMs?: number;
}

export function createReactNativeSocketPort(
  socket: RnTcpSocketLike,
  codec: ReactNativeSocketCodec,
  options: ReactNativeSocketPortOptions = {}
): SocketPort {
  socket.setNoDelay?.(true);

  const timers = options.timers;
  const drainTimeoutMs = options.drainTimeoutMs ?? WRITE_DRAIN_TIMEOUT_MS;
  let inFlightWrites = 0;
  let closeRequested = false;
  let destroyed = false;
  let drainTimer: unknown = null;

  const destroyNow = () => {
    if (destroyed) return;
    destroyed = true;
    if (drainTimer !== null && timers) {
      timers.clearTimeout(drainTimer);
      drainTimer = null;
    }
    socket.destroy();
  };

  const destroyWhenDrained = () => {
    if (closeRequested && inFlightWrites === 0) destroyNow();
  };

  return {
    remoteAddress: socket.remoteAddress,
    write(bytes) {
      if (destroyed) return;
      inFlightWrites += 1;
      socket.write(codec.fromBytes(bytes), undefined, () => {
        inFlightWrites -= 1;
        destroyWhenDrained();
      });
    },
    close() {
      if (destroyed) return;
      closeRequested = true;
      if (inFlightWrites === 0) {
        destroyNow();
        return;
      }
      if (timers && drainTimer === null) {
        drainTimer = timers.setTimeout(destroyNow, drainTimeoutMs);
      }
    },
    onData(handler) {
      socket.on("data", (chunk) => handler(codec.toBytes(chunk)));
    },
    onClose(handler) {
      socket.on("close", () => {
        destroyed = true;
        handler();
      });
    },
    onError(handler) {
      socket.on("error", (error) => handler(error));
    },
  };
}

export function createReactNativeListener(
  server: RnTcpServerLike,
  codec: ReactNativeSocketCodec,
  options: ReactNativeSocketPortOptions = {}
): ListenerPort {
  return {
    onConnection(handler) {
      server.on("connection", (socket) => {
        handler(createReactNativeSocketPort(socket, codec, options));
      });
    },
    close() {
      server.close();
    },
  };
}
