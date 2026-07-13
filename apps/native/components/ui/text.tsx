import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { cn } from "@/lib/utils";

export type FontWeight = "regular" | "medium" | "semibold" | "bold";

const ibmPlexSansFamily: Record<FontWeight, string> = {
  regular: "IBMPlexSans-Regular",
  medium: "IBMPlexSans-Medium",
  semibold: "IBMPlexSans-SemiBold",
  bold: "IBMPlexSans-Bold",
};

const DISPLAY_FAMILY = "SpaceGrotesk-Bold";

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

type DisplayProps = RNTextProps & {
  className?: string;
};

export function Display({ className, style, ...rest }: DisplayProps) {
  return (
    <RNText
      className={cn("text-foreground", className)}
      style={[{ fontFamily: DISPLAY_FAMILY }, style]}
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
