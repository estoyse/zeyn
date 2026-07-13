import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { runOnJS } from "react-native-reanimated";

import { isSfxMuted } from "./prefs";

export type SfxName =
  | "tick"
  | "countdownTick"
  | "countdownGo"
  | "questionStart"
  | "buzz"
  | "correct"
  | "wrong"
  | "win";

const SOURCES: Record<SfxName, number> = {
  tick: require("../assets/sfx/tick.wav"),
  countdownTick: require("../assets/sfx/countdownTick.wav"),
  countdownGo: require("../assets/sfx/countdownGo.wav"),
  questionStart: require("../assets/sfx/questionStart.wav"),
  buzz: require("../assets/sfx/buzz.wav"),
  correct: require("../assets/sfx/correct.wav"),
  wrong: require("../assets/sfx/wrong.wav"),
  win: require("../assets/sfx/win.wav"),
};

const VOICES: Partial<Record<SfxName, number>> = {
  tick: 3,
  buzz: 3,
};

const VOLUME: Partial<Record<SfxName, number>> = {
  tick: 0.45,
  countdownTick: 0.7,
};

type Pool = { voices: AudioPlayer[]; cursor: number };

const pools = new Map<SfxName, Pool>();

function poolFor(name: SfxName): Pool {
  const existing = pools.get(name);
  if (existing) return existing;

  const size = VOICES[name] ?? 1;
  const created: Pool = {
    voices: Array.from({ length: size }, () => {
      const player = createAudioPlayer(SOURCES[name]);
      player.volume = VOLUME[name] ?? 0.8;
      return player;
    }),
    cursor: 0,
  };

  pools.set(name, created);
  return created;
}

export function play(name: SfxName): void {
  if (isSfxMuted()) return;

  const pool = poolFor(name);
  const player = pool.voices[pool.cursor];
  pool.cursor = (pool.cursor + 1) % pool.voices.length;

  try {
    Promise.resolve(player.seekTo(0)).catch(() => {});
    player.play();
  } catch {}
}

export function playFromWorklet(name: SfxName): void {
  "worklet";
  runOnJS(play)(name);
}
