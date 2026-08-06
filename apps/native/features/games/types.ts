import type { ComponentType } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { ClientMessage } from "@zeyn/api/game-types";
import type { AppRouter } from "@zeyn/api/routers/index";
import type { ClientRoomState } from "@/features/game/hooks/useGameState";
import type { useGameRoom } from "@/features/game/hooks/useGameRoom";

export type GameRoomController = ReturnType<typeof useGameRoom>;

export interface GameRoomView {
  state: ClientRoomState | null;
  playerId: string;
  serverTimeOffset: number;
  isConnected: boolean;
  isSpectator: boolean;
  send: (message: ClientMessage) => void;
}

export type GameResultsData = NonNullable<
  inferRouterOutputs<AppRouter>["game"]["getResults"]
>;

export interface GamePlayViewProps {
  room: GameRoomView;
}

export interface GameResultsViewProps {
  results: GameResultsData;
  onBack: () => void;
}

export type GamePlayView = ComponentType<GamePlayViewProps>;
export type GameResultsView = ComponentType<GameResultsViewProps>;
