import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { createNodeListener, nodeTimers } from "@zeyn/ws-server/node";
import { LocalGameHost, type LocalGameHostOptions } from "../src/index";

const NONCE = "551209";
const HOST_DEVICE = "host-device-secret";
const GUEST_PAGE = "<!doctype html><title>Zeyn local</title><h1>Join</h1>";

interface Booted {
  host: LocalGameHost;
  port: number;
}

const running: LocalGameHost[] = [];

async function boot(
  overrides: Partial<LocalGameHostOptions> = {}
): Promise<Booted> {
  const listener = createNodeListener();
  const host = new LocalGameHost({
    listener,
    timers: nodeTimers,
    now: () => Date.now(),
    nonce: NONCE,
    hostDeviceId: HOST_DEVICE,
    guestPage: GUEST_PAGE,
    ...overrides,
  });
  running.push(host);
  const port = await listener.listen(0, "127.0.0.1");
  return { host, port };
}

interface Envelope {
  type: string;
  message?: string;
  code?: string;
  state?: Record<string, unknown>;
  serverTime?: number;
}

class Peer {
  readonly received: Envelope[] = [];
  readonly socket: WebSocket;

  closeCode: number | null = null;

  constructor(port: number) {
    this.socket = new WebSocket(`ws://127.0.0.1:${port}/`);
    this.socket.on("message", (data) => {
      this.received.push(JSON.parse(String(data)) as Envelope);
    });
    this.socket.on("close", (code) => {
      this.closeCode = code;
    });
  }

  static async connect(port: number): Promise<Peer> {
    const peer = new Peer(port);
    await new Promise<void>((resolve, reject) => {
      peer.socket.once("open", () => resolve());
      peer.socket.once("error", reject);
    });
    return peer;
  }

  static async join(
    port: number,
    deviceId: string,
    name: string,
    nonce = NONCE
  ): Promise<Peer> {
    const peer = await Peer.connect(port);
    peer.send({ type: "HELLO", v: 1, nonce, deviceId, name });
    return peer;
  }

  send(value: unknown): void {
    this.socket.send(JSON.stringify(value));
  }

  sendRaw(text: string): void {
    this.socket.send(text);
  }

  get states(): Record<string, unknown>[] {
    return this.received
      .filter((message) => message.type === "STATE_UPDATE")
      .map((message) => message.state as Record<string, unknown>);
  }

  get lastState(): Record<string, unknown> | undefined {
    return this.states.at(-1);
  }

  get errors(): Envelope[] {
    return this.received.filter((message) => message.type === "ERROR");
  }

  async waitFor(
    predicate: (peer: Peer) => boolean,
    label: string
  ): Promise<void> {
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      if (predicate(this)) return;
      await sleep(2);
    }
    throw new Error(`timed out waiting for ${label}`);
  }

  nextMessage(label: string): Promise<Envelope> {
    return new Promise<Envelope>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`timed out waiting for ${label}`)),
        5000
      );
      this.socket.once("message", (data) => {
        clearTimeout(timer);
        resolve(JSON.parse(String(data)) as Envelope);
      });
    });
  }

  async waitForClose(): Promise<number> {
    if (this.socket.readyState === WebSocket.CLOSED) return this.closeCode ?? 0;
    return new Promise<number>((resolve) => {
      this.socket.once("close", (code) => resolve(code));
    });
  }

  close(): void {
    this.socket.close();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

afterEach(() => {
  while (running.length > 0) running.pop()?.stop();
});

describe("http on the same port", () => {
  it("serves the guest page on GET /", async () => {
    const { port } = await boot();

    const response = await fetch(`http://127.0.0.1:${port}/`);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/html; charset=utf-8"
    );
    expect(await response.text()).toBe(GUEST_PAGE);
  });

  it("serves 404 for anything else", async () => {
    const { port } = await boot();

    const response = await fetch(`http://127.0.0.1:${port}/admin`);

    expect(response.status).toBe(404);
  });

  it("upgrades a websocket on the same port that served the page", async () => {
    const { host, port } = await boot();

    expect((await fetch(`http://127.0.0.1:${port}/`)).status).toBe(200);
    const peer = await Peer.join(port, HOST_DEVICE, "Host");
    await peer.waitFor((p) => p.states.length > 0, "snapshot");

    expect(host.playerCount).toBe(1);
    expect(peer.lastState?.hostId).toBe(host.hostPlayerId);
  });
});

describe("a real game over real sockets", () => {
  it("plays a full round and awards the faster reaction that arrived second", async () => {
    const { host, port } = await boot();

    const hostPeer = await Peer.join(port, HOST_DEVICE, "Host");
    const alice = await Peer.join(port, "device-alice", "Alice");
    const bob = await Peer.join(port, "device-bob", "Bob");
    await bob.waitFor((p) => p.states.length > 0, "bob snapshot");
    await hostPeer.waitFor(() => host.playerCount === 3, "three players");

    const [aliceId, bobId] = Object.keys(host.state.players).filter(
      (id) => id !== host.hostPlayerId
    );

    hostPeer.send({ type: "START", playerId: host.hostPlayerId });
    await hostPeer.waitFor(() => host.state.status === "PLAYING", "playing");

    hostPeer.send({ type: "ARM", playerId: host.hostPlayerId });
    await hostPeer.waitFor(() => host.state.phase === "ARMED", "armed");

    await sleep(320);
    const firstBuzzBroadcast = alice.nextMessage("first buzz broadcast");
    alice.send({ type: "BUZZ", playerId: aliceId, reactionMs: 250 });
    await firstBuzzBroadcast;
    expect(host.state.buzzes).toHaveLength(1);
    expect(host.state.phase).toBe("COLLECTING");

    bob.send({ type: "BUZZ", playerId: bobId, reactionMs: 120 });
    await bob.waitFor(() => host.state.buzzes.length === 2, "second buzz");

    expect(host.state.buzzes[0]?.playerId).toBe(aliceId);
    expect(host.state.buzzes[1]?.playerId).toBe(bobId);

    await hostPeer.waitFor(() => host.state.phase === "LOCKED", "locked");
    expect(host.state.lockedPlayerId).toBe(bobId);
    await bob.waitFor(
      (p) => p.lastState?.lockedPlayerId === bobId,
      "locked broadcast"
    );

    hostPeer.send({ type: "JUDGE", playerId: host.hostPlayerId, correct: true });
    await hostPeer.waitFor(() => host.state.phase === "IDLE", "judged");

    expect(host.state.players[bobId as string]?.score).toBe(10);
    expect(host.state.players[aliceId as string]?.score).toBe(0);

    hostPeer.send({ type: "END_GAME", playerId: host.hostPlayerId });
    await alice.waitFor(
      (p) => p.lastState?.status === "FINISHED",
      "finished broadcast"
    );
    expect(host.state.status).toBe("FINISHED");
  });

  it("stamps the socket identity over a spoofed playerId", async () => {
    const { host, port } = await boot();
    const hostPeer = await Peer.join(port, HOST_DEVICE, "Host");
    const alice = await Peer.join(port, "device-alice", "Alice");
    await hostPeer.waitFor(() => host.playerCount === 2, "two players");

    alice.send({ type: "START", playerId: host.hostPlayerId });
    await alice.waitFor((p) => p.errors.length > 0, "rejection");

    expect(alice.errors[0]?.message).toBe("Only the host can start the game");
    expect(host.state.status).toBe("WAITING");
  });

  it("returns the same playerId and score to a reconnecting device", async () => {
    const { host, port } = await boot();
    const hostPeer = await Peer.join(port, HOST_DEVICE, "Host");
    const alice = await Peer.join(port, "device-alice", "Alice");
    await hostPeer.waitFor(() => host.playerCount === 2, "two players");

    const aliceId = Object.keys(host.state.players).find(
      (id) => id !== host.hostPlayerId
    ) as string;

    alice.close();
    await hostPeer.waitFor(
      () => host.state.players[aliceId]?.connected === false,
      "disconnect"
    );

    const again = await Peer.join(port, "device-alice", "Alice");
    await again.waitFor((p) => p.states.length > 0, "reconnect snapshot");

    expect(host.playerCount).toBe(2);
    expect(host.state.players[aliceId]?.connected).toBe(true);
  });

  it("rejects a wrong nonce over the wire", async () => {
    const { host, port } = await boot();

    const intruder = await Peer.join(port, "device-x", "Mallory", "000000");
    const code = await intruder.waitForClose();

    expect(intruder.errors[0]?.code).toBe("BAD_NONCE");
    expect(code).toBe(1008);
    expect(host.playerCount).toBe(0);
  });

  it("closes a socket that never sends HELLO", async () => {
    const { port } = await boot({ helloTimeoutMs: 200 });

    const silent = await Peer.connect(port);
    const code = await silent.waitForClose();

    expect(code).toBe(1008);
    expect(silent.errors[0]?.code).toBe("HELLO_TIMEOUT");
  });

  it("survives malformed JSON without dropping the room", async () => {
    const { host, port } = await boot();
    const hostPeer = await Peer.join(port, HOST_DEVICE, "Host");
    const alice = await Peer.join(port, "device-alice", "Alice");
    await hostPeer.waitFor(() => host.playerCount === 2, "two players");

    alice.sendRaw("}{ not json");
    await alice.waitFor((p) => p.errors.length > 0, "error");

    expect(alice.errors[0]?.message).toBe("Invalid message format");
    expect(alice.socket.readyState).toBe(WebSocket.OPEN);

    hostPeer.send({ type: "START", playerId: host.hostPlayerId });
    await alice.waitFor(
      (p) => p.lastState?.status === "PLAYING",
      "still receiving"
    );
  });

  it("closes a socket that sends an oversized frame and keeps the room alive", async () => {
    const { host, port } = await boot({ limits: { maxFramePayloadBytes: 4096 } });
    const hostPeer = await Peer.join(port, HOST_DEVICE, "Host");
    const alice = await Peer.join(port, "device-alice", "Alice");
    await hostPeer.waitFor(() => host.playerCount === 2, "two players");

    alice.sendRaw(JSON.stringify({ type: "BUZZ", pad: "x".repeat(8192) }));
    const code = await alice.waitForClose();

    expect(code).toBe(1009);
    expect(hostPeer.socket.readyState).toBe(WebSocket.OPEN);
    expect(host.playerCount).toBe(2);
  });
});
