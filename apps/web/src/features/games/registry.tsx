import { Zap } from "lucide-react";
import { buzzerMeta } from "@shaxsiy-oyin/api/games";
import type { ClientGameModule } from "./types";
import { BuzzerCreateForm } from "./buzzer/BuzzerCreateForm";
import { BuzzerPlaying } from "./buzzer/BuzzerPlaying";
import { BuzzerResults } from "./buzzer/BuzzerResults";

const buzzer: ClientGameModule = {
  type: "buzzer",
  meta: buzzerMeta,
  Icon: Zap,
  Create: BuzzerCreateForm,
  Playing: BuzzerPlaying,
  Results: BuzzerResults,
};

export const clientGames: Record<string, ClientGameModule> = {
  buzzer,
};

export function getClientGame(type: string): ClientGameModule | undefined {
  return clientGames[type];
}

export function listClientGames(): ClientGameModule[] {
  return Object.values(clientGames);
}
