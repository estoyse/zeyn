import * as SecureStore from "expo-secure-store";

const KEY = "zeyn-seen-onboarding";

export async function getSeenOnboarding(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(KEY);
  return value === "1";
}

export async function setSeenOnboarding(): Promise<void> {
  await SecureStore.setItemAsync(KEY, "1");
}
