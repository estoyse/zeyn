import { router, type Href } from "expo-router";
import { Button, Card, Chip } from "heroui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { listClientGames } from "@/features/games/registry";

export function GameCatalog() {
  const { t } = useTranslation("games");
  const games = listClientGames();

  return (
    <View className="gap-4">
      {games.map((game) => (
        <Card key={game.type}>
          <Card.Body className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="size-10 items-center justify-center rounded-full bg-brand/10">
                <game.Icon size={20} className="text-brand" />
              </View>
              <View className="flex-1 gap-0.5">
                <Card.Title>{t(`catalog.game.${game.type}.title`, game.meta.title)}</Card.Title>
                <Chip size="sm" variant="soft" className="self-start">
                  <Chip.Label>
                    {t("catalog.playersRange", {
                      min: game.meta.minPlayers,
                      max: game.meta.maxPlayers,
                    })}
                  </Chip.Label>
                </Chip>
              </View>
            </View>
            <Card.Description>
              {t(`catalog.game.${game.type}.description`, game.meta.description)}
            </Card.Description>
          </Card.Body>
          <Card.Footer>
            <Button
              variant="outline"
              className="w-full"
              onPress={() => router.push(`/(tabs)/games/${game.type}` as Href)}
            >
              <Button.Label>{t("catalog.play")}</Button.Label>
            </Button>
          </Card.Footer>
        </Card>
      ))}
    </View>
  );
}
