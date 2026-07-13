import Ionicons from "@expo/vector-icons/Ionicons";
import { router, type Href } from "expo-router";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { Logo } from "@/components/ui";

const StyledIonicons = withUniwind(Ionicons);

interface FocusTopBarProps {
  onLeave?: () => void;
}

export function FocusTopBar({ onLeave }: FocusTopBarProps) {
  const leave = onLeave ?? (() => router.replace("/(tabs)/home" as Href));

  return (
    <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
      <StyledIonicons
        name="arrow-back"
        size={22}
        className="text-foreground"
        onPress={leave}
      />
      <View className="h-6 w-px bg-border" />
      <Logo size="sm" />
    </View>
  );
}
