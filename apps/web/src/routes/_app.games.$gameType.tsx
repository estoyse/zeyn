import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { ArrowLeft, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@zeyn/ui/components/button";
import { authClient } from "@/features/auth/lib/auth-client";
import { PublicArenas } from "@/features/dashboard/components/PublicArenas";
import { RecentGamesSection } from "@/features/dashboard/components/RecentGamesSection";
import { LeaderboardPlaceholder } from "@/features/dashboard/components/LeaderboardPlaceholder";
import { getClientGame } from "@/features/games/registry";

export const Route = createFileRoute("/_app/games/$gameType")({
  component: GameTypePage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: "/auth/login",
      });
    }
    return { session: session.data };
  },
});

function GameTypePage() {
  const { t } = useTranslation();
  const { gameType } = Route.useParams();
  const { session } = Route.useRouteContext();
  const game = getClientGame(gameType);

  if (!game) {
    return (
      <div className='min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6 text-center'>
        <h1 className='text-2xl font-bold'>{t("game:typePage.unknownTitle")}</h1>
        <p className='text-muted-foreground'>
          {t("game:typePage.unknownDescription", { gameType })}
        </p>
        <Link to='/dashboard'>
          <Button variant='outline'>
            <ArrowLeft className='size-4 mr-2' />
            {t("game:typePage.backToDashboard")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-7xl space-y-12'>
        <header className='flex flex-col md:flex-row items-start md:items-center justify-between gap-6'>
          <div className='flex items-center gap-3'>
            <div className='flex size-12 items-center justify-center bg-brand text-brand-foreground'>
              <game.Icon className='size-6' />
            </div>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                {t(`games:catalog.game.${game.type}.title`, game.meta.title)}
              </h1>
              <p className='text-muted-foreground italic'>
                {t(
                  `games:catalog.game.${game.type}.description`,
                  game.meta.description
                )}
              </p>
            </div>
          </div>
          <Link to='/game/create/$gameType' params={{ gameType: game.type }}>
            <Button variant='brand' size='lg'>
              <Zap className='size-4 mr-2' />
              {t("game:typePage.createGame")}
            </Button>
          </Link>
        </header>

        <div className='grid gap-8 lg:grid-cols-[1fr_350px]'>
          <div className='space-y-10'>
            <PublicArenas
              userId={session?.user?.id}
              gameType={game.type}
              title={t("game:typePage.activeGames")}
            />
            <RecentGamesSection gameType={game.type} />
          </div>

          <aside className='space-y-6 h-fit sticky top-6'>
            <LeaderboardPlaceholder />
          </aside>
        </div>
      </div>
    </div>
  );
}
