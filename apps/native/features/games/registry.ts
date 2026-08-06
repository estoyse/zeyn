import Ionicons from "@expo/vector-icons/Ionicons";
import {
  buzzerMeta,
  livebuzzerMeta,
  musicMeta,
  type GameModuleMeta,
} from "@zeyn/api/games";
import { createElement, type ComponentType } from "react";
import { withUniwind } from "uniwind";

import { BuzzerCreateForm } from "@/features/games/buzzer/BuzzerCreateForm";
import { BuzzerPlaying } from "@/features/games/buzzer/BuzzerPlaying";
import { BuzzerResults } from "@/features/games/buzzer/BuzzerResults";
import { LivebuzzerCreateForm } from "@/features/games/livebuzzer/LivebuzzerCreateForm";
import { LivebuzzerPlaying } from "@/features/games/livebuzzer/LivebuzzerPlaying";
import { LivebuzzerResults } from "@/features/games/livebuzzer/LivebuzzerResults";
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

function LivebuzzerIcon(props: IconProps) {
  return createElement(StyledIonicons, { name: "mic", ...props });
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

const livebuzzer: ClientGameModule = {
  type: "livebuzzer",
  meta: livebuzzerMeta,
  Icon: LivebuzzerIcon,
  Create: LivebuzzerCreateForm,
  Playing: LivebuzzerPlaying,
  Results: LivebuzzerResults,
};

export const clientGames: Record<string, ClientGameModule> = {
  buzzer,
  music,
  livebuzzer,
};

export function getClientGame(type: string): ClientGameModule | undefined {
  return clientGames[type];
}

export function listClientGames(): ClientGameModule[] {
  return Object.values(clientGames);
}
