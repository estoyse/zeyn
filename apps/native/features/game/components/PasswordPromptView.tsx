import Ionicons from "@expo/vector-icons/Ionicons";
import { Input, TextField } from "heroui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { Button, Heading, Text } from "@/components/ui";

const StyledIonicons = withUniwind(Ionicons);

interface PasswordPromptViewProps {
  onJoin: (password: string) => void;
  onBack: () => void;
}

export function PasswordPromptView({ onJoin, onBack }: PasswordPromptViewProps) {
  const { t } = useTranslation("game");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!password.trim()) {
      setError(t("auth.passwordPrompt.error"));
      return;
    }
    onJoin(password);
  };

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background px-6">
      <View className="items-center gap-3">
        <View className="size-16 items-center justify-center rounded-full bg-brand/10">
          <StyledIonicons name="lock-closed" size={32} className="text-brand" />
        </View>
        <Heading className="text-xl">{t("auth.passwordPrompt.title")}</Heading>
        <Text className="text-muted-foreground text-center text-sm">
          {t("auth.passwordPrompt.description")}
        </Text>
      </View>

      <View className="w-full max-w-sm gap-4">
        <TextField>
          <Input
            value={password}
            onChangeText={value => {
              setPassword(value);
              setError("");
            }}
            placeholder={t("auth.passwordPrompt.placeholder")}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </TextField>
        {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

        <View className="flex-row gap-3">
          <Button variant="outline" className="flex-1" onPress={onBack}>
            <Button.Label>{t("auth.passwordPrompt.back")}</Button.Label>
          </Button>
          <Button className="flex-1" onPress={handleSubmit}>
            <Button.Label>{t("auth.passwordPrompt.join")}</Button.Label>
          </Button>
        </View>
      </View>
    </View>
  );
}
