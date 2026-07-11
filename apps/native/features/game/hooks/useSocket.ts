import { useRef, useCallback, useEffect, useState } from "react";
import type { ServerMessage } from "@zeyn/api/game-types";

type NativeWebSocketCtor = {
  new (
    url: string,
    protocols?: string | string[],
    options?: { headers?: Record<string, string> }
  ): WebSocket;
};

const NativeWebSocket = WebSocket as unknown as NativeWebSocketCtor;

interface UseSocketOptions {
  url: string;
  headers?: Record<string, string>;
  onMessage: (data: ServerMessage) => void;
  onOpen?: () => void;
  onError?: (error: string) => void;
  reconnectDelay?: number;
  maxRetries?: number;
  enabled?: boolean;
}

export function useSocket({
  url,
  headers,
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
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onErrorRef = useRef(onError);
  const headersRef = useRef(headers);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onErrorRef.current = onError;
    headersRef.current = headers;
  }, [onMessage, onOpen, onError, headers]);

  const connect = useCallback(() => {
    const currentHeaders = headersRef.current;
    const ws = currentHeaders
      ? new NativeWebSocket(url, undefined, { headers: currentHeaders })
      : new WebSocket(url);
    wsRef.current = ws;
    setIsConnecting(true);
    setIsConnected(false);
    setIsReconnecting(false);

    ws.onopen = () => {
      setIsConnecting(false);
      setIsConnected(true);
      stableTimerRef.current = setTimeout(() => {
        retryCountRef.current = 0;
      }, 5000);
      onOpenRef.current?.();
    };

    ws.onmessage = event => {
      const data: ServerMessage = JSON.parse(event.data);
      onMessageRef.current(data);
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      if (stableTimerRef.current) {
        clearTimeout(stableTimerRef.current);
        stableTimerRef.current = null;
      }
      setIsConnecting(false);
      setIsConnected(false);

      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setIsReconnecting(true);
        const delay = reconnectDelay * retryCountRef.current;
        reconnectTimeoutRef.current = setTimeout(() => {
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
    if (stableTimerRef.current) {
      clearTimeout(stableTimerRef.current);
      stableTimerRef.current = null;
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
