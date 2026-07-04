import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
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
import { LanguageToggle } from "@/shared/components/language-toggle";
import { ModeToggle } from "@/shared/components/mode-toggle";
import { trpc } from "@/shared/lib/trpc";

export const Route = createFileRoute("/_app/settings")({
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
  const { t } = useTranslation();
  const meQuery = useQuery(trpc.profile.getMe.queryOptions());
  const me = meQuery.data;

  return (
    <div className='min-h-full bg-background p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl space-y-8'>
        <header className='space-y-1'>
          <h1 className='text-3xl font-bold'>{t("settings:title")}</h1>
          <p className='text-muted-foreground'>{t("settings:subtitle")}</p>
        </header>

        {!me ? (
          <div className='space-y-4'>
            <Skeleton className='h-10 w-full max-w-sm' />
            <Skeleton className='h-64 w-full' />
          </div>
        ) : (
          <Tabs defaultValue='account'>
            <TabsList>
              <TabsTrigger value='account'>{t("settings:tabs.account")}</TabsTrigger>
              <TabsTrigger value='privacy'>{t("settings:tabs.privacy")}</TabsTrigger>
              <TabsTrigger value='security'>{t("settings:tabs.security")}</TabsTrigger>
              <TabsTrigger value='preferences'>
                {t("settings:preferences.title")}
              </TabsTrigger>
              <TabsTrigger value='danger'>{t("settings:tabs.danger")}</TabsTrigger>
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

            <TabsContent value='preferences' className='pt-8'>
              <div className='divide-y border'>
                <div className='flex items-center justify-between gap-4 p-4'>
                  <div className='space-y-0.5'>
                    <p className='text-sm font-medium'>
                      {t("settings:preferences.theme.label")}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {t("settings:preferences.theme.description")}
                    </p>
                  </div>
                  <ModeToggle />
                </div>
                <div className='flex items-center justify-between gap-4 p-4'>
                  <div className='space-y-0.5'>
                    <p className='text-sm font-medium'>
                      {t("settings:preferences.language.label")}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {t("settings:preferences.language.description")}
                    </p>
                  </div>
                  <LanguageToggle />
                </div>
              </div>
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
