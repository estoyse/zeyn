import { useState, useCallback } from "react";
import type { GameState, ClientMessage, PublicGameState } from "@shaxsiy-oyin/api/game-types";

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
  const [state, setState] = useState<PublicGameState | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  const handleMessage = useCallback((data: unknown) => {
    const message = data as { type: string; state?: PublicGameState; serverTime?: number; message?: string; code?: string };
    
    if (message.type === "STATE_UPDATE") {
      if (message.serverTime) {
        setServerTimeOffset(message.serverTime - Date.now());
      }
      if (message.state) {
        setState(prevState => {
          const newState = prevState ? {
            ...message.state!,
            players: {
              ...(prevState.players || {}),
              ...(message.state!.players || {})
            }
          } : message.state!;

          // Trigger callback with merged state
          onStateUpdate?.(newState as any);
          return newState;
        });
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
    ...(state as any),
    activeQuestionState: state.activeQuestionState ? {
      ...state.activeQuestionState,
      timerExpiresAt: state.activeQuestionState.timerExpiresAt - serverTimeOffset,
    } : null,
  } : null;

  return {
    state: adjustedState as any,
    handleMessage,
    createJoinMessage,
    serverTimeOffset,
  };
}