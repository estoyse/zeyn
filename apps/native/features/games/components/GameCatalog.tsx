import { router, type Href } from "expo-router";
import { View } from "react-native";

import { GamePoster } from "@/features/games/components/GamePoster";
import { listClientGames } from "@/features/games/registry";

export function GameCatalog() {
  const games = listClientGames();

  return (
    <View className="gap-4">
      {games.map((game) => (
        <GamePoster
          key={game.type}
          game={game}
          size="wide"
          onPress={() => router.push(`/(tabs)/games/${game.type}` as Href)}
        />
      ))}
    </View>
  );
}
