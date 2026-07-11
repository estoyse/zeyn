import { router, type Href } from "expo-router";
import { Card } from "heroui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Button, Heading, Screen, Text } from "@/components/ui";
import { JoinByIdCard } from "@/features/dashboard/components/JoinByIdCard";
import { RecentGamesSection } from "@/features/dashboard/components/RecentGamesSection";
import { authClient } from "@/lib/auth-client";

export default function HomeScreen() {
  const { t } = useTranslation("dashboard");
  const { t: tAuth } = useTranslation("auth");
  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <Screen contentClassName="gap-6 px-6 py-6">
      <View className="gap-1">
        <Heading className="text-2xl">{t("header.title")}</Heading>
        {user ? (
          <Text className="text-muted-foreground">
            {t("header.welcome", { name: user.name })}
          </Text>
        ) : null}
      </View>

      <JoinByIdCard />

      {user ? (
        <RecentGamesSection enabled={!!user} />
      ) : (
        <Card>
          <Card.Body className="gap-3">
            <Card.Title>{t("recentGames.title")}</Card.Title>
            <Card.Description>{t("recentGames.empty")}</Card.Description>
          </Card.Body>
          <Card.Footer>
            <Button className="w-full" onPress={() => router.push("/(auth)/login" as Href)}>
              <Button.Label>{tAuth("login.submitButton")}</Button.Label>
            </Button>
          </Card.Footer>
        </Card>
      )}

      <Button variant="outline" onPress={() => router.push("/(tabs)/games" as Href)}>
        <Button.Label>{t("page.gamesHeading")}</Button.Label>
      </Button>
    </Screen>
  );
}
