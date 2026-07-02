import type { PublicGameState, Player } from "@shaxsiy-oyin/api/game-types";

export type BuzzerView = Omit<PublicGameState, "players"> & {
  players: Record<string, Player>;
};
