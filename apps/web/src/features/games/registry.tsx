import { Zap, Music2 } from "lucide-react";
import { buzzerMeta, musicMeta } from "@shaxsiy-oyin/api/games";
import type { ClientGameModule } from "./types";
import { BuzzerCreateForm } from "./buzzer/BuzzerCreateForm";
import { BuzzerPlaying } from "./buzzer/BuzzerPlaying";
import { BuzzerResults } from "./buzzer/BuzzerResults";
import { MusicCreateForm } from "./music/MusicCreateForm";
import { MusicPlaying } from "./music/MusicPlaying";
import { MusicResults } from "./music/MusicResults";

const buzzer: ClientGameModule = {
  type: "buzzer",
  meta: buzzerMeta,
  Icon: Zap,
  Create: BuzzerCreateForm,
  Playing: BuzzerPlaying,
  Results: BuzzerResults,
};

const music: ClientGameModule = {
  type: "music",
  meta: musicMeta,
  Icon: Music2,
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
