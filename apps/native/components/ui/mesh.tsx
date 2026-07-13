import { useId, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Rect, Stop } from "react-native-svg";

import { MESH, type MeshTone } from "@/lib/mesh";
import { cn } from "@/lib/utils";

type MeshSurfaceProps = {
  tone?: MeshTone;
  radius?: string;
  className?: string;
  children?: ReactNode;
};

export function MeshSurface({
  tone = "brand",
  radius = "rounded-card",
  className,
  children,
}: MeshSurfaceProps) {
  const mesh = MESH[tone];
  const uid = useId().replace(/:/g, "");

  return (
    <View className={cn(radius, className)}>
      <View
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        className={cn("overflow-hidden", radius)}
      >
        <Svg width="100%" height="100%">
          <Defs>
            {mesh.blobs.map((blob, index) => (
              <RadialGradient
                key={index}
                id={`${uid}-${index}`}
                cx="50%"
                cy="50%"
                r="50%"
              >
                <Stop offset="0" stopColor={blob.color} stopOpacity={blob.opacity} />
                <Stop offset="1" stopColor={blob.color} stopOpacity={0} />
              </RadialGradient>
            ))}
          </Defs>

          <Rect x="0" y="0" width="100%" height="100%" fill={mesh.base} />

          {mesh.blobs.map((blob, index) => (
            <Ellipse
              key={index}
              cx={blob.cx}
              cy={blob.cy}
              rx={blob.r}
              ry={blob.r}
              fill={`url(#${uid}-${index})`}
            />
          ))}
        </Svg>
      </View>

      {children}
    </View>
  );
}
