export type MeshTone = "brand" | "buzzer" | "music" | "amber" | "slate";

type Mesh = {
  base: string;
  blobs: { color: string; cx: string; cy: string; r: string; opacity: number }[];
};

export const MESH: Record<MeshTone, Mesh> = {
  brand: {
    base: "#2A2F6B",
    blobs: [
      { color: "#5B6BF5", cx: "18%", cy: "10%", r: "70%", opacity: 0.95 },
      { color: "#8E5BF5", cx: "88%", cy: "24%", r: "62%", opacity: 0.7 },
      { color: "#1B1F52", cx: "62%", cy: "104%", r: "78%", opacity: 0.9 },
    ],
  },
  buzzer: {
    base: "#20265E",
    blobs: [
      { color: "#4C63F0", cx: "12%", cy: "6%", r: "72%", opacity: 1 },
      { color: "#F0B23C", cx: "96%", cy: "12%", r: "48%", opacity: 0.55 },
      { color: "#171A45", cx: "70%", cy: "108%", r: "80%", opacity: 0.92 },
    ],
  },
  music: {
    base: "#3A1F63",
    blobs: [
      { color: "#8B45E8", cx: "16%", cy: "8%", r: "70%", opacity: 1 },
      { color: "#3FD0D8", cx: "94%", cy: "18%", r: "52%", opacity: 0.5 },
      { color: "#221040", cx: "66%", cy: "106%", r: "78%", opacity: 0.9 },
    ],
  },
  amber: {
    base: "#5A3B12",
    blobs: [
      { color: "#F0B23C", cx: "20%", cy: "8%", r: "68%", opacity: 0.95 },
      { color: "#F06B3C", cx: "92%", cy: "26%", r: "58%", opacity: 0.6 },
      { color: "#38240B", cx: "64%", cy: "104%", r: "76%", opacity: 0.9 },
    ],
  },
  slate: {
    base: "#232733",
    blobs: [
      { color: "#3A4152", cx: "18%", cy: "10%", r: "70%", opacity: 0.9 },
      { color: "#4C5468", cx: "90%", cy: "22%", r: "58%", opacity: 0.5 },
      { color: "#181B24", cx: "62%", cy: "104%", r: "78%", opacity: 0.92 },
    ],
  },
};

export const GAME_TONE: Record<string, MeshTone> = {
  buzzer: "buzzer",
  music: "music",
};

export function toneForGame(gameType: string): MeshTone {
  return GAME_TONE[gameType] ?? "brand";
}
