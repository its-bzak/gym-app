import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { usePathname, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { FloatingActionButton } from '@/components/FloatingActionButton';
import { NavigationButton } from '@/components/NavigationButton';

const NAVIGATION_TABS = [
  {
    key: 'exercise',
    iconName: 'barbell-outline',
    label: 'Exercise',
    route: '/exercise',
  },
  {
    key: 'dashboard',
    iconName: 'grid-outline',
    label: 'Dashboard',
    route: '/dashboard',
  },
  {
    key: 'nutrition',
    iconName: 'restaurant-outline',
    label: 'Nutrition',
    route: '/nutrition',
  },
] as const;

export const BottomNavigation = memo(function BottomNavigation(_props: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const activeTabKey = useMemo(() => {
    const currentSegment = pathname.split('/').filter(Boolean).pop() ?? 'dashboard';

    if (currentSegment === 'exercise') return 'exercise';
    if (currentSegment === 'nutrition') return 'nutrition';

    return 'dashboard';
  }, [pathname]);

  const activeIndex = NAVIGATION_TABS.findIndex((tab) => tab.key === activeTabKey);
  const normalizedIndex = activeIndex >= 0 ? activeIndex : 0;
  const pillWidth = Math.min(320, Math.max(260, width - 116));
  const buttonWidth = pillWidth / NAVIGATION_TABS.length;
  const indicatorWidth = 56;
  const indicatorOffset = buttonWidth * normalizedIndex + (buttonWidth - indicatorWidth) / 2;

  const indicatorX = useSharedValue(indicatorOffset);

  useEffect(() => {
    indicatorX.value = withSpring(indicatorOffset, {
      damping: 18,
      stiffness: 260,
      mass: 0.5,
    });
  }, [indicatorOffset, indicatorX]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const handleNavigation = (tabRoute: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace(tabRoute);
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: insets.bottom + 16 }]}>
      <View style={[styles.pill, { width: pillWidth }]}>
        <Animated.View
          style={[
            styles.indicator,
            animatedIndicatorStyle,
            {
              width: indicatorWidth,
              height: 52,
            },
          ]}
        />

        <View style={styles.navigationRow}>
          {NAVIGATION_TABS.map((tab) => (
            <NavigationButton
              key={tab.key}
              iconName={tab.iconName}
              label={tab.label}
              selected={activeTabKey === tab.key}
              onPress={() => handleNavigation(tab.route)}
              accessibilityLabel={tab.label}
            />
          ))}
        </View>
      </View>

      <FloatingActionButton onPress={() => {}} accessibilityLabel="Add new item" />
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  pill: {
    height: 72,
    borderRadius: 999,
    backgroundColor: '#202225',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  indicator: {
    position: 'absolute',
    top: 10,
    left: 0,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    zIndex: 0,
  },
  navigationRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    zIndex: 1,
  },
});
