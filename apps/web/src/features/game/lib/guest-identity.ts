export interface GuestIdentity {
  token: string;
  gid: string;
  name: string;
}

const STORAGE_KEY = "zeyn.guestIdentity";

export function loadGuestIdentity(): GuestIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function clearGuestIdentity(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
