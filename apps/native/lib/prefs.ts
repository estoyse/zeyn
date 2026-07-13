import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";
import { Uniwind } from "uniwind";

import { setHapticsEnabled } from "./haptics";
import type { GameStyle } from "./neon";

const HAPTICS_KEY = "zeyn-haptics-enabled";
const SFX_KEY = "zeyn-sfx-muted";
const APPEARANCE_KEY = "zeyn-appearance";
const GAME_STYLE_KEY = "zeyn-game-style";

export type Appearance = "light" | "dark" | "system";

const APPEARANCES: readonly Appearance[] = ["light", "dark", "system"];

function isAppearance(value: string | null): value is Appearance {
  return value !== null && APPEARANCES.includes(value as Appearance);
}

type Prefs = {
  hapticsEnabled: boolean;
  sfxMuted: boolean;
  appearance: Appearance;
  gameStyle: GameStyle;
};

let prefs: Prefs = {
  hapticsEnabled: true,
  sfxMuted: false,
  appearance: "system",
  gameStyle: "refined",
};
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot() {
  return prefs;
}

export function isSfxMuted() {
  return prefs.sfxMuted;
}

export async function hydratePrefs() {
  const [haptics, sfx, appearance, gameStyle] = await Promise.all([
    SecureStore.getItemAsync(HAPTICS_KEY),
    SecureStore.getItemAsync(SFX_KEY),
    SecureStore.getItemAsync(APPEARANCE_KEY),
    SecureStore.getItemAsync(GAME_STYLE_KEY),
  ]);
  prefs = {
    hapticsEnabled: haptics !== "0",
    sfxMuted: sfx === "1",
    appearance: isAppearance(appearance) ? appearance : "system",
    gameStyle: gameStyle === "neon" ? "neon" : "refined",
  };
  setHapticsEnabled(prefs.hapticsEnabled);
  Uniwind.setTheme(prefs.appearance);
  emit();
}

export function setAppearance(value: Appearance) {
  prefs = { ...prefs, appearance: value };
  Uniwind.setTheme(value);
  emit();
  SecureStore.setItemAsync(APPEARANCE_KEY, value).catch(() => {});
}

export function setHapticsPref(value: boolean) {
  prefs = { ...prefs, hapticsEnabled: value };
  setHapticsEnabled(value);
  emit();
  SecureStore.setItemAsync(HAPTICS_KEY, value ? "1" : "0").catch(() => {});
}

export function setSfxMuted(value: boolean) {
  prefs = { ...prefs, sfxMuted: value };
  emit();
  SecureStore.setItemAsync(SFX_KEY, value ? "1" : "0").catch(() => {});
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, snapshot);
}

export function setGameStyle(value: GameStyle) {
  prefs = { ...prefs, gameStyle: value };
  emit();
  SecureStore.setItemAsync(GAME_STYLE_KEY, value).catch(() => {});
}
