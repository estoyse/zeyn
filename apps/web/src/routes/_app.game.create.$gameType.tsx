import { createFileRoute } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getClientGame } from "@/features/games/registry";
import { BackButton } from "@/shared/components/app/BackButton";
import { PageHeader } from "@/shared/components/app/PageHeader";
import { PageShell } from "@/shared/components/app/PageShell";

export const Route = createFileRoute("/_app/game/create/$gameType")({
  component: CreateGamePage,
});

function CreateGamePage() {
  const { t } = useTranslation();
  const { gameType } = Route.useParams();
  const game = getClientGame(gameType);

  if (!game) {
    return (
      <div className='min-h-full bg-background flex flex-col items-center justify-center gap-4 p-6 text-center'>
        <h1 className='text-2xl font-bold'>{t("game:typePage.unknownTitle")}</h1>
        <p className='text-muted-foreground'>
          {t("game:typePage.unknownDescription", { gameType })}
        </p>
        <BackButton
          target={{ to: "/game/create" }}
          label={t("game:typePage.backToGames")}
        />
      </div>
    );
  }

  const { Create } = game;

  return (
    <PageShell width='lg' gap='md'>
      <PageHeader
        back={{ to: "/game/create" }}
        icon={Settings2}
        title={t(`games:catalog.game.${game.type}.title`, game.meta.title)}
        subtitle={t("game:create.configure.subtitle")}
      />

      <Create />
    </PageShell>
  );
}
