import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { TabBarButton, TabIcon } from "@/components/navigation/tab-bar-button";
import { useAppColor, useThemeColor } from "@/lib/theme";

export default function TabsLayout() {
  const { t } = useTranslation("common");
  const [surface, separator] = useThemeColor(["surface", "separator"]);
  const [brand, mutedForeground] = useAppColor(["brand", "mutedForeground"]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "shift",
        freezeOnBlur: true,
        tabBarHideOnKeyboard: true,
        tabBarButton: (props) => <TabBarButton {...props} />,
        tabBarActiveTintColor: brand,
        tabBarInactiveTintColor: mutedForeground,
        tabBarStyle: {
          backgroundColor: surface,
          borderTopColor: separator,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontFamily: "IBMPlexSans-Medium",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="home-outline"
              filledName="home"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: t("tabs.games"),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="game-controller-outline"
              filledName="game-controller"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="person-outline"
              filledName="person"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
