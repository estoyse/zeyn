import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { Button, Heading, Text } from "@/components/ui";

const StyledIonicons = withUniwind(Ionicons);

interface ConnectionErrorViewProps {
  error: string;
  onRetry: () => void;
}

export function ConnectionErrorView({ error, onRetry }: ConnectionErrorViewProps) {
  const { t } = useTranslation("game");

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background px-6">
      <View className="items-center gap-3">
        <View className="size-16 items-center justify-center rounded-full bg-destructive/10">
          <StyledIonicons name="close-circle" size={32} className="text-destructive" />
        </View>
        <Heading className="text-destructive text-xl">
          {t("errors.connection.title")}
        </Heading>
        <Text className="text-muted-foreground text-center text-sm">{t(error)}</Text>
      </View>

      <Button className="w-full max-w-sm" onPress={onRetry}>
        <Button.Label>{t("errors.connection.retry")}</Button.Label>
      </Button>
    </View>
  );
}
