import { Tabs } from 'expo-router';
import React from 'react';

import { BottomNavigation } from '@/components/BottomNavigation';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        },
      }}
      tabBar={(props) => <BottomNavigation {...props} />}>
      <Tabs.Screen name="exercise" options={{ title: 'Exercise' }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition' }} />
    </Tabs>
  );
}
