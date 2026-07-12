import { Skeleton } from "heroui-native";
import { View } from "react-native";

import { Group, RowSeparator } from "@/components/ui";

export function ProfileSkeleton() {
  return (
    <View className="gap-8">
      <View className="items-center gap-3">
        <Skeleton className="size-20 rounded-full" />
        <View className="items-center gap-1.5">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </View>
        <Skeleton className="h-4 w-56 rounded-md" />
      </View>

      <View className="gap-3">
        <Skeleton className="h-5 w-16 rounded-md" />
        {Array.from({ length: 2 }).map((_, row) => (
          <View key={row} className="flex-row gap-3">
            {Array.from({ length: 2 }).map((_, column) => (
              <Skeleton key={column} className="h-[104px] flex-1 rounded-card" />
            ))}
          </View>
        ))}
      </View>

      <View className="gap-3">
        <Skeleton className="h-5 w-32 rounded-md" />
        <Group>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i}>
              <View className="min-h-14 flex-row items-center gap-3 px-4 py-3">
                <Skeleton className="size-[18px] rounded-full" />
                <View className="min-w-0 flex-1 gap-1.5">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </View>
                <Skeleton className="h-4 w-8 rounded-md" />
              </View>
              {i < 2 ? <RowSeparator /> : null}
            </View>
          ))}
        </Group>
      </View>
    </View>
  );
}
