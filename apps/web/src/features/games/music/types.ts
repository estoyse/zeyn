import type { MusicPublicState } from "@zeyn/api/games";
import type { Player } from "@zeyn/api/game-types";

export type MusicView = Omit<MusicPublicState, "players"> & {
  players: Record<string, Player>;
};
