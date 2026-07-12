import { describe, expect, it } from "vitest";

import { diffBuzzer } from "@/features/games/buzzer/events";
import type { BuzzerView } from "@/features/games/buzzer/types";
import type { QuestionResult } from "@zeyn/api/game-types";

import {
  advanceEventStream,
  initialCursor,
  type EventCursor,
  type GameEvent,
} from "./gameEvents";

const SELF = "player-self";
const RIVAL = "player-rival";

function result(index: number, userId: string, correct: boolean): QuestionResult {
  return {
    questionId: `q${index}`,
    userId,
    correct,
    pointsAwarded: correct ? 100 : -100,
    subjectIndex: Math.floor(index / 5),
    questionIndex: index % 5,
    subjectName: "Subject",
  };
}

function view(overrides: Partial<BuzzerView> = {}): BuzzerView {
  return {
    status: "PLAYING",
    gameType: "buzzer",
    gameId: "game-1",
    gameName: "Room",
    hostId: SELF,
    maxPlayers: 10,
    isPublic: true,
    hasPassword: false,
    players: {},
    subjectCount: 5,
    currentSubjectIndex: 0,
    currentQuestionIndex: 0,
    phase: "ACTIVE",
    activeQuestionState: {
      buzzedPlayerId: null,
      wrongAttempts: 0,
      playersWhoAttempted: [],
      timerExpiresAt: 0,
    },
    questionResults: [],
    ...overrides,
  } as BuzzerView;
}

function drive(
  cursor: EventCursor<BuzzerView>,
  state: BuzzerView | null,
  isConnected: boolean
) {
  return advanceEventStream(cursor, { state, isConnected, selfId: SELF }, diffBuzzer);
}

describe("advanceEventStream", () => {
  it("emits nothing for the first state after mount", () => {
    const step = drive(initialCursor<BuzzerView>(), view(), true);
    expect(step.events).toEqual([]);
    expect(step.cursor.armed).toBe(true);
  });

  it("emits nothing while still connecting", () => {
    const step = drive(initialCursor<BuzzerView>(), null, false);
    expect(step.events).toEqual([]);
    expect(step.cursor.armed).toBe(false);
  });

  it("emits an answer event once armed", () => {
    let { cursor } = drive(initialCursor<BuzzerView>(), view(), true);

    const answered = view({ questionResults: [result(0, SELF, true)] });
    const step = drive(cursor, answered, true);

    expect(step.events).toEqual<GameEvent[]>([
      { type: "answer", playerId: SELF, isSelf: true, correct: true, points: 100 },
    ]);
  });

  it("does not replay the match when a reconnect rehydrates full state", () => {
    let cursor = initialCursor<BuzzerView>();

    const early = view({ questionResults: [result(0, SELF, true)] });
    cursor = drive(cursor, early, true).cursor;

    cursor = drive(cursor, early, false).cursor;

    const stillStale = drive(cursor, early, true);
    expect(stillStale.events).toEqual([]);
    cursor = stillStale.cursor;

    const rehydrated = view({
      currentSubjectIndex: 1,
      currentQuestionIndex: 3,
      questionResults: Array.from({ length: 40 }, (_, i) =>
        result(i, i % 2 === 0 ? SELF : RIVAL, i % 3 === 0)
      ),
    });

    const storm = drive(cursor, rehydrated, true);
    expect(storm.events).toEqual([]);

    cursor = storm.cursor;

    const afterReconnect = view({
      currentSubjectIndex: 1,
      currentQuestionIndex: 3,
      questionResults: [
        ...rehydrated.questionResults,
        result(40, SELF, true),
      ],
    });

    expect(drive(cursor, afterReconnect, true).events).toEqual<GameEvent[]>([
      { type: "answer", playerId: SELF, isSelf: true, correct: true, points: 100 },
    ]);
  });

  it("is idempotent when re-run with the same state object", () => {
    const state = view();
    let cursor = drive(initialCursor<BuzzerView>(), state, true).cursor;

    expect(drive(cursor, state, true).events).toEqual([]);
    expect(drive(cursor, state, true).events).toEqual([]);
  });
});

describe("diffBuzzer", () => {
  it("reports a buzz when someone claims the question", () => {
    const prev = view();
    const next = view({
      phase: "ANSWERING",
      activeQuestionState: {
        buzzedPlayerId: RIVAL,
        wrongAttempts: 0,
        playersWhoAttempted: [RIVAL],
        timerExpiresAt: 0,
      },
    });

    expect(diffBuzzer(prev, next, SELF)).toEqual<GameEvent[]>([
      { type: "buzz", playerId: RIVAL, isSelf: false },
    ]);
  });

  it("reports an unsolved reveal when the question times out unbuzzed", () => {
    const prev = view();
    const next = view({ phase: "REVEALED" });

    expect(diffBuzzer(prev, next, SELF)).toEqual<GameEvent[]>([
      { type: "reveal", solved: false, selfScored: false },
    ]);
  });

  it("reports a solved reveal crediting the scorer", () => {
    const prev = view({ phase: "ANSWERING" });
    const next = view({
      phase: "REVEALED",
      questionResults: [result(0, RIVAL, true)],
    });

    expect(diffBuzzer(prev, next, SELF)).toEqual<GameEvent[]>([
      { type: "answer", playerId: RIVAL, isSelf: false, correct: true, points: 100 },
      { type: "reveal", solved: true, selfScored: false },
    ]);
  });

  it("reports a question start when the cursor advances", () => {
    const prev = view({ phase: "REVEALED" });
    const next = view({ phase: "ACTIVE", currentQuestionIndex: 1 });

    expect(diffBuzzer(prev, next, SELF)).toEqual<GameEvent[]>([
      { type: "questionStart", questionIndex: 1 },
    ]);
  });
});
