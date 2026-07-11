export const palette = {
  light: {
    background: "#ffffff",
    foreground: "#090b0c",
    card: "#ffffff",
    cardForeground: "#090b0c",
    muted: "#f1f3f3",
    mutedForeground: "#67787c",
    secondary: "#f1f3f3",
    secondaryForeground: "#161b1d",
    primary: "#000000",
    primaryForeground: "#f9fbfb",
    brand: "#3e65ed",
    brandForeground: "#f9fbfb",
    buzzer: "#fac053",
    buzzerForeground: "#131a29",
    destructive: "#e7000b",
    success: "#0a924b",
    warning: "#e19100",
    border: "#e3e7e8",
    input: "#e3e7e8",
    ring: "#9ca8ab",
  },
  dark: {
    background: "#090b0c",
    foreground: "#f9fbfb",
    card: "#161b1d",
    cardForeground: "#f9fbfb",
    muted: "#22292b",
    mutedForeground: "#9ca8ab",
    secondary: "#22292b",
    secondaryForeground: "#f9fbfb",
    primary: "#e3e7e8",
    primaryForeground: "#161b1d",
    brand: "#6690ff",
    brandForeground: "#f9fbfb",
    buzzer: "#fac053",
    buzzerForeground: "#131a29",
    destructive: "#ff6467",
    success: "#2bbb71",
    warning: "#f3b01d",
    border: "rgba(255,255,255,0.1)",
    input: "rgba(255,255,255,0.15)",
    ring: "#67787c",
  },
} as const;

export type ThemeName = "light" | "dark";
export type PaletteColor = keyof (typeof palette)["light"];

export function getPalette(theme: ThemeName) {
  return palette[theme];
}
