import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/features/auth/lib/auth-client";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { PublicArenas } from "@/features/dashboard/components/PublicArenas";
import { Sidebar } from "@/features/dashboard/components/Sidebar";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
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

function DashboardPage() {
  const { session } = Route.useRouteContext();

  return (
    <div className='min-h-screen bg-background p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-7xl space-y-12'>
        <DashboardHeader userName={session?.user?.name} />

        <div className='grid gap-8 lg:grid-cols-[1fr_350px]'>
          <div className='space-y-10'>
            <QuickActions />
            <PublicArenas userId={session?.user?.id} />
          </div>

          <Sidebar />
        </div>
      </div>
    </div>
  );
}
