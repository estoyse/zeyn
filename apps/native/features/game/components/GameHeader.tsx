import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Alert, View } from "react-native";
import { withUniwind } from "uniwind";

import { Button, Logo, LogoMark, PressableScale, Text } from "@/components/ui";
import { setGameStyle, setSfxMuted, usePrefs } from "@/lib/prefs";

const StyledIonicons = withUniwind(Ionicons);

interface GameHeaderProps {
  gameId: string;
  onLeave: () => void;
}

export function GameHeader({ gameId, onLeave }: GameHeaderProps) {
  const { t } = useTranslation("game");
  const { sfxMuted, gameStyle } = usePrefs();

  const confirmLeave = () => {
    Alert.alert(
      t("header.leaveConfirm.title"),
      t("header.leaveConfirm.description"),
      [
        { text: t("header.leave"), style: "cancel" },
        {
          text: t("header.leaveConfirm.confirm"),
          style: "destructive",
          onPress: onLeave,
        },
      ]
    );
  };

  return (
    <View className="flex-row items-center justify-between gap-3 border-b border-border px-4 py-3">
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <View className="size-10 items-center justify-center rounded-card bg-brand">
          <LogoMark size={20} />
        </View>
        <View className="min-w-0 flex-1">
          <Logo size="sm" />
          <Text className="text-caption uppercase text-muted-foreground">
            {t("header.room", { gameId })}
          </Text>
        </View>
      </View>

      <PressableScale
        haptic="toggle"
        onPress={() => setGameStyle(gameStyle === "neon" ? "refined" : "neon")}
        accessibilityRole="button"
        accessibilityLabel={t("header.style")}
        className="size-10 items-center justify-center rounded-pill bg-muted-surface"
      >
        <StyledIonicons
          name={gameStyle === "neon" ? "flash" : "contrast"}
          size={17}
          className={gameStyle === "neon" ? "text-buzzer" : "text-foreground"}
        />
      </PressableScale>

      <PressableScale
        haptic="toggle"
        onPress={() => setSfxMuted(!sfxMuted)}
        accessibilityRole="switch"
        accessibilityState={{ checked: !sfxMuted }}
        accessibilityLabel={t(sfxMuted ? "header.unmute" : "header.mute")}
        className="size-10 items-center justify-center rounded-pill bg-muted-surface"
      >
        <StyledIonicons
          name={sfxMuted ? "volume-mute" : "volume-medium"}
          size={18}
          className={sfxMuted ? "text-muted-foreground" : "text-foreground"}
        />
      </PressableScale>

      <Button variant="danger" size="sm" onPress={confirmLeave}>
        <StyledIonicons name="log-out-outline" size={16} className="text-danger-foreground" />
        <Button.Label>{t("header.leave")}</Button.Label>
      </Button>
    </View>
  );
}
