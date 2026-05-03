import { useRef, useCallback, useEffect, useState } from "react";
import type { ServerMessage } from "@shaxsiy-oyin/api/game-types";

interface UseSocketOptions {
  url: string;
  onMessage: (data: ServerMessage) => void;
  onOpen?: () => void;
  onError?: (error: string) => void;
  reconnectDelay?: number;
}

export function useSocket({
  url,
  onMessage,
  onOpen,
  onError,
  reconnectDelay = 3000,
}: UseSocketOptions) {
  const [isConnecting, setIsConnecting] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  
  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
  }, [onMessage, onOpen]);

  const connect = useCallback(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    setIsConnecting(true);

    ws.onopen = () => {
      onOpenRef.current?.();
    };
    
    ws.onmessage = (event) => {
      const data: ServerMessage = JSON.parse(event.data);
      onMessageRef.current(data);
    };

    ws.onerror = () => {
      onError?.("Connection error");
    };

    ws.onclose = () => {
      setIsConnecting(false);
      setIsConnecting(true);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, reconnectDelay);
    };
  }, [url, reconnectDelay, onError]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const close = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
  }, []);

  useEffect(() => {
    connect();
    return close;
  }, [connect, close]);

  return { send, close, isConnecting };
}