import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function NutritionLibraryScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Nutrition Library</ThemedText>
      <ThemedText type="default">
        On this screen will live your food and recipe library, allowing easy logging for your favorite meals.
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
