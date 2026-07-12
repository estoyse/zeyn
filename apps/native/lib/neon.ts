export const NEON = {
  ringSafe: "#2DE2FF",
  ringWarn: "#FFC24B",
  ringDanger: "#FF3B5C",
  ringTrack: "#22222E",
  glow: "#6D7BFF",
  success: "#3DFFA8",
  danger: "#FF3B5C",
  buzzer: "#FFC24B",
  background: "#0B0B12",
} as const;

export const REFINED = {
  ringSafe: "#E4E8F0",
  ringWarn: "#E3B341",
  ringDanger: "#E5484D",
  ringTrack: "#1E1E26",
  glow: "#7C8AF0",
  success: "#43C97E",
  danger: "#E5484D",
  buzzer: "#E4E8F0",
  background: "#0E0E13",
} as const;

export type GameStyle = "refined" | "neon";

export function palette(style: GameStyle) {
  return style === "neon" ? NEON : REFINED;
}
