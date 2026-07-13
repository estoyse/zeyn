import { useQuery } from "@tanstack/react-query";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { Text } from "@/components/ui";
import { GamePoster } from "@/features/games/components/GamePoster";
import { listClientGames } from "@/features/games/registry";
import { fadeUp, stagger } from "@/lib/motion";
import { trpc } from "@/utils/trpc";

export function PlayNowTiles({ enabled = false }: { enabled?: boolean }) {
  const { t } = useTranslation("dashboard");
  const games = listClientGames();

  const { data: rooms } = useQuery({
    ...trpc.game.getPublicRooms.queryOptions({ limit: 50 }),
    enabled,
    refetchInterval: 30000,
  });

  const liveByType = (rooms ?? []).reduce<Record<string, number>>((acc, room) => {
    acc[room.gameType] = (acc[room.gameType] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <View className="gap-3">
      <Text weight="semibold" className="text-base">
        {t("playNow.title")}
      </Text>

      <View className="flex-row gap-3">
        {games.map((game, index) => (
          <Animated.View
            key={game.type}
            entering={fadeUp(stagger(index))}
            className="flex-1"
          >
            <GamePoster
              game={game}
              liveCount={liveByType[game.type]}
              onPress={() => router.push(`/game/create/${game.type}` as Href)}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
