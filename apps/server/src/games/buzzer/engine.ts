// Pure game engine for a GameRoom.
//
// Every function here is a deterministic transition over `GameState`: given the
// current state, an action, and the current time (`now`), it MUTATES the state
// in place and returns an `EngineDirectives` describing the side effects the
// Durable Object must carry out (schedule an alarm, update the DB row, persist
// results, reply to / close the acting socket).
//
// The engine never touches the network, the database, `Date.now()`, or `this`.
// That is what makes the buzz/answer/timeout/scoring state machine unit-testable
// without a Durable Object: construct a state, call a transition with a fixed
// `now`, and assert on the resulting state and directives.

import {
  gameConfig,
  type EngineDirectives,
  type GameState,
  type ServerMessage,
  type Subject,
} from "@zeyn/api/game-types";
import { isFuzzyMatch } from "./fuzzy-match";
import type { JoinParams } from "../contract";

/** The subset of the `active_games` row the engine reads during hydration. */
export interface RoomRow {
  name: string;
  hostId: string;
  maxPlayers: number;
  isPublic: boolean;
  password: string | null;
  status: "waiting" | "playing" | "finished";
}

/** Raw subject/question rows as returned by the DB, shaped by `mapSubjects`. */
export interface SubjectRow {
  id: string;
  name: string;
}
export interface QuestionRow {
  id: string;
  subjectId: string;
  text: string;
  answer: string;
  points: number;
}

function error(message: string, code?: string): ServerMessage {
  return code ? { type: "ERROR", message, code } : { type: "ERROR", message };
}

/** The fresh, un-hydrated state a brand-new room starts from. */
export function createInitialState(): GameState {
  return {
    status: "WAITING",
    gameType: "buzzer",
    gameId: null,
    gameName: null,
    hostId: null,
    maxPlayers: gameConfig.maxPlayers,
    isPublic: true,
    hasPassword: false,
    players: {},
    subjects: [],
    currentSubjectIndex: 0,
    currentQuestionIndex: 0,
    phase: "ACTIVE",
    activeQuestionState: null,
    questionResults: [],
  };
}

/**
 * Shape raw subject + question rows into the nested `Subject[]` the game state
 * holds, with each subject's questions sorted by ascending points. Pure so both
 * the JOIN-time hydration and the host START path share one implementation.
 */
export function mapSubjects(
  subjectsData: SubjectRow[],
  questionsData: QuestionRow[]
): Subject[] {
  return subjectsData.map(s => ({
    id: s.id,
    name: s.name,
    questions: questionsData
      .filter(q => q.subjectId === s.id)
      .sort((a, b) => a.points - b.points)
      .map(q => ({
        id: q.id,
        text: q.text,
        answer: q.answer,
        points: q.points,
      })),
  }));
}

/**
 * Populate room metadata from the DB row the first time a player joins. Returns
 * an error directive when the room can't be joined (missing / already in play);
 * the secret password stays with the caller and is passed to `join` instead of
 * being stored on the broadcast-able state.
 */
export function hydrateRoom(
  state: GameState,
  gameId: string,
  room: RoomRow | undefined
): EngineDirectives {
  if (!room) {
    return { reply: error("Room not found", "NOT_FOUND"), closeSocket: true };
  }
  if (room.status === "playing") {
    return {
      reply: error("Game already started", "ALREADY_STARTED"),
      closeSocket: true,
    };
  }
  if (room.status === "finished") {
    return {
      reply: error("Game already ended", "ALREADY_FINISHED"),
      closeSocket: true,
    };
  }

  state.gameId = gameId;
  state.gameName = room.name;
  state.hostId = room.hostId;
  state.maxPlayers = room.maxPlayers;
  state.isPublic = room.isPublic;
  state.hasPassword = !!room.password;
  return {};
}

/** Validate and admit a player, or reconnect an existing one. */
export function join(state: GameState, params: JoinParams): EngineDirectives {
  const { playerId, name, password, roomPassword } = params;

  if (!playerId || !name) {
    return {
      reply: error("Player ID and name are required to join."),
      closeSocket: true,
    };
  }

  if (playerId.startsWith("guest-")) {
    return {
      reply: error("Guest access is disabled. Please login."),
      closeSocket: true,
    };
  }

  if (roomPassword && roomPassword !== password) {
    return {
      reply: error(
        "Incorrect or missing password for this room",
        "PASSWORD_REQUIRED"
      ),
    };
  }

  const isNewPlayer = !state.players[playerId];
  if (isNewPlayer && Object.keys(state.players).length >= state.maxPlayers) {
    return { reply: error("Room is full") };
  }

  const existing = state.players[playerId];
  if (existing) {
    existing.connected = true;
    existing.name = name;
  } else {
    state.players[playerId] = {
      id: playerId,
      name,
      score: 0,
      connected: true,
    };
  }

  return { accepted: true };
}

/**
 * Host starts the match. Subjects must already be loaded onto the state (the DO
 * hydrates or lazily loads them from the DB before calling this).
 */
export function start(
  state: GameState,
  playerId: string,
  now: number
): EngineDirectives {
  if (state.hostId !== playerId) {
    return { reply: error("Only the host can start the game") };
  }
  if (state.status !== "WAITING") {
    return { reply: error("Game already started") };
  }
  if (state.subjects.length < gameConfig.minSubjects) {
    return {
      reply: error(
        `Game requires at least ${gameConfig.minSubjects} subjects to start`
      ),
    };
  }

  state.status = "PLAYING";
  const alarmAt = startQuestionCycle(state, now);
  return { updateRoomStatus: "playing", alarmAt };
}

/** Begin a fresh question: reset the buzzer and arm the question timer. */
function startQuestionCycle(state: GameState, now: number): number {
  state.phase = "ACTIVE";
  state.activeQuestionState = {
    buzzedPlayerId: null,
    wrongAttempts: 0,
    playersWhoAttempted: [],
    timerExpiresAt: now + gameConfig.questionTimeMs,
  };
  return state.activeQuestionState.timerExpiresAt;
}

/** A player hits the buzzer, claiming the right to answer. */
export function buzz(
  state: GameState,
  playerId: string,
  now: number
): EngineDirectives {
  if (!state.players[playerId]?.connected) return {};
  if (state.phase !== "ACTIVE") return {};

  const q = state.activeQuestionState;
  if (!q || q.buzzedPlayerId) return {};
  if (q.playersWhoAttempted.includes(playerId)) return {};

  state.phase = "ANSWERING";
  q.buzzedPlayerId = playerId;
  q.timerExpiresAt = now + gameConfig.answerTimeMs;
  return { alarmAt: q.timerExpiresAt };
}

/** The buzzed-in player submits an answer (empty string = answer timed out). */
export function submitAnswer(
  state: GameState,
  playerId: string,
  answer: string,
  now: number
): EngineDirectives {
  if (!state.players[playerId]?.connected) return {};
  if (state.phase !== "ANSWERING") return {};

  const q = state.activeQuestionState;
  if (!q || q.buzzedPlayerId !== playerId) return {};

  const subject = state.subjects[state.currentSubjectIndex];
  const question = subject?.questions[state.currentQuestionIndex];
  if (!subject || !question) return {};

  const player = state.players[playerId];
  const correct = isFuzzyMatch(answer, question.answer);
  const pointsAwarded = correct ? question.points : -question.points;

  if (player) player.score += pointsAwarded;
  state.questionResults.push({
    questionId: question.id,
    userId: playerId,
    correct,
    pointsAwarded,
    subjectIndex: state.currentSubjectIndex,
    questionIndex: state.currentQuestionIndex,
    subjectName: subject.name,
  });

  if (correct) {
    return reveal(state, now);
  }

  q.wrongAttempts++;
  q.playersWhoAttempted.push(playerId);
  q.buzzedPlayerId = null;

  if (q.wrongAttempts >= gameConfig.maxWrongAttempts) {
    return reveal(state, now);
  }

  // Re-open the question to the remaining players.
  state.phase = "ACTIVE";
  q.timerExpiresAt = now + gameConfig.questionTimeMs;
  return { alarmAt: q.timerExpiresAt };
}

/** Show the answer to everyone, then hold before advancing. */
function reveal(state: GameState, now: number): EngineDirectives {
  state.phase = "REVEALED";
  if (state.activeQuestionState) {
    state.activeQuestionState.timerExpiresAt = now + gameConfig.revealTimeMs;
  }
  return { alarmAt: now + gameConfig.revealTimeMs };
}

/** Advance to the next question / subject, or finish the match. */
function nextQuestion(state: GameState, now: number): EngineDirectives {
  state.currentQuestionIndex++;
  if (state.currentQuestionIndex >= gameConfig.questionsPerSubject) {
    state.currentQuestionIndex = 0;
    state.currentSubjectIndex++;
  }

  if (state.currentSubjectIndex >= state.subjects.length) {
    state.status = "FINISHED";
    state.phase = "REVEALED";
    return {
      updateRoomStatus: "finished",
      persistResults: true,
      cancelAlarm: true,
    };
  }

  const alarmAt = startQuestionCycle(state, now);
  return { alarmAt };
}

/**
 * Fired when a phase deadline elapses. The action is implied by the current
 * phase: question expires → reveal; answer expires → count as a wrong answer;
 * reveal ends → advance.
 */
export function handleTimeout(state: GameState, now: number): EngineDirectives {
  if (state.status !== "PLAYING") return {};

  switch (state.phase) {
    case "ACTIVE":
      return reveal(state, now);
    case "ANSWERING": {
      const playerId = state.activeQuestionState?.buzzedPlayerId;
      if (!playerId) return {};
      return submitAnswer(state, playerId, "", now);
    }
    case "REVEALED":
      return nextQuestion(state, now);
    default:
      return {};
  }
}
