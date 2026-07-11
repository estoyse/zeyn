import * as SecureStore from "expo-secure-store";

const KEY = "zeyn-seen-onboarding";

let seenOnboarding: Promise<boolean> = SecureStore.getItemAsync(KEY).then(
  (value) => value === "1"
);

export function getSeenOnboarding(): Promise<boolean> {
  return seenOnboarding;
}

export async function setSeenOnboarding(): Promise<void> {
  await SecureStore.setItemAsync(KEY, "1");
  seenOnboarding = Promise.resolve(true);
}
