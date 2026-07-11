import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { useAppColor, useThemeColor } from "@/lib/theme";

export default function TabsLayout() {
  const { t } = useTranslation("common");
  const [surface, border] = useThemeColor(["surface", "border"]);
  const [brand, mutedForeground] = useAppColor(["brand", "mutedForeground"]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand,
        tabBarInactiveTintColor: mutedForeground,
        tabBarStyle: {
          backgroundColor: surface,
          borderTopColor: border,
        },
        tabBarLabelStyle: {
          fontFamily: "IBMPlexSans_500Medium",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: t("tabs.games"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "game-controller" : "game-controller-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
