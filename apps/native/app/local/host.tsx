import { router, useLocalSearchParams, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScopedTheme } from "uniwind";

import { ConnectingView } from "@/features/game/components/ConnectingView";
import { FocusLayout } from "@/features/game/components/FocusLayout";
import { FocusTopBar } from "@/features/game/components/FocusTopBar";
import { GameFxProvider } from "@/features/game/components/GameFxProvider";
import { LoadingView } from "@/features/game/components/LoadingView";
import type { GameRoomView } from "@/features/games/types";
import { LocalErrorView } from "@/features/local/components/LocalErrorView";
import { LocalGameSurface } from "@/features/local/components/LocalGameSurface";
import { LocalRoomHero } from "@/features/local/components/LocalRoomHero";
import { decodeLocalSetup } from "@/features/local/local-config";
import { localErrorCopy } from "@/features/local/local-errors";
import { loadLocalPlayerName } from "@/features/local/local-identity";
import {
  LOCAL_LOOPBACK_HOST,
  localSocketUrl,
} from "@/features/local/local-room";
import { useLocalGame } from "@/features/local/useLocalGame";
import { useLocalHost } from "@/features/local/useLocalHost";
import { authClient } from "@/lib/auth-client";

export default function LocalHostScreen() {
  return (
    <ScopedTheme theme="arcade">
      <GameFxProvider>
        <LocalHostRoom />
      </GameFxProvider>
    </ScopedTheme>
  );
}

function LocalHostRoom() {
  const { t } = useTranslation("game");
  const params = useLocalSearchParams<{ setup?: string }>();
  const { data: session } = authClient.useSession();
  const [storedName] = useState(loadLocalPlayerName);

  const setup = useMemo(
    () => decodeLocalSetup(params.setup, t("local.host.roomName")),
    [params.setup, t]
  );

  const hostName =
    session?.user?.name || storedName || t("local.host.defaultName");

  const {
    room,
    status: hostStatus,
    error: hostError,
  } = useLocalHost({
    roomName: setup.roomName,
    maxPlayers: setup.maxPlayers,
    config: setup.config,
  });

  const client = useLocalGame({
    url: localSocketUrl(LOCAL_LOOPBACK_HOST),
    nonce: room?.nonce ?? "",
    deviceId: room?.hostDeviceId ?? "",
    name: hostName,
    enabled: hostStatus === "ready" && !!room,
  });

  const view = useMemo<GameRoomView>(
    () => ({
      state: client.state,
      playerId: client.playerId,
      serverTimeOffset: client.serverTimeOffset,
      isConnected: client.isConnected,
      isSpectator: false,
      send: client.sendAction,
    }),
    [
      client.state,
      client.playerId,
      client.serverTimeOffset,
      client.isConnected,
      client.sendAction,
    ]
  );

  const leave = () => router.replace("/(tabs)/home" as Href);

  if (hostStatus === "error") {
    return (
      <FocusLayout header={<FocusTopBar onLeave={leave} />}>
        <LocalErrorView
          message={t("local.errors.hostFailed")}
          detail={hostError}
          hints={[t("local.errors.hostWifiHint")]}
          actionLabel={t("local.errors.back")}
          onAction={leave}
        />
      </FocusLayout>
    );
  }

  if (client.status === "error") {
    const copy = localErrorCopy(t, client.errorCode);
    return (
      <FocusLayout header={<FocusTopBar onLeave={leave} />}>
        <LocalErrorView
          message={copy.message}
          detail={client.error}
          actionLabel={t("local.errors.back")}
          onAction={leave}
        />
      </FocusLayout>
    );
  }

  if (!room) {
    return (
      <FocusLayout header={<FocusTopBar onLeave={leave} />}>
        <LoadingView message="local.host.starting" />
      </FocusLayout>
    );
  }

  if (!client.state) {
    return (
      <FocusLayout header={<FocusTopBar onLeave={leave} />}>
        <ConnectingView />
      </FocusLayout>
    );
  }

  return (
    <LocalGameSurface
      room={view}
      code={room.roomCode}
      hero={
        <LocalRoomHero
          code={room.roomCode}
          ip={room.ip}
          guestUrl={room.guestUrl}
        />
      }
      onLeave={leave}
    />
  );
}
