import {
  BlurMask,
  Canvas,
  Group,
  Path,
  Skia,
  interpolateColors,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { palette, type GameStyle } from "@/lib/neon";

type RingProps = {
  size: number;
  strokeWidth: number;
  progress: SharedValue<number>;
  urgency: SharedValue<number>;
  pressBoost: SharedValue<number>;
  dimmed?: boolean;
  style?: GameStyle;
};

export function Ring({
  size,
  strokeWidth,
  progress,
  urgency,
  pressBoost,
  dimmed = false,
  style = "refined",
}: RingProps) {
  const tone = palette(style);
  const neon = style === "neon";

  const inset = strokeWidth / 2 + 2;
  const diameter = size - inset * 2;

  const path = useMemo(() => {
    const p = Skia.Path.Make();
    p.addArc({ x: inset, y: inset, width: diameter, height: diameter }, -90, 360);
    return p;
  }, [inset, diameter]);

  const end = useDerivedValue(() => progress.value);

  const color = useDerivedValue(() =>
    dimmed
      ? interpolateColors(0, [0, 1], [tone.ringTrack, tone.ringTrack])
      : interpolateColors(
          progress.value,
          [0, 0.15, 0.4, 1],
          [tone.ringDanger, tone.ringDanger, tone.ringWarn, tone.ringSafe]
        )
  );

  const blur = useDerivedValue(() => {
    if (dimmed) return 0;
    if (neon) return 5 + urgency.value * 13 + pressBoost.value;
    return urgency.value * urgency.value * 6 + pressBoost.value * 0.35;
  });

  return (
    <Canvas style={{ width: size, height: size }}>
      <Path
        path={path}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeCap="round"
        color={tone.ringTrack}
      />
      <Group>
        <Path
          path={path}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
          start={0}
          end={end}
          color={color}
        >
          <BlurMask blur={blur} style="solid" />
        </Path>
      </Group>
    </Canvas>
  );
}
