import { useState, useCallback } from "react";
import type { GameState, ClientMessage } from "@shaxsiy-oyin/api/game-types";

interface UseGameStateOptions {
  roomId: string;
  playerId: string;
  playerName: string;
  password?: string;
  onStateUpdate?: (state: GameState) => void;
  onError?: (error: string, code?: string) => void;
}

export function useGameState({
  roomId,
  playerId,
  playerName,
  password,
  onStateUpdate,
  onError,
}: UseGameStateOptions) {
  const [state, setState] = useState<GameState | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  const handleMessage = useCallback((data: unknown) => {
    const message = data as { type: string; state?: GameState; serverTime?: number; message?: string; code?: string };
    
    if (message.type === "STATE_UPDATE") {
      if (message.serverTime) {
        setServerTimeOffset(message.serverTime - Date.now());
      }
      if (message.state) {
        setState(message.state);
        onStateUpdate?.(message.state);
      }
    } else if (message.type === "ERROR") {
      onError?.(message.message || "Unknown error", message.code);
    }
  }, [onStateUpdate, onError]);

  const createJoinMessage = useCallback((): ClientMessage => ({
    type: "JOIN",
    playerId,
    name: playerName,
    roomId,
    password,
  }), [playerId, playerName, roomId, password]);

  const adjustedState = state ? {
    ...state,
    activeQuestionState: state.activeQuestionState ? {
      ...state.activeQuestionState,
      timerExpiresAt: state.activeQuestionState.timerExpiresAt - serverTimeOffset,
    } : null,
  } : null;

  return {
    state: adjustedState,
    handleMessage,
    createJoinMessage,
    serverTimeOffset,
  };
}