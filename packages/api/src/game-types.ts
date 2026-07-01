// Shared game types for client and server
// Used by game-client.ts and GameRoom.ts

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

export interface GameState {
  status: "WAITING" | "PLAYING" | "FINISHED";
  gameId: string | null;
  gameName: string | null;
  hostId: string | null;
  maxPlayers: number;
  isPublic: boolean;
  hasPassword: boolean;
  players: Record<string, Player>;
  subjects: Subject[];
  currentSubjectIndex: number;
  currentQuestionIndex: number;
  phase: "ACTIVE" | "ANSWERING" | "REVEALED";
  activeQuestionState: ActiveQuestionState | null;
  questionResults: QuestionResult[];
}

export interface PublicGameState
  extends Omit<GameState, "subjects" | "players"> {
  subjectCount: number;
  players?: Record<string, Partial<Player>>; // Only changed players
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
export const clientMessageSchema = z.discriminatedUnion("type", [
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
    subjectIds: z.array(z.string().max(200)).max(100),
  }),
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

export type ClientMessage = z.infer<typeof clientMessageSchema>;

export type ServerMessage =
  | { type: "STATE_UPDATE"; state: PublicGameState; serverTime: number }
  | { type: "ERROR"; message: string; code?: string };

export const gameConfig = {
  questionTimeMs: 15000,
  answerTimeMs: 20000,
  revealTimeMs: 5000,
  minSubjects: 5,
  maxWrongAttempts: 3,
  questionsPerSubject: 5,
  maxPlayers: 20,
  minPlayers: 2,
} as const;

export type GameConfig = typeof gameConfig;
