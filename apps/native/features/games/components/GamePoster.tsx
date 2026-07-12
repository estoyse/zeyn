import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { MeshSurface, PressableScale, Text } from "@/components/ui";
import type { ClientGameModule } from "@/features/games/registry";
import { toneForGame } from "@/lib/mesh";
import { cn } from "@/lib/utils";

const StyledIonicons = withUniwind(Ionicons);

type GamePosterProps = {
  game: ClientGameModule;
  onPress: () => void;
  size?: "tile" | "wide";
  liveCount?: number;
  className?: string;
};

export function GamePoster({
  game,
  onPress,
  size = "tile",
  liveCount,
  className,
}: GamePosterProps) {
  const Icon = game.Icon;
  const wide = size === "wide";

  return (
    <PressableScale
      onPress={onPress}
      scale={0.975}
      accessibilityRole="button"
      accessibilityLabel={game.meta.title}
      className={cn("flex-1", className)}
    >
      <MeshSurface
        tone={toneForGame(game.type)}
        className={cn("justify-between p-4", wide ? "h-44" : "h-40")}
      >
        <View className="flex-row items-start justify-between">
          <View className="size-11 items-center justify-center rounded-pill bg-white/15">
            <Icon size={22} className="text-white" />
          </View>

          {liveCount ? (
            <View className="flex-row items-center gap-1.5 rounded-pill bg-black/25 px-2.5 py-1">
              <View className="size-1.5 rounded-full bg-success" />
              <Text className="text-caption uppercase text-white/90">
                {liveCount}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="gap-1">
          <Text weight="bold" className="text-title-3 text-white">
            {game.meta.title}
          </Text>
          <Text
            numberOfLines={wide ? 2 : 2}
            className="text-footnote leading-snug text-white/65"
          >
            {game.meta.description}
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <Text weight="semibold" className="text-caption uppercase text-white/90">
            {game.meta.minPlayers}–{game.meta.maxPlayers}
          </Text>
          <StyledIonicons
            name="person"
            size={10}
            className="text-white/60"
          />
        </View>
      </MeshSurface>
    </PressableScale>
  );
}
