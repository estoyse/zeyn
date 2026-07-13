import { formatGameCode } from "@zeyn/api/game-code";
import { useQuery } from "@tanstack/react-query";
import { router, type Href } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { PressableScale, Text } from "@/components/ui";
import { getClientGame } from "@/features/games/registry";
import { trpc } from "@/utils/trpc";

export function LiveNowStrip() {
  const { t } = useTranslation("dashboard");
  const { data } = useQuery({
    ...trpc.game.getPublicRooms.queryOptions({ limit: 8 }),
    refetchInterval: 20000,
  });

  const rooms = data ?? [];
  if (rooms.length === 0) return null;

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2 px-6">
        <LiveDot />
        <Text weight="semibold" className="text-sm">
          {t("liveNow.title")}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 24 }}
      >
        {rooms.map(room => {
          const game = getClientGame(room.gameType);
          const Icon = game?.Icon;

          return (
            <PressableScale
              key={room.id}
              onPress={() => router.push(`/game/${room.id}` as Href)}
              className="w-44 gap-2 rounded-card border border-border bg-card p-4"
            >
              <View className="flex-row items-center gap-2">
                {Icon ? <Icon size={15} className="text-brand" /> : null}
                <Text className="text-caption uppercase text-muted-foreground">
                  {game?.meta.title ?? room.gameType}
                </Text>
              </View>

              <Text weight="semibold" numberOfLines={1} className="text-sm">
                {room.name}
              </Text>

              <Text className="text-caption uppercase text-muted-foreground">
                {formatGameCode(room.id)}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

function LiveDot() {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
    return () => cancelAnimation(pulse);
  }, [reduced, pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 2.4 }],
  }));

  return (
    <View className="size-2 items-center justify-center">
      <Animated.View
        style={haloStyle}
        pointerEvents="none"
        className="absolute size-2 rounded-full bg-destructive"
      />
      <View className="size-2 rounded-full bg-destructive" />
    </View>
  );
}
