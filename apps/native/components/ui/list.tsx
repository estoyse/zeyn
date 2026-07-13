import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import { View } from "react-native";

import { PRESS } from "@/lib/motion";
import { useThemeColor } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { PressableScale } from "./pressable-scale";
import { Eyebrow, Text } from "./text";

type SectionProps = {
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Section({ eyebrow, action, className, children }: SectionProps) {
  return (
    <View className={cn("gap-3", className)}>
      {eyebrow || action ? (
        <View className="flex-row items-center justify-between px-1">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : <View />}
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

type GroupProps = {
  className?: string;
  children: ReactNode;
};

export function Group({ className, children }: GroupProps) {
  return (
    <View
      className={cn(
        "overflow-hidden rounded-card border border-border bg-surface",
        className
      )}
    >
      {children}
    </View>
  );
}

type RowProps = {
  label: string;
  caption?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  className?: string;
};

export function Row({
  label,
  caption,
  leading,
  trailing,
  chevron = false,
  disabled = false,
  onPress,
  className,
}: RowProps) {
  const [muted] = useThemeColor(["muted"]);

  const content = (
    <>
      {leading ? <View className="shrink-0">{leading}</View> : null}
      <View className="min-w-0 flex-1 gap-0.5">
        <Text numberOfLines={1} className="text-body">
          {label}
        </Text>
        {caption ? (
          <Text numberOfLines={2} className="text-footnote text-muted-foreground">
            {caption}
          </Text>
        ) : null}
      </View>
      {trailing}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={muted} /> : null}
    </>
  );

  const layout = "min-h-14 flex-row items-center gap-3 px-4 py-3";

  if (!onPress) {
    return <View className={cn(layout, className)}>{content}</View>;
  }

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scale={PRESS.scaleWide}
      className={cn(layout, "active:bg-surface-secondary", disabled && "opacity-50", className)}
    >
      {content}
    </PressableScale>
  );
}

export function RowSeparator() {
  return <View className="ml-4 h-px bg-separator" />;
}
