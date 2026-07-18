import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { memo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

export interface FloatingActionButtonProps {
  onPress?: () => void;
  accessibilityLabel?: string;
}

export const FloatingActionButton = memo(function FloatingActionButton({
  onPress,
  accessibilityLabel = 'Quick action',
}: FloatingActionButtonProps) {
  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.9}
      onPress={handlePress}
      style={styles.fab}>
      <Ionicons name="add" size={30} color="#FFFFFF" />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#202225',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});
