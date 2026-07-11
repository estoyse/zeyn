import { Link, Stack } from "expo-router";
import { Surface } from "heroui-native";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { Button } from "@/components/ui";

export default function NotFoundScreen() {
  const { t } = useTranslation("common");

  return (
    <>
      <Stack.Screen options={{ title: t("notFound.title") }} />
      <Container>
        <View className="flex-1 justify-center items-center p-4">
          <Surface variant="secondary" className="items-center p-6 max-w-sm rounded-lg">
            <Text className="text-4xl mb-3">🤔</Text>
            <Text className="text-foreground font-medium text-lg mb-1">
              {t("notFound.title")}
            </Text>
            <Text className="text-muted text-sm text-center mb-4">
              {t("notFound.description")}
            </Text>
            <Link href="/" asChild>
              <Button size="sm">{t("notFound.goHome")}</Button>
            </Link>
          </Surface>
        </View>
      </Container>
    </>
  );
}
