import { describe, it, expect } from "vitest";
import {
  BUZZ_COLLECTION_MS,
  LIVEBUZZER_FINISHED_CLEANUP_GRACE_MS,
  LIVEBUZZER_INACTIVITY_MS,
  MIN_REACTION_MS,
  type LivebuzzerConfig,
  type LivebuzzerState,
} from "@zeyn/api/games";
import {
  adjustScore,
  arm,
  buzz,
  clampReactionMs,
  createInitialState,
  endGame,
  handleTimeout,
  judge,
  skipRound,
  start,
} from "@zeyn/game-engine/livebuzzer/engine";
import { LivebuzzerSerializer } from "@zeyn/game-engine/livebuzzer/serializer";

const NOW = 1_000_000;

function snapshot(state: LivebuzzerState): LivebuzzerState {
  return JSON.parse(JSON.stringify(state)) as LivebuzzerState;
}

function waitingState(config: Partial<LivebuzzerConfig> = {}): LivebuzzerState {
  const state = createInitialState();
  state.gameId = "g1";
  state.gameName = "Room";
  state.hostId = "host";
  state.config = { ...state.config, ...config };
  state.players = {
    host: { id: "host", name: "Host", score: 0, connected: true },
    p1: { id: "p1", name: "P1", score: 0, connected: true },
    p2: { id: "p2", name: "P2", score: 0, connected: true },
  };
  return state;
}

function playingState(config: Partial<LivebuzzerConfig> = {}): LivebuzzerState {
  const state = waitingState(config);
  start(state, "host", NOW);
  return state;
}

function armedState(config: Partial<LivebuzzerConfig> = {}): LivebuzzerState {
  const state = playingState(config);
  arm(state, "host", NOW);
  return state;
}

const BUZZ_AT = NOW + 500;
const LOCK_AT = BUZZ_AT + BUZZ_COLLECTION_MS;

function lockedState(config: Partial<LivebuzzerConfig> = {}): LivebuzzerState {
  const state = armedState(config);
  buzz(state, "p1", 200, BUZZ_AT);
  handleTimeout(state, LOCK_AT);
  return state;
}

describe("livebuzzer start", () => {
  it("rejects a non-host", () => {
    const state = waitingState();
    const d = start(state, "p1", NOW);
    expect(d.reply?.type).toBe("ERROR");
    expect(state.status).toBe("WAITING");
  });

  it("rejects a room containing only the host", () => {
    const state = waitingState();
    state.players = {
      host: { id: "host", name: "Host", score: 0, connected: true },
    };
    const d = start(state, "host", NOW);
    expect(d.reply?.type).toBe("ERROR");
    expect(state.status).toBe("WAITING");
  });

  it("starts idle, with the inactivity reaper as its only deadline", () => {
    const state = playingState();
    expect(state.status).toBe("PLAYING");
    expect(state.phase).toBe("IDLE");
    expect(state.round).toBe(0);
    expect(state.timerExpiresAt).toBe(NOW + LIVEBUZZER_INACTIVITY_MS);
  });
});

describe("livebuzzer host authorization", () => {
  it("rejects every host-only action from a non-host and leaves state unchanged", () => {
    const cases: Array<[string, (s: LivebuzzerState) => ReturnType<typeof arm>]> =
      [
        ["ARM", s => arm(s, "p2", NOW + 1)],
        ["JUDGE", s => judge(s, "p2", true, NOW + 1)],
        ["SKIP_ROUND", s => skipRound(s, "p2", NOW + 1)],
        ["ADJUST_SCORE", s => adjustScore(s, "p2", "p2", 1000)],
        ["END_GAME", s => endGame(s, "p2", NOW + 1)],
      ];

    for (const [, act] of cases) {
      const state = lockedState();
      const before = snapshot(state);
      const d = act(state);
      expect(d.reply?.type).toBe("ERROR");
      expect(d.alarmAt).toBeUndefined();
      expect(d.persistResults).toBeUndefined();
      expect(d.updateRoomStatus).toBeUndefined();
      expect(snapshot(state)).toEqual(before);
    }
  });
});

describe("livebuzzer arm", () => {
  it("increments the round and clears lockouts, wrong attempts and buzzes", () => {
    const state = playingState();
    state.lockedOutPlayerIds = ["p1"];
    state.wrongAttempts = 2;
    state.buzzes = [{ playerId: "p1", reactionMs: 100, arrivedAt: NOW }];

    const d = arm(state, "host", NOW + 50);

    expect(state.phase).toBe("ARMED");
    expect(state.round).toBe(1);
    expect(state.armedAt).toBe(NOW + 50);
    expect(state.lockedOutPlayerIds).toEqual([]);
    expect(state.wrongAttempts).toBe(0);
    expect(state.buzzes).toEqual([]);
    expect(state.timerExpiresAt).toBe(NOW + 50 + state.config.buzzWindowMs);
    expect(d.alarmAt).toBe(state.timerExpiresAt);
  });

  it("refuses to arm while a round is already live", () => {
    const state = armedState();
    const before = snapshot(state);
    const d = arm(state, "host", NOW + 100);
    expect(d.reply?.type).toBe("ERROR");
    expect(snapshot(state)).toEqual(before);
  });
});

describe("livebuzzer buzz eligibility", () => {
  it("ignores a buzz while idle", () => {
    const state = playingState();
    const d = buzz(state, "p1", 150, NOW + 10);
    expect(d).toEqual({ noChange: true });
    expect(state.buzzes).toEqual([]);
    expect(state.phase).toBe("IDLE");
  });

  it("refuses a buzz from the moderator host", () => {
    const state = armedState();
    const d = buzz(state, "host", 150, NOW + 200);
    expect(d).toEqual({ noChange: true });
    expect(state.buzzes).toEqual([]);
  });

  it("lets the host buzz when hostPlays is on", () => {
    const state = armedState({ hostPlays: true });
    buzz(state, "host", 150, NOW + 200);
    expect(state.buzzes.map(b => b.playerId)).toEqual(["host"]);
  });

  it("refuses a buzz from a locked-out player", () => {
    const state = armedState();
    state.lockedOutPlayerIds = ["p1"];
    const d = buzz(state, "p1", 150, NOW + 200);
    expect(d).toEqual({ noChange: true });
    expect(state.buzzes).toEqual([]);
  });

  it("refuses a buzz from a disconnected player", () => {
    const state = armedState();
    state.players.p1!.connected = false;
    const d = buzz(state, "p1", 150, NOW + 200);
    expect(d).toEqual({ noChange: true });
    expect(state.buzzes).toEqual([]);
  });

  it("ignores a second buzz from the same player", () => {
    const state = armedState();
    buzz(state, "p1", 150, NOW + 200);
    const d = buzz(state, "p1", 90, NOW + 250);
    expect(d).toEqual({ noChange: true });
    expect(state.buzzes).toHaveLength(1);
    expect(state.buzzes[0]!.reactionMs).toBe(150);
  });
});

describe("livebuzzer reaction ranking", () => {
  it("gives the round to the fastest reaction, not to the first packet", () => {
    const state = armedState();
    buzz(state, "p1", 400, NOW + 450);
    buzz(state, "p2", 200, NOW + 600);

    const d = handleTimeout(state, NOW + 450 + BUZZ_COLLECTION_MS);

    expect(state.phase).toBe("LOCKED");
    expect(state.lockedPlayerId).toBe("p2");
    expect(d.alarmAt).toBe(state.timerExpiresAt);
  });

  it("breaks a reaction tie by arrival, then by player id", () => {
    const state = armedState();
    buzz(state, "p2", 200, NOW + 400);
    buzz(state, "p1", 200, NOW + 500);
    handleTimeout(state, NOW + 400 + BUZZ_COLLECTION_MS);
    expect(state.lockedPlayerId).toBe("p2");

    const tied = armedState();
    buzz(tied, "p2", 200, NOW + 400);
    buzz(tied, "p1", 200, NOW + 400);
    handleTimeout(tied, NOW + 400 + BUZZ_COLLECTION_MS);
    expect(tied.lockedPlayerId).toBe("p1");
  });

  it("bounds but does not eliminate cheating: a claimed floor reaction wins", () => {
    const state = armedState();
    buzz(state, "p1", 190, NOW + 400);
    buzz(state, "p2", 0, NOW + 420);
    handleTimeout(state, NOW + 400 + BUZZ_COLLECTION_MS);

    expect(state.buzzes.find(b => b.playerId === "p2")!.reactionMs).toBe(
      MIN_REACTION_MS
    );
    expect(state.lockedPlayerId).toBe("p2");
  });

  it("does not move the collection deadline on a second buzz", () => {
    const state = armedState();
    const first = buzz(state, "p1", 400, NOW + 450);
    expect(first.alarmAt).toBe(NOW + 450 + BUZZ_COLLECTION_MS);

    const second = buzz(state, "p2", 200, NOW + 600);

    expect(second.alarmAt).toBeUndefined();
    expect(second.cancelAlarm).toBeUndefined();
    expect(state.timerExpiresAt).toBe(NOW + 450 + BUZZ_COLLECTION_MS);
  });

  it("drops a buzzer who disconnected during the collection window", () => {
    const state = armedState();
    buzz(state, "p2", 120, NOW + 400);
    buzz(state, "p1", 300, NOW + 450);
    state.players.p2!.connected = false;

    handleTimeout(state, NOW + 400 + BUZZ_COLLECTION_MS);

    expect(state.lockedPlayerId).toBe("p1");
  });
});

describe("livebuzzer reaction clamping", () => {
  it("clamps a below-floor or negative reaction up to the floor", () => {
    expect(clampReactionMs(-500, 1000)).toBe(MIN_REACTION_MS);
    expect(clampReactionMs(10, 1000)).toBe(MIN_REACTION_MS);
    expect(clampReactionMs(MIN_REACTION_MS, 1000)).toBe(MIN_REACTION_MS);
  });

  it("clamps a reaction longer than the round has existed down to the round age", () => {
    expect(clampReactionMs(5000, 600)).toBe(600);
    expect(clampReactionMs(300, 1000)).toBe(300);
  });

  it("keeps the floor when the round is younger than the floor", () => {
    expect(clampReactionMs(5, 20)).toBe(MIN_REACTION_MS);
  });

  it("clamps through buzz against the real round age", () => {
    const state = armedState();
    buzz(state, "p1", 90_000, NOW + 700);
    expect(state.buzzes[0]!.reactionMs).toBe(700);
  });
});

describe("livebuzzer judging", () => {
  it("scores a correct answer and returns the room to idle", () => {
    const state = lockedState();
    const d = judge(state, "host", true, LOCK_AT + 1000);

    expect(state.players.p1!.score).toBe(state.config.pointsPerCorrect);
    expect(state.phase).toBe("IDLE");
    expect(state.lockedPlayerId).toBeNull();
    expect(state.lockedOutPlayerIds).toEqual([]);
    expect(state.roundResults).toHaveLength(1);
    expect(state.roundResults[0]).toMatchObject({
      round: 1,
      playerId: "p1",
      correct: true,
      autoJudged: false,
      reactionMs: 200,
    });
    expect(d.alarmAt).toBe(LOCK_AT + 1000 + LIVEBUZZER_INACTIVITY_MS);
  });

  it("locks out a wrong answer and reopens the round with a fresh buzz window", () => {
    const state = lockedState({ penaltyPerWrong: 4 });
    const at = LOCK_AT + 1000;
    const d = judge(state, "host", false, at);

    expect(state.players.p1!.score).toBe(-4);
    expect(state.phase).toBe("ARMED");
    expect(state.armedAt).toBe(at);
    expect(state.buzzes).toEqual([]);
    expect(state.lockedOutPlayerIds).toEqual(["p1"]);
    expect(state.wrongAttempts).toBe(1);
    expect(state.round).toBe(1);
    expect(state.timerExpiresAt).toBe(at + state.config.buzzWindowMs);
    expect(d.alarmAt).toBe(at + state.config.buzzWindowMs);
    expect(buzz(state, "p1", 100, at + 100)).toEqual({ noChange: true });
  });

  it("kills the round once maxWrongPerRound is reached", () => {
    const state = lockedState({ maxWrongPerRound: 1 });
    judge(state, "host", false, LOCK_AT + 1000);

    expect(state.phase).toBe("IDLE");
    expect(state.wrongAttempts).toBe(1);
    expect(state.roundResults).toHaveLength(1);
  });

  it("kills the round when nobody is left to buzz, below maxWrongPerRound", () => {
    const state = lockedState({ maxWrongPerRound: 3 });
    judge(state, "host", false, LOCK_AT + 1000);
    expect(state.phase).toBe("ARMED");

    buzz(state, "p2", 200, LOCK_AT + 1200);
    handleTimeout(state, LOCK_AT + 1200 + BUZZ_COLLECTION_MS);
    expect(state.lockedPlayerId).toBe("p2");

    judge(state, "host", false, LOCK_AT + 2000);

    expect(state.phase).toBe("IDLE");
    expect(state.wrongAttempts).toBe(2);
    expect(state.wrongAttempts).toBeLessThan(state.config.maxWrongPerRound);
    expect(state.lockedOutPlayerIds).toEqual(["p1", "p2"]);
  });

  it("rejects a judgement when nothing is locked", () => {
    const state = armedState();
    const before = snapshot(state);
    const d = judge(state, "host", true, NOW + 100);
    expect(d.reply?.type).toBe("ERROR");
    expect(snapshot(state)).toEqual(before);
  });
});

describe("livebuzzer timeouts", () => {
  it("re-arms and changes nothing when the alarm fires early", () => {
    const state = armedState();
    const before = snapshot(state);
    const d = handleTimeout(state, NOW + 10);

    expect(d).toEqual({ noChange: true, alarmAt: state.timerExpiresAt });
    expect(snapshot(state)).toEqual(before);
  });

  it("ends the round unscored when the buzz window lapses with no buzz", () => {
    const state = armedState();
    const at = NOW + state.config.buzzWindowMs;
    const d = handleTimeout(state, at);

    expect(state.phase).toBe("IDLE");
    expect(state.roundResults).toEqual([]);
    expect(state.players.p1!.score).toBe(0);
    expect(state.timerExpiresAt).toBe(at + LIVEBUZZER_INACTIVITY_MS);
    expect(d.alarmAt).toBe(at + LIVEBUZZER_INACTIVITY_MS);
  });

  it("auto-judges a lapsed answer clock exactly like a host wrong ruling", () => {
    const auto = lockedState({ penaltyPerWrong: 4 });
    const autoAt = auto.timerExpiresAt;
    handleTimeout(auto, autoAt);

    const manual = lockedState({ penaltyPerWrong: 4 });
    judge(manual, "host", false, autoAt);

    expect(auto.phase).toBe("ARMED");
    expect(auto.lockedOutPlayerIds).toEqual(manual.lockedOutPlayerIds);
    expect(auto.wrongAttempts).toBe(manual.wrongAttempts);
    expect(auto.players.p1!.score).toBe(manual.players.p1!.score);
    expect(auto.roundResults[0]!.correct).toBe(false);
    expect(auto.roundResults[0]!.autoJudged).toBe(true);
    expect(manual.roundResults[0]!.autoJudged).toBe(false);
  });

  it("reaps an idle room into FINISHED", () => {
    const state = playingState();
    const at = NOW + LIVEBUZZER_INACTIVITY_MS;
    const d = handleTimeout(state, at);

    expect(state.status).toBe("FINISHED");
    expect(d.updateRoomStatus).toBe("finished");
    expect(d.persistResults).toBe(true);
    expect(d.alarmAt).toBe(at + LIVEBUZZER_FINISHED_CLEANUP_GRACE_MS);
  });

  it("does nothing once the game is finished", () => {
    const state = playingState();
    endGame(state, "host", NOW + 10);
    const before = snapshot(state);
    const d = handleTimeout(state, NOW + 10 + LIVEBUZZER_INACTIVITY_MS);

    expect(d).toEqual({ noChange: true });
    expect(snapshot(state)).toEqual(before);
  });
});

describe("livebuzzer clockless config", () => {
  it("arms with no buzz window and waits on the host", () => {
    const state = armedState({ buzzWindowMs: 0 });
    expect(state.timerExpiresAt).toBe(NOW + LIVEBUZZER_INACTIVITY_MS);

    const early = handleTimeout(state, NOW + 60_000);
    expect(early).toEqual({ noChange: true, alarmAt: state.timerExpiresAt });
    expect(state.phase).toBe("ARMED");

    handleTimeout(state, NOW + LIVEBUZZER_INACTIVITY_MS);
    expect(state.status).toBe("FINISHED");
  });

  it("locks with no answer clock and waits on the host", () => {
    const state = lockedState({ answerTimeMs: 0 });
    expect(state.phase).toBe("LOCKED");
    expect(state.timerExpiresAt).toBe(LOCK_AT + LIVEBUZZER_INACTIVITY_MS);

    handleTimeout(state, LOCK_AT + LIVEBUZZER_INACTIVITY_MS);
    expect(state.status).toBe("FINISHED");
    expect(state.roundResults).toEqual([]);
  });
});

describe("livebuzzer skip and adjust", () => {
  it("skips a live round without scoring it", () => {
    const state = lockedState();
    const at = LOCK_AT + 500;
    const d = skipRound(state, "host", at);

    expect(state.phase).toBe("IDLE");
    expect(state.lockedPlayerId).toBeNull();
    expect(state.roundResults).toEqual([]);
    expect(state.players.p1!.score).toBe(0);
    expect(d.alarmAt).toBe(at + LIVEBUZZER_INACTIVITY_MS);
  });

  it("refuses to skip an idle room", () => {
    const state = playingState();
    const d = skipRound(state, "host", NOW + 10);
    expect(d.reply?.type).toBe("ERROR");
    expect(state.phase).toBe("IDLE");
  });

  it("adjusts a score without touching the armed buzz-window alarm", () => {
    const state = armedState();
    const deadline = state.timerExpiresAt;
    const d = adjustScore(state, "host", "p1", -5);

    expect(state.players.p1!.score).toBe(-5);
    expect(d).toEqual({});
    expect(d.alarmAt).toBeUndefined();
    expect(d.cancelAlarm).toBeUndefined();
    expect(state.timerExpiresAt).toBe(deadline);
    expect(state.phase).toBe("ARMED");
  });

  it("adjusts a score without touching the locked answer-clock alarm", () => {
    const state = lockedState();
    const deadline = state.timerExpiresAt;
    const d = adjustScore(state, "host", "p2", 7);

    expect(state.players.p2!.score).toBe(7);
    expect(d).toEqual({});
    expect(d.alarmAt).toBeUndefined();
    expect(d.cancelAlarm).toBeUndefined();
    expect(state.timerExpiresAt).toBe(deadline);
    expect(state.phase).toBe("LOCKED");
    expect(state.lockedPlayerId).toBe("p1");
  });

  it("rejects an adjustment for an unknown player", () => {
    const state = playingState();
    const d = adjustScore(state, "host", "ghost", 10);
    expect(d.reply?.type).toBe("ERROR");
  });
});

describe("livebuzzer end game", () => {
  it("finishes the room and persists results", () => {
    const state = lockedState();
    const at = LOCK_AT + 5000;
    const d = endGame(state, "host", at);

    expect(state.status).toBe("FINISHED");
    expect(state.phase).toBe("IDLE");
    expect(state.lockedPlayerId).toBeNull();
    expect(d.updateRoomStatus).toBe("finished");
    expect(d.persistResults).toBe(true);
    expect(d.alarmAt).toBe(at + LIVEBUZZER_FINISHED_CLEANUP_GRACE_MS);
  });
});

describe("livebuzzer serializer", () => {
  it("hides the reaper deadline and the private round-results log", () => {
    const state = playingState();
    const serializer = new LivebuzzerSerializer();

    const idle = serializer.toPublic(state, true);
    expect(idle.timerExpiresAt).toBe(0);
    expect(idle.judgedCount).toBe(0);
    expect(idle.lastResult).toBeUndefined();
    expect(idle.nonScoringPlayerIds).toEqual(["host"]);
    expect(JSON.stringify(idle)).not.toContain("roundResults");

    arm(state, "host", NOW + 10);
    expect(serializer.toPublic(state).timerExpiresAt).toBe(
      state.timerExpiresAt
    );
  });

  it("hides the reaper deadline of a clockless armed round", () => {
    const state = armedState({ buzzWindowMs: 0 });
    const view = new LivebuzzerSerializer().toPublic(state, true);
    expect(view.phase).toBe("ARMED");
    expect(view.timerExpiresAt).toBe(0);
  });

  it("exposes the judged count and last result for client-side effects", () => {
    const state = lockedState();
    const serializer = new LivebuzzerSerializer();

    const locked = serializer.toPublic(state, true);
    expect(locked.lockedPlayerId).toBe("p1");
    expect(locked.lockedReactionMs).toBe(200);
    expect(locked.timerExpiresAt).toBe(LOCK_AT + state.config.answerTimeMs);

    judge(state, "host", true, LOCK_AT + 100);
    const judged = serializer.toPublic(state);
    expect(judged.judgedCount).toBe(1);
    expect(judged.lastResult).toMatchObject({ playerId: "p1", correct: true });
  });

  it("keeps the host on the scoreboard when hostPlays is on", () => {
    const state = playingState({ hostPlays: true });
    const view = new LivebuzzerSerializer().toPublic(state, true);
    expect(view.nonScoringPlayerIds).toBeUndefined();
  });
});
