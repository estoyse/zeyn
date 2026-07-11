import { useState, useCallback, useMemo, useEffect } from "react";
import { env } from "@zeyn/env/native";
import { useSocket } from "./useSocket";
import { useGameState } from "./useGameState";
import type { ClientMessage } from "@zeyn/api/game-types";

interface UseGameOptions {
  gameId: string;
  playerId: string;
  playerName: string;
  password?: string;
  guestToken?: string;
  cookie?: string;
  spectate: boolean;
  connect: boolean;
}

export function useGame({
  gameId,
  playerId,
  playerName,
  password,
  guestToken,
  cookie,
  spectate,
  connect,
}: UseGameOptions) {
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const wsUrl = useMemo(() => {
    const base = env.EXPO_PUBLIC_SERVER_URL.replace(/\/$/, "").replace(
      /^http/,
      "ws"
    );
    const url = `${base}/game/${gameId}/ws`;
    if (guestToken) return `${url}?guest=${encodeURIComponent(guestToken)}`;
    if (spectate) return `${url}?spectate=1`;
    return url;
  }, [gameId, guestToken, spectate]);

  const headers = useMemo(
    () => (cookie ? { Cookie: cookie } : undefined),
    [cookie]
  );

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
    errorCode === "UNAUTHORIZED" ||
    errorCode === "GUESTS_NOT_ALLOWED";

  const { send, close, isConnecting, isConnected } = useSocket({
    url: wsUrl,
    headers,
    onMessage: handleMessage,
    onError: handleSocketError,
    enabled: connect && !terminal,
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
    if (isConnected && playerId && !spectate) {
      join();
    }
  }, [isConnected, join, playerId, spectate]);

  return {
    state,
    serverTimeOffset,
    error,
    errorCode,
    sendAction,
    isConnecting,
    isConnected,
    close,
    join,
  };
}
