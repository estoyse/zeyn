import { Ionicons } from "@expo/vector-icons";
import { canonicalizeGameId } from "@zeyn/api/game-code";
import * as Clipboard from "expo-clipboard";
import { router, type Href } from "expo-router";
import { Input, TextField } from "heroui-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { PressableScale, Text } from "@/components/ui";
import { haptic } from "@/lib/haptics";

const StyledIonicons = withUniwind(Ionicons);

export function JoinBar() {
  const { t } = useTranslation("dashboard");
  const [code, setCode] = useState("");

  const join = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/game/${canonicalizeGameId(trimmed)}` as Href);
  };

  const pasteCode = async () => {
    const clip = (await Clipboard.getStringAsync()).trim();
    if (!clip) return;
    haptic("tap");
    setCode(clip);
    join(clip);
  };

  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-1">
        <TextField>
          <Input
            value={code}
            onChangeText={setCode}
            placeholder={t("joinById.placeholder")}
            autoCapitalize="characters"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="go"
            onSubmitEditing={() => join(code)}
          />
        </TextField>
      </View>

      <PressableScale
        onPress={pasteCode}
        accessibilityRole="button"
        accessibilityLabel={t("joinById.paste")}
        className="h-12 flex-row items-center gap-1.5 rounded-pill bg-muted-surface px-4"
      >
        <StyledIonicons name="clipboard-outline" size={15} className="text-foreground" />
        <Text weight="medium" className="text-sm">
          {t("joinById.paste")}
        </Text>
      </PressableScale>
    </View>
  );
}
