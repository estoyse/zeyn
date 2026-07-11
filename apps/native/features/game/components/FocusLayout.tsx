import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FocusLayoutProps {
  header: ReactNode;
  children: ReactNode;
}

export function FocusLayout({ header, children }: FocusLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {header}
      <View className="flex-1">{children}</View>
    </View>
  );
}
