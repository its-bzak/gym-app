import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function RoutineLibraryScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Routine Library</ThemedText>
      <ThemedText type="default">
        Browse and manage your collection of routines, create custom routines, and track your performance.
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
