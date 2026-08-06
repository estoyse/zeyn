import * as SecureStore from "expo-secure-store";

import { createHostDeviceId, createRandomBytes } from "./transport";

const DEVICE_ID_KEY = "zeyn.localDeviceId";
const PLAYER_NAME_KEY = "zeyn.localPlayerName";

export function loadLocalDeviceId(): string {
  try {
    const stored = SecureStore.getItem(DEVICE_ID_KEY);
    if (stored) return stored;
  } catch {}

  const minted = createHostDeviceId(createRandomBytes());
  try {
    SecureStore.setItem(DEVICE_ID_KEY, minted);
  } catch {}
  return minted;
}

export function loadLocalPlayerName(): string {
  try {
    return SecureStore.getItem(PLAYER_NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveLocalPlayerName(name: string): void {
  try {
    SecureStore.setItem(PLAYER_NAME_KEY, name);
  } catch {}
}
