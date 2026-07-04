import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings2, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@zeyn/ui/components/button";
import { getClientGame } from "@/features/games/registry";

export const Route = createFileRoute("/_app/game/create/$gameType")({
  component: CreateGamePage,
});

function CreateGamePage() {
  const { t } = useTranslation();
  const { gameType } = Route.useParams();
  const game = getClientGame(gameType);

  if (!game) {
    return (
      <div className='min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6 text-center'>
        <h1 className='text-2xl font-bold'>{t("game:typePage.unknownTitle")}</h1>
        <p className='text-muted-foreground'>
          {t("game:typePage.unknownDescription", { gameType })}
        </p>
        <Link to='/game/create'>
          <Button variant='outline'>
            <ArrowLeft className='size-4 mr-2' />
            {t("game:typePage.backToGames")}
          </Button>
        </Link>
      </div>
    );
  }

  const { Create } = game;

  return (
    <div className='min-h-screen bg-background p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-6xl space-y-8'>
        <header className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='flex size-12 items-center justify-center bg-brand text-brand-foreground'>
              <Settings2 className='size-6' />
            </div>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                {t(`games:catalog.game.${game.type}.title`, game.meta.title)}
              </h1>
              <p className='text-muted-foreground italic'>
                {t("game:create.configure.subtitle")}
              </p>
            </div>
          </div>
          <Link to='/game/create'>
            <Button variant='ghost' size='sm'>
              <ArrowLeft className='size-4 mr-2' />
              {t("game:create.configure.backButton")}
            </Button>
          </Link>
        </header>

        <Create />
      </div>
    </div>
  );
}
