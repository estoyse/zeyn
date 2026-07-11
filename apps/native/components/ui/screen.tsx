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
  edges = ["top"],
  refreshControl,
  children,
}: PropsWithChildren<ScreenProps>) {
  const insets = useSafeAreaInsets();

  const padding = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
  };

  return (
    <View className={cn("flex-1 bg-background", className)} style={padding}>
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
