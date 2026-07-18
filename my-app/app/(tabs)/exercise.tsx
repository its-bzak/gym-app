import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ExerciseScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Exercise</ThemedText>
      <ThemedText type="default">
        Log workouts, check progress, and keep your training plan on track.
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
