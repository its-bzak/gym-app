import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function NutritionScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Nutrition</ThemedText>
      <ThemedText type="default">
        Record meals, monitor macros, and keep your nutrition goals visible day by day.
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
