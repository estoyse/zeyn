import { useThemeColor } from "heroui-native";
import { useCSSVariable } from "uniwind";

export { useThemeColor };

const appColorVars = {
  brand: "--color-brand",
  brandForeground: "--color-brand-foreground",
  buzzer: "--color-buzzer",
  buzzerForeground: "--color-buzzer-foreground",
  card: "--color-card",
  cardForeground: "--color-card-foreground",
  mutedSurface: "--color-muted-surface",
  mutedForeground: "--color-muted-foreground",
  destructive: "--color-destructive",
} as const;

export type AppColorName = keyof typeof appColorVars;

export function useAppColor<const T extends readonly AppColorName[]>(
  names: T
): { [K in keyof T]: string } {
  const resolved = useCSSVariable(names.map((name) => appColorVars[name]));
  return resolved.map((value) =>
    typeof value === "string" ? value : String(value ?? "")
  ) as { [K in keyof T]: string };
}
