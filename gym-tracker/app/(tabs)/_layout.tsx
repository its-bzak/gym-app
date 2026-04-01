import { Tabs } from "expo-router";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from "@/components/haptic-tab";

function TabIcon({
  focused,
  name,
}: {
  focused: boolean;
  name: React.ComponentProps<typeof Ionicons>["name"];
}) {
  if (focused) {
    return (
      <View
        style={{
          width: 45,
          height: 45,
          borderRadius: 32,
          backgroundColor: "#393939",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <Ionicons name={name} size={24} color="#E4E4E4" />
      </View>
    );
  }

  return <Ionicons name={name} size={24} color="#BFBFBF" />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: "#151515" },
        tabBarStyle: {
          position: "absolute",
          height: 65,
          paddingTop: 6,
          paddingBottom: 10,
          backgroundColor: "#282828",
          borderTopWidth: 0,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
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
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="restaurant-outline" />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: "Workout",
          tabBarButton: HapticTab,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="barbell-outline" />,
        }}
      />
      <Tabs.Screen
        name="performance"
        options={{
          title: "Performance",
          tabBarButton: HapticTab,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="stats-chart-outline" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarButton: HapticTab,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="person-outline" />,
        }}
      />
    </Tabs>
  );
}