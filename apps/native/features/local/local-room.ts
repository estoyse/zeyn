import {
  LOCAL_PORT,
  encodeLocalCode,
  localGuestUrl,
  type LocalRoomAddress,
} from "@zeyn/api/local-code";

import type { ClientRoomState } from "@/features/game/hooks/useGameState";
import type { GameResultsData } from "@/features/games/types";

const NONCE_QUERY = "?r=";

export const LOCAL_LOOPBACK_HOST = "127.0.0.1";

export function localNonceToken(address: LocalRoomAddress): string {
  const url = localGuestUrl(address);
  return url.slice(url.indexOf(NONCE_QUERY) + NONCE_QUERY.length);
}

export function localRoomCode(address: LocalRoomAddress): string {
  return encodeLocalCode(address.ip, address.nonce, address.version);
}

export function localSocketUrl(host: string): string {
  return `ws://${host}:${LOCAL_PORT}/`;
}

export function localResults(state: ClientRoomState): GameResultsData {
  const roomId = state.gameId ?? "local";
  const excluded = new Set(state.nonScoringPlayerIds ?? []);

  return {
    game: {
      id: roomId,
      gameId: roomId,
      gameType: state.gameType,
      hostId: state.hostId ?? "",
      subjects: "[]",
      createdAt: new Date().toISOString(),
    },
    playerResults: Object.values(state.players)
      .filter(player => !excluded.has(player.id))
      .map(player => ({
        id: player.id,
        gameId: roomId,
        userId: player.id,
        playerName: player.name,
        score: player.score,
      })),
    subjects: [],
    questionResults: [],
  };
}
