import { describe, expect, it } from "vitest";
import type { Player } from "@zeyn/api/game-types";
import * as typedGuestLogic from "../src/guest-logic";
import type { BuzzerInputs } from "../src/guest-logic";
import { buildGuestPage, GUEST_LOGIC_SCRIPT_ID } from "../src/guest-page";

type GuestLogic = typeof typedGuestLogic;

function servedGuestLogic(): GuestLogic {
  const html = buildGuestPage();
  const script = new RegExp(
    `<script id="${GUEST_LOGIC_SCRIPT_ID}">([\\s\\S]*?)</script>`
  ).exec(html);
  if (script === null) throw new Error("the served page carries no guest logic");

  const source = script[1] as string;
  const evaluate = new Function(`${source}\nreturn ZeynGuestLogic;`) as () => GuestLogic;
  return evaluate();
}

function player(id: string, name: string, score: number, connected = true): Player {
  return { id, name, score, connected, isGuest: true };
}

function buzzer(overrides: Partial<BuzzerInputs> = {}): BuzzerInputs {
  return {
    status: "PLAYING",
    phase: "ARMED",
    lockedOutPlayerIds: [],
    buzzedPlayerIds: [],
    playerId: "p2",
    armedAt: 1000,
    ...overrides,
  };
}

const subjects: [string, GuestLogic][] = [
  ["the typed reference module", typedGuestLogic],
  ["the logic the guest page actually serves", servedGuestLogic()],
];

describe.each(subjects)("%s", (_subject, logic) => {
  const {
    buzzerView,
    formatReactionMs,
    formatSeconds,
    mergePlayers,
    nextArmedAt,
    parseRoomNonce,
    reactionMsFor,
    remainingMs,
    scoreboardRows,
  } = logic;

  describe("parseRoomNonce", () => {
    it("reads the room nonce the host's QR link carries", () => {
      expect(parseRoomNonce("?r=A7K3M")).toBe("A7K3M");
    });

    it("reads it regardless of position among other params", () => {
      expect(parseRoomNonce("?utm=qr&r=A7K3M&x=1")).toBe("A7K3M");
    });

    it("tolerates a leading question mark being absent", () => {
      expect(parseRoomNonce("r=A7K3M")).toBe("A7K3M");
    });

    it("percent-decodes and trims", () => {
      expect(parseRoomNonce("?r=%20A7K3M%20")).toBe("A7K3M");
    });

    it("decodes a plus as a space", () => {
      expect(parseRoomNonce("?r=A7+K3M")).toBe("A7 K3M");
    });

    it("returns null when the param is missing entirely", () => {
      expect(parseRoomNonce("")).toBeNull();
      expect(parseRoomNonce("?")).toBeNull();
      expect(parseRoomNonce("?room=A7K3M")).toBeNull();
    });

    it("does not match a param that merely ends in r", () => {
      expect(parseRoomNonce("?ur=A7K3M")).toBeNull();
    });

    it("returns null for an empty or whitespace-only nonce", () => {
      expect(parseRoomNonce("?r=")).toBeNull();
      expect(parseRoomNonce("?r=%20%20")).toBeNull();
    });

    it("returns null for garbage percent-encoding instead of throwing", () => {
      expect(parseRoomNonce("?r=%E0%A4%A")).toBeNull();
      expect(parseRoomNonce("?r=%")).toBeNull();
    });

    it("rejects a nonce longer than the HELLO schema accepts", () => {
      expect(parseRoomNonce(`?r=${"A".repeat(200)}`)).toHaveLength(200);
      expect(parseRoomNonce(`?r=${"A".repeat(201)}`)).toBeNull();
    });
  });

  describe("mergePlayers", () => {
    it("keeps players from earlier updates when a later update only carries the changed one", () => {
      const first = mergePlayers(
        {},
        { p1: player("p1", "Host", 0), p2: player("p2", "Ali", 0) }
      );
      const second = mergePlayers(first, { p3: player("p3", "Bea", 0) });
      const third = mergePlayers(second, { p2: player("p2", "Ali", 10) });

      expect(Object.keys(third).sort()).toEqual(["p1", "p2", "p3"]);
      expect(third.p1?.name).toBe("Host");
      expect(third.p3?.name).toBe("Bea");
      expect(third.p2?.score).toBe(10);
    });

    it("keeps every player when an update carries no players key at all", () => {
      const seeded = mergePlayers({}, { p1: player("p1", "Host", 3) });

      const unchanged = mergePlayers(seeded, undefined);

      expect(Object.keys(unchanged)).toEqual(["p1"]);
      expect(unchanged.p1?.score).toBe(3);
    });

    it("applies a partial patch without wiping the fields it omits", () => {
      const seeded = mergePlayers({}, { p2: player("p2", "Ali", 20) });

      const patched = mergePlayers(seeded, { p2: { connected: false } });

      expect(patched.p2).toEqual({
        id: "p2",
        name: "Ali",
        score: 20,
        connected: false,
        isGuest: true,
      });
    });

    it("does not mutate the previous map", () => {
      const seeded = mergePlayers({}, { p2: player("p2", "Ali", 0) });

      mergePlayers(seeded, { p2: player("p2", "Ali", 50) });

      expect(seeded.p2?.score).toBe(0);
    });

    it("fills in defaults for a player first seen through a partial patch", () => {
      const merged = mergePlayers({}, { p9: { score: 5 } });

      expect(merged.p9).toEqual({
        id: "p9",
        name: "",
        score: 5,
        connected: false,
      });
    });
  });

  describe("nextArmedAt", () => {
    it("arms on IDLE -> ARMED", () => {
      expect(nextArmedAt("IDLE", "ARMED", null, 5_000)).toBe(5_000);
    });

    it("arms on LOCKED -> ARMED, the wrong-answer reopen inside the same round", () => {
      expect(nextArmedAt("LOCKED", "ARMED", 1_000, 9_000)).toBe(9_000);
    });

    it("arms on the very first update the page ever sees", () => {
      expect(nextArmedAt(null, "ARMED", null, 5_000)).toBe(5_000);
    });

    it("holds the arm instant across repeat ARMED updates", () => {
      expect(nextArmedAt("ARMED", "ARMED", 5_000, 5_400)).toBe(5_000);
    });

    it("holds the arm instant through COLLECTING so an in-flight press still measures", () => {
      expect(nextArmedAt("ARMED", "COLLECTING", 5_000, 5_300)).toBe(5_000);
    });

    it("disarms outside a buzz window", () => {
      expect(nextArmedAt("COLLECTING", "LOCKED", 5_000, 5_600)).toBeNull();
      expect(nextArmedAt("LOCKED", "IDLE", 5_000, 7_000)).toBeNull();
    });
  });

  describe("the reopen trap: reactionMs can never be inflated by a same-round reopen", () => {
    it("measures from the reopen, not from the round's first arm", () => {
      const roundOpenedAt = 100_000;
      let armedAt = nextArmedAt("IDLE", "ARMED", null, roundOpenedAt);
      expect(reactionMsFor(armedAt, roundOpenedAt + 240)).toBe(240);

      armedAt = nextArmedAt("ARMED", "COLLECTING", armedAt, roundOpenedAt + 250);
      armedAt = nextArmedAt("COLLECTING", "LOCKED", armedAt, roundOpenedAt + 550);

      const reopenedAt = roundOpenedAt + 18_000;
      armedAt = nextArmedAt("LOCKED", "ARMED", armedAt, reopenedAt);

      const reactionMs = reactionMsFor(armedAt, reopenedAt + 310);

      expect(reactionMs).toBe(310);
      expect(reactionMs).toBeLessThan(1_000);
    });

    it("would have reported an inflated reaction had the timer keyed off the round number", () => {
      const roundOpenedAt = 100_000;
      const reopenedAt = roundOpenedAt + 18_000;
      const pressedAt = reopenedAt + 310;

      const keyedOffRound = pressedAt - roundOpenedAt;
      const keyedOffPhase = reactionMsFor(
        nextArmedAt("LOCKED", "ARMED", roundOpenedAt, reopenedAt),
        pressedAt
      );

      expect(keyedOffRound).toBe(18_310);
      expect(keyedOffPhase).toBe(310);
    });

    it("refuses to produce a reaction time with no arm instant", () => {
      expect(reactionMsFor(null, 12_345)).toBeNull();
    });

    it("floors a backwards clock at zero rather than going negative", () => {
      expect(reactionMsFor(5_000, 4_900)).toBe(0);
    });
  });

  describe("buzzerView", () => {
    it("disables the buzzer while the room waits for the host to start", () => {
      const view = buzzerView(buzzer({ status: "WAITING", phase: "IDLE" }));

      expect(view.enabled).toBe(false);
      expect(view.caption).toBe("Waiting for the host to start");
    });

    it("disables the buzzer in IDLE and tells the player to listen", () => {
      const view = buzzerView(buzzer({ phase: "IDLE", armedAt: null }));

      expect(view.enabled).toBe(false);
      expect(view.caption).toBe("Listen for the question");
    });

    it("enables the buzzer in ARMED", () => {
      const view = buzzerView(buzzer());

      expect(view.enabled).toBe(true);
      expect(view.label).toBe("BUZZ");
    });

    it("disables the buzzer in ARMED when I am locked out", () => {
      const view = buzzerView(buzzer({ lockedOutPlayerIds: ["p2"] }));

      expect(view.enabled).toBe(false);
      expect(view.caption).toBe("You are locked out this round");
    });

    it("keeps the buzzer live in ARMED when someone else is locked out", () => {
      const view = buzzerView(buzzer({ lockedOutPlayerIds: ["p3", "p4"] }));

      expect(view.enabled).toBe(true);
    });

    it("does not claim a lockout in IDLE, where stale lockouts linger until the next arm", () => {
      const view = buzzerView(
        buzzer({ phase: "IDLE", armedAt: null, lockedOutPlayerIds: ["p2"] })
      );

      expect(view.caption).toBe("Listen for the question");
    });

    it("disables the buzzer in ARMED until an arm instant exists to measure from", () => {
      const view = buzzerView(buzzer({ armedAt: null }));

      expect(view.enabled).toBe(false);
      expect(view.caption).toBe("Syncing");
    });

    it("disables the buzzer once I am already in the buzz list", () => {
      const view = buzzerView(buzzer({ buzzedPlayerIds: ["p2"] }));

      expect(view.enabled).toBe(false);
      expect(view.caption).toBe("Buzzed!");
    });

    it("disables the buzzer in COLLECTING", () => {
      const view = buzzerView(buzzer({ phase: "COLLECTING" }));

      expect(view.enabled).toBe(false);
      expect(view.caption).toBe("Locking in");
    });

    it("disables the buzzer in LOCKED", () => {
      const view = buzzerView(buzzer({ phase: "LOCKED", armedAt: null }));

      expect(view.enabled).toBe(false);
      expect(view.caption).toBe("Answer locked in");
    });

    it("disables the buzzer once the game is finished", () => {
      const view = buzzerView(buzzer({ status: "FINISHED", phase: "IDLE" }));

      expect(view.enabled).toBe(false);
      expect(view.caption).toBe("Game over");
    });

    it("never enables the buzzer before the page knows who it is", () => {
      const view = buzzerView(buzzer({ playerId: null, armedAt: null }));

      expect(view.enabled).toBe(false);
    });
  });

  describe("scoreboardRows", () => {
    const players = {
      p1: player("p1", "Host", 0),
      p2: player("p2", "Ali", 20),
      p3: player("p3", "Bea", 30),
      p4: player("p4", "Cem", 20, false),
    };

    it("ranks by score and excludes the non-scoring host", () => {
      const rows = scoreboardRows(players, ["p1"]);

      expect(rows.map((row) => row.id)).toEqual(["p3", "p2", "p4"]);
      expect(rows.map((row) => row.rank)).toEqual([1, 2, 2]);
    });

    it("keeps everyone when nothing is excluded", () => {
      const rows = scoreboardRows(players, undefined);

      expect(rows).toHaveLength(4);
      expect(rows.at(-1)?.id).toBe("p1");
    });

    it("carries the connected flag so the page can dim who left", () => {
      const rows = scoreboardRows(players, ["p1"]);

      expect(rows.find((row) => row.id === "p4")?.connected).toBe(false);
    });

    it("falls back to a placeholder name and a zero score", () => {
      const rows = scoreboardRows({ p7: player("p7", "", 0) }, undefined);

      expect(rows[0]?.name).toBe("Player");
      expect(rows[0]?.score).toBe(0);
    });
  });

  describe("countdown", () => {
    it("corrects for the offset between the host's clock and the phone's", () => {
      const serverTime = 500_000;
      const localNow = 500_000 + 90_000;
      const clockOffsetMs = localNow - serverTime;

      expect(remainingMs(serverTime + 15_000, clockOffsetMs, localNow)).toBe(15_000);
      expect(remainingMs(serverTime + 15_000, clockOffsetMs, localNow + 5_000)).toBe(
        10_000
      );
    });

    it("has no countdown when the phase carries no live clock", () => {
      expect(remainingMs(0, 0, 1_000)).toBeNull();
    });

    it("floors an expired timer at zero", () => {
      expect(remainingMs(1_000, 0, 9_999)).toBe(0);
    });

    it("formats whole seconds", () => {
      expect(formatSeconds(15_000)).toBe("15");
      expect(formatSeconds(1)).toBe("1");
      expect(formatSeconds(0)).toBe("0");
    });

    it("formats a reaction time", () => {
      expect(formatReactionMs(312)).toBe("312ms");
      expect(formatReactionMs(null)).toBe("");
    });
  });
});
