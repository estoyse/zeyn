import Ionicons from "@expo/vector-icons/Ionicons";
import {
  formatLocalCode,
  parseLocalCode,
  type LocalRoomAddress,
} from "@zeyn/api/local-code";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Card, Input, TextField } from "heroui-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ScopedTheme, withUniwind } from "uniwind";

import { Button, Heading, Text } from "@/components/ui";
import { ConnectingView } from "@/features/game/components/ConnectingView";
import { FocusLayout } from "@/features/game/components/FocusLayout";
import { FocusTopBar } from "@/features/game/components/FocusTopBar";
import { GameFxProvider } from "@/features/game/components/GameFxProvider";
import type { GameRoomView } from "@/features/games/types";
import { LocalErrorView } from "@/features/local/components/LocalErrorView";
import { LocalGameSurface } from "@/features/local/components/LocalGameSurface";
import { LocalRoomHero } from "@/features/local/components/LocalRoomHero";
import { localErrorCopy } from "@/features/local/local-errors";
import {
  loadLocalDeviceId,
  loadLocalPlayerName,
  saveLocalPlayerName,
} from "@/features/local/local-identity";
import {
  localNonceToken,
  localRoomCode,
  localSocketUrl,
} from "@/features/local/local-room";
import { useLocalGame } from "@/features/local/useLocalGame";

const StyledIonicons = withUniwind(Ionicons);

export default function LocalJoinScreen() {
  return (
    <ScopedTheme theme="arcade">
      <GameFxProvider>
        <LocalJoin />
      </GameFxProvider>
    </ScopedTheme>
  );
}

function LocalJoin() {
  const { t } = useTranslation("game");
  const params = useLocalSearchParams<{ c?: string }>();
  const [name, setName] = useState(() => loadLocalPlayerName());
  const [confirmedName, setConfirmedName] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const address = useMemo(
    () => parseLocalCode(params.c ?? ""),
    [params.c]
  );

  const leave = () => router.replace("/(tabs)/home" as Href);

  if (!address) {
    return (
      <FocusLayout header={<FocusTopBar onLeave={leave} />}>
        <LocalErrorView
          message={t("local.errors.invalidCode")}
          actionLabel={t("local.errors.back")}
          onAction={leave}
        />
      </FocusLayout>
    );
  }

  if (confirmedName === null) {
    const trimmed = name.trim();
    const confirm = () => {
      saveLocalPlayerName(trimmed);
      setConfirmedName(trimmed);
    };

    return (
      <FocusLayout header={<FocusTopBar onLeave={leave} />}>
        <View className="flex-1 justify-center gap-6 p-6">
          <View className="items-center gap-2">
            <View className="size-16 items-center justify-center rounded-full bg-brand/10">
              <StyledIonicons name="wifi" size={30} className="text-brand" />
            </View>
            <Heading className="text-center text-title-2">
              {t("local.join.title")}
            </Heading>
            <Text className="text-center text-muted-foreground text-sm">
              {t("local.join.subtitle")}
            </Text>
          </View>

          <Card>
            <Card.Body className="items-center gap-1">
              <Text className="text-caption uppercase text-muted-foreground">
                {t("local.join.codeLabel")}
              </Text>
              <Heading className="text-title-3 tracking-[0.12em]">
                {formatLocalCode(localRoomCode(address))}
              </Heading>
            </Card.Body>
          </Card>

          <View className="gap-2">
            <Text weight="medium" className="text-sm">
              {t("local.join.namePrompt")}
            </Text>
            <TextField>
              <Input
                value={name}
                onChangeText={setName}
                placeholder={t("local.join.namePlaceholder")}
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={() => {
                  if (trimmed) confirm();
                }}
              />
            </TextField>
          </View>

          <Button size="lg" isDisabled={!trimmed} onPress={confirm}>
            <Button.Label>{t("local.join.join")}</Button.Label>
          </Button>
        </View>
      </FocusLayout>
    );
  }

  return (
    <LocalJoinSession
      key={attempt}
      address={address}
      name={confirmedName}
      onRetry={() => setAttempt(value => value + 1)}
      onRename={() => setConfirmedName(null)}
      onLeave={leave}
    />
  );
}

interface LocalJoinSessionProps {
  address: LocalRoomAddress;
  name: string;
  onRetry: () => void;
  onRename: () => void;
  onLeave: () => void;
}

function LocalJoinSession({
  address,
  name,
  onRetry,
  onRename,
  onLeave,
}: LocalJoinSessionProps) {
  const { t } = useTranslation("game");
  const deviceId = useMemo(() => loadLocalDeviceId(), []);
  const code = localRoomCode(address);

  const client = useLocalGame({
    url: localSocketUrl(address.ip),
    nonce: localNonceToken(address),
    deviceId,
    name,
    enabled: true,
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

  if (client.status === "error") {
    const copy = localErrorCopy(t, client.errorCode);

    return (
      <FocusLayout header={<FocusTopBar onLeave={onLeave} />}>
        <LocalErrorView
          message={copy.message}
          hints={copy.hints}
          actionLabel={t("local.errors.retry")}
          onAction={onRetry}
          secondaryLabel={t("local.errors.changeName")}
          onSecondary={onRename}
        />
      </FocusLayout>
    );
  }

  if (!client.state) {
    return (
      <FocusLayout header={<FocusTopBar onLeave={onLeave} />}>
        <ConnectingView />
      </FocusLayout>
    );
  }

  return (
    <LocalGameSurface
      room={view}
      code={code}
      hero={<LocalRoomHero code={code} ip={address.ip} />}
      onLeave={onLeave}
    />
  );
}
