import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { GameModuleMeta } from "@shaxsiy-oyin/api/games";
import type { useGameRoom } from "@/features/game/hooks/useGameRoom";

export type GameRoomController = ReturnType<typeof useGameRoom>;

export interface GamePlayViewProps {
  room: GameRoomController;
}

export interface ClientGameModule {
  type: string;
  meta: GameModuleMeta;
  Icon: LucideIcon;
  Create: ComponentType;
  Playing: ComponentType<GamePlayViewProps>;
}
