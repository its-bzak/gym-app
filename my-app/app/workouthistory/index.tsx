import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function WorkoutHistoryScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Workout History</ThemedText>
      <ThemedText type="default">
        Review your past workouts, track your progress over time, and analyze your performance trends.
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
