import { useRef, useCallback, useEffect, useState } from "react";
import type { ServerMessage } from "@shaxsiy-oyin/api/game-types";

interface UseSocketOptions {
  url: string;
  onMessage: (data: ServerMessage) => void;
  onOpen?: () => void;
  onError?: (error: string) => void;
  reconnectDelay?: number;
  maxRetries?: number;
  enabled?: boolean;
}

export function useSocket({
  url,
  onMessage,
  onOpen,
  onError,
  reconnectDelay = 3000,
  maxRetries = 5,
  enabled = true,
}: UseSocketOptions) {
  const [isConnecting, setIsConnecting] = useState(enabled);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onErrorRef.current = onError;
  }, [onMessage, onOpen, onError]);

  const connect = useCallback(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    setIsConnecting(true);
    setIsConnected(false);
    setIsReconnecting(false);

    ws.onopen = () => {
      retryCountRef.current = 0;
      setIsConnecting(false);
      setIsConnected(true);
      onOpenRef.current?.();
    };

    ws.onmessage = event => {
      const data: ServerMessage = JSON.parse(event.data);
      onMessageRef.current(data);
    };

    ws.onerror = e => {};

    ws.onclose = e => {
      setIsConnecting(false);
      setIsConnected(false);

      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setIsReconnecting(true);
        const delay = reconnectDelay * retryCountRef.current;
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, delay);
      } else {
        setIsReconnecting(false);
        onErrorRef.current?.("Connection failed after max retries");
      }
    };
  }, [url, reconnectDelay, maxRetries]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const close = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    retryCountRef.current = maxRetries;
    wsRef.current?.close();
    setIsConnected(false);
    setIsConnecting(false);
  }, [maxRetries]);

  useEffect(() => {
    if (enabled) {
      connect();
      return close;
    } else {
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, [enabled, connect, close]);

  return { send, close, isConnecting, isConnected, isReconnecting };
}
