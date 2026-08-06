import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { Button, Heading, Text } from "@/components/ui";

const StyledIonicons = withUniwind(Ionicons);

interface LocalErrorViewProps {
  message: string;
  hints?: string[];
  detail?: string | null;
  actionLabel: string;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function LocalErrorView({
  message,
  hints,
  detail,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: LocalErrorViewProps) {
  const { t } = useTranslation("game");

  return (
    <View className="flex-1 items-center justify-center gap-6 px-6">
      <View className="items-center gap-3">
        <View className="size-16 items-center justify-center rounded-full bg-destructive/10">
          <StyledIonicons
            name="wifi-outline"
            size={32}
            className="text-destructive"
          />
        </View>
        <Heading className="text-center text-xl">
          {t("local.errors.title")}
        </Heading>
        <Text className="text-center text-muted-foreground text-sm">
          {message}
        </Text>
        {detail ? (
          <Text className="text-center text-muted-foreground text-xs">
            {detail}
          </Text>
        ) : null}
      </View>

      {hints?.length ? (
        <View className="w-full max-w-sm gap-3 rounded-card border border-border bg-muted-surface p-4">
          {hints.map(hint => (
            <View key={hint} className="flex-row items-start gap-2">
              <StyledIonicons
                name="bulb-outline"
                size={16}
                className="text-brand"
              />
              <Text className="flex-1 text-muted-foreground text-xs">
                {hint}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="w-full max-w-sm gap-2">
        <Button onPress={onAction}>
          <Button.Label>{actionLabel}</Button.Label>
        </Button>
        {secondaryLabel && onSecondary ? (
          <Button variant="ghost" onPress={onSecondary}>
            <Button.Label>{secondaryLabel}</Button.Label>
          </Button>
        ) : null}
      </View>
    </View>
  );
}
