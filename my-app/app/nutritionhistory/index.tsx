import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function NutritionHistoryScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Nutrition History</ThemedText>
      <ThemedText type="default">
        View previous nutrition tracking days, see macros, and analyze your eating habits over time.
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
