import { z } from "zod";
import { buzzerActionSchema, roomLimits } from "../game-types";
import type { GameModuleMeta } from "./contract";

export const buzzerConfigSchema = z.object({
  subjectIds: z
    .array(z.string())
    .min(roomLimits.minSubjects)
    .max(roomLimits.maxSubjects),
});

export type BuzzerConfig = z.infer<typeof buzzerConfigSchema>;

export const buzzerMeta: GameModuleMeta<BuzzerConfig> = {
  type: "buzzer",
  title: "Buzzer Trivia",
  description:
    "Fast-paced trivia. Buzz in first, answer against the clock, win the points.",
  minPlayers: roomLimits.minPlayers,
  maxPlayers: roomLimits.maxPlayers,
  configSchema: buzzerConfigSchema,
  actionSchema: buzzerActionSchema,
};
