import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect } from "react";
import { Pressable, View, type PressableProps } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { haptic } from "@/lib/haptics";
import { PRESS, SPRING } from "@/lib/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TabBarButtonProps = Omit<PressableProps, "style"> & {
  "aria-selected"?: boolean;
  style?: PressableProps["style"];
};

export function TabBarButton({
  children,
  onPress,
  onPressIn,
  style,
  ...rest
}: TabBarButtonProps) {
  const isFocused = rest["aria-selected"] ?? false;
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pressed.value, [0, 1], [1, PRESS.scaleIcon]) },
    ],
  }));

  return (
    <AnimatedPressable
      {...rest}
      style={[
        style,
        { flex: 1, alignItems: "center", justifyContent: "center" },
        animatedStyle,
      ]}
      onPressIn={(event) => {
        pressed.value = withSpring(1, SPRING.press);
        if (!isFocused) haptic("select");
        onPressIn?.(event);
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, SPRING.press);
      }}
      onPress={onPress}
    >
      {children}
    </AnimatedPressable>
  );
}

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  filledName: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  size: number;
};

export function TabIcon({ name, filledName, focused, color, size }: TabIconProps) {
  const focus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focus.value = withSpring(focused ? 1 : 0, SPRING.bouncy);
  }, [focused, focus]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(focus.value, [0, 1], [1, 1.08]) },
      { translateY: interpolate(focus.value, [0, 1], [0, -1]) },
    ],
  }));

  const outlineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focus.value, [0, 1], [1, 0]),
  }));

  const filledStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
  }));

  return (
    <Animated.View style={containerStyle}>
      <View style={{ width: size, height: size }}>
        <Animated.View style={[{ position: "absolute" }, outlineStyle]}>
          <Ionicons name={name} size={size} color={color} />
        </Animated.View>
        <Animated.View style={[{ position: "absolute" }, filledStyle]}>
          <Ionicons name={filledName} size={size} color={color} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}
