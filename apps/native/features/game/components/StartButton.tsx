import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { Button } from "@/components/ui";

const StyledIonicons = withUniwind(Ionicons);

interface StartButtonProps {
  canStart: boolean;
  onStart: () => void;
}

export function StartButton({ canStart, onStart }: StartButtonProps) {
  const { t } = useTranslation("game");
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!canStart || reduced) {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 160 });
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 720, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 720, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    return () => cancelAnimation(pulse);
  }, [canStart, reduced, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.02 }],
  }));

  return (
    <Animated.View style={pulseStyle}>
      <Button isDisabled={!canStart} onPress={onStart}>
        <StyledIonicons name="play" size={16} className="text-primary-foreground" />
        <Button.Label>{t("lobby.startGame")}</Button.Label>
      </Button>
    </Animated.View>
  );
}
