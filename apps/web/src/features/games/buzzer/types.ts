import type { PublicGameState, Player } from "@zeyn/api/game-types";

export type BuzzerView = Omit<PublicGameState, "players"> & {
  players: Record<string, Player>;
};
