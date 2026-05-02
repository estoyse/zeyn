import { useState, useEffect, useCallback, useRef } from "react";

// Mirroring the server types (ideally shared in a package)
export interface GameState {
  status: "WAITING" | "PLAYING" | "FINISHED";
  hostId: string | null;
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
}

export type ClientMessage =
  | { type: "JOIN"; playerId: string; name: string }
  | { type: "START"; playerId: string; subjectIds: string[] }
  | { type: "BUZZ"; playerId: string }
  | { type: "SUBMIT_ANSWER"; playerId: string; answer: string };

export function useGame(roomId: string, playerId: string, playerName: string) {
  const [state, setState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
    const wsUrl = serverUrl.replace(/^http/, "ws") + `/game/${roomId}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "JOIN", playerId, name: playerName }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "STATE_UPDATE") {
        setState(data.state);
      } else if (data.type === "ERROR") {
        setError(data.message);
      }
    };

    ws.onerror = () => {
      setError("WebSocket error");
    };

    ws.onclose = () => {
      setError("Connection closed");
    };

    return () => {
      ws.close();
    };
  }, [roomId, playerId, playerName]);

  const sendAction = useCallback((action: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }
  }, []);

  return { state, error, sendAction };
}
