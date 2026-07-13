import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, EmptyState, Heading, Screen } from "@/components/ui";
import { JoinBar } from "@/features/dashboard/components/JoinBar";
import { LiveNowStrip } from "@/features/dashboard/components/LiveNowStrip";
import { PlayNowTiles } from "@/features/dashboard/components/PlayNowTiles";
import { RecentGamesSection } from "@/features/dashboard/components/RecentGamesSection";
import { authClient } from "@/lib/auth-client";

function greetingKey(hour: number) {
  if (hour < 12) return "greeting.morning";
  if (hour < 18) return "greeting.afternoon";
  return "greeting.evening";
}

export default function HomeScreen() {
  const { t } = useTranslation("dashboard");
  const { t: tAuth } = useTranslation("auth");
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const greeting = user
    ? `${t(greetingKey(new Date().getHours()))}, ${user.name}`
    : t("greeting.anon");

  return (
    <Screen contentClassName="px-0">
      <View className="gap-4 px-6">
        <Heading className="text-title-1">{greeting}</Heading>
        <JoinBar />
      </View>

      <View className="px-6">
        <PlayNowTiles enabled={!!user} />
      </View>

      {user ? <LiveNowStrip /> : null}

      <View className="px-6">
        {user ? (
          <RecentGamesSection enabled />
        ) : (
          <EmptyState
            icon="game-controller"
            title={t("recentGames.empty")}
            caption={t("greeting.anon")}
            action={
              <Button onPress={() => router.push("/(auth)/login" as Href)}>
                <Button.Label>{tAuth("login.submitButton")}</Button.Label>
              </Button>
            }
          />
        )}
      </View>
    </Screen>
  );
}
