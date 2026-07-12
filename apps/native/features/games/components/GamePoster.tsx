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
      className={cn(wide ? "w-full" : "flex-1", className)}
    >
      <MeshSurface
        tone={toneForGame(game.type)}
        className={cn("gap-3 p-4", wide ? "min-h-40" : "min-h-44")}
      >
        <View className="flex-row items-start justify-between gap-2">
          <View className="size-11 items-center justify-center rounded-pill bg-white/15">
            <Icon size={22} className="text-white" />
          </View>

          {liveCount ? (
            <View className="flex-row items-center gap-1.5 rounded-pill bg-black/30 px-2.5 py-1">
              <View className="size-1.5 rounded-full bg-success" />
              <Text weight="semibold" className="text-caption text-white">
                {liveCount}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="gap-1">
          <Text weight="bold" className="text-title-3 text-white">
            {game.meta.title}
          </Text>
          {wide ? (
            <Text numberOfLines={2} className="text-footnote leading-snug text-white/65">
              {game.meta.description}
            </Text>
          ) : null}
        </View>

        <View className="flex-row items-center gap-1.5">
          <StyledIonicons name="people" size={12} className="text-white/60" />
          <Text weight="semibold" className="text-caption uppercase text-white/80">
            {game.meta.minPlayers}–{game.meta.maxPlayers}
          </Text>
        </View>
      </MeshSurface>
    </PressableScale>
  );
}
