import { useState, useCallback } from "react";
import type {
  BasePublicGameState,
  ClientMessage,
  Player,
} from "@shaxsiy-oyin/api/game-types";

export type ClientRoomState = Omit<BasePublicGameState, "players"> & {
  players: Record<string, Player>;
};

interface UseGameStateOptions {
  gameId: string;
  playerId: string;
  playerName: string;
  password?: string;
  onError?: (error: string, code?: string) => void;
}

export function useGameState({
  gameId,
  playerId,
  playerName,
  password,
  onError,
}: UseGameStateOptions) {
  const [state, setState] = useState<ClientRoomState | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  const handleMessage = useCallback(
    (data: unknown) => {
      const message = data as {
        type: string;
        state?: ClientRoomState;
        serverTime?: number;
        message?: string;
        code?: string;
      };

      if (message.type === "STATE_UPDATE") {
        if (message.serverTime) {
          setServerTimeOffset(message.serverTime - Date.now());
        }
        if (message.state) {
          setState(prev =>
            prev
              ? {
                  ...message.state!,
                  players: {
                    ...prev.players,
                    ...message.state!.players,
                  },
                }
              : message.state!
          );
        }
      } else if (message.type === "ERROR") {
        onError?.(message.message || "Unknown error", message.code);
      }
    },
    [onError]
  );

  const createJoinMessage = useCallback(
    (): ClientMessage => ({
      type: "JOIN",
      playerId,
      name: playerName,
      gameId,
      password,
    }),
    [playerId, playerName, gameId, password]
  );

  return { state, serverTimeOffset, handleMessage, createJoinMessage };
}
