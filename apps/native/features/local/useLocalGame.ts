import type { ClientMessage, ServerMessage } from "@zeyn/api/game-types";
import { LOCAL_PROTOCOL_VERSION } from "@zeyn/local-host/protocol";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ClientRoomState } from "@/features/game/hooks/useGameState";
import { useSocket } from "@/features/game/hooks/useSocket";

const CONNECT_TIMEOUT_MS = 10000;

export const LOCAL_CLIENT_ERROR = {
  CONNECT_TIMEOUT: "CONNECT_TIMEOUT",
  CONNECTION_LOST: "CONNECTION_LOST",
  ROOM_FULL: "ROOM_FULL",
} as const;

export type LocalGameStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error";

interface LocalWelcomeMessage {
  type: "WELCOME";
  v: number;
  playerId: string;
}

type LocalServerMessage = ServerMessage | LocalWelcomeMessage;

interface UseLocalGameOptions {
  url: string;
  nonce: string;
  deviceId: string;
  name: string;
  enabled: boolean;
}

export function useLocalGame({
  url,
  nonce,
  deviceId,
  name,
  enabled,
}: UseLocalGameOptions) {
  const [state, setState] = useState<ClientRoomState | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [playerId, setPlayerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [terminal, setTerminal] = useState(false);

  const playerIdRef = useRef("");
  const sendRef = useRef<(data: unknown) => void>(() => {});

  const handleMessage = useCallback((data: ServerMessage) => {
    const message = data as unknown as LocalServerMessage;

    if (message.type === "WELCOME") {
      playerIdRef.current = message.playerId;
      setPlayerId(message.playerId);
      setError(null);
      setErrorCode(null);
      return;
    }

    if (message.type === "STATE_UPDATE") {
      setServerTimeOffset(message.serverTime - Date.now());
      const next = message.state as ClientRoomState;
      setState(prev =>
        prev
          ? { ...next, players: { ...prev.players, ...next.players } }
          : next
      );
      return;
    }

    if (message.type === "ERROR") {
      const joined = playerIdRef.current !== "";
      setError(message.message);
      setErrorCode(
        message.code ?? (joined ? null : LOCAL_CLIENT_ERROR.ROOM_FULL)
      );
      if (!joined) setTerminal(true);
    }
  }, []);

  const handleOpen = useCallback(() => {
    sendRef.current({
      type: "HELLO",
      v: LOCAL_PROTOCOL_VERSION,
      nonce,
      deviceId,
      name,
    });
  }, [nonce, deviceId, name]);

  const handleSocketError = useCallback((message: string) => {
    setError(message);
    setErrorCode(
      playerIdRef.current
        ? LOCAL_CLIENT_ERROR.CONNECTION_LOST
        : LOCAL_CLIENT_ERROR.CONNECT_TIMEOUT
    );
    setTerminal(true);
  }, []);

  const { send, close, isConnecting, isConnected } = useSocket({
    url,
    onMessage: handleMessage,
    onOpen: handleOpen,
    onError: handleSocketError,
    enabled: enabled && !terminal,
  });

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  useEffect(() => {
    if (!enabled || terminal || playerId) return;

    const handle = setTimeout(() => {
      setError("Local room did not answer");
      setErrorCode(LOCAL_CLIENT_ERROR.CONNECT_TIMEOUT);
      setTerminal(true);
    }, CONNECT_TIMEOUT_MS);

    return () => clearTimeout(handle);
  }, [enabled, terminal, playerId]);

  const sendAction = useCallback(
    (action: ClientMessage) => {
      send(action);
    },
    [send]
  );

  const status: LocalGameStatus = terminal
    ? "error"
    : !enabled
      ? "idle"
      : playerId && state
        ? "connected"
        : "connecting";

  return {
    state,
    playerId,
    serverTimeOffset,
    sendAction,
    close,
    status,
    isConnecting,
    isConnected,
    error,
    errorCode,
  };
}
