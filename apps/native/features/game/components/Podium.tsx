import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { AnimatedNumber, MeshSurface, Text } from "@/components/ui";
import { useGameFx } from "@/features/game/components/GameFxProvider";
import { haptic } from "@/lib/haptics";
import { SPRING } from "@/lib/motion";
import { useThemeColor } from "@/lib/theme";
import { cn } from "@/lib/utils";

const StyledIonicons = withUniwind(Ionicons);

export interface PodiumEntry {
  id: string;
  name: string;
  score: number;
}

const BAR_HEIGHT = [104, 148, 80];
const RISE_DELAY = [220, 460, 0];
const BAR_TONE = [
  "bg-surface-tertiary",
  "bg-brand",
  "bg-surface-secondary",
];
const BAR_LABEL = [
  "text-foreground",
  "text-brand-foreground",
  "text-muted-foreground",
];

export function Podium({
  entries,
  selfId,
}: {
  entries: PodiumEntry[];
  selfId?: string;
}) {
  const { burst } = useGameFx();
  const top = entries.slice(0, 3);

  useEffect(() => {
    if (top.length === 0) return;
    const timer = setTimeout(() => {
      burst("success");
      haptic("success");
    }, RISE_DELAY[1] + 260);
    return () => clearTimeout(timer);
  }, [burst, top.length]);

  if (top.length === 0) return null;

  const order = [top[1], top[0], top[2]];

  return (
    <View className="flex-row items-end justify-center gap-3 px-2">
      {order.map((entry, column) =>
        entry ? (
          <Step
            key={entry.id}
            entry={entry}
            column={column}
            place={column === 1 ? 1 : column === 0 ? 2 : 3}
            isSelf={entry.id === selfId}
          />
        ) : (
          <View key={`empty-${column}`} className="flex-1" />
        )
      )}
    </View>
  );
}

function Step({
  entry,
  column,
  place,
  isSelf,
}: {
  entry: PodiumEntry;
  column: number;
  place: number;
  isSelf: boolean;
}) {
  const rise = useSharedValue(0);
  const [foreground] = useThemeColor(["foreground"]);

  useEffect(() => {
    rise.value = withDelay(RISE_DELAY[column], withSpring(1, SPRING.bouncy));
  }, [column, rise]);

  const capStyle = useAnimatedStyle(() => ({
    opacity: rise.value,
    transform: [{ translateY: (1 - rise.value) * 24 }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: rise.value }],
    transformOrigin: "bottom",
  }));

  return (
    <View className="flex-1 items-center gap-2">
      <Animated.View style={capStyle} className="items-center gap-1">
        {place === 1 && (
          <StyledIonicons name="trophy" size={22} className="text-buzzer" />
        )}
        <Text
          weight="semibold"
          numberOfLines={1}
          className={cn("text-center text-sm", isSelf && "text-brand")}
        >
          {entry.name}
        </Text>
        <AnimatedNumber
          value={entry.score}
          duration={900}
          style={{ fontSize: 20, fontWeight: "800", color: foreground }}
        />
      </Animated.View>

      <Animated.View
        style={[barStyle, { height: BAR_HEIGHT[column] }]}
        className="w-full"
      >
        {place === 1 ? (
          <MeshSurface
            tone="amber"
            className="h-full w-full items-center justify-start rounded-b-none pt-2"
          >
            <Text weight="bold" className="text-lg text-white">
              {place}
            </Text>
          </MeshSurface>
        ) : (
          <View
            className={cn(
              "h-full w-full items-center justify-start rounded-t-card pt-2",
              BAR_TONE[column]
            )}
          >
            <Text weight="bold" className={cn("text-lg", BAR_LABEL[column])}>
              {place}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}
