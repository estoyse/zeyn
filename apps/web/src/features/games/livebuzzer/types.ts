import type { LivebuzzerPublicState } from "@zeyn/api/games";
import type { Player } from "@zeyn/api/game-types";

export type LivebuzzerView = Omit<LivebuzzerPublicState, "players"> & {
  players: Record<string, Player>;
};
