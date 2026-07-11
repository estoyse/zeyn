import { Ionicons } from "@expo/vector-icons";
import { formatGameCode } from "@zeyn/api/game-code";
import * as Clipboard from "expo-clipboard";
import { Button, Card, Chip, useToast } from "heroui-native";
import { useTranslation } from "react-i18next";
import { Pressable, Share, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { Heading, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ClientRoomState } from "@/features/game/hooks/useGameState";

const StyledIonicons = withUniwind(Ionicons);

interface GameLobbyProps {
  state: ClientRoomState;
  playerId: string;
  onStart: () => void;
  minPlayers: number;
  description: string;
  isSpectator?: boolean;
}

export function GameLobby({
  state,
  playerId,
  onStart,
  minPlayers,
  description,
  isSpectator = false,
}: GameLobbyProps) {
  const { t } = useTranslation("game");
  const { toast } = useToast();
  const isHost = state.hostId === playerId;
  const players = Object.values(state.players);
  const canStart = players.length >= minPlayers;

  const copyCode = async () => {
    if (!state.gameId) return;
    await Clipboard.setStringAsync(state.gameId);
    toast.show({ variant: "success", label: t("lobby.codeCopied") });
  };

  const shareRoom = async () => {
    if (!state.gameId) return;
    const code = formatGameCode(state.gameId);
    await Share.share({
      message: state.gameName ? `${state.gameName} — ${code}` : code,
    });
  };

  return (
    <View className="gap-5">
      {state.gameName ? (
        <Heading className="text-2xl">{state.gameName}</Heading>
      ) : null}

      <Card>
        <Card.Body className="gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <StyledIonicons name="people" size={18} className="text-foreground" />
              <Card.Title>{t("lobby.playersInLobby")}</Card.Title>
            </View>
            <Text className="text-muted-foreground text-xs uppercase tracking-widest">
              {t("lobby.joined", {
                count: players.length,
                max: state.maxPlayers,
              })}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {players.map(p => (
              <Animated.View
                entering={FadeIn}
                layout={LinearTransition}
                key={p.id}
                className={cn(
                  "min-w-[47%] flex-1 flex-row items-center justify-between border border-border bg-muted-surface p-3",
                  !p.connected && "opacity-50"
                )}
              >
                <View className="min-w-0 flex-1 flex-row items-center gap-2">
                  <StyledIonicons
                    name="person-circle"
                    size={22}
                    className="text-muted-foreground"
                  />
                  <Text
                    weight="medium"
                    className={cn("text-sm", !p.connected && "line-through")}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  {p.isGuest && (
                    <Chip size="sm" variant="soft">
                      <Chip.Label>Guest</Chip.Label>
                    </Chip>
                  )}
                  {p.id === state.hostId && (
                    <StyledIonicons name="ribbon" size={14} className="text-brand" />
                  )}
                </View>
              </Animated.View>
            ))}
          </View>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body className="gap-4">
          <View className="flex-row items-center justify-between">
            <Card.Title>{t("lobby.gameDetails")}</Card.Title>
            {state.hasPassword ? (
              <Chip size="sm" variant="soft">
                <Chip.Label>{t("lobby.locked")}</Chip.Label>
              </Chip>
            ) : state.isPublic ? (
              <Chip size="sm" variant="soft">
                <Chip.Label>{t("lobby.public")}</Chip.Label>
              </Chip>
            ) : (
              <Chip size="sm" variant="soft">
                <Chip.Label>{t("lobby.private")}</Chip.Label>
              </Chip>
            )}
          </View>

          {state.gameId ? (
            <View className="gap-1">
              <Text className="text-muted-foreground text-xs uppercase tracking-widest">
                {t("lobby.joinCode")}
              </Text>
              <Pressable
                onPress={copyCode}
                accessibilityLabel={t("lobby.copyCode")}
                className="flex-row items-center gap-2"
              >
                <Heading className="text-2xl tracking-widest">
                  {formatGameCode(state.gameId)}
                </Heading>
                <StyledIonicons name="copy-outline" size={18} className="text-muted-foreground" />
              </Pressable>
            </View>
          ) : null}

          <View className="flex-row gap-3">
            <Button variant="outline" className="flex-1" onPress={copyCode}>
              <StyledIonicons name="copy-outline" size={16} className="text-foreground" />
              <Button.Label>{t("lobby.copyCode")}</Button.Label>
            </Button>
            <Button variant="outline" className="flex-1" onPress={shareRoom}>
              <StyledIonicons name="share-outline" size={16} className="text-foreground" />
              <Button.Label>{t("lobby.shareLink")}</Button.Label>
            </Button>
          </View>

          <Card className="border-dashed bg-muted-surface">
            <Card.Body className="flex-row items-center gap-3">
              <StyledIonicons name="information-circle" size={22} className="text-brand" />
              <View className="flex-1">
                <Text weight="medium" className="text-sm">
                  {t("lobby.gameInformation")}
                </Text>
                <Text className="text-muted-foreground text-xs">{description}</Text>
              </View>
            </Card.Body>
          </Card>

          {isSpectator ? null : isHost ? (
            <Button isDisabled={!canStart} onPress={onStart}>
              <StyledIonicons name="play" size={16} className="text-primary-foreground" />
              <Button.Label>{t("lobby.startGame")}</Button.Label>
            </Button>
          ) : (
            <View className="items-center gap-2 border border-dashed border-border bg-muted-surface p-4">
              <Text className="text-muted-foreground text-xs">
                {t("lobby.waitingForHost")}
              </Text>
            </View>
          )}
        </Card.Body>
      </Card>
    </View>
  );
}
