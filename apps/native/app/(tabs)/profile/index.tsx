import { useQuery } from "@tanstack/react-query";
import { router, type Href } from "expo-router";
import { Card } from "heroui-native";
import { useTranslation } from "react-i18next";

import { Button, Heading, Screen, Text } from "@/components/ui";
import { ProfileGamesSection } from "@/features/profile/components/ProfileGamesSection";
import { ProfileSkeleton } from "@/features/profile/components/ProfileSkeleton";
import { ProfileView } from "@/features/profile/components/ProfileView";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

function ProfileLoading() {
  return (
    <Screen contentClassName="gap-8 px-6 py-6">
      <ProfileSkeleton />
    </Screen>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation("profile");
  const { t: tAuth } = useTranslation("auth");
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const meQuery = useQuery({
    ...trpc.profile.getMe.queryOptions(),
    enabled: !!session?.user,
  });

  const username = meQuery.data?.username;

  const profileQuery = useQuery({
    ...trpc.profile.getByUsername.queryOptions({ username: username ?? "" }),
    enabled: !!username,
  });

  if (sessionPending) {
    return <ProfileLoading />;
  }

  if (!session?.user) {
    return (
      <Screen contentClassName="items-center justify-center gap-4 px-6">
        <Card className="w-full">
          <Card.Body className="items-center gap-2">
            <Heading className="text-center">
              {t("signInCta.title", "Sign in to view your profile")}
            </Heading>
            <Text className="text-muted-foreground text-center text-sm">
              {t(
                "signInCta.description",
                "Track your games, stats, and account settings.",
              )}
            </Text>
          </Card.Body>
          <Card.Footer>
            <Button className="w-full" onPress={() => router.push("/(auth)/login" as Href)}>
              <Button.Label>{tAuth("login.submitButton")}</Button.Label>
            </Button>
          </Card.Footer>
        </Card>
      </Screen>
    );
  }

  if (meQuery.isLoading || profileQuery.isLoading || !profileQuery.data) {
    return <ProfileLoading />;
  }

  const data = profileQuery.data;

  return (
    <Screen contentClassName="gap-8 px-6 py-6">
      <ProfileView user={data.user} stats={data.stats} isOwner />

      <ProfileGamesSection history={data.history} hostedGames={data.hostedGames} />
    </Screen>
  );
}
