import { Stack } from "expo-router";

export default function PerformanceWizardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="goal-type" />
      <Stack.Screen name="goal-target" />
      <Stack.Screen name="program-mode" />
      <Stack.Screen name="program-manual" />
      <Stack.Screen name="program-generated/[step]" />
    </Stack>
  );
}
