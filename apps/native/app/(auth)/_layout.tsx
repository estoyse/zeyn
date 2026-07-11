import { Stack } from "expo-router";

import { useThemeColor } from "@/lib/theme";

export default function AuthLayout() {
  const [background] = useThemeColor(["background"]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: background },
        animation: "ios_from_right",
      }}
    />
  );
}
