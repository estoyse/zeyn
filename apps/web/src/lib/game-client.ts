import { useState, useCallback, useMemo, useEffect } from "react";
import { useSocket } from "./useSocket";
import { useGameState } from "./useGameState";
import type { ClientMessage } from "@shaxsiy-oyin/api/game-types";

export function useGame(
  gameId: string,
  playerId: string,
  playerName: string,
  password?: string
) {
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const wsUrl = useMemo(() => {
    // Use relative path - Vite proxy will handle it
    return `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
      window.location.host
    }/game/${gameId}/ws`;
  }, [gameId]);

  const handleGameStateError = useCallback((err: string, code?: string) => {
    setError(err);
    setErrorCode(code || null);
  }, []);

  const { state, handleMessage, createJoinMessage } = useGameState({
    gameId,
    playerId,
    playerName,
    password,
    onError: handleGameStateError,
  });

  const handleSocketError = useCallback((err: string) => {
    setError(err);
  }, []);

  const { send, close, isConnecting, isConnected } = useSocket({
    url: wsUrl,
    onMessage: handleMessage,
    onError: handleSocketError,
    enabled: !!playerId,
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

  // Join once connected
  useEffect(() => {
    if (isConnected) {
      join();
    }
  }, [isConnected, join]);

  return {
    state,
    error,
    errorCode,
    sendAction,
    isConnecting,
    isConnected,
    join,
  };
}
