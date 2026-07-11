import { Stack } from "expo-router";

import { useThemeColor } from "@/lib/theme";

export default function OnboardingLayout() {
  const [background] = useThemeColor(["background"]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: background },
        animation: "none",
        gestureEnabled: false,
      }}
    />
  );
}
