import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { cn } from "@/lib/utils";

export type FontWeight = "regular" | "medium" | "semibold" | "bold";

const ibmPlexSansFamily: Record<FontWeight, string> = {
  regular: "IBMPlexSans_400Regular",
  medium: "IBMPlexSans_500Medium",
  semibold: "IBMPlexSans_600SemiBold",
  bold: "IBMPlexSans_700Bold",
};

const spaceGroteskFamily: Record<FontWeight, string> = {
  regular: "SpaceGrotesk_400Regular",
  medium: "SpaceGrotesk_500Medium",
  semibold: "SpaceGrotesk_600SemiBold",
  bold: "SpaceGrotesk_700Bold",
};

type TextProps = RNTextProps & {
  weight?: FontWeight;
  className?: string;
};

export function Text({ weight = "regular", className, style, ...rest }: TextProps) {
  return (
    <RNText
      className={cn("text-foreground", className)}
      style={[{ fontFamily: ibmPlexSansFamily[weight] }, style]}
      {...rest}
    />
  );
}

type HeadingProps = RNTextProps & {
  weight?: FontWeight;
  className?: string;
};

export function Heading({ weight = "semibold", className, style, ...rest }: HeadingProps) {
  return (
    <RNText
      className={cn("text-foreground", className)}
      style={[{ fontFamily: ibmPlexSansFamily[weight] }, style]}
      {...rest}
    />
  );
}

export function Display({ weight = "bold", className, style, ...rest }: HeadingProps) {
  return (
    <RNText
      className={cn("text-foreground", className)}
      style={[{ fontFamily: spaceGroteskFamily[weight] }, style]}
      {...rest}
    />
  );
}

export function Numeric({ weight = "semibold", className, style, ...rest }: HeadingProps) {
  return (
    <RNText
      className={cn("text-foreground", className)}
      style={[{ fontFamily: spaceGroteskFamily[weight] }, style]}
      {...rest}
    />
  );
}

type EyebrowProps = RNTextProps & { className?: string };

export function Eyebrow({ className, style, ...rest }: EyebrowProps) {
  return (
    <RNText
      className={cn("text-caption text-muted-foreground uppercase", className)}
      style={[{ fontFamily: ibmPlexSansFamily.semibold }, style]}
      {...rest}
    />
  );
}
