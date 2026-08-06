import { describe, expect, it } from "vitest";
import {
  createReactNativeSocketPort,
  type ReactNativeSocketCodec,
  type RnTcpSocketLike,
} from "../src/adapters/react-native";
import type { Timers } from "../src/types";

const codec: ReactNativeSocketCodec = {
  toBytes: chunk => chunk as Uint8Array,
  fromBytes: bytes => bytes,
};

function fakeTimers() {
  const scheduled: Array<{ handler: () => void; delayMs: number }> = [];
  const timers: Timers = {
    setTimeout(handler, delayMs) {
      scheduled.push({ handler, delayMs });
      return scheduled.length - 1;
    },
    clearTimeout(handle) {
      const index = handle as number;
      if (scheduled[index]) scheduled[index] = { handler: () => {}, delayMs: 0 };
    },
  };
  return { timers, fireAll: () => scheduled.forEach(t => t.handler()) };
}

function fakeSocket() {
  const pending: Array<(error?: unknown) => void> = [];
  const written: Uint8Array[] = [];
  let destroyed = false;
  const socket: RnTcpSocketLike = {
    on() {},
    write(data, _encoding, callback) {
      written.push(data as Uint8Array);
      if (callback) pending.push(callback);
    },
    destroy() {
      destroyed = true;
    },
    setNoDelay() {},
  };
  return {
    socket,
    written,
    get destroyed() {
      return destroyed;
    },
    flushOneWrite() {
      pending.shift()?.();
    },
    flushAllWrites() {
      while (pending.length > 0) pending.shift()?.();
    },
  };
}

describe("react-native socket port drains writes before destroying", () => {
  it("does not destroy the socket while a write is still in flight", () => {
    const fake = fakeSocket();
    const { timers } = fakeTimers();
    const port = createReactNativeSocketPort(fake.socket, codec, { timers });

    port.write(new Uint8Array([1, 2, 3]));
    port.close();

    expect(fake.destroyed).toBe(false);

    fake.flushOneWrite();
    expect(fake.destroyed).toBe(true);
  });

  it("waits for every queued write, not just the first", () => {
    const fake = fakeSocket();
    const { timers } = fakeTimers();
    const port = createReactNativeSocketPort(fake.socket, codec, { timers });

    port.write(new Uint8Array([1]));
    port.write(new Uint8Array([2]));
    port.write(new Uint8Array([3]));
    port.close();

    fake.flushOneWrite();
    expect(fake.destroyed).toBe(false);
    fake.flushOneWrite();
    expect(fake.destroyed).toBe(false);
    fake.flushOneWrite();
    expect(fake.destroyed).toBe(true);
  });

  it("destroys immediately when nothing is in flight", () => {
    const fake = fakeSocket();
    const { timers } = fakeTimers();
    const port = createReactNativeSocketPort(fake.socket, codec, { timers });

    port.close();
    expect(fake.destroyed).toBe(true);
  });

  it("never leaks a socket when a write callback never fires", () => {
    const fake = fakeSocket();
    const { timers, fireAll } = fakeTimers();
    const port = createReactNativeSocketPort(fake.socket, codec, { timers });

    port.write(new Uint8Array([1, 2, 3]));
    port.close();
    expect(fake.destroyed).toBe(false);

    fireAll();
    expect(fake.destroyed).toBe(true);
  });

  it("drops writes issued after the socket is gone", () => {
    const fake = fakeSocket();
    const { timers } = fakeTimers();
    const port = createReactNativeSocketPort(fake.socket, codec, { timers });

    port.close();
    port.write(new Uint8Array([9]));
    expect(fake.written).toHaveLength(0);
  });

  it("destroys only once even if drained and timed out", () => {
    const fake = fakeSocket();
    const { timers, fireAll } = fakeTimers();
    const port = createReactNativeSocketPort(fake.socket, codec, { timers });

    port.write(new Uint8Array([1]));
    port.close();
    fake.flushAllWrites();
    expect(fake.destroyed).toBe(true);

    fireAll();
    expect(fake.destroyed).toBe(true);
  });
});
