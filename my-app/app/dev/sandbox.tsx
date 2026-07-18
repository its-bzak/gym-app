import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SandboxScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Sandbox</ThemedText>
      <ThemedText type="default">
        This is a sandbox environment where you can test new features and experiment with the app. Only available in development.
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
