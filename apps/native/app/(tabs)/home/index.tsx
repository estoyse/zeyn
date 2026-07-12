import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Heading, Screen, Text } from "@/components/ui";
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
        <PlayNowTiles />
      </View>

      {user ? <LiveNowStrip /> : null}

      <View className="px-6">
        {user ? (
          <RecentGamesSection enabled />
        ) : (
          <View className="items-center gap-3 rounded-card border border-border bg-card p-6">
            <Text className="text-center text-muted-foreground text-sm">
              {t("recentGames.empty")}
            </Text>
            <Button
              className="w-full"
              onPress={() => router.push("/(auth)/login" as Href)}
            >
              <Button.Label>{tAuth("login.submitButton")}</Button.Label>
            </Button>
          </View>
        )}
      </View>
    </Screen>
  );
}
