import { Zap, Music2, Mic } from "lucide-react";
import { buzzerMeta, musicMeta, livebuzzerMeta } from "@zeyn/api/games";
import type { ClientGameModule } from "./types";
import { BuzzerCreateForm } from "./buzzer/BuzzerCreateForm";
import { BuzzerPlaying } from "./buzzer/BuzzerPlaying";
import { BuzzerResults } from "./buzzer/BuzzerResults";
import { MusicCreateForm } from "./music/MusicCreateForm";
import { MusicPlaying } from "./music/MusicPlaying";
import { MusicResults } from "./music/MusicResults";
import { LivebuzzerCreateForm } from "./livebuzzer/LivebuzzerCreateForm";
import { LivebuzzerPlaying } from "./livebuzzer/LivebuzzerPlaying";
import { LivebuzzerResults } from "./livebuzzer/LivebuzzerResults";

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

const livebuzzer: ClientGameModule = {
  type: "livebuzzer",
  meta: livebuzzerMeta,
  Icon: Mic,
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
