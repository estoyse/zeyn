import { type ComponentProps, type PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import { type Edge, useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/utils";

type ScreenProps = {
  scroll?: boolean;
  className?: string;
  contentClassName?: string;
  edges?: Edge[];
  refreshControl?: ComponentProps<typeof ScrollView>["refreshControl"];
};

export function Screen({
  scroll = true,
  className,
  contentClassName,
  refreshControl,
  children,
}: PropsWithChildren<ScreenProps>) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn("flex-1 bg-background", className)}
      style={{
        paddingBottom: insets.bottom,
      }}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          <View className={cn("flex-1", contentClassName)}>{children}</View>
        </ScrollView>
      ) : (
        <View className={cn("flex-1", contentClassName)}>{children}</View>
      )}
    </View>
  );
}
