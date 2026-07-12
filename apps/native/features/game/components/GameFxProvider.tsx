import { Canvas, Circle } from "@shopify/react-native-skia";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
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

  const fx = useMemo<GameFx>(() => ({ flash, shake, burst }), [flash, shake, burst]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor: flashColor.value,
  }));

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
});
