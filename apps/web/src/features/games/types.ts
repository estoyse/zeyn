import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import type { GameModuleMeta } from "@zeyn/api/games";
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

export interface ClientGameModule {
  type: string;
  meta: GameModuleMeta;
  Icon: LucideIcon;
  Create: ComponentType;
  Playing: ComponentType<GamePlayViewProps>;
  Results: ComponentType<GameResultsViewProps>;
}
