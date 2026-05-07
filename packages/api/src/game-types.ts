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
}

export interface ActiveQuestionState {
  buzzedPlayerId: string | null;
  wrongAttempts: number;
  playersWhoAttempted: string[];
  timerExpiresAt: number;
}

export interface GameState {
  status: "WAITING" | "PLAYING" | "FINISHED";
  roomId: string | null;
  roomName: string | null;
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

export interface PublicGameState extends Omit<GameState, "subjects" | "players"> {
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
  | { type: "JOIN"; playerId: string; name: string; roomId: string; password?: string }
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