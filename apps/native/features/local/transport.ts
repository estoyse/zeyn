import type { RandomBytes } from "@zeyn/api/game-code";
import {
  createReactNativeListener,
  type ListenerPort,
  type ReactNativeSocketCodec,
  type RnTcpServerLike,
  type RnTcpSocketLike,
  type Timers,
} from "@zeyn/ws-server";
import * as Crypto from "expo-crypto";
import * as Network from "expo-network";

export interface RnRawSocket {
  remoteAddress?: string;
  on(event: "data", listener: (data: unknown) => void): void;
  on(event: "close", listener: (hadError?: boolean) => void): void;
  on(event: "error", listener: (error: unknown) => void): void;
  write(
    data: Uint8Array,
    encoding?: unknown,
    callback?: (error?: unknown) => void
  ): boolean;
  destroy(): void;
  setNoDelay(enable?: boolean): void;
}

export interface RnRawServer {
  on(event: "connection", listener: (socket: RnRawSocket) => void): void;
  on(event: "listening", listener: () => void): void;
  on(event: "error", listener: (error: unknown) => void): void;
  on(event: "close", listener: () => void): void;
  listen(options: { port: number; host?: string; reuseAddress?: boolean }): void;
  close(): void;
}

export interface RnTcpSocketModule {
  createServer(): RnRawServer;
}

let cachedModule: RnTcpSocketModule | null | undefined;

export function loadTcpSocketModule(): RnTcpSocketModule {
  if (cachedModule === undefined) {
    try {
      const required = require("react-native-tcp-socket");
      cachedModule = (required.default ?? required) as RnTcpSocketModule;
    } catch {
      cachedModule = null;
    }
  }
  if (!cachedModule) {
    throw new Error(
      "react-native-tcp-socket is unavailable. Build and run a native dev client (expo run:android) -- this feature does not work in Expo Go."
    );
  }
  return cachedModule;
}

export const socketCodec: ReactNativeSocketCodec = {
  toBytes(chunk) {
    if (typeof chunk === "string") {
      const bytes = new Uint8Array(chunk.length);
      for (let index = 0; index < chunk.length; index += 1) {
        bytes[index] = chunk.charCodeAt(index) & 0xff;
      }
      return bytes;
    }
    const view = chunk as Uint8Array;
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength).slice();
  },
  fromBytes(bytes) {
    return bytes;
  },
};

export function createRnTimers(): Timers {
  return {
    setTimeout: (handler, delayMs) => setTimeout(handler, delayMs),
    clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  };
}

function wrapSocket(socket: RnRawSocket): RnTcpSocketLike {
  const wrapped = {
    on(event: "data" | "close" | "error", listener: (arg?: unknown) => void) {
      socket.on(event as "data", listener as (data: unknown) => void);
    },
    write(
      data: unknown,
      _encoding?: unknown,
      callback?: (error?: unknown) => void
    ) {
      try {
        socket.write(data as Uint8Array, undefined, callback);
      } catch (error) {
        callback?.(error);
      }
    },
    destroy() {
      try {
        socket.destroy();
      } catch {}
    },
    setNoDelay(enable: boolean) {
      try {
        socket.setNoDelay(enable);
      } catch {}
    },
    remoteAddress: socket.remoteAddress,
  };
  return wrapped as unknown as RnTcpSocketLike;
}

export interface LocalListenerEvents {
  onListening?: () => void;
  onServerError?: (error: unknown) => void;
  onServerClose?: () => void;
  onSocketConnection?: (remoteAddress: string | undefined) => void;
  onSocketData?: (remoteAddress: string | undefined, byteCount: number) => void;
  onSocketError?: (remoteAddress: string | undefined, error: unknown) => void;
  onSocketClose?: (remoteAddress: string | undefined) => void;
}

export function createLocalListener(port: number, events: LocalListenerEvents = {}): ListenerPort {
  const module = loadTcpSocketModule();
  const server = module.createServer();

  const serverLike: RnTcpServerLike = {
    on(_event, listener) {
      server.on("connection", (socket) => {
        events.onSocketConnection?.(socket.remoteAddress);
        socket.on("data", (data) => {
          const byteCount = typeof data === "string" ? data.length : (data as Uint8Array).byteLength;
          events.onSocketData?.(socket.remoteAddress, byteCount);
        });
        socket.on("error", (error) => events.onSocketError?.(socket.remoteAddress, error));
        socket.on("close", () => events.onSocketClose?.(socket.remoteAddress));
        listener(wrapSocket(socket));
      });
    },
    close() {
      try {
        server.close();
      } catch {}
    },
  };

  server.on("listening", () => events.onListening?.());
  server.on("error", (error) => events.onServerError?.(error));
  server.on("close", () => events.onServerClose?.());

  const listener = createReactNativeListener(serverLike, socketCodec, {
    timers: createRnTimers(),
  });
  server.listen({ port, host: "0.0.0.0", reuseAddress: true });
  return listener;
}

export async function getLanIpAddress(): Promise<string> {
  const state = await Network.getNetworkStateAsync();
  if (!state.isConnected) {
    throw new Error("Not connected to a network. Join Wi-Fi to host a local game.");
  }
  const ip = await Network.getIpAddressAsync();
  if (!ip || ip === "0.0.0.0") {
    throw new Error("No usable LAN IP address available. Join Wi-Fi to host a local game.");
  }
  return ip;
}

export function createRandomBytes(): RandomBytes {
  return (length: number) => Crypto.getRandomBytes(length);
}

export function createHostDeviceId(randomBytes: RandomBytes): string {
  const bytes = randomBytes(16);
  let hex = "";
  for (let index = 0; index < bytes.length; index += 1) {
    hex += bytes[index]!.toString(16).padStart(2, "0");
  }
  return hex;
}
