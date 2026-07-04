import { z } from "zod";

export interface Player {
  id: string;
  name: string;
  score: number;
  connected: boolean;
}

export interface Question {
  id: string;
  text: string;
  answer: string;
  points: number;
}

export interface Subject {
  id: string;
  name: string;
  questions: Question[];
}

export interface QuestionResult {
  questionId: string;
  userId: string;
  correct: boolean;
  pointsAwarded: number;
  // Snapshot of where this question sat in the game, so results stay
  // renderable even if the subject/question bank changes later.
  subjectIndex: number;
  questionIndex: number;
  subjectName: string;
}

export interface ActiveQuestionState {
  buzzedPlayerId: string | null;
  wrongAttempts: number;
  playersWhoAttempted: string[];
  timerExpiresAt: number;
}

// Fields every game's state carries, regardless of game type. The generic
// platform machinery (the GameRoom durable object, the room lifecycle) only ever
// touches these; each game type extends this with its own play state.
export interface BaseGameState {
  status: "WAITING" | "PLAYING" | "FINISHED";
  gameType: string;
  gameId: string | null;
  gameName: string | null;
  hostId: string | null;
  maxPlayers: number;
  isPublic: boolean;
  hasPassword: boolean;
  players: Record<string, Player>;
}

// The buzzer game's full state. Buzzer-specific play fields (subjects, the
// question cursor, the active-question buzzer state, per-question results) live
// here, not on BaseGameState.
export interface GameState extends BaseGameState {
  subjects: Subject[];
  currentSubjectIndex: number;
  currentQuestionIndex: number;
  phase: "ACTIVE" | "ANSWERING" | "REVEALED";
  activeQuestionState: ActiveQuestionState | null;
  questionResults: QuestionResult[];
}

// The broadcast fields common to every game type: everything the platform-level
// UI (room header, player list, lobby, connection state) reads, independent of
// which game is being played.
export interface BasePublicGameState {
  status: "WAITING" | "PLAYING" | "FINISHED";
  gameType: string;
  gameId: string | null;
  gameName: string | null;
  hostId: string | null;
  maxPlayers: number;
  isPublic: boolean;
  hasPassword: boolean;
  players?: Record<string, Partial<Player>>; // Only changed players
}

// The buzzer game's public (client-facing) state. The buzzer-specific fields
// below will move under a game-specific payload once a second game exists and
// the web renderer is split per game type (see migration plan, Phase 4).
export interface PublicGameState extends BasePublicGameState {
  subjectCount: number;
  currentSubjectIndex: number;
  currentQuestionIndex: number;
  phase: "ACTIVE" | "ANSWERING" | "REVEALED";
  activeQuestionState: ActiveQuestionState | null;
  questionResults: QuestionResult[];
  currentSubjectName?: string;
  currentQuestion?: {
    text: string;
    points: number;
    answer?: string;
  };
}

// Zod schema for messages arriving over the WebSocket — the untrusted client
// boundary. This is the single source of truth: `ClientMessage` is inferred
// from it, so the type and the runtime guard can never drift. Validation here is
// purely structural (shapes + generous size caps to reject abusive payloads);
// semantic rules (host-only START, room full, password, empty name) live in the
// game engine so it can return specific error messages.
// Platform-level messages, common to every game type: joining a room and the
// host starting the match. The room's content is loaded from its stored config
// at join, so START carries no game-specific payload.
export const platformMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("JOIN"),
    playerId: z.string().max(200),
    name: z.string().max(200),
    gameId: z.string().max(200),
    password: z.string().max(200).optional(),
  }),
  z.object({
    type: z.literal("START"),
    playerId: z.string().max(200),
  }),
]);

// The buzzer game's own actions. Each game module owns a schema like this; the
// durable object validates incoming messages against the union of the platform
// schema and the room's game module schema.
export const buzzerActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("BUZZ"),
    playerId: z.string().max(200),
  }),
  z.object({
    type: z.literal("SUBMIT_ANSWER"),
    playerId: z.string().max(200),
    answer: z.string().max(2000),
  }),
]);

export const musicActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("ANSWER"),
    playerId: z.string().max(200),
    optionIndex: z.number().int().min(0).max(10),
  }),
]);

export const clientMessageSchema = z.union([
  platformMessageSchema,
  buzzerActionSchema,
  musicActionSchema,
]);

export type PlatformMessage = z.infer<typeof platformMessageSchema>;
export type BuzzerAction = z.infer<typeof buzzerActionSchema>;
export type MusicAction = z.infer<typeof musicActionSchema>;
export type ClientMessage = z.infer<typeof clientMessageSchema>;

export type ServerMessage =
  | { type: "STATE_UPDATE"; state: BasePublicGameState; serverTime: number }
  | { type: "ERROR"; message: string; code?: string };

/**
 * Side effects produced by a game engine transition, executed by the GameRoom
 * durable object. Game-agnostic: every game module's transitions return this, so
 * the durable object never needs to know a game's rules to carry out its effects.
 * Every field is optional; an empty object means "state may have changed, just
 * save and broadcast" (the DO always saves + broadcasts after an action).
 */
export interface EngineDirectives {
  /** Message to send back to the socket that triggered the action. */
  reply?: ServerMessage;
  /** Close the acting socket after sending `reply`. */
  closeSocket?: boolean;
  /** JOIN succeeded — the DO should attach player metadata to the socket. */
  accepted?: boolean;
  /** Schedule the next phase alarm at this absolute epoch-ms timestamp. */
  alarmAt?: number;
  /** Delete any pending alarm (the game reached a terminal state). */
  cancelAlarm?: boolean;
  /** Persist the room's `status` column. */
  updateRoomStatus?: "playing" | "finished";
  /** Flush the accumulated match results to history tables. */
  persistResults?: boolean;
  noChange?: boolean;
}

export const gameConfig = {
  questionTimeMs: 15000,
  answerTimeMs: 20000,
  revealTimeMs: 5000,
  minSubjects: 5,
  maxWrongAttempts: 3,
  questionsPerSubject: 5,
  maxPlayers: 20,
  minPlayers: 2,
  finishedCleanupGraceMs: 60000,
} as const;

export type GameConfig = typeof gameConfig;

// Room-creation limits, shared by the createRoom validator (server) and the
// create-game form (client) so the two never drift.
export const roomLimits = {
  nameMinLength: 3,
  nameMaxLength: 50,
  minPlayers: 2,
  maxPlayers: 20,
  defaultMaxPlayers: 10,
  minSubjects: 5,
  maxSubjects: 10,
} as const;

export type RoomLimits = typeof roomLimits;
