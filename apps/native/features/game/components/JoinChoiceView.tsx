import { Ionicons } from "@expo/vector-icons";
import { NAME_MAX_LENGTH } from "@zeyn/api/game-types";
import { router, type Href } from "expo-router";
import { Input, TextField } from "heroui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { Button, Heading, Text } from "@/components/ui";

const StyledIonicons = withUniwind(Ionicons);

interface JoinChoiceViewProps {
  gameId: string;
  onJoinAsGuest: (name: string) => void;
  onWatch: () => void;
  pending?: boolean;
  allowGuests?: boolean;
}

export function JoinChoiceView({
  gameId,
  onJoinAsGuest,
  onWatch,
  pending = false,
  allowGuests = true,
}: JoinChoiceViewProps) {
  const { t } = useTranslation("game");
  const [name, setName] = useState("");
  const trimmed = name.trim();

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background px-6">
      <View className="items-center gap-3">
        <View className="size-16 items-center justify-center rounded-full bg-brand/10">
          <StyledIonicons name="person-circle" size={36} className="text-brand" />
        </View>
        <Heading className="text-xl">{t("auth.loginRequired.title")}</Heading>
        <Text className="text-muted-foreground text-center text-sm">
          {t("auth.loginRequired.description")}
        </Text>
      </View>

      <View className="w-full max-w-sm gap-3">
        {allowGuests && (
          <>
            <TextField>
              <Input
                value={name}
                onChangeText={setName}
                maxLength={NAME_MAX_LENGTH}
                placeholder={t("auth.joinChoice.namePlaceholder")}
                autoCapitalize="words"
              />
            </TextField>

            <Button
              isDisabled={!trimmed || pending}
              onPress={() => {
                if (trimmed) onJoinAsGuest(trimmed);
              }}
            >
              <Button.Label>{t("auth.joinChoice.joinAsGuest")}</Button.Label>
            </Button>
          </>
        )}

        <Button variant="outline" isDisabled={pending} onPress={onWatch}>
          <Button.Label>{t("auth.joinChoice.watch")}</Button.Label>
        </Button>

        <Button
          variant="ghost"
          onPress={() =>
            router.push(
              `/(auth)/login?returnTo=/game/${encodeURIComponent(gameId)}` as Href
            )
          }
        >
          <Button.Label>{t("auth.loginRequired.signIn")}</Button.Label>
        </Button>
      </View>
    </View>
  );
}
