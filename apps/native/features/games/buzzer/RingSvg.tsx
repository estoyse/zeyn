import Animated, {
  interpolateColor,
  useAnimatedProps,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { NEON } from "@/lib/neon";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RingProps = {
  size: number;
  strokeWidth: number;
  progress: SharedValue<number>;
  urgency: SharedValue<number>;
  pressBoost: SharedValue<number>;
  dimmed?: boolean;
};

export function Ring({
  size,
  strokeWidth,
  progress,
  urgency,
  pressBoost,
  dimmed = false,
}: RingProps) {
  const inset = strokeWidth / 2 + 2;
  const radius = (size - inset * 2) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
    stroke: dimmed
      ? NEON.ringTrack
      : interpolateColor(
          progress.value,
          [0, 0.15, 0.4, 1],
          [NEON.ringDanger, NEON.ringDanger, NEON.ringWarn, NEON.ringSafe]
        ),
  }));

  const haloProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
    strokeWidth: strokeWidth + 6 + urgency.value * 6 + pressBoost.value * 0.5,
    strokeOpacity: dimmed ? 0 : 0.18 + urgency.value * 0.22,
    stroke: dimmed
      ? NEON.ringTrack
      : interpolateColor(
          progress.value,
          [0, 0.15, 0.4, 1],
          [NEON.ringDanger, NEON.ringDanger, NEON.ringWarn, NEON.ringSafe]
        ),
  }));

  return (
    <Svg width={size} height={size} style={{ position: "absolute" }}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={NEON.ringTrack}
        strokeWidth={strokeWidth}
        fill="none"
      />

      <AnimatedCircle
        animatedProps={haloProps}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        transform={`rotate(-90 ${center} ${center})`}
      />

      <AnimatedCircle
        animatedProps={arcProps}
        cx={center}
        cy={center}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </Svg>
  );
}
