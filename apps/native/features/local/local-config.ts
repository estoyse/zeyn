import { roomLimits } from "@zeyn/api/game-types";
import { livebuzzerConfigSchema, type LivebuzzerConfig } from "@zeyn/api/games";

export interface LocalRoomSetup {
  roomName: string;
  maxPlayers: number;
  config: LivebuzzerConfig;
}

export function encodeLocalSetup(setup: LocalRoomSetup): string {
  return encodeURIComponent(JSON.stringify(setup));
}

function parseSetupJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {}

  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export function decodeLocalSetup(
  raw: string | undefined,
  fallbackName: string
): LocalRoomSetup {
  const fallback: LocalRoomSetup = {
    roomName: fallbackName,
    maxPlayers: roomLimits.defaultMaxPlayers,
    config: livebuzzerConfigSchema.parse({}),
  };

  if (!raw) return fallback;

  const source = parseSetupJson(raw) as Partial<LocalRoomSetup> | null;
  if (!source || typeof source !== "object") return fallback;

  const config = livebuzzerConfigSchema.safeParse(source.config ?? {});
  const name =
    typeof source.roomName === "string" && source.roomName.trim()
      ? source.roomName.trim()
      : fallbackName;

  return {
    roomName: name,
    maxPlayers:
      typeof source.maxPlayers === "number"
        ? source.maxPlayers
        : roomLimits.defaultMaxPlayers,
    config: config.success ? config.data : fallback.config,
  };
}
