import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";

function TabIcon({ focused }: { focused: boolean }) {
  if (focused) {
    return (
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: "#393939",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <MaterialIcons
          name="play-arrow"
          size={34}
          color="#E4E4E4"
          style={{ transform: [{ rotate: "90deg" }] }}
        />
      </View>
    );
  }

  return (
    <MaterialIcons
      name="play-arrow"
      size={34}
      color="#E4E4E4"
      style={{ transform: [{ rotate: "90deg" }] }}
    />
  );
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
          height: 90,
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
        name="profile"
        options={{
          title: "Profile",
          tabBarButton: HapticTab,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: "Workout",
          tabBarButton: HapticTab,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Social",
          tabBarButton: HapticTab,
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} />,
        }}
      />
    </Tabs>
  );
}