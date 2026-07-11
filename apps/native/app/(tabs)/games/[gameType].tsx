import { type GameType } from "@zeyn/api/games";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Card, Chip, Skeleton } from "heroui-native";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { Button, Heading, Screen, Text } from "@/components/ui";
import { getClientGame } from "@/features/games/registry";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export default function GameTypeScreen() {
  const { gameType } = useLocalSearchParams<{ gameType: string }>();
  const { t } = useTranslation("game");
  const { t: tGames } = useTranslation("games");
  const { t: tDashboard } = useTranslation("dashboard");
  const { data: session } = authClient.useSession();
  const game = getClientGame(gameType);

  const publicRoomsQuery = useQuery({
    ...trpc.game.getPublicRooms.queryOptions({ gameType: gameType as GameType }),
    enabled: !!session?.user && !!game,
  });

  const recentGamesQuery = useQuery({
    ...trpc.game.getMyRecentGames.queryOptions({ gameType: gameType as GameType }),
    enabled: !!session?.user && !!game,
  });

  if (!game) {
    return (
      <Screen contentClassName="items-center justify-center gap-2 px-6">
        <Heading>{t("typePage.unknownTitle")}</Heading>
        <Text className="text-muted-foreground text-center">
          {t("typePage.unknownDescription", { gameType })}
        </Text>
        <Button variant="outline" onPress={() => router.back()}>
          <Button.Label>{t("typePage.backToGames")}</Button.Label>
        </Button>
      </Screen>
    );
  }

  const rooms = publicRoomsQuery.data;
  const recentItems = recentGamesQuery.data?.items;

  return (
    <Screen contentClassName="gap-6 px-6 py-6">
      <View className="gap-3">
        <View className="flex-row items-center gap-3">
          <View className="size-12 items-center justify-center rounded-full bg-brand/10">
            <game.Icon size={24} className="text-brand" />
          </View>
          <View className="flex-1 gap-0.5">
            <Heading className="text-2xl">
              {tGames(`catalog.game.${game.type}.title`, game.meta.title)}
            </Heading>
            <Chip size="sm" variant="soft" className="self-start">
              <Chip.Label>
                {tGames("catalog.playersRange", {
                  min: game.meta.minPlayers,
                  max: game.meta.maxPlayers,
                })}
              </Chip.Label>
            </Chip>
          </View>
        </View>
        <Text className="text-muted-foreground">
          {tGames(`catalog.game.${game.type}.description`, game.meta.description)}
        </Text>
        <Button
          size="lg"
          onPress={() => router.push(`/game/create/${game.type}` as Href)}
        >
          <Button.Label>{t("typePage.createGame")}</Button.Label>
        </Button>
      </View>

      {session?.user ? (
        <>
          <View className="gap-3">
            <Heading className="text-lg">{t("typePage.activeGames")}</Heading>
            {publicRoomsQuery.isLoading ? (
              <View className="gap-3">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </View>
            ) : rooms?.length === 0 ? (
              <Card>
                <Card.Body>
                  <Card.Description>{tDashboard("publicArenas.emptyTitle")}</Card.Description>
                </Card.Body>
              </Card>
            ) : (
              <View className="gap-3">
                {rooms?.map((room) => (
                  <Card key={room.id}>
                    <Card.Body className="gap-2">
                      <Card.Title>{room.name}</Card.Title>
                      <Text className="text-muted-foreground text-sm">
                        {tDashboard("roomCard.players", { count: room.maxPlayers })}
                      </Text>
                    </Card.Body>
                    <Card.Footer>
                      <Button
                        variant={room.password ? "outline" : "primary"}
                        className="w-full"
                        onPress={() => router.push(`/game/${room.id}` as Href)}
                      >
                        <Button.Label>{tDashboard("roomCard.join")}</Button.Label>
                      </Button>
                    </Card.Footer>
                  </Card>
                ))}
              </View>
            )}
          </View>

          <View className="gap-3">
            <Heading className="text-lg">{tDashboard("recentGames.title")}</Heading>
            {recentGamesQuery.isLoading ? (
              <Skeleton className="h-16 w-full rounded-lg" />
            ) : recentItems?.length === 0 ? (
              <Card>
                <Card.Body>
                  <Card.Description>{tDashboard("recentGames.empty")}</Card.Description>
                </Card.Body>
              </Card>
            ) : (
              <View className="gap-2">
                {recentItems?.map((item) => (
                  <Pressable
                    key={item.historyId}
                    onPress={() => router.push(`/game/${item.gameId}` as Href)}
                  >
                    <Card>
                      <Card.Body className="flex-row items-center justify-between">
                        <Text weight="medium">{item.roomName ?? game.meta.title}</Text>
                        <Text className="text-muted-foreground text-sm">{item.score} pts</Text>
                      </Card.Body>
                    </Card>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </>
      ) : (
        <Card>
          <Card.Body className="gap-3">
            <Card.Title>{t("auth.loginRequired.title")}</Card.Title>
            <Card.Description>{t("auth.loginRequired.description")}</Card.Description>
          </Card.Body>
          <Card.Footer>
            <Button className="w-full" onPress={() => router.push("/(auth)/login" as Href)}>
              <Button.Label>{t("auth.loginRequired.signIn")}</Button.Label>
            </Button>
          </Card.Footer>
        </Card>
      )}
    </Screen>
  );
}
