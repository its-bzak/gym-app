import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ActiveWorkoutScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Active Workout</ThemedText>
      <ThemedText type="default">
        Here, your current workout session will be displayed, allowing you to track activities, exercises, sets, and reps.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
});
