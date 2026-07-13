import { useQuery } from "@tanstack/react-query";
import { router, type Href } from "expo-router";
import { Card, Skeleton } from "heroui-native";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { EmptyState, Heading, Text } from "@/components/ui";
import { getClientGame } from "@/features/games/registry";
import { trpc } from "@/utils/trpc";

interface RecentGamesSectionProps {
  enabled: boolean;
}

export function RecentGamesSection({ enabled }: RecentGamesSectionProps) {
  const { t } = useTranslation("dashboard");
  const recentGamesQuery = useQuery({
    ...trpc.game.getMyRecentGames.queryOptions(),
    enabled,
  });
  const items = recentGamesQuery.data?.items;

  return (
    <View className="gap-3">
      <Heading className="text-lg">{t("recentGames.title")}</Heading>

      {recentGamesQuery.isLoading ? (
        <View className="gap-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </View>
      ) : items?.length === 0 ? (
        <EmptyState icon="game-controller" title={t("recentGames.empty")} />
      ) : (
        <View className="gap-2">
          {items?.map((item) => {
            const game = getClientGame(item.gameType);
            return (
              <Pressable
                key={item.historyId}
                onPress={() => router.push(`/game/${item.gameId}` as Href)}
              >
                <Card>
                  <Card.Body className="flex-row items-center justify-between gap-3">
                    <View className="flex-1 gap-0.5">
                      <Text weight="medium" numberOfLines={1}>
                        {item.roomName ?? game?.meta.title ?? item.gameType}
                      </Text>
                      <Text className="text-muted-foreground text-xs">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text weight="semibold" className="text-brand">
                        {item.score}
                      </Text>
                      <Text className="text-muted-foreground text-xs">
                        {item.playerCount}
                      </Text>
                    </View>
                  </Card.Body>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
