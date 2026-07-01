// Shared game types for client and server
// Used by game-client.ts and GameRoom.ts

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

export type ClientMessage =
  | {
      type: "JOIN";
      playerId: string;
      name: string;
      gameId: string;
      password?: string;
    }
  | { type: "START"; playerId: string; subjectIds: string[] }
  | { type: "BUZZ"; playerId: string }
  | { type: "SUBMIT_ANSWER"; playerId: string; answer: string };

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
