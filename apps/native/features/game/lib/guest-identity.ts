import * as SecureStore from "expo-secure-store";

export interface GuestIdentity {
  token: string;
  gid: string;
  name: string;
}

const STORAGE_KEY = "zeyn.guestIdentity";

export function loadGuestIdentity(): GuestIdentity | null {
  try {
    const raw = SecureStore.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestIdentity>;
    if (
      typeof parsed.token === "string" &&
      typeof parsed.gid === "string" &&
      typeof parsed.name === "string"
    ) {
      return { token: parsed.token, gid: parsed.gid, name: parsed.name };
    }
  } catch {
    return null;
  }
  return null;
}

export function saveGuestIdentity(identity: GuestIdentity): void {
  SecureStore.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function clearGuestIdentity(): void {
  void SecureStore.deleteItemAsync(STORAGE_KEY);
}
