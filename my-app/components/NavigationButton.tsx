import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export interface NavigationButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  hitSlop?: number;
  style?: ViewStyle;
}

export const NavigationButton = memo(function NavigationButton({
  iconName,
  label,
  selected,
  onPress,
  accessibilityLabel,
  hitSlop = 8,
  style,
}: NavigationButtonProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.16 : 1, {
      damping: 14,
      stiffness: 240,
      mass: 0.4,
    });
  }, [scale, selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      hitSlop={hitSlop}
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.button, style]}>
      <Animated.View style={[styles.iconWrapper, animatedStyle]}>
        <Ionicons
          name={iconName}
          size={28}
          color={selected ? '#FFFFFF' : 'rgba(255,255,255,0.66)'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
