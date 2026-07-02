import type { MusicPublicState } from "@shaxsiy-oyin/api/games";
import type { Player } from "@shaxsiy-oyin/api/game-types";

export type MusicView = Omit<MusicPublicState, "players"> & {
  players: Record<string, Player>;
};
