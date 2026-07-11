import type { ComponentType } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zeyn/api/routers/index";
import type { useGameRoom } from "@/features/game/hooks/useGameRoom";

export type GameRoomController = ReturnType<typeof useGameRoom>;

export type GameResultsData = NonNullable<
  inferRouterOutputs<AppRouter>["game"]["getResults"]
>;

export interface GamePlayViewProps {
  room: GameRoomController;
}

export interface GameResultsViewProps {
  results: GameResultsData;
  onBack: () => void;
}

export type GamePlayView = ComponentType<GamePlayViewProps>;
export type GameResultsView = ComponentType<GameResultsViewProps>;
