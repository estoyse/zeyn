import { Spinner } from "heroui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Text } from "@/components/ui";

export function ConnectingView() {
  const { t } = useTranslation("game");

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
      <Spinner size="lg" />
      <Text className="text-muted-foreground text-sm">
        {t("loading.connectingToRoom")}
      </Text>
    </View>
  );
}
