import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { PressableScale, Text } from "@/components/ui";
import { listClientGames } from "@/features/games/registry";
import { fadeUp, stagger } from "@/lib/motion";

export function PlayNowTiles() {
  const { t } = useTranslation("dashboard");
  const games = listClientGames();

  return (
    <View className="gap-3">
      <Text weight="semibold" className="text-sm">
        {t("playNow.title")}
      </Text>

      <View className="flex-row gap-3">
        {games.map((game, index) => {
          const Icon = game.Icon;

          return (
            <Animated.View
              key={game.type}
              entering={fadeUp(stagger(index))}
              className="flex-1"
            >
              <PressableScale
                onPress={() =>
                  router.push(`/game/create/${game.type}` as Href)
                }
                accessibilityRole="button"
                accessibilityLabel={game.meta.title}
                className="h-32 justify-between rounded-card border border-border bg-card p-4"
              >
                <View className="size-10 items-center justify-center rounded-pill bg-brand/10">
                  <Icon size={20} className="text-brand" />
                </View>
                <View className="gap-0.5">
                  <Text weight="semibold" className="text-sm">
                    {game.meta.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="text-caption text-muted-foreground"
                  >
                    {t("playNow.create")}
                  </Text>
                </View>
              </PressableScale>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
