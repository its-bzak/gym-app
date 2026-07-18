import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ExerciseLibraryScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Exercise Library</ThemedText>
      <ThemedText type="default">
        Browse and manage your collection of exercises, create custom exercises, and track your performance.
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
