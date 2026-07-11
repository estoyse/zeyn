import { useQuery } from "@tanstack/react-query";
import { router, type Href } from "expo-router";
import { Card, Skeleton } from "heroui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Heading, Screen, Text } from "@/components/ui";
import { ProfileGamesList } from "@/features/profile/components/ProfileGamesList";
import { ProfileView } from "@/features/profile/components/ProfileView";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

function ProfileSkeleton() {
  return (
    <Screen contentClassName="gap-8 px-6 py-6">
      <View className="flex-row items-start gap-4">
        <Skeleton className="size-20 rounded-full" />
        <View className="flex-1 gap-2 pt-1">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </View>
      </View>
      <View className="flex-row flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 min-w-[45%] flex-1 rounded-xl" />
        ))}
      </View>
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
    return <ProfileSkeleton />;
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
    return <ProfileSkeleton />;
  }

  const data = profileQuery.data;

  return (
    <Screen contentClassName="gap-8 px-6 py-6">
      <ProfileView user={data.user} stats={data.stats} isOwner />

      {data.history ? (
        <View className="gap-3">
          <Heading className="text-base">{t("recentGames.title")}</Heading>
          <ProfileGamesList items={data.history} emptyLabel={t("recentGames.empty")} />
        </View>
      ) : null}

      {data.hostedGames ? (
        <View className="gap-3">
          <Heading className="text-base">{t("hostedGames.title")}</Heading>
          <ProfileGamesList items={data.hostedGames} emptyLabel={t("hostedGames.empty")} />
        </View>
      ) : null}
    </Screen>
  );
}
