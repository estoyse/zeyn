import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

import { Button, Heading, Screen, Text } from "@/components/ui";
import { getClientGame } from "@/features/games/registry";

export default function CreateGameScreen() {
  const { gameType } = useLocalSearchParams<{ gameType: string }>();
  const { t } = useTranslation("game");
  const { t: tGames } = useTranslation("games");
  const game = getClientGame(gameType);

  if (!game) {
    return (
      <Screen contentClassName="items-center justify-center" edges={["top", "bottom"]}>
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

  const { Create } = game;

  return (
    <Screen edges={["top", "bottom"]}>
      <Heading className="text-2xl">
        {tGames(`catalog.game.${game.type}.title`, game.meta.title)}
      </Heading>
      {Create ? <Create /> : null}
    </Screen>
  );
}
