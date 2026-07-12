import { Canvas, Circle } from "@shopify/react-native-skia";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { NEON } from "@/lib/neon";

export type FlashKind = "success" | "danger" | "neutral";

type GameFx = {
  flash: (kind: FlashKind) => void;
  shake: () => void;
  burst: (kind?: FlashKind) => void;
  points: (value: number) => void;
};

const FLASH_COLOR: Record<FlashKind, string> = {
  success: NEON.success,
  danger: NEON.danger,
  neutral: NEON.glow,
};

const FLASH_PEAK: Record<FlashKind, number> = {
  success: 0.26,
  danger: 0.3,
  neutral: 0.14,
};

const PARTICLE_COUNT = 18;

const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
  angle: (index / PARTICLE_COUNT) * Math.PI * 2,
  distance: 96 + (index % 5) * 30,
  radius: 3 + (index % 3),
}));

const GameFxContext = createContext<GameFx | null>(null);

export function useGameFx(): GameFx {
  const fx = useContext(GameFxContext);
  if (!fx) throw new Error("useGameFx must be used inside GameFxProvider");
  return fx;
}

export function GameFxProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const { width, height } = useWindowDimensions();

  const flashOpacity = useSharedValue(0);
  const flashColor = useSharedValue<string>(NEON.glow);
  const shakeX = useSharedValue(0);
  const burstProgress = useSharedValue(0);
  const burstColor = useSharedValue<string>(NEON.success);
  const pointsProgress = useSharedValue(0);
  const [awarded, setAwarded] = useState<number | null>(null);

  const flash = useCallback(
    (kind: FlashKind) => {
      flashColor.value = FLASH_COLOR[kind];
      const peak = reduced ? FLASH_PEAK[kind] * 0.4 : FLASH_PEAK[kind];
      flashOpacity.value = withSequence(
        withTiming(peak, { duration: 90, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 340, easing: Easing.in(Easing.quad) })
      );
    },
    [flashColor, flashOpacity, reduced]
  );

  const shake = useCallback(() => {
    if (reduced) return;
    shakeX.value = withSequence(
      withTiming(-9, { duration: 45 }),
      withTiming(8, { duration: 80 }),
      withTiming(-6, { duration: 75 }),
      withTiming(4, { duration: 65 }),
      withTiming(0, { duration: 55 })
    );
  }, [reduced, shakeX]);

  const burst = useCallback(
    (kind: FlashKind = "success") => {
      if (reduced) return;
      burstColor.value = FLASH_COLOR[kind];
      burstProgress.value = 0;
      burstProgress.value = withTiming(1, {
        duration: 720,
        easing: Easing.out(Easing.cubic),
      });
    },
    [burstColor, burstProgress, reduced]
  );

  const points = useCallback(
    (value: number) => {
      if (value === 0) return;
      setAwarded(value);
      pointsProgress.value = 0;
      pointsProgress.value = withTiming(1, {
        duration: 1150,
        easing: Easing.out(Easing.cubic),
      });
    },
    [pointsProgress]
  );

  const fx = useMemo<GameFx>(
    () => ({ flash, shake, burst, points }),
    [flash, shake, burst, points]
  );

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor: flashColor.value,
  }));

  const falling = (awarded ?? 0) < 0;

  const pointsStyle = useAnimatedStyle(() => {
    const p = pointsProgress.value;
    return {
      opacity: interpolate(p, [0, 0.1, 0.7, 1], [0, 1, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateY: (falling ? 1 : -1) * interpolate(p, [0, 1], [0, 96]) },
        { scale: interpolate(p, [0, 0.16, 1], [0.5, 1.18, 1], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <GameFxContext.Provider value={fx}>
      <Animated.View style={[styles.fill, shakeStyle]}>{children}</Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, flashStyle]}
      />

      <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
        {PARTICLES.map((particle, index) => (
          <Particle
            key={index}
            angle={particle.angle}
            distance={particle.distance}
            radius={particle.radius}
            originX={width / 2}
            originY={height / 2}
            progress={burstProgress}
            color={burstColor}
          />
        ))}
      </Canvas>

      {awarded !== null && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.pointsLayer]}
        >
          <Animated.Text
            style={[
              styles.pointsText,
              pointsStyle,
              { color: falling ? NEON.danger : NEON.success },
            ]}
          >
            {awarded > 0 ? `+${awarded}` : String(awarded)}
          </Animated.Text>
        </Animated.View>
      )}
    </GameFxContext.Provider>
  );
}

function Particle({
  angle,
  distance,
  radius,
  originX,
  originY,
  progress,
  color,
}: {
  angle: number;
  distance: number;
  radius: number;
  originX: number;
  originY: number;
  progress: SharedValue<number>;
  color: SharedValue<string>;
}) {
  const cx = useDerivedValue(
    () => originX + Math.cos(angle) * distance * progress.value
  );
  const cy = useDerivedValue(
    () => originY + Math.sin(angle) * distance * progress.value + progress.value * progress.value * 40
  );
  const opacity = useDerivedValue(() =>
    progress.value === 0 || progress.value === 1 ? 0 : 1 - progress.value
  );
  const r = useDerivedValue(() => radius * (1 - progress.value * 0.5));

  return <Circle cx={cx} cy={cy} r={r} color={color} opacity={opacity} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pointsLayer: { alignItems: "center", justifyContent: "center" },
  pointsText: {
    fontSize: 56,
    fontWeight: "800",
    letterSpacing: -1,
  },
});
