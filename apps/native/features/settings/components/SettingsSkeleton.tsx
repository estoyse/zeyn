import { Skeleton } from "heroui-native";
import { View } from "react-native";

export function SettingsSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </View>
  );
}
