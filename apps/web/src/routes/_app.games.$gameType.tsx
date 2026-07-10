import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@zeyn/ui/components/button";
import { authClient } from "@/features/auth/lib/auth-client";
import { PublicArenas } from "@/features/dashboard/components/PublicArenas";
import { RecentGamesSection } from "@/features/dashboard/components/RecentGamesSection";
import { LeaderboardPlaceholder } from "@/features/dashboard/components/LeaderboardPlaceholder";
import { getClientGame } from "@/features/games/registry";
import { BackButton } from "@/shared/components/app/BackButton";
import { PageHeader } from "@/shared/components/app/PageHeader";
import { PageShell } from "@/shared/components/app/PageShell";

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
      <div className='min-h-full bg-background flex flex-col items-center justify-center gap-4 p-6 text-center'>
        <h1 className='text-2xl font-bold'>{t("game:typePage.unknownTitle")}</h1>
        <p className='text-muted-foreground'>
          {t("game:typePage.unknownDescription", { gameType })}
        </p>
        <BackButton
          target={{ to: "/" }}
          label={t("game:typePage.backToDashboard")}
        />
      </div>
    );
  }

  return (
    <PageShell width='xl' gap='lg'>
      <PageHeader
        back={{ to: "/" }}
        icon={game.Icon}
        title={t(`games:catalog.game.${game.type}.title`, game.meta.title)}
        subtitle={t(
          `games:catalog.game.${game.type}.description`,
          game.meta.description
        )}
      >
        <Link to='/game/create/$gameType' params={{ gameType: game.type }}>
          <Button variant='brand' size='lg'>
            <Zap className='size-4 mr-2' />
            {t("game:typePage.createGame")}
          </Button>
        </Link>
      </PageHeader>

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
    </PageShell>
  );
}
