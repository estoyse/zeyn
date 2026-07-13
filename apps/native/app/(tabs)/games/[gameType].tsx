import Ionicons from "@expo/vector-icons/Ionicons";
import { type GameType } from "@zeyn/api/games";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Card, Skeleton } from "heroui-native";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { withUniwind } from "uniwind";

import { Button, EmptyState, Heading, MeshSurface, Screen, ScreenHeader, Text } from "@/components/ui";
import { getClientGame } from "@/features/games/registry";
import { authClient } from "@/lib/auth-client";
import { toneForGame } from "@/lib/mesh";
import { trpc } from "@/utils/trpc";

const StyledIonicons = withUniwind(Ionicons);

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
      <Screen
        contentClassName="items-center justify-center"
        header={<ScreenHeader back title={t("typePage.unknownTitle")} />}
      >
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
    <Screen
      header={
        <ScreenHeader
          back
          title={tGames(`catalog.game.${game.type}.title`, game.meta.title)}
        />
      }
      refreshing={publicRoomsQuery.isRefetching || recentGamesQuery.isRefetching}
      onRefresh={() => {
        publicRoomsQuery.refetch();
        recentGamesQuery.refetch();
      }}
    >
      <MeshSurface tone={toneForGame(game.type)} className="gap-3 p-5">
        <View className="flex-row items-center gap-3">
          <View className="size-12 items-center justify-center rounded-full bg-white/15">
            <game.Icon size={24} className="text-white" />
          </View>
          <View className="flex-1 gap-1.5">
            <Heading className="text-2xl text-white">
              {tGames(`catalog.game.${game.type}.title`, game.meta.title)}
            </Heading>
            <View className="flex-row items-center gap-1.5 self-start rounded-pill bg-white/15 px-2.5 py-1">
              <StyledIonicons name="person" size={11} className="text-white/80" />
              <Text weight="semibold" className="text-caption uppercase text-white/90">
                {tGames("catalog.playersRange", {
                  min: game.meta.minPlayers,
                  max: game.meta.maxPlayers,
                })}
              </Text>
            </View>
          </View>
        </View>
        <Text className="text-white/70">
          {tGames(`catalog.game.${game.type}.description`, game.meta.description)}
        </Text>
      </MeshSurface>

      <Button
        size="lg"
        onPress={() => router.push(`/game/create/${game.type}` as Href)}
      >
        <Button.Label>{t("typePage.createGame")}</Button.Label>
      </Button>

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
              <EmptyState icon="people-outline" title={tDashboard("publicArenas.emptyTitle")} />
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
              <EmptyState icon="game-controller" title={tDashboard("recentGames.empty")} />
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
