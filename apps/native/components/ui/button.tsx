import { Button as HeroButton } from "heroui-native";
import type { ComponentProps } from "react";
import type { GestureResponderEvent } from "react-native";
import { Easing } from "react-native-reanimated";

import { haptic as fireHaptic, type HapticIntent } from "@/lib/haptics";
import { PRESS } from "@/lib/motion";

type HeroButtonProps = ComponentProps<typeof HeroButton>;

const pressAnimation = {
  scale: {
    value: PRESS.scale,
    ignoreScaleCoefficient: true,
    timingConfig: { duration: 140, easing: Easing.out(Easing.quad) },
  },
};

type ButtonProps = HeroButtonProps & {
  haptic?: HapticIntent | null;
};

function ButtonRoot({ haptic: intent = "tap", ...rest }: ButtonProps) {
  const { isDisabled, onPressIn } = rest as {
    isDisabled?: boolean;
    onPressIn?: (event: GestureResponderEvent) => void;
  };

  const handlePressIn = (event: GestureResponderEvent) => {
    if (intent && !isDisabled) fireHaptic(intent);
    onPressIn?.(event);
  };

  const heroProps = {
    animation: pressAnimation,
    hitSlop: PRESS.hitSlop,
    ...rest,
    onPressIn: handlePressIn,
  } as HeroButtonProps;

  return <HeroButton {...heroProps} />;
}

export const Button = Object.assign(ButtonRoot, {
  Label: HeroButton.Label,
});
