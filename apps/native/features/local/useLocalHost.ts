import {
  LOCAL_CODE_VERSION,
  LOCAL_PORT,
  generateLocalNonce,
  localGuestUrl,
  type LocalRoomAddress,
} from "@zeyn/api/local-code";
import type { LivebuzzerConfig } from "@zeyn/api/games";
import { LocalGameHost } from "@zeyn/local-host";
import { useKeepAwake } from "expo-keep-awake";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { loadLocalDeviceId } from "./local-identity";
import { localNonceToken, localRoomCode } from "./local-room";
import {
  createLocalListener,
  createRandomBytes,
  createRnTimers,
  getLanIpAddress,
} from "./transport";

export type LocalHostStatus = "starting" | "ready" | "error";

export interface LocalHostRoom {
  ip: string;
  port: number;
  roomCode: string;
  guestUrl: string;
  nonce: string;
  hostDeviceId: string;
}

interface UseLocalHostOptions {
  roomName: string;
  maxPlayers: number;
  config: Partial<LivebuzzerConfig>;
}

export function useLocalHost({
  roomName,
  maxPlayers,
  config,
}: UseLocalHostOptions) {
  useKeepAwake();

  const [room, setRoom] = useState<LocalHostRoom | null>(null);
  const [status, setStatus] = useState<LocalHostStatus>("starting");
  const [error, setError] = useState<string | null>(null);

  const optionsRef = useRef({ roomName, maxPlayers, config });
  const hostRef = useRef<LocalGameHost | null>(null);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const ip = await getLanIpAddress();
        if (cancelled) return;

        const randomBytes = createRandomBytes();
        const address: LocalRoomAddress = {
          version: LOCAL_CODE_VERSION,
          ip,
          nonce: generateLocalNonce(randomBytes),
        };
        const nonce = localNonceToken(address);
        const hostDeviceId = loadLocalDeviceId();
        const options = optionsRef.current;

        const listener = createLocalListener(LOCAL_PORT, {
          onListening: () => {
            if (!cancelled) setStatus("ready");
          },
          onServerError: serverError => {
            if (cancelled) return;
            setError(String(serverError));
            setStatus("error");
          },
        });

        const host = new LocalGameHost({
          listener,
          timers: createRnTimers(),
          now: Date.now,
          nonce,
          hostDeviceId,
          roomId: localRoomCode(address),
          roomName: options.roomName,
          maxPlayers: options.maxPlayers,
          config: options.config,
        });

        if (cancelled) {
          host.stop();
          return;
        }

        hostRef.current = host;
        setRoom({
          ip,
          port: LOCAL_PORT,
          roomCode: localRoomCode(address),
          guestUrl: localGuestUrl(address),
          nonce,
          hostDeviceId,
        });
      } catch (startError) {
        if (cancelled) return;
        setError(
          startError instanceof Error ? startError.message : String(startError)
        );
        setStatus("error");
      }
    };

    void start();

    return () => {
      cancelled = true;
      hostRef.current?.stop();
      hostRef.current = null;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", next => {
      if (next === "active") hostRef.current?.resume();
    });

    return () => subscription.remove();
  }, []);

  return { room, status, error };
}
