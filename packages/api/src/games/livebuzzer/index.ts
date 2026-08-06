import { z } from "zod";
import {
  livebuzzerActionSchema,
  roomLimits,
  type BaseGameState,
  type BasePublicGameState,
} from "../../game-types";
import type { GameModuleMeta } from "../contract";

export const livebuzzerConfigSchema = z.object({
  buzzWindowMs: z.number().int().min(0).max(120000).default(15000),
  answerTimeMs: z.number().int().min(0).max(120000).default(20000),
  pointsPerCorrect: z.number().int().min(1).max(1000).default(10),
  penaltyPerWrong: z.number().int().min(0).max(1000).default(0),
  maxWrongPerRound: z.number().int().min(1).max(20).default(3),
  hostPlays: z.boolean().default(false),
});

export type LivebuzzerConfig = z.infer<typeof livebuzzerConfigSchema>;

export const BUZZ_COLLECTION_MS = 300;
export const MIN_REACTION_MS = 80;
export const LIVEBUZZER_INACTIVITY_MS = 30 * 60 * 1000;
export const LIVEBUZZER_FINISHED_CLEANUP_GRACE_MS = 60000;
export const LIVEBUZZER_MIN_PLAYERS = 2;

export type LivebuzzerPhase = "IDLE" | "ARMED" | "COLLECTING" | "LOCKED";

export interface LivebuzzerBuzz {
  playerId: string;
  reactionMs: number;
  arrivedAt: number;
}

export interface LivebuzzerRoundResult {
  round: number;
  playerId: string;
  playerName: string;
  correct: boolean;
  pointsAwarded: number;
  reactionMs: number;
  autoJudged: boolean;
  judgedAt: number;
}

export interface LivebuzzerState extends BaseGameState {
  config: LivebuzzerConfig;
  phase: LivebuzzerPhase;
  round: number;
  armedAt: number;
  timerExpiresAt: number;
  buzzes: LivebuzzerBuzz[];
  lockedPlayerId: string | null;
  lockedOutPlayerIds: string[];
  wrongAttempts: number;
  roundResults: LivebuzzerRoundResult[];
}

export interface LivebuzzerPublicState extends BasePublicGameState {
  config: LivebuzzerConfig;
  phase: LivebuzzerPhase;
  round: number;
  timerExpiresAt: number;
  buzzedPlayerIds: string[];
  lockedPlayerId: string | null;
  lockedReactionMs: number | null;
  lockedOutPlayerIds: string[];
  wrongAttempts: number;
  judgedCount: number;
  lastResult?: LivebuzzerRoundResult;
}

export const livebuzzerMeta: GameModuleMeta<LivebuzzerConfig> = {
  type: "livebuzzer",
  title: "Live Buzzer",
  description:
    "You read the questions out loud, the room races to buzz in. Winners are ranked by reaction time, not by who has the better Wi-Fi.",
  minPlayers: roomLimits.minPlayers,
  maxPlayers: roomLimits.maxPlayers,
  configSchema: livebuzzerConfigSchema,
  actionSchema: livebuzzerActionSchema,
};
