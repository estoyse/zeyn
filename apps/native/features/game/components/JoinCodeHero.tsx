import { Ionicons } from "@expo/vector-icons";
import { formatGameCode } from "@zeyn/api/game-code";
import * as Clipboard from "expo-clipboard";
import { useToast } from "heroui-native";
import { useTranslation } from "react-i18next";
import { Share, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { Button, Heading, MeshSurface, PressableScale, Text } from "@/components/ui";
import { haptic } from "@/lib/haptics";
import { SPRING } from "@/lib/motion";

const StyledIonicons = withUniwind(Ionicons);

interface JoinCodeHeroProps {
  gameId: string;
  gameName: string | null;
}

export function JoinCodeHero({ gameId, gameName }: JoinCodeHeroProps) {
  const { t } = useTranslation("game");
  const { toast } = useToast();
  const punch = useSharedValue(0);

  const copyCode = async () => {
    punch.value = withSequence(
      withTiming(1, { duration: 90 }),
      withSpring(0, SPRING.bouncy)
    );
    haptic("impact");
    await Clipboard.setStringAsync(gameId);
    toast.show({ variant: "success", label: t("lobby.codeCopied") });
  };

  const shareRoom = async () => {
    const code = formatGameCode(gameId);
    await Share.share({
      message: gameName ? `${gameName} — ${code}` : code,
    });
  };

  const punchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + punch.value * 0.06 }],
  }));

  return (
    <MeshSurface tone="brand" className="items-center gap-4 px-5 py-6">
      <Text className="text-caption uppercase text-white/60">
        {t("lobby.joinCode")}
      </Text>

      <PressableScale
        haptic={null}
        onPress={copyCode}
        accessibilityLabel={t("lobby.copyCode")}
        className="items-center gap-2"
      >
        <Animated.View style={punchStyle}>
          <Heading className="text-display tracking-[0.2em] text-white">
            {formatGameCode(gameId)}
          </Heading>
        </Animated.View>
        <View className="flex-row items-center gap-1.5">
          <StyledIonicons name="copy-outline" size={13} className="text-white/60" />
          <Text className="text-caption uppercase text-white/60">
            {t("lobby.tapToCopy")}
          </Text>
        </View>
      </PressableScale>

      <Button variant="outline" size="sm" className="border-white/25 bg-white/10" onPress={shareRoom}>
        <StyledIonicons name="share-outline" size={15} className="text-white" />
        <Button.Label className="text-white">{t("lobby.shareLink")}</Button.Label>
      </Button>
    </MeshSurface>
  );
}
