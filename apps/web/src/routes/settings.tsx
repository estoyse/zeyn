import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@zeyn/ui/components/tabs";
import { Skeleton } from "@zeyn/ui/components/skeleton";
import { authClient } from "@/features/auth/lib/auth-client";
import { AccountSettings } from "@/features/profile/settings/AccountSettings";
import { DangerZone } from "@/features/profile/settings/DangerZone";
import { PasswordSettings } from "@/features/profile/settings/PasswordSettings";
import { PrivacySettings } from "@/features/profile/settings/PrivacySettings";
import { trpc } from "@/shared/lib/trpc";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({ to: "/auth/login" });
    }
    return { session: session.data };
  },
});

function SettingsPage() {
  const meQuery = useQuery(trpc.profile.getMe.queryOptions());
  const me = meQuery.data;

  return (
    <div className='min-h-full bg-background p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl space-y-8'>
        <header className='space-y-1'>
          <h1 className='text-3xl font-bold'>Settings</h1>
          <p className='text-muted-foreground'>
            Manage your profile, privacy, and account.
          </p>
        </header>

        {!me ? (
          <div className='space-y-4'>
            <Skeleton className='h-10 w-full max-w-sm' />
            <Skeleton className='h-64 w-full' />
          </div>
        ) : (
          <Tabs defaultValue='account'>
            <TabsList>
              <TabsTrigger value='account'>Account</TabsTrigger>
              <TabsTrigger value='privacy'>Privacy</TabsTrigger>
              <TabsTrigger value='security'>Security</TabsTrigger>
              <TabsTrigger value='danger'>Danger</TabsTrigger>
            </TabsList>

            <TabsContent value='account' className='pt-8'>
              <AccountSettings
                me={{ name: me.name, username: me.username, bio: me.bio }}
              />
            </TabsContent>

            <TabsContent value='privacy' className='pt-8'>
              <PrivacySettings
                me={{
                  isProfilePublic: me.isProfilePublic,
                  showStats: me.showStats,
                  showHistory: me.showHistory,
                  showHostedGames: me.showHostedGames,
                }}
              />
            </TabsContent>

            <TabsContent value='security' className='pt-8'>
              <PasswordSettings />
            </TabsContent>

            <TabsContent value='danger' className='pt-8'>
              <DangerZone username={me.username} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
