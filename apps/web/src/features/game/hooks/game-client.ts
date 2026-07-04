import { useState, useCallback, useMemo, useEffect } from "react";
import { env } from "@zeyn/env/web";
import { useSocket } from "./useSocket";
import { useGameState } from "./useGameState";
import type { ClientMessage } from "@zeyn/api/game-types";

export function useGame(
  gameId: string,
  playerId: string,
  playerName: string,
  password?: string
) {
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const wsUrl = useMemo(() => {
    const base = env.VITE_SERVER_URL.replace(/\/$/, "").replace(/^http/, "ws");
    return `${base}/game/${gameId}/ws`;
  }, [gameId]);

  const handleGameStateError = useCallback((err: string, code?: string) => {
    setError(err);
    setErrorCode(code || null);
  }, []);

  const { state, serverTimeOffset, handleMessage, createJoinMessage } =
    useGameState({
      gameId,
      playerId,
      playerName,
      password,
      onError: handleGameStateError,
    });

  const handleSocketError = useCallback((err: string) => {
    setError(err);
  }, []);

  const terminal =
    state?.status === "FINISHED" ||
    errorCode === "NOT_FOUND" ||
    errorCode === "ALREADY_STARTED" ||
    errorCode === "ALREADY_FINISHED" ||
    errorCode === "UNAUTHORIZED";

  const { send, close, isConnecting, isConnected } = useSocket({
    url: wsUrl,
    onMessage: handleMessage,
    onError: handleSocketError,
    enabled: !!playerId && !terminal,
  });

  const join = useCallback(() => {
    const message = createJoinMessage();
    send(message);
  }, [createJoinMessage, send]);

  const sendAction = useCallback(
    (action: ClientMessage) => {
      send(action);
    },
    [send]
  );

  useEffect(() => {
    if (isConnected) {
      join();
    }
  }, [isConnected, join]);

  return {
    state,
    serverTimeOffset,
    error,
    errorCode,
    sendAction,
    isConnecting,
    isConnected,
    join,
  };
}
