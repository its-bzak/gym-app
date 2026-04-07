import { Tabs } from "expo-router";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { TabBarItemVisual } from "@/design/components/navigation";

import { HapticTab } from "@/components/haptic-tab";

export default function TabsLayout() {
  const { theme } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: theme.colors.background },
        tabBarStyle: {
          position: "absolute",
          height: theme.components.tabBar.height + theme.spacing.md,
          paddingTop: theme.spacing.xs,
          paddingBottom: theme.spacing.sm,
          backgroundColor: theme.colors.tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: theme.colors.tabBarBorder,
          borderTopLeftRadius: theme.radii.xl,
          borderTopRightRadius: theme.radii.xl,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
      }}>
      <Tabs.Screen
        name="discover"
        options={{
          title: "Food Log",
          tabBarButton: HapticTab,
          tabBarIcon: ({ focused }) => (
            <TabBarItemVisual focused={focused} iconName="restaurant-outline" label="Log" />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: "Workout",
          tabBarButton: HapticTab,
          tabBarIcon: ({ focused }) => (
            <TabBarItemVisual focused={focused} iconName="barbell-outline" label="Workout" />
          ),
        }}
      />
      <Tabs.Screen
        name="performance"
        options={{
          title: "Performance",
          tabBarButton: HapticTab,
          tabBarIcon: ({ focused }) => (
            <TabBarItemVisual focused={focused} iconName="stats-chart-outline" label="Stats" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarButton: HapticTab,
          tabBarIcon: ({ focused }) => (
            <TabBarItemVisual focused={focused} iconName="person-outline" label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}