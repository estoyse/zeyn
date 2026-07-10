import { createFileRoute, redirect } from "@tanstack/react-router";
import { Gamepad2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LogoMark } from "@zeyn/ui/components/logo";
import { authClient } from "@/features/auth/lib/auth-client";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { Sidebar } from "@/features/dashboard/components/Sidebar";
import { GameCatalog } from "@/features/games/components/GameCatalog";
import { PageShell } from "@/shared/components/app/PageShell";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
  pendingComponent: RootSplash,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: "/home",
      });
    }
    return { session: session.data };
  },
});

function RootSplash() {
  return (
    <div className='flex h-full items-center justify-center'>
      <LogoMark className='size-10 animate-pulse text-brand' />
    </div>
  );
}

function DashboardPage() {
  const { t } = useTranslation();
  const { session } = Route.useRouteContext();

  return (
    <PageShell width='xl' gap='lg'>
      <DashboardHeader userName={session?.user?.name} />

      <div className='grid gap-8 lg:grid-cols-[1fr_350px]'>
        <div className='space-y-10'>
          <section className='space-y-6'>
            <h3 className='text-xl font-bold flex items-center gap-3'>
              <Gamepad2 className='size-5' />
              {t("dashboard:page.gamesHeading")}
            </h3>
            <GameCatalog variant='play' />
          </section>
        </div>

        <Sidebar />
      </div>
    </PageShell>
  );
}
