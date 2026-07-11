import { Spinner } from "heroui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Text } from "@/components/ui";

export function ReconnectingBanner() {
  const { t } = useTranslation("game");

  return (
    <View className="flex-row items-center justify-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2">
      <Spinner size="sm" color="warning" />
      <Text className="text-warning text-xs">{t("connection.reconnecting")}</Text>
    </View>
  );
}
