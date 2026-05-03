import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// Mirroring the server types (ideally shared in a package)
export interface GameState {
  status: "WAITING" | "PLAYING" | "FINISHED";
  roomId: string | null;
  roomName: string | null;
  hostId: string | null;
  maxPlayers: number;
  isPublic: boolean;
  hasPassword: boolean;
  players: Record<string, { id: string; name: string; score: number; connected: boolean }>;
  subjects: any[];
  currentSubjectIndex: number;
  currentQuestionIndex: number;
  phase: "SUBJECT_REVEAL" | "ACTIVE" | "ANSWERING" | "REVEALED";
  activeQuestionState: {
    buzzedPlayerId: string | null;
    wrongAttempts: number;
    playersWhoAttempted: string[];
    timerExpiresAt: number;
  } | null;
  questionResults: any[];
}

export type ClientMessage =
  | { type: "JOIN"; playerId: string; name: string; roomId: string; password?: string }
  | { type: "START"; playerId: string; subjectIds: string[] }
  | { type: "BUZZ"; playerId: string }
  | { type: "SUBMIT_ANSWER"; playerId: string; answer: string };

export function useGame(roomId: string, playerId: string, playerName: string, password?: string) {
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!playerId || !playerName) return;

    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
    const wsUrl = serverUrl.replace(/^http/, "ws") + `/game/${roomId}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "JOIN", playerId, name: playerName, roomId, password }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "STATE_UPDATE") {
        if (data.serverTime) {
          setServerTimeOffset(data.serverTime - Date.now());
        }
        setState(data.state);
        setError(null);
        setErrorCode(null);
      } else if (data.type === "ERROR") {
        setError(data.message);
        setErrorCode(data.code);
      }
    };

    ws.onerror = () => {
      setError("WebSocket error");
    };

    ws.onclose = () => {
      // Logic handled by DO closure
    };

    return () => {
      ws.close();
    };
  }, [roomId, playerId, playerName, password]);

  const sendAction = useCallback((action: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }
  }, []);

  const adjustedState = useMemo(() => {
    if (!state || !state.activeQuestionState) return state;
    return {
      ...state,
      activeQuestionState: {
        ...state.activeQuestionState,
        // Adjust the server timestamp to be relative to the client's clock
        timerExpiresAt: state.activeQuestionState.timerExpiresAt - serverTimeOffset
      }
    };
  }, [state, serverTimeOffset]);

  return { state: adjustedState, error, errorCode, sendAction };
}
