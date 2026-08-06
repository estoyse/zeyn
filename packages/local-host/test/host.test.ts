import { describe, expect, it } from "vitest";
import {
  BUZZ_COLLECTION_MS,
  LIVEBUZZER_FINISHED_CLEANUP_GRACE_MS,
  LIVEBUZZER_INACTIVITY_MS,
  type LivebuzzerState,
} from "@zeyn/api/games";
import {
  buildGuestPage,
  LocalGameHost,
  type LocalGameHostOptions,
} from "../src/index";
import { FakeClient, FakeClock, FakeNetwork } from "./harness";

const NONCE = "742913";
const HOST_DEVICE = "host-device-secret";

interface Room {
  host: LocalGameHost;
  clock: FakeClock;
  network: FakeNetwork;
}

function createRoom(overrides: Partial<LocalGameHostOptions> = {}): Room {
  const clock = new FakeClock();
  const network = new FakeNetwork();
  const host = new LocalGameHost({
    listener: network,
    timers: clock.timers,
    now: clock.now,
    nonce: NONCE,
    hostDeviceId: HOST_DEVICE,
    ...overrides,
  });
  return { host, clock, network };
}

function join(
  network: FakeNetwork,
  deviceId: string,
  name: string,
  nonce = NONCE,
  remoteAddress?: string
): FakeClient {
  const client = network.connect("/", {}, remoteAddress);
  client.send({ type: "HELLO", v: 1, nonce, deviceId, name });
  return client;
}

function snapshot(state: Readonly<LivebuzzerState>): LivebuzzerState {
  return JSON.parse(JSON.stringify(state)) as LivebuzzerState;
}

interface Table extends Room {
  hostClient: FakeClient;
  alice: FakeClient;
  bob: FakeClient;
  aliceId: string;
  bobId: string;
}

function seatThree(overrides: Partial<LocalGameHostOptions> = {}): Table {
  const room = createRoom(overrides);
  const hostClient = join(room.network, HOST_DEVICE, "Host");
  const alice = join(room.network, "device-alice", "Alice");
  const bob = join(room.network, "device-bob", "Bob");
  const ids = Object.keys(room.host.state.players).filter(
    (id) => id !== room.host.hostPlayerId
  );
  return {
    ...room,
    hostClient,
    alice,
    bob,
    aliceId: ids[0] as string,
    bobId: ids[1] as string,
  };
}

describe("hello handshake", () => {
  it("mints the host player id before any socket exists", () => {
    const { host } = createRoom();
    expect(host.hostPlayerId).toBeTruthy();
    expect(host.state.hostId).toBe(host.hostPlayerId);
    expect(host.playerCount).toBe(0);
  });

  it("binds the host device to the pre-minted host id", () => {
    const { host, network } = createRoom();
    join(network, HOST_DEVICE, "Host");
    expect(Object.keys(host.state.players)).toEqual([host.hostPlayerId]);
  });

  it("admits a guest and sends it a full snapshot", () => {
    const { host, network } = createRoom();
    join(network, HOST_DEVICE, "Host");
    const alice = join(network, "device-alice", "Alice");

    expect(host.playerCount).toBe(2);
    const snapshotState = alice.lastState;
    expect(snapshotState).not.toBeNull();
    const players = snapshotState?.players as Record<string, { name: string }>;
    expect(Object.keys(players)).toHaveLength(2);
    expect(snapshotState?.hostId).toBe(host.hostPlayerId);
  });

  it("rejects a wrong nonce and closes the socket", () => {
    const { host, network } = createRoom();
    const intruder = join(network, "device-x", "Mallory", "000000");

    expect(intruder.errors[0]?.code).toBe("BAD_NONCE");
    expect(intruder.closed).toBe(true);
    expect(host.playerCount).toBe(0);
  });

  it("rejects a first message that is not a HELLO", () => {
    const { host, network } = createRoom();
    const client = network.connect();
    client.send({ type: "START", playerId: "whoever" });

    expect(client.errors[0]?.code).toBe("BAD_HELLO");
    expect(client.closed).toBe(true);
    expect(host.playerCount).toBe(0);
  });

  it("closes a socket that never says HELLO", () => {
    const { clock, network } = createRoom({ helloTimeoutMs: 3000 });
    const client = network.connect();

    expect(client.closed).toBe(false);
    clock.advance(3000);
    expect(client.errors[0]?.code).toBe("HELLO_TIMEOUT");
    expect(client.closed).toBe(true);
  });

  it("keeps the socket open once HELLO lands before the deadline", () => {
    const { clock, network } = createRoom({ helloTimeoutMs: 3000 });
    const client = join(network, "device-alice", "Alice");
    clock.advance(3000);
    expect(client.closed).toBe(false);
  });

  it("rejects a HELLO once the room is full", () => {
    const { host, network } = seatThree({ maxPlayers: 3 });
    const latecomer = join(network, "device-late", "Late");

    expect(latecomer.errors[0]?.message).toBe("Room is full");
    expect(latecomer.closed).toBe(true);
    expect(host.playerCount).toBe(3);
  });

  it("still lets a seated player reconnect into a full room", () => {
    const { host, network, alice, aliceId } = seatThree({ maxPlayers: 3 });
    alice.disconnect();
    expect(host.state.players[aliceId]?.connected).toBe(false);

    const again = join(network, "device-alice", "Alice");
    expect(again.closed).toBe(false);
    expect(host.playerCount).toBe(3);
    expect(host.state.players[aliceId]?.connected).toBe(true);
  });
});

describe("scripted game", () => {
  it("runs start, arm, buzz, judge, end to a finished room", () => {
    const table = seatThree();
    const { host, clock, hostClient, alice, bob, aliceId, bobId } = table;

    hostClient.send({ type: "START", playerId: host.hostPlayerId });
    expect(host.state.status).toBe("PLAYING");
    expect(host.state.phase).toBe("IDLE");

    hostClient.send({ type: "ARM", playerId: host.hostPlayerId });
    expect(host.state.phase).toBe("ARMED");
    expect(host.state.round).toBe(1);

    clock.advance(260);
    alice.send({ type: "BUZZ", playerId: aliceId, reactionMs: 250 });
    expect(host.state.phase).toBe("COLLECTING");

    clock.advance(40);
    bob.send({ type: "BUZZ", playerId: bobId, reactionMs: 120 });
    expect(host.state.buzzes).toHaveLength(2);

    clock.advance(BUZZ_COLLECTION_MS);
    expect(host.state.phase).toBe("LOCKED");
    expect(host.state.lockedPlayerId).toBe(bobId);

    hostClient.send({
      type: "JUDGE",
      playerId: host.hostPlayerId,
      correct: true,
    });
    expect(host.state.players[bobId]?.score).toBe(10);
    expect(host.state.players[aliceId]?.score).toBe(0);
    expect(host.state.phase).toBe("IDLE");

    hostClient.send({ type: "END_GAME", playerId: host.hostPlayerId });
    expect(host.state.status).toBe("FINISHED");
    expect(bob.lastState?.status).toBe("FINISHED");
  });

  it("awards the slower-arriving buzz that reports the faster reaction", () => {
    const { host, clock, hostClient, alice, bob, aliceId, bobId } = seatThree();

    hostClient.send({ type: "START", playerId: host.hostPlayerId });
    hostClient.send({ type: "ARM", playerId: host.hostPlayerId });

    clock.advance(260);
    alice.send({ type: "BUZZ", playerId: aliceId, reactionMs: 250 });

    clock.advance(40);
    bob.send({ type: "BUZZ", playerId: bobId, reactionMs: 120 });

    const buzzes = snapshot(host.state).buzzes;
    expect(buzzes[0]?.playerId).toBe(aliceId);
    expect(buzzes[1]?.playerId).toBe(bobId);
    expect(buzzes[1]?.arrivedAt).toBeGreaterThan(buzzes[0]?.arrivedAt ?? 0);
    expect(buzzes[1]?.reactionMs).toBeLessThan(buzzes[0]?.reactionMs ?? 0);

    clock.advance(BUZZ_COLLECTION_MS);
    expect(host.state.lockedPlayerId).toBe(bobId);
  });

  it("broadcasts a state update to every seated player on each change", () => {
    const { host, clock, hostClient, alice, bob } = seatThree();
    const before = bob.updates.length;

    hostClient.send({ type: "START", playerId: host.hostPlayerId });

    expect(bob.updates.length).toBeGreaterThan(before);
    expect(alice.lastState?.status).toBe("PLAYING");
    expect(hostClient.lastState?.status).toBe("PLAYING");
    expect(bob.updates.at(-1)?.serverTime).toBe(clock.now());
  });
});

describe("identity is stamped from the socket", () => {
  it("overwrites a spoofed playerId on a JUDGE and rejects it", () => {
    const { host, clock, hostClient, alice, bob, aliceId, bobId } = seatThree();

    hostClient.send({ type: "START", playerId: host.hostPlayerId });
    hostClient.send({ type: "ARM", playerId: host.hostPlayerId });
    clock.advance(260);
    bob.send({ type: "BUZZ", playerId: bobId, reactionMs: 200 });
    clock.advance(BUZZ_COLLECTION_MS);
    expect(host.state.lockedPlayerId).toBe(bobId);

    const before = snapshot(host.state);
    alice.send({
      type: "JUDGE",
      playerId: host.hostPlayerId,
      correct: true,
    });

    expect(alice.errors.at(-1)?.message).toBe("Only the host can judge an answer");
    expect(snapshot(host.state)).toEqual(before);
    expect(host.state.players[bobId]?.score).toBe(0);
    expect(host.state.players[aliceId]?.score).toBe(0);
  });

  it("overwrites a spoofed playerId on a START and rejects it", () => {
    const { host, alice } = seatThree();
    const before = snapshot(host.state);

    alice.send({ type: "START", playerId: host.hostPlayerId });

    expect(alice.errors.at(-1)?.message).toBe("Only the host can start the game");
    expect(host.state.status).toBe("WAITING");
    expect(snapshot(host.state)).toEqual(before);
  });

  it("overwrites a spoofed playerId on an ARM and rejects it", () => {
    const { host, hostClient, bob } = seatThree();
    hostClient.send({ type: "START", playerId: host.hostPlayerId });
    const before = snapshot(host.state);

    bob.send({ type: "ARM", playerId: host.hostPlayerId });

    expect(bob.errors.at(-1)?.message).toBe("Only the host can open the buzzer");
    expect(host.state.phase).toBe("IDLE");
    expect(snapshot(host.state)).toEqual(before);
  });

  it("attributes a buzz to the sending socket, not the claimed playerId", () => {
    const { host, clock, hostClient, alice, aliceId, bobId } = seatThree();

    hostClient.send({ type: "START", playerId: host.hostPlayerId });
    hostClient.send({ type: "ARM", playerId: host.hostPlayerId });
    clock.advance(260);

    alice.send({ type: "BUZZ", playerId: bobId, reactionMs: 90 });

    expect(host.state.buzzes).toHaveLength(1);
    expect(host.state.buzzes[0]?.playerId).toBe(aliceId);
    expect(host.state.buzzes[0]?.playerId).not.toBe(bobId);
  });

  it("rejects a spoofed ADJUST_SCORE from a guest", () => {
    const { host, hostClient, alice, aliceId } = seatThree();
    hostClient.send({ type: "START", playerId: host.hostPlayerId });

    alice.send({
      type: "ADJUST_SCORE",
      playerId: host.hostPlayerId,
      targetId: aliceId,
      delta: 1000,
    });

    expect(alice.errors.at(-1)?.message).toBe("Only the host can adjust scores");
    expect(host.state.players[aliceId]?.score).toBe(0);
  });

  it("cannot rename another player through a JOIN", () => {
    const { host, alice, aliceId, bobId } = seatThree();

    alice.send({
      type: "JOIN",
      playerId: bobId,
      name: "Impostor",
      gameId: "local",
    });

    expect(host.state.players[bobId]?.name).toBe("Bob");
    expect(host.state.players[aliceId]?.name).toBe("Impostor");
  });
});

describe("disconnect and reconnect", () => {
  it("marks a dropped player disconnected and broadcasts it", () => {
    const { host, alice, bob, aliceId } = seatThree();

    alice.disconnect();

    expect(host.state.players[aliceId]?.connected).toBe(false);
    const players = bob.lastState?.players as Record<
      string,
      { connected: boolean }
    >;
    expect(players[aliceId]?.connected).toBe(false);
  });

  it("restores the same playerId and score for the same deviceId", () => {
    const table = seatThree();
    const { host, clock, network, hostClient, alice, bob, aliceId } = table;

    hostClient.send({ type: "START", playerId: host.hostPlayerId });
    hostClient.send({ type: "ARM", playerId: host.hostPlayerId });
    clock.advance(260);
    alice.send({ type: "BUZZ", playerId: aliceId, reactionMs: 200 });
    clock.advance(BUZZ_COLLECTION_MS);
    hostClient.send({
      type: "JUDGE",
      playerId: host.hostPlayerId,
      correct: true,
    });
    expect(host.state.players[aliceId]?.score).toBe(10);

    alice.disconnect();
    expect(host.state.players[aliceId]?.connected).toBe(false);

    const reconnected = join(network, "device-alice", "Alice");
    expect(host.playerCount).toBe(3);
    expect(host.state.players[aliceId]?.connected).toBe(true);
    expect(host.state.players[aliceId]?.score).toBe(10);

    const players = reconnected.lastState?.players as Record<
      string,
      { id: string; score: number }
    >;
    expect(players[aliceId]?.score).toBe(10);
    expect(bob.lastState).not.toBeNull();
  });

  it("mints a fresh playerId for an unknown device", () => {
    const { host, network, aliceId } = seatThree();
    const stranger = join(network, "device-other", "Alice");

    expect(host.playerCount).toBe(4);
    expect(stranger.closed).toBe(false);
    expect(Object.keys(host.state.players)).toContain(aliceId);
  });

  it("keeps a player connected when an older socket closes after a reconnect", () => {
    const { host, network, alice, aliceId } = seatThree();
    const replacement = join(network, "device-alice", "Alice");
    expect(replacement.closed).toBe(false);

    alice.disconnect();

    expect(host.state.players[aliceId]?.connected).toBe(true);
  });
});

describe("suspend and replay", () => {
  function armedRoom(): Table & { armedAt: number } {
    const table = seatThree();
    table.hostClient.send({
      type: "START",
      playerId: table.host.hostPlayerId,
    });
    table.hostClient.send({ type: "ARM", playerId: table.host.hostPlayerId });
    expect(table.host.state.phase).toBe("ARMED");
    return { ...table, armedAt: table.clock.now() };
  }

  it("fast-forwards a lapsed buzz window when the app wakes up", () => {
    const { host, clock, armedAt } = armedRoom();

    clock.suspend(60_000);
    expect(host.state.phase).toBe("ARMED");

    host.resume();

    expect(host.state.phase).toBe("IDLE");
    expect(host.state.status).toBe("PLAYING");
    expect(host.state.timerExpiresAt).toBe(
      armedAt + 15_000 + LIVEBUZZER_INACTIVITY_MS
    );
    expect(host.alarmTime).toBe(host.state.timerExpiresAt);
  });

  it("replays several elapsed deadlines in a single wake-up", () => {
    const { host, clock, armedAt } = armedRoom();

    clock.suspend(31 * 60 * 1000);
    host.resume();

    expect(host.state.status).toBe("FINISHED");
    expect(host.state.phase).toBe("IDLE");
    expect(host.alarmTime).toBe(
      armedAt + 15_000 + LIVEBUZZER_INACTIVITY_MS +
        LIVEBUZZER_FINISHED_CLEANUP_GRACE_MS
    );
  });

  it("reaches the same state whether the clock ticked or the app was suspended", () => {
    const ticked = armedRoom();
    ticked.clock.advance(31 * 60 * 1000);

    const suspended = armedRoom();
    suspended.clock.suspend(31 * 60 * 1000);
    suspended.host.resume();

    expect(ticked.clock.now()).toBe(suspended.clock.now());
    expect(snapshot(ticked.host.state)).toEqual(
      snapshot(suspended.host.state)
    );
    expect(ticked.host.alarmTime).toBe(suspended.host.alarmTime);
  });

  it("keeps broadcasting through a replay so clients see the final state", () => {
    const { host, clock, bob } = armedRoom();

    clock.suspend(31 * 60 * 1000);
    host.resume();

    expect(bob.lastState?.status).toBe("FINISHED");
  });

  it("drops the alarm on the finished-room cleanup pass", () => {
    const { host, clock, hostClient } = seatThree();
    hostClient.send({ type: "START", playerId: host.hostPlayerId });
    hostClient.send({ type: "END_GAME", playerId: host.hostPlayerId });
    expect(host.state.status).toBe("FINISHED");
    expect(host.alarmTime).toBe(
      clock.now() + LIVEBUZZER_FINISHED_CLEANUP_GRACE_MS
    );

    clock.advance(LIVEBUZZER_FINISHED_CLEANUP_GRACE_MS);

    expect(host.alarmTime).toBeNull();
    expect(host.state.status).toBe("FINISHED");
  });

  it("re-arms an alarm that the platform timer fired early", () => {
    const { host, clock, hostClient, alice, aliceId } = seatThree();

    hostClient.send({ type: "START", playerId: host.hostPlayerId });
    hostClient.send({ type: "ARM", playerId: host.hostPlayerId });
    clock.advance(260);
    alice.send({ type: "BUZZ", playerId: aliceId, reactionMs: 200 });
    const collectionDeadline = host.alarmTime;
    expect(host.state.phase).toBe("COLLECTING");

    clock.suspend(BUZZ_COLLECTION_MS - 1);
    clock.fireEarly(1);

    expect(host.state.phase).toBe("COLLECTING");
    expect(host.alarmTime).toBe(collectionDeadline);

    clock.advance(1);

    expect(host.state.phase).toBe("LOCKED");
    expect(host.state.lockedPlayerId).toBe(aliceId);
  });

  it("keeps exactly one alarm armed across a round", () => {
    const { host, clock, hostClient, alice, aliceId } = seatThree();
    const armed = () => clock.pendingTimers;

    hostClient.send({ type: "START", playerId: host.hostPlayerId });
    const afterStart = armed();

    hostClient.send({ type: "ARM", playerId: host.hostPlayerId });
    expect(armed()).toBe(afterStart);

    clock.advance(260);
    alice.send({ type: "BUZZ", playerId: aliceId, reactionMs: 200 });
    expect(armed()).toBe(afterStart);

    clock.advance(BUZZ_COLLECTION_MS);
    expect(host.state.phase).toBe("LOCKED");
    expect(armed()).toBe(afterStart);
  });
});

describe("hostile input", () => {
  it("answers malformed JSON with an error and keeps the socket usable", () => {
    const { host, hostClient, alice } = seatThree();

    alice.sendText("{not json");

    expect(alice.errors.at(-1)?.message).toBe("Invalid message format");
    expect(alice.closed).toBe(false);

    hostClient.send({ type: "START", playerId: host.hostPlayerId });
    expect(alice.lastState?.status).toBe("PLAYING");
  });

  it("answers an unknown message type with an error", () => {
    const { alice } = seatThree();

    alice.send({ type: "DROP_TABLE", playerId: "x" });

    expect(alice.errors.at(-1)?.message).toBe("Invalid message format");
    expect(alice.closed).toBe(false);
  });

  it("answers a structurally invalid action with an error", () => {
    const { host, alice } = seatThree();

    alice.send({ type: "BUZZ", reactionMs: "fast" });

    expect(alice.errors.at(-1)?.message).toBe("Invalid message format");
    expect(host.state.buzzes).toHaveLength(0);
  });

  it("closes a socket that sends an oversized frame without killing the room", () => {
    const { host, hostClient, alice, bob } = seatThree({
      limits: { maxFramePayloadBytes: 4096 },
    });

    const huge = "x".repeat(8192);
    alice.sendText(JSON.stringify({ type: "BUZZ", playerId: "x", huge }));

    expect(alice.closed).toBe(true);
    expect(alice.closeCode).toBe(1009);

    hostClient.send({ type: "START", playerId: host.hostPlayerId });
    expect(host.state.status).toBe("PLAYING");
    expect(bob.lastState?.status).toBe("PLAYING");
  });

  it("rejects a HELLO with an over-long name", () => {
    const { host, network } = createRoom();
    const client = network.connect();
    client.send({
      type: "HELLO",
      v: 1,
      nonce: NONCE,
      deviceId: "device-long",
      name: "n".repeat(200),
    });

    expect(client.errors[0]?.code).toBe("BAD_HELLO");
    expect(host.playerCount).toBe(0);
  });

  it("rejects a HELLO with the wrong protocol version", () => {
    const { host, network } = createRoom();
    const client = network.connect();
    client.send({
      type: "HELLO",
      v: 2,
      nonce: NONCE,
      deviceId: "device-v2",
      name: "Future",
    });

    expect(client.errors[0]?.code).toBe("BAD_HELLO");
    expect(host.playerCount).toBe(0);
  });
});

describe("per-peer HELLO throttle", () => {
  it("refuses a new connection from a peer that exhausted its failed-HELLO budget", () => {
    const { host, network } = createRoom({
      maxFailedHellosPerPeer: 3,
      failedHelloWindowMs: 30_000,
    });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const bad = join(
        network,
        `device-${attempt}`,
        "Mallory",
        "000000",
        "10.0.0.5"
      );
      expect(bad.errors[0]?.code).toBe("BAD_NONCE");
      expect(bad.closed).toBe(true);
    }

    const blocked = network.connect("/", {}, "10.0.0.5");
    expect(blocked.closed).toBe(true);
    expect(blocked.errors[0]?.code).toBe("THROTTLED");
    expect(blocked.received).toHaveLength(1);

    blocked.send({ type: "HELLO", v: 1, nonce: NONCE, deviceId: "device-late", name: "Late" });
    expect(host.playerCount).toBe(0);
  });

  it("does not let a throttled peer deny service to a different address", () => {
    const { host, network } = createRoom({
      maxFailedHellosPerPeer: 2,
      failedHelloWindowMs: 30_000,
    });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const bad = join(
        network,
        `device-mallory-${attempt}`,
        "Mallory",
        "000000",
        "10.0.0.5"
      );
      expect(bad.closed).toBe(true);
    }

    const stillBlockedA = network.connect("/", {}, "10.0.0.5");
    expect(stillBlockedA.closed).toBe(true);
    expect(stillBlockedA.errors[0]?.code).toBe("THROTTLED");

    const bob = join(network, "device-bob", "Bob", NONCE, "10.0.0.9");
    expect(bob.closed).toBe(false);
    expect(bob.errors).toHaveLength(0);
    expect(host.playerCount).toBe(1);
  });

  it("resets the failed-HELLO budget once the window elapses", () => {
    const { host, clock, network } = createRoom({
      maxFailedHellosPerPeer: 2,
      failedHelloWindowMs: 10_000,
    });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      join(network, `device-${attempt}`, "Mallory", "000000", "10.0.0.5");
    }

    const stillBlocked = network.connect("/", {}, "10.0.0.5");
    expect(stillBlocked.closed).toBe(true);
    expect(stillBlocked.errors[0]?.code).toBe("THROTTLED");

    clock.advance(10_000);

    const retried = join(network, "device-retry", "Alice", NONCE, "10.0.0.5");
    expect(retried.closed).toBe(false);
    expect(host.playerCount).toBe(1);
  });

  it("clears a peer's failure count on a successful HELLO", () => {
    const { host, network } = createRoom({
      maxFailedHellosPerPeer: 3,
      failedHelloWindowMs: 30_000,
    });

    join(network, "device-mallory-0", "Mallory", "000000", "10.0.0.5");
    join(network, "device-mallory-1", "Mallory", "000000", "10.0.0.5");

    const good = join(network, "device-alice", "Alice", NONCE, "10.0.0.5");
    expect(good.closed).toBe(false);

    join(network, "device-mallory-2", "Mallory", "000000", "10.0.0.5");

    const stillAllowed = network.connect("/", {}, "10.0.0.5");
    expect(stillAllowed.closed).toBe(false);
    expect(host.playerCount).toBe(1);
  });

  it("keeps the failed-HELLO map bounded across many distinct peers", () => {
    const { host, network } = createRoom({
      maxFailedHellosPerPeer: 1,
      failedHelloWindowMs: 30_000,
    });

    for (let index = 0; index < 300; index += 1) {
      join(
        network,
        `device-${index}`,
        "Mallory",
        "000000",
        `10.0.${Math.floor(index / 256)}.${index % 256}`
      );
    }

    expect(host.trackedFailedHelloPeers).toBeLessThanOrEqual(256);
  });
});

describe("guest page", () => {
  const page = "<!doctype html><title>Zeyn</title><p>join</p>";

  it("serves the injected page on GET /", () => {
    const { network } = createRoom({ guestPage: page });

    const response = network.fetch("GET", "/");

    expect(response.startsWith("HTTP/1.1 200 OK")).toBe(true);
    expect(response).toContain("Content-Type: text/html; charset=utf-8");
    expect(response).toContain(page);
  });

  it("serves 404 for any other path", () => {
    const { network } = createRoom({ guestPage: page });

    const response = network.fetch("GET", "/secrets");

    expect(response.startsWith("HTTP/1.1 404")).toBe(true);
    expect(response).not.toContain(page);
  });

  it("serves the built-in buzzer when no page is configured", () => {
    const { network } = createRoom();

    const response = network.fetch("GET", "/");

    expect(response.startsWith("HTTP/1.1 200 OK")).toBe(true);
    expect(response).toContain("Content-Type: text/html; charset=utf-8");
    expect(response).toContain(buildGuestPage());
  });

  it("upgrades a websocket on the same listener that serves the page", () => {
    const { host, network } = createRoom({ guestPage: page });

    expect(network.fetch("GET", "/").startsWith("HTTP/1.1 200")).toBe(true);
    const client = join(network, HOST_DEVICE, "Host");

    expect(client.upgraded).toBe(true);
    expect(client.httpResponse).toContain("HTTP/1.1 101");
    expect(host.playerCount).toBe(1);
  });
});
