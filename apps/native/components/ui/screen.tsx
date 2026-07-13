import { createContext, useContext, type PropsWithChildren, type ReactNode } from "react";
import { RefreshControl, View } from "react-native";
import Animated, {
  useAnimatedRef,
  useScrollOffset,
  type SharedValue,
} from "react-native-reanimated";
import { type Edge, useSafeAreaInsets } from "react-native-safe-area-context";

import { haptic } from "@/lib/haptics";
import { useThemeColor } from "@/lib/theme";
import { cn } from "@/lib/utils";

const ScrollOffsetContext = createContext<SharedValue<number> | null>(null);

export function useScrollOffsetContext() {
  return useContext(ScrollOffsetContext);
}

export const SCREEN_PADDING = "px-6 py-6";
export const SCREEN_GAP = "gap-6";

type ScreenProps = {
  scroll?: boolean;
  padded?: boolean;
  className?: string;
  contentClassName?: string;
  edges?: Edge[];
  header?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function Screen({
  scroll = true,
  padded = true,
  className,
  contentClassName,
  edges = ["top"],
  header,
  refreshing = false,
  onRefresh,
  children,
}: PropsWithChildren<ScreenProps>) {
  const insets = useSafeAreaInsets();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const offset = useScrollOffset(scrollRef);
  const [accent] = useThemeColor(["accent"]);

  const padding = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
  };

  const content = cn(
    "flex-1",
    padded && SCREEN_PADDING,
    padded && SCREEN_GAP,
    contentClassName
  );

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={() => {
        haptic("impact");
        onRefresh();
      }}
      tintColor={accent}
      colors={[accent]}
    />
  ) : undefined;

  return (
    <ScrollOffsetContext.Provider value={offset}>
      <View className={cn("flex-1 bg-background", className)} style={padding}>
        {header}
        <Animated.ScrollView
          ref={scrollRef}
          scrollEnabled={scroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          <View className={content}>{children}</View>
        </Animated.ScrollView>
      </View>
    </ScrollOffsetContext.Provider>
  );
}
