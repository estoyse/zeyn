import { useState, useCallback, useMemo } from "react";
import { useSocket } from "./useSocket";
import { useGameState } from "./useGameState";
import type { GameState, ClientMessage } from "@shaxsiy-oyin/api/game-types";

export function useGame(roomId: string, playerId: string, playerName: string, password?: string) {
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const wsUrl = useMemo(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
    return serverUrl.replace(/^http/, "ws") + `/game/${roomId}/ws`;
  }, [roomId]);

  const { state, handleMessage, createJoinMessage } = useGameState({
    roomId,
    playerId,
    playerName,
    password,
    onError: (err, code) => {
      setError(err);
      setErrorCode(code || null);
    },
  });

  const { send, close, isConnecting } = useSocket({
    url: wsUrl,
    onMessage: handleMessage,
    onError: (err) => setError(err),
  });

  const sendAction = useCallback((action: ClientMessage) => {
    send(action);
  }, [send]);

  const join = useCallback(() => {
    const message = createJoinMessage();
    send(message);
  }, [createJoinMessage, send]);

  const handleOpen = useCallback(() => {
    join();
  }, [join]);

  return { 
    state, 
    error, 
    errorCode, 
    sendAction, 
    isConnecting,
    join,
  };
}