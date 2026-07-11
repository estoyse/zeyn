import { Ionicons } from "@expo/vector-icons";
import { buzzerMeta, musicMeta, type GameModuleMeta } from "@zeyn/api/games";
import { createElement, type ComponentType } from "react";
import { withUniwind } from "uniwind";

import { BuzzerCreateForm } from "@/features/games/buzzer/BuzzerCreateForm";
import { BuzzerPlaying } from "@/features/games/buzzer/BuzzerPlaying";
import { BuzzerResults } from "@/features/games/buzzer/BuzzerResults";
import { MusicCreateForm } from "@/features/games/music/MusicCreateForm";
import { MusicPlaying } from "@/features/games/music/MusicPlaying";
import { MusicResults } from "@/features/games/music/MusicResults";
import type { GamePlayView, GameResultsView } from "@/features/games/types";

const StyledIonicons = withUniwind(Ionicons);

type IconProps = {
  size?: number;
  className?: string;
};

function BuzzerIcon(props: IconProps) {
  return createElement(StyledIonicons, { name: "flash", ...props });
}

function MusicIcon(props: IconProps) {
  return createElement(StyledIonicons, { name: "musical-notes", ...props });
}

export interface ClientGameModule {
  type: string;
  meta: GameModuleMeta;
  Icon: ComponentType<IconProps>;
  Create?: ComponentType;
  Playing?: GamePlayView;
  Results?: GameResultsView;
}

const buzzer: ClientGameModule = {
  type: "buzzer",
  meta: buzzerMeta,
  Icon: BuzzerIcon,
  Create: BuzzerCreateForm,
  Playing: BuzzerPlaying,
  Results: BuzzerResults,
};

const music: ClientGameModule = {
  type: "music",
  meta: musicMeta,
  Icon: MusicIcon,
  Create: MusicCreateForm,
  Playing: MusicPlaying,
  Results: MusicResults,
};

export const clientGames: Record<string, ClientGameModule> = {
  buzzer,
  music,
};

export function getClientGame(type: string): ClientGameModule | undefined {
  return clientGames[type];
}

export function listClientGames(): ClientGameModule[] {
  return Object.values(clientGames);
}
