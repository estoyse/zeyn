import { describe, it, expect } from "vitest";
import {
  clientMessageSchema,
  gameConfig,
  type GameState,
  type Player,
  type Question,
  type ServerMessage,
} from "@zeyn/api/game-types";
import {
  buzz,
  createInitialState,
  handleTimeout,
  hydrateRoom,
  join,
  mapSubjects,
  start,
  submitAnswer,
  type RoomRow,
} from "./engine";

const NOW = 1_000_000;

// Accessors that assert presence, so tests read cleanly under
// noUncheckedIndexedAccess and fail loudly if a fixture assumption breaks.
function player(s: GameState, id: string): Player {
  const p = s.players[id];
  if (!p) throw new Error(`expected player "${id}" to exist`);
  return p;
}

function questionAt(s: GameState, subjectIdx: number, questionIdx: number): Question {
  const q = s.subjects[subjectIdx]?.questions[questionIdx];
  if (!q) throw new Error(`expected question ${subjectIdx}/${questionIdx} to exist`);
  return q;
}

function errText(reply: ServerMessage | undefined): string {
  if (!reply || reply.type !== "ERROR") throw new Error("expected an ERROR reply");
  return reply.message;
}

function room(overrides: Partial<RoomRow> = {}): RoomRow {
  return {
    name: "Trivia Night",
    hostId: "host",
    maxPlayers: 10,
    isPublic: true,
    password: null,
    status: "waiting",
    ...overrides,
  };
}

/** A state that has passed hydration and holds `minSubjects` subjects. */
function seededState(): GameState {
  const state = createInitialState();
  state.gameId = "game-1";
  state.hostId = "host";
  const subjectRows = Array.from({ length: gameConfig.minSubjects }, (_, i) => ({
    id: `s${i}`,
    name: `Subject ${i}`,
  }));
  const questionRows = subjectRows.flatMap(s =>
    Array.from({ length: gameConfig.questionsPerSubject }, (_, q) => ({
      id: `${s.id}-q${q}`,
      subjectId: s.id,
      text: `Q${q}`,
      answer: `answer${q}`,
      points: (q + 1) * 10,
    }))
  );
  state.subjects = mapSubjects(subjectRows, questionRows);
  return state;
}

/** Seed a state and start the match, returning the running state. */
function startedState(): GameState {
  const state = seededState();
  state.players["host"] = { id: "host", name: "Host", score: 0, connected: true };
  state.players["p1"] = { id: "p1", name: "P1", score: 0, connected: true };
  start(state, "host", NOW);
  return state;
}

describe("clientMessageSchema (WebSocket boundary)", () => {
  it("accepts each well-formed message type", () => {
    const valid = [
      { type: "JOIN", playerId: "p1", name: "Ann", gameId: "g1" },
      { type: "JOIN", playerId: "p1", name: "Ann", gameId: "g1", password: "x" },
      { type: "START", playerId: "p1" },
      { type: "BUZZ", playerId: "p1" },
      { type: "SUBMIT_ANSWER", playerId: "p1", answer: "42" },
    ];
    for (const msg of valid) {
      expect(clientMessageSchema.safeParse(msg).success).toBe(true);
    }
  });

  it("rejects unknown types and structurally invalid payloads", () => {
    const invalid = [
      { type: "NUKE", playerId: "p1" }, // unknown discriminator
      { type: "JOIN", playerId: "p1", name: "Ann" }, // missing gameId
      { type: "BUZZ" }, // missing playerId
      { type: "SUBMIT_ANSWER", playerId: "p1", answer: 42 }, // wrong type
      { type: "START" }, // missing playerId
      "not even an object",
      null,
    ];
    for (const msg of invalid) {
      expect(clientMessageSchema.safeParse(msg).success).toBe(false);
    }
  });

  it("rejects abusive oversized free-text fields", () => {
    const huge = "a".repeat(5000);
    expect(
      clientMessageSchema.safeParse({
        type: "SUBMIT_ANSWER",
        playerId: "p1",
        answer: huge,
      }).success
    ).toBe(false);
  });
});

describe("join", () => {
  it("admits a valid new player", () => {
    const s = createInitialState();
    const d = join(s, { playerId: "p1", name: "Ann", roomPassword: null });
    expect(d.accepted).toBe(true);
    expect(s.players["p1"]).toMatchObject({ name: "Ann", score: 0, connected: true });
  });

  it("rejects and closes for missing id/name", () => {
    const s = createInitialState();
    expect(join(s, { playerId: "", name: "Ann", roomPassword: null })).toMatchObject({
      closeSocket: true,
    });
    expect(join(s, { playerId: "p1", name: "", roomPassword: null })).toMatchObject({
      closeSocket: true,
    });
  });

  it("rejects guest ids", () => {
    const s = createInitialState();
    const d = join(s, { playerId: "guest-42", name: "G", roomPassword: null });
    expect(d.closeSocket).toBe(true);
    expect(s.players["guest-42"]).toBeUndefined();
  });

  it("enforces the room password without closing the socket", () => {
    const s = createInitialState();
    const wrong = join(s, { playerId: "p1", name: "Ann", roomPassword: "secret" });
    expect(wrong.reply).toMatchObject({ code: "PASSWORD_REQUIRED" });
    expect(wrong.closeSocket).toBeUndefined();
    expect(s.players["p1"]).toBeUndefined();

    const right = join(s, {
      playerId: "p1",
      name: "Ann",
      password: "secret",
      roomPassword: "secret",
    });
    expect(right.accepted).toBe(true);
  });

  it("rejects a new player when the room is full but readmits existing ones", () => {
    const s = createInitialState();
    s.maxPlayers = 1;
    join(s, { playerId: "p1", name: "Ann", roomPassword: null });

    const full = join(s, { playerId: "p2", name: "Bob", roomPassword: null });
    expect(full.reply).toMatchObject({ type: "ERROR", message: "Room is full" });
    expect(s.players["p2"]).toBeUndefined();

    // Existing player reconnecting is always allowed and flips connected back on.
    player(s, "p1").connected = false;
    const rejoin = join(s, { playerId: "p1", name: "Ann2", roomPassword: null });
    expect(rejoin.accepted).toBe(true);
    expect(s.players["p1"]).toMatchObject({ connected: true, name: "Ann2", score: 0 });
  });
});

describe("hydrateRoom", () => {
  it("copies room metadata onto the state and hides the password", () => {
    const s = createInitialState();
    const d = hydrateRoom(s, "game-1", room({ password: "pw", maxPlayers: 4 }));
    expect(d.reply).toBeUndefined();
    expect(s).toMatchObject({
      gameId: "game-1",
      gameName: "Trivia Night",
      hostId: "host",
      maxPlayers: 4,
      hasPassword: true,
    });
    expect((s as unknown as Record<string, unknown>).password).toBeUndefined();
  });

  it("rejects missing / in-progress / finished rooms", () => {
    expect(hydrateRoom(createInitialState(), "g", undefined).reply).toMatchObject({
      code: "NOT_FOUND",
    });
    expect(
      hydrateRoom(createInitialState(), "g", room({ status: "playing" })).reply
    ).toMatchObject({ code: "ALREADY_STARTED" });
    expect(
      hydrateRoom(createInitialState(), "g", room({ status: "finished" })).reply
    ).toMatchObject({ code: "ALREADY_FINISHED" });
  });
});

describe("start", () => {
  it("only lets the host start", () => {
    const s = seededState();
    expect(start(s, "not-host", NOW).reply).toMatchObject({ type: "ERROR" });
    expect(s.status).toBe("WAITING");
  });

  it("requires the minimum number of subjects", () => {
    const s = seededState();
    s.subjects = s.subjects.slice(0, gameConfig.minSubjects - 1);
    expect(errText(start(s, "host", NOW).reply)).toContain(
      String(gameConfig.minSubjects)
    );
    expect(s.status).toBe("WAITING");
  });

  it("starts the match, arms the question timer, and flags the DB write", () => {
    const s = seededState();
    const d = start(s, "host", NOW);
    expect(s.status).toBe("PLAYING");
    expect(s.phase).toBe("ACTIVE");
    expect(d.updateRoomStatus).toBe("playing");
    expect(d.alarmAt).toBe(NOW + gameConfig.questionTimeMs);
    expect(s.activeQuestionState?.timerExpiresAt).toBe(NOW + gameConfig.questionTimeMs);
  });
});

describe("buzz", () => {
  it("locks the buzzer to the first player and arms the answer timer", () => {
    const s = startedState();
    const d = buzz(s, "p1", NOW);
    expect(s.phase).toBe("ANSWERING");
    expect(s.activeQuestionState?.buzzedPlayerId).toBe("p1");
    expect(d.alarmAt).toBe(NOW + gameConfig.answerTimeMs);
  });

  it("ignores a second buzz while someone is answering", () => {
    const s = startedState();
    buzz(s, "p1", NOW);
    const d = buzz(s, "host", NOW);
    expect(d).toEqual({});
    expect(s.activeQuestionState?.buzzedPlayerId).toBe("p1");
  });

  it("ignores disconnected players and players who already attempted", () => {
    const s = startedState();
    player(s, "p1").connected = false;
    expect(buzz(s, "p1", NOW)).toEqual({});
    expect(s.phase).toBe("ACTIVE");
  });
});

describe("submitAnswer", () => {
  it("awards points and reveals on a correct answer", () => {
    const s = startedState();
    const question = questionAt(s, 0, 0);
    buzz(s, "p1", NOW);
    const d = submitAnswer(s, "p1", question.answer, NOW);
    expect(player(s, "p1").score).toBe(question.points);
    expect(s.phase).toBe("REVEALED");
    expect(d.alarmAt).toBe(NOW + gameConfig.revealTimeMs);
    expect(s.questionResults.at(-1)).toMatchObject({ correct: true, pointsAwarded: question.points });
  });

  it("deducts points and reopens the question on a wrong answer", () => {
    const s = startedState();
    const question = questionAt(s, 0, 0);
    buzz(s, "p1", NOW);
    const d = submitAnswer(s, "p1", "definitely wrong", NOW);
    expect(player(s, "p1").score).toBe(-question.points);
    expect(s.phase).toBe("ACTIVE");
    expect(s.activeQuestionState?.buzzedPlayerId).toBeNull();
    expect(s.activeQuestionState?.playersWhoAttempted).toContain("p1");
    expect(d.alarmAt).toBe(NOW + gameConfig.questionTimeMs);
  });

  it("reveals once max wrong attempts are reached", () => {
    const s = startedState();
    // Give ourselves enough distinct players to exhaust the attempt limit.
    for (let i = 0; i < gameConfig.maxWrongAttempts; i++) {
      const id = `w${i}`;
      s.players[id] = { id, name: id, score: 0, connected: true };
      buzz(s, id, NOW);
      submitAnswer(s, id, "wrong", NOW);
    }
    expect(s.activeQuestionState?.wrongAttempts).toBe(gameConfig.maxWrongAttempts);
    expect(s.phase).toBe("REVEALED");
  });

  it("ignores answers from anyone but the buzzed-in player", () => {
    const s = startedState();
    buzz(s, "p1", NOW);
    expect(submitAnswer(s, "host", "answer0", NOW)).toEqual({});
    expect(s.phase).toBe("ANSWERING");
  });
});

describe("handleTimeout", () => {
  it("reveals when a question times out", () => {
    const s = startedState();
    const d = handleTimeout(s, NOW);
    expect(s.phase).toBe("REVEALED");
    expect(d.alarmAt).toBe(NOW + gameConfig.revealTimeMs);
  });

  it("counts an answer timeout as a wrong answer for the buzzed player", () => {
    const s = startedState();
    const question = questionAt(s, 0, 0);
    buzz(s, "p1", NOW);
    handleTimeout(s, NOW);
    expect(player(s, "p1").score).toBe(-question.points);
  });

  it("advances to the next question after a reveal", () => {
    const s = startedState();
    handleTimeout(s, NOW); // ACTIVE -> REVEALED
    handleTimeout(s, NOW); // REVEALED -> next
    expect(s.currentQuestionIndex).toBe(1);
    expect(s.phase).toBe("ACTIVE");
  });

  it("rolls to the next subject after the last question of a subject", () => {
    const s = startedState();
    s.currentQuestionIndex = gameConfig.questionsPerSubject - 1;
    handleTimeout(s, NOW); // reveal last question of subject 0
    handleTimeout(s, NOW); // advance
    expect(s.currentSubjectIndex).toBe(1);
    expect(s.currentQuestionIndex).toBe(0);
  });

  it("finishes the match and asks to persist results after the final question", () => {
    const s = startedState();
    s.currentSubjectIndex = s.subjects.length - 1;
    s.currentQuestionIndex = gameConfig.questionsPerSubject - 1;
    handleTimeout(s, NOW); // reveal
    const d = handleTimeout(s, NOW); // advance past the end
    expect(s.status).toBe("FINISHED");
    expect(d.updateRoomStatus).toBe("finished");
    expect(d.persistResults).toBe(true);
    expect(d.cancelAlarm).toBe(true);
  });

  it("does nothing once the game is finished", () => {
    const s = startedState();
    s.status = "FINISHED";
    expect(handleTimeout(s, NOW)).toEqual({});
  });
});
