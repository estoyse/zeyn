import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";
import { createNodeListener, nodeTimers } from "@zeyn/ws-server/node";
import { buildGuestPage, LocalGameHost } from "../src/index";

const NONCE = "A7K3M";
const HOST_DEVICE = "host-device-secret";

const running: LocalGameHost[] = [];

async function boot(): Promise<{ host: LocalGameHost; port: number }> {
  const listener = createNodeListener();
  const host = new LocalGameHost({
    listener,
    timers: nodeTimers,
    now: () => Date.now(),
    nonce: NONCE,
    hostDeviceId: HOST_DEVICE,
  });
  running.push(host);
  const port = await listener.listen(0, "127.0.0.1");
  return { host, port };
}

interface Envelope {
  type: string;
  message?: string;
  code?: string;
  playerId?: string;
  state?: Record<string, unknown>;
  serverTime?: number;
}

class Peer {
  readonly received: Envelope[] = [];
  readonly socket: WebSocket;

  constructor(port: number) {
    this.socket = new WebSocket(`ws://127.0.0.1:${port}/`);
    this.socket.on("message", (data) => {
      this.received.push(JSON.parse(String(data)) as Envelope);
    });
  }

  static async join(
    port: number,
    deviceId: string,
    name: string,
    nonce = NONCE
  ): Promise<Peer> {
    const peer = new Peer(port);
    await new Promise<void>((resolve, reject) => {
      peer.socket.once("open", () => resolve());
      peer.socket.once("error", reject);
    });
    peer.send({ type: "HELLO", v: 1, nonce, deviceId, name });
    await peer.waitFor(() => peer.playerId !== null, "welcome");
    return peer;
  }

  send(value: unknown): void {
    this.socket.send(JSON.stringify(value));
  }

  get playerId(): string | null {
    const welcome = this.received.find((message) => message.type === "WELCOME");
    return welcome?.playerId ?? null;
  }

  get errors(): Envelope[] {
    return this.received.filter((message) => message.type === "ERROR");
  }

  get states(): Record<string, unknown>[] {
    return this.received
      .filter((message) => message.type === "STATE_UPDATE")
      .map((message) => message.state as Record<string, unknown>);
  }

  async waitFor(predicate: () => boolean, label: string): Promise<void> {
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      if (predicate()) return;
      await new Promise((resolve) => setTimeout(resolve, 2));
    }
    throw new Error(`timed out waiting for ${label}`);
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

describe("the guest page a phone actually downloads", () => {
  it("is served as html on GET / with no configuration at all", async () => {
    const { port } = await boot();

    const response = await fetch(`http://127.0.0.1:${port}/`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toBe(buildGuestPage());
  });

  it("carries the whole buzzer inline, with nothing to fetch from the internet", () => {
    const html = buildGuestPage();

    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<link[^>]+href=/i);
    expect(html).not.toContain("http://");
    expect(html).not.toContain("https://");
  });

  it("speaks the local protocol the host is listening for", () => {
    const html = buildGuestPage();

    expect(html).toContain("HELLO");
    expect(html).toContain("BUZZ");
    expect(html).toContain("reactionMs");
    expect(html).toContain("deviceId");
    expect(html).toContain("WebSocket");
  });

  it("ships every pure function the tests exercise against the served page", () => {
    const html = buildGuestPage();

    for (const name of [
      "parseRoomNonce",
      "mergePlayers",
      "nextArmedAt",
      "reactionMsFor",
      "buzzerView",
      "scoreboardRows",
      "remainingMs",
      "formatSeconds",
      "formatReactionMs",
    ]) {
      expect(html).toContain(`function ${name}(`);
      expect(html).toContain(`${name}: ${name}`);
    }
  });

  it("is authored as literal javascript, so no bundler can ever rewrite it", () => {
    const html = buildGuestPage();

    for (const helper of [
      "_objectSpread",
      "_extends",
      "_toConsumableArray",
      "_slicedToArray",
      "_defineProperty",
      "_createClass",
      "_objectWithoutProperties",
    ]) {
      expect(html).not.toContain(helper);
    }
    expect(html).not.toContain("require(");
    expect(html).not.toMatch(/^\s*import\s/m);
  });

  it("parses, and binds only names the logic script really exports", () => {
    const html = buildGuestPage();
    const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(
      (match) => match[1] as string
    );
    expect(scripts).toHaveLength(2);

    const [logicSource, appSource] = scripts as [string, string];
    expect(() => new Function(appSource)).not.toThrow();

    const logic = new Function(`${logicSource}\nreturn ZeynGuestLogic;`)() as Record<
      string,
      unknown
    >;
    const used = [...appSource.matchAll(/ZeynGuestLogic\.(\w+)/g)].map(
      (match) => match[1] as string
    );

    expect(used).toHaveLength(9);
    for (const name of used) expect(typeof logic[name]).toBe("function");
  });

  it("is thumb-friendly and does not zoom on tap", () => {
    const html = buildGuestPage();

    expect(html).toContain("user-scalable=no");
    expect(html).toContain("touch-action: manipulation");
    expect(html).toContain("pointerdown");
  });

  it("never leaks the bearer deviceId into the markup", () => {
    const html = buildGuestPage();

    expect(html).toContain("getRandomValues");
    expect(html).not.toContain(HOST_DEVICE);
  });
});

describe("a browser guest playing through the real host", () => {
  it("says HELLO, learns who it is, buzzes and takes the point", async () => {
    const { host, port } = await boot();

    const hostPeer = await Peer.join(port, HOST_DEVICE, "Host");
    const guest = await Peer.join(port, "guest-device-token", "Ali");
    const rival = await Peer.join(port, "rival-device-token", "Bea");
    await hostPeer.waitFor(() => host.playerCount === 3, "three players");

    const guestId = guest.playerId as string;
    expect(guestId).not.toBe(hostPeer.playerId);
    expect(host.state.players[guestId]?.name).toBe("Ali");

    hostPeer.send({ type: "START", playerId: hostPeer.playerId });
    await hostPeer.waitFor(() => host.state.status === "PLAYING", "playing");

    hostPeer.send({ type: "ARM", playerId: hostPeer.playerId });
    await guest.waitFor(() => host.state.phase === "ARMED", "armed");

    await sleep(500);
    guest.send({ type: "BUZZ", playerId: guestId, reactionMs: 312 });
    rival.send({ type: "BUZZ", playerId: rival.playerId, reactionMs: 480 });
    await hostPeer.waitFor(() => host.state.phase === "LOCKED", "locked");

    expect(host.state.lockedPlayerId).toBe(guestId);
    await guest.waitFor(
      () => guest.states.at(-1)?.lockedReactionMs === 312,
      "locked broadcast"
    );

    hostPeer.send({ type: "JUDGE", playerId: hostPeer.playerId, correct: true });
    await guest.waitFor(() => host.state.phase === "IDLE", "judged");

    expect(host.state.players[guestId]?.score).toBe(10);

    const finalState = guest.states.at(-1) as Record<string, unknown>;
    const players = finalState.players as Record<string, { score: number }>;
    expect(players[guestId]?.score).toBe(10);
  });

  it("hands the same identity and score back to a page that reloaded", async () => {
    const { host, port } = await boot();

    const hostPeer = await Peer.join(port, HOST_DEVICE, "Host");
    const guest = await Peer.join(port, "guest-device-token", "Ali");
    await hostPeer.waitFor(() => host.playerCount === 2, "two players");

    const guestId = guest.playerId as string;
    hostPeer.send({ type: "START", playerId: hostPeer.playerId });
    await hostPeer.waitFor(() => host.state.status === "PLAYING", "playing");

    hostPeer.send({
      type: "ADJUST_SCORE",
      playerId: hostPeer.playerId,
      targetId: guestId,
      delta: 40,
    });
    await hostPeer.waitFor(() => host.state.players[guestId]?.score === 40, "score");

    guest.close();
    await hostPeer.waitFor(
      () => host.state.players[guestId]?.connected === false,
      "disconnect"
    );

    const reloaded = await Peer.join(port, "guest-device-token", "Ali");
    await reloaded.waitFor(() => reloaded.states.length > 0, "snapshot");

    expect(reloaded.playerId).toBe(guestId);
    expect(host.playerCount).toBe(2);
    const snapshot = reloaded.states[0] as Record<string, unknown>;
    const players = snapshot.players as Record<string, { score: number }>;
    expect(players[guestId]?.score).toBe(40);
  });

  it("tells a guest that scanned a stale QR that it has the wrong room code", async () => {
    const { host, port } = await boot();

    const stray = new Peer(port);
    await new Promise<void>((resolve) => stray.socket.once("open", () => resolve()));
    stray.send({
      type: "HELLO",
      v: 1,
      nonce: "ZZZZZ",
      deviceId: "guest-device-token",
      name: "Ali",
    });
    await stray.waitFor(() => stray.errors.length > 0, "rejection");

    expect(stray.errors[0]?.code).toBe("BAD_NONCE");
    expect(stray.playerId).toBeNull();
    expect(host.playerCount).toBe(0);
  });
});
