import { z } from "zod";
import {
  musicActionSchema,
  roomLimits,
  type BaseGameState,
  type BasePublicGameState,
} from "../game-types";
import type { GameModuleMeta } from "./contract";

export const musicConfigSchema = z.object({
  artistIds: z.array(z.string()).min(1).max(10),
});

export type MusicConfig = z.infer<typeof musicConfigSchema>;

export const musicGameConfig = {
  questionCount: 10,
  optionsPerQuestion: 3,
  countdownTimeMs: 3000,
  questionTimeMs: 20000,
  revealTimeMs: 6000,
  basePoints: 100,
  maxSpeedBonus: 100,
  streakBonusPerLevel: 25,
  maxStreakBonus: 100,
  minPlayers: 2,
  finishedCleanupGraceMs: 60000,
} as const;

export interface MusicQuestion {
  songId: string;
  previewUrl: string;
  correctTitle: string;
  artistName: string;
  options: string[];
  correctIndex: number;
}

export interface MusicPlayerAnswer {
  optionIndex: number;
  answeredAt: number;
  correct: boolean;
  pointsAwarded: number;
}

export interface MusicQuizState extends BaseGameState {
  artistIds: string[];
  questions: MusicQuestion[];
  currentQuestionIndex: number;
  phase: "COUNTDOWN" | "QUESTION" | "REVEAL";
  timerExpiresAt: number;
  answers: Record<string, MusicPlayerAnswer>;
  streaks: Record<string, number>;
}

export interface MusicPublicReveal {
  correctIndex: number;
  correctTitle: string;
  artistName: string;
  answers: Record<string, { optionIndex: number; correct: boolean; pointsAwarded: number }>;
}

export interface MusicPublicState extends BasePublicGameState {
  currentQuestionIndex: number;
  totalQuestions: number;
  phase: "COUNTDOWN" | "QUESTION" | "REVEAL";
  timerExpiresAt: number;
  answeredPlayerIds: string[];
  question?: { previewUrl: string; options: string[] };
  reveal?: MusicPublicReveal;
}

export const musicMeta: GameModuleMeta<MusicConfig> = {
  type: "music",
  title: "Music Quiz",
  description:
    "Listen to a clip and pick the right song from three options. Answer fast and keep a streak to score big.",
  minPlayers: roomLimits.minPlayers,
  maxPlayers: roomLimits.maxPlayers,
  configSchema: musicConfigSchema,
  actionSchema: musicActionSchema,
};
