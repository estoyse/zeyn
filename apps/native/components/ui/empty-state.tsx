import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { MeshSurface } from "./mesh";
import { Text } from "./text";

const StyledIonicons = withUniwind(Ionicons);

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  caption?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, caption, action }: EmptyStateProps) {
  return (
    <MeshSurface tone="slate" className="items-center gap-4 px-6 py-10">
      <View className="size-16 items-center justify-center rounded-full bg-white/10">
        <StyledIonicons name={icon} size={28} className="text-white/80" />
      </View>

      <View className="items-center gap-1.5">
        <Text weight="semibold" className="text-center text-base text-white">
          {title}
        </Text>
        {caption ? (
          <Text className="max-w-[260px] text-center text-sm text-white/60">
            {caption}
          </Text>
        ) : null}
      </View>

      {action}
    </MeshSurface>
  );
}
