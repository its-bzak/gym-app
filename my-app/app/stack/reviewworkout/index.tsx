import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ReviewWorkoutScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Review Workout</ThemedText>
      <ThemedText type="default">
        Here, you can review your completed workout, see new personal records, and make notes.
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
