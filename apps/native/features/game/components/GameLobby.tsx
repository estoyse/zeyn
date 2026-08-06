import Ionicons from "@expo/vector-icons/Ionicons";
import { Card, Chip } from "heroui-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { Heading, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ClientRoomState } from "@/features/game/hooks/useGameState";

import { JoinCodeHero } from "./JoinCodeHero";
import { StartButton } from "./StartButton";

const StyledIonicons = withUniwind(Ionicons);

interface GameLobbyProps {
  state: ClientRoomState;
  playerId: string;
  onStart: () => void;
  minPlayers: number;
  description: string;
  isSpectator?: boolean;
  hero?: ReactNode;
}

export function GameLobby({
  state,
  playerId,
  onStart,
  minPlayers,
  description,
  isSpectator = false,
  hero,
}: GameLobbyProps) {
  const { t } = useTranslation("game");
  const isHost = state.hostId === playerId;
  const players = Object.values(state.players);
  const canStart = players.length >= minPlayers;
  const needed = Math.max(0, minPlayers - players.length);

  return (
    <View className="gap-5">
      {state.gameName ? (
        <Heading className="text-center text-title-2">{state.gameName}</Heading>
      ) : null}

      {hero ??
        (state.gameId ? (
          <JoinCodeHero gameId={state.gameId} gameName={state.gameName} />
        ) : null)}

      <Card>
        <Card.Body className="gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <StyledIonicons name="people" size={18} className="text-foreground" />
              <Card.Title>{t("lobby.playersInLobby")}</Card.Title>
            </View>
            <Text className="text-caption uppercase text-muted-foreground">
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
                  "min-w-[47%] flex-1 flex-row items-center justify-between rounded-row border border-border bg-muted-surface p-3",
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
                      <Chip.Label>{t("lobby.guest")}</Chip.Label>
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
            <Chip size="sm" variant="soft">
              <Chip.Label>
                {state.hasPassword
                  ? t("lobby.locked")
                  : state.isPublic
                    ? t("lobby.public")
                    : t("lobby.private")}
              </Chip.Label>
            </Chip>
          </View>

          <Text className="text-muted-foreground text-sm">{description}</Text>

          {isSpectator ? null : isHost ? (
            <View className="gap-2">
              <StartButton canStart={canStart} onStart={onStart} />
              {!canStart && (
                <Text className="text-center text-caption uppercase text-muted-foreground">
                  {t("lobby.needMorePlayers", { count: needed })}
                </Text>
              )}
            </View>
          ) : (
            <View className="items-center gap-2 rounded-row border border-dashed border-border bg-muted-surface p-4">
              <Text className="text-muted-foreground text-sm">
                {t("lobby.waitingForHost")}
              </Text>
            </View>
          )}
        </Card.Body>
      </Card>
    </View>
  );
}
