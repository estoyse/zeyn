import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FocusLayoutProps {
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function FocusLayout({ header, footer, children }: FocusLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {header}
      <View className="flex-1">{children}</View>
      {footer ? <View className="px-4 pb-2 pt-3">{footer}</View> : null}
    </View>
  );
}
