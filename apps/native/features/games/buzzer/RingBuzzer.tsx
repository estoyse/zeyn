import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { Text } from "@/components/ui";
import { haptic } from "@/lib/haptics";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { Ring } from "./Ring";

export type BuzzState = "armed" | "out" | "won" | "spectator";

type RingBuzzerProps = {
  progress: SharedValue<number>;
  urgency: SharedValue<number>;
  state: BuzzState;
  onBuzz: () => void;
  size?: number;
};

const STROKE = 10;

export function RingBuzzer({
  progress,
  urgency,
  state,
  onBuzz,
  size = 208,
}: RingBuzzerProps) {
  const { t } = useTranslation("game");
  const reduced = useReducedMotion();

  const press = useSharedValue(0);
  const shock = useSharedValue(0);
  const idle = useSharedValue(0);
  const pressBoost = useSharedValue(0);

  const armed = state === "armed";
  const core = size - STROKE * 2 - 22;

  useEffect(() => {
    if (!armed || reduced) {
      cancelAnimation(idle);
      idle.value = withTiming(0, { duration: 120 });
      return;
    }

    idle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 620, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 620, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      false
    );

    return () => cancelAnimation(idle);
  }, [armed, reduced, idle]);

  const tap = Gesture.Tap()
    .enabled(armed)
    .maxDuration(10000)
    .shouldCancelWhenOutside(false)
    .onBegin(() => {
      press.value = withTiming(1, { duration: 60 });
      pressBoost.value = withTiming(10, { duration: 60 });
      if (!reduced) {
        shock.value = 0;
        shock.value = withTiming(1, {
          duration: 450,
          easing: Easing.out(Easing.quad),
        });
      }
      runOnJS(haptic)("heavy");
      runOnJS(onBuzz)();
    })
    .onFinalize(() => {
      press.value = withSpring(0, SPRING.press);
      pressBoost.value = withTiming(0, { duration: 220 });
    });

  const coreStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + idle.value * 0.03 - press.value * 0.1 },
      { translateY: press.value * 3 },
    ],
  }));

  const shockStyle = useAnimatedStyle(() => ({
    opacity: shock.value === 0 ? 0 : 1 - shock.value,
    transform: [{ scale: 1 + shock.value * 0.45 }],
  }));

  const coreClass = cn(
    "absolute items-center justify-center rounded-full",
    armed && "bg-buzzer",
    state === "won" && "bg-success",
    state === "out" && "border-2 border-destructive bg-muted-surface opacity-50",
    state === "spectator" && "bg-muted-surface opacity-60"
  );

  const labelClass = cn(
    "text-title-3 font-bold uppercase",
    armed && "text-buzzer-foreground",
    state === "won" && "text-background",
    state !== "armed" && state !== "won" && "text-muted-foreground"
  );

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center"
    >
      <Ring
        size={size}
        strokeWidth={STROKE}
        progress={progress}
        urgency={urgency}
        pressBoost={pressBoost}
        dimmed={state === "out"}
      />

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, shockStyle]}
        className="rounded-full border-2 border-buzzer"
      />

      <GestureDetector gesture={tap}>
        <Animated.View
          style={[coreStyle, { width: core, height: core }]}
          className={coreClass}
        >
          {armed ? (
            <Ionicons name="flash" size={30} color="#15100A" />
          ) : null}
          <Text className={labelClass}>
            {state === "out"
              ? t("playing.out")
              : state === "won"
                ? t("playing.yourTurn")
                : t("playing.buzz")}
          </Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
