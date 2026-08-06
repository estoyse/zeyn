import { roomLimits } from "@zeyn/api/game-types";
import { z } from "zod";

type Translate = (key: string, options?: Record<string, unknown>) => string;

const MIN_ARTISTS = 1;
const MAX_ARTISTS = 10;

function generalRoomShape(t: Translate) {
  return {
    name: z
      .string()
      .trim()
      .min(
        roomLimits.nameMinLength,
        t("create.errors.nameTooShort", { count: roomLimits.nameMinLength }),
      )
      .max(roomLimits.nameMaxLength),
    maxPlayers: z
      .number()
      .min(
        roomLimits.minPlayers,
        t("create.errors.playersRange", {
          min: roomLimits.minPlayers,
          max: roomLimits.maxPlayers,
        }),
      )
      .max(
        roomLimits.maxPlayers,
        t("create.errors.playersRange", {
          min: roomLimits.minPlayers,
          max: roomLimits.maxPlayers,
        }),
      ),
    isPublic: z.boolean(),
    password: z.string(),
    allowGuests: z.boolean(),
  };
}

export function createBuzzerRoomSchema(t: Translate) {
  return z.object({
    ...generalRoomShape(t),
    subjectIds: z
      .array(z.string())
      .min(
        roomLimits.minSubjects,
        t("create.errors.subjectsRange", {
          min: roomLimits.minSubjects,
          max: roomLimits.maxSubjects,
        }),
      )
      .max(
        roomLimits.maxSubjects,
        t("create.errors.subjectsRange", {
          min: roomLimits.minSubjects,
          max: roomLimits.maxSubjects,
        }),
      ),
  });
}

export function createMusicRoomSchema(t: Translate) {
  return z.object({
    ...generalRoomShape(t),
    artistIds: z
      .array(z.string())
      .min(
        MIN_ARTISTS,
        t("create.errors.artistsRange", { min: MIN_ARTISTS, max: MAX_ARTISTS }),
      )
      .max(
        MAX_ARTISTS,
        t("create.errors.artistsRange", { min: MIN_ARTISTS, max: MAX_ARTISTS }),
      ),
  });
}

export function createLivebuzzerRoomSchema(t: Translate) {
  return z.object({
    ...generalRoomShape(t),
    buzzWindowMs: z.number(),
    answerTimeMs: z.number(),
    pointsPerCorrect: z.number(),
    penaltyPerWrong: z.number(),
    maxWrongPerRound: z.number(),
    hostPlays: z.boolean(),
  });
}
