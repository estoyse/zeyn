import type { GameMetaRegistry, GameModuleMeta } from "./contract";
import { buzzerMeta } from "./buzzer";
import { musicMeta } from "./music";
import { livebuzzerMeta } from "./livebuzzer";

export * from "./contract";
export * from "./buzzer";
export * from "./music";
export * from "./livebuzzer";

// The single source of truth for which game types exist, shared by the server
// and the web app. Adding a game type means adding its meta here (plus its
// server engine and client views, registered in their own layers).
export const gameMetaRegistry = {
  buzzer: buzzerMeta,
  music: musicMeta,
  livebuzzer: livebuzzerMeta,
} satisfies GameMetaRegistry;

export type GameType = keyof typeof gameMetaRegistry;

export function getGameMeta(type: string): GameModuleMeta | undefined {
  return gameMetaRegistry[type as GameType];
}
