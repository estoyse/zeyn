import { useTranslation } from "react-i18next";

import { Heading, Screen } from "@/components/ui";
import { GameCatalog } from "@/features/games/components/GameCatalog";

export default function GamesScreen() {
  const { t } = useTranslation("dashboard");

  return (
    <Screen contentClassName="gap-6 px-6 py-6">
      <Heading className="text-2xl">{t("page.gamesHeading")}</Heading>
      <GameCatalog />
    </Screen>
  );
}
