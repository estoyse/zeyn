import Svg, { Path } from "react-native-svg";
import { View } from "react-native";

import { useAppTheme } from "@/contexts/app-theme-context";
import { getPalette } from "@/lib/colors";
import { cn } from "@/lib/utils";

import { Heading } from "./text";

type LogoMarkProps = {
  size?: number;
  color?: string;
};

export function LogoMark({ size = 24, color }: LogoMarkProps) {
  const { isLight } = useAppTheme();
  const fill = color ?? getPalette(isLight ? "light" : "dark").brand;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M20 16 H80 V33 L47 62 H80 V84 H20 V67 L53 38 H20 Z" fill={fill} />
    </Svg>
  );
}

const wordmarkSize = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-6xl",
} as const;

const dotSize = {
  sm: "size-1.5",
  md: "size-2",
  lg: "size-2.5",
  xl: "size-3",
} as const;

type LogoProps = {
  size?: keyof typeof wordmarkSize;
  className?: string;
};

export function Logo({ size = "md", className }: LogoProps) {
  return (
    <View className={cn("flex-row items-end", className)}>
      <Heading weight="bold" className={cn("lowercase tracking-tight", wordmarkSize[size])}>
        zeyn
      </Heading>
      <View className={cn("mb-1 ml-0.5 rounded-full bg-buzzer", dotSize[size])} />
    </View>
  );
}

export function LogoLockup({ size = "md", className }: LogoProps) {
  const { isLight } = useAppTheme();
  const brandForeground = getPalette(isLight ? "light" : "dark").brandForeground;

  return (
    <View className={cn("flex-row items-center gap-2", className)}>
      <View className="size-8 items-center justify-center bg-brand">
        <LogoMark size={20} color={brandForeground} />
      </View>
      <Logo size={size} />
    </View>
  );
}
