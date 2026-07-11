import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";

import { setHapticsEnabled } from "./haptics";

const HAPTICS_KEY = "zeyn-haptics-enabled";
const SFX_KEY = "zeyn-sfx-muted";

type Prefs = {
  hapticsEnabled: boolean;
  sfxMuted: boolean;
};

let prefs: Prefs = { hapticsEnabled: true, sfxMuted: false };
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
  const [haptics, sfx] = await Promise.all([
    SecureStore.getItemAsync(HAPTICS_KEY),
    SecureStore.getItemAsync(SFX_KEY),
  ]);
  prefs = {
    hapticsEnabled: haptics !== "0",
    sfxMuted: sfx === "1",
  };
  setHapticsEnabled(prefs.hapticsEnabled);
  emit();
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
