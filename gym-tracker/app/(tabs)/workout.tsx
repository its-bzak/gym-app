import DateCarousel from "@/components/main/DateCarousel";
import TodaysExerciseCard from "@/components/main/TodaysExerciseCard";
import TodaysNutritionCard from "@/components/main/TodaysNutritionCard";
import { useActiveWorkout } from "@/context/ActiveWorkoutContext";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import { useDisplayUnitPreference } from "@/hooks/use-display-unit-preference";
import {
  DEFAULT_METRICS_DATE,
  getDailyExerciseMetrics,
  getDailyMacroMetrics,
  mockGoal,
  mockWeightEntries,
} from "@/mock/MainScreen/DailyMetricsSection";
import {
  getDateKey,
  getWorkoutDashboardSnapshot,
  type WorkoutDashboardSnapshot,
} from "@/services/dashboardService";
import { getAuthenticatedUserId } from "@/services/profileService";
import type { WeightEntry, WeightGoal } from "@/types/dashboard";
import type { MacroBarProps } from "@/utils/calculateMacroBar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import InsightsCard from "../../components/main/InsightsCard";

const EMPTY_MACRO_METRICS: MacroBarProps = {
  protein: 0,
  proteinGoal: 0,
  fat: 0,
  fatGoal: 0,
  carbs: 0,
  carbsGoal: 0,
  calorieGoal: 0,
};

const EMPTY_EXERCISE_METRICS = {
  volume: 0,
  durationMins: 0,
  workoutType: "",
};

const DASHBOARD_CARD_ORDER_STORAGE_KEY = "workout-dashboard-card-order-v1";
const DEFAULT_DASHBOARD_CARD_ORDER = [
  "nutrition",
  "exercise",
  "insights",
] as const;

type DashboardCardKey = (typeof DEFAULT_DASHBOARD_CARD_ORDER)[number];

export default function WorkoutScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [selectedDate, setSelectedDate] = useState(
    () => new Date(DEFAULT_METRICS_DATE),
  );
  const [dailyMacroMetrics, setDailyMacroMetrics] = useState<MacroBarProps>(
    () => getDailyMacroMetrics(selectedDate),
  );
  const [dailyExerciseMetrics, setDailyExerciseMetrics] = useState(() =>
    getDailyExerciseMetrics(selectedDate),
  );
  const [weightEntries, setWeightEntries] =
    useState<WeightEntry[]>(mockWeightEntries);
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(mockGoal);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardLoadError, setDashboardLoadError] = useState<string | null>(
    null,
  );
  const [dashboardCardOrder, setDashboardCardOrder] = useState<
    DashboardCardKey[]
  >([...DEFAULT_DASHBOARD_CARD_ORDER]);
  const [draggingDashboardCard, setDraggingDashboardCard] =
    useState<DashboardCardKey | null>(null);
  const [isFloatingActionMenuOpen, setIsFloatingActionMenuOpen] =
    useState(false);
  const { startWorkout } = useActiveWorkout();
  const { unitPreference } = useDisplayUnitPreference();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const dragOffsetY = useRef(new Animated.Value(0)).current;
  const floatingActionMenuAnimation = useRef(new Animated.Value(0)).current;
  const dashboardCardLayoutsRef = useRef<
    Partial<Record<DashboardCardKey, { y: number; height: number }>>
  >({});
  const dashboardCardOrderRef = useRef<DashboardCardKey[]>([
    ...DEFAULT_DASHBOARD_CARD_ORDER,
  ]);
  const activeDragCardRef = useRef<DashboardCardKey | null>(null);
  const dragActivationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hasActivatedDragRef = useRef(false);
  const dragStartPageYRef = useRef(0);
  const dragStartCardYRef = useRef(0);
  const dragStartScrollYRef = useRef(0);
  const scrollOffsetYRef = useRef(0);
  const scrollViewportHeightRef = useRef(0);
  const scrollContentHeightRef = useRef(0);
  const scrollViewportTopRef = useRef(0);
  const styles = createThemedStyles(theme, (currentTheme) => ({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    screen: {
      flex: 1,
      flexDirection: "column" as const,
      backgroundColor: currentTheme.colors.background,
      paddingHorizontal: 18,
      paddingTop: 9,
    },
    screenContent: {
      paddingBottom: 64,
    },
    statusRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
      marginTop: 8,
      marginBottom: 8,
    },
    statusText: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.caption.fontWeight,
      textAlign: "center" as const,
      marginTop: 4,
      marginBottom: 4,
    },
    floatingActionDismissOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    floatingActionButton: {
      position: "absolute" as const,
      right: 22,
      width: 58,
      height: 58,
      borderRadius: currentTheme.radii.pill,
      backgroundColor: "#FFFFFF",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      shadowColor: "#000000",
      shadowOpacity: 0.18,
      shadowRadius: 14,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      elevation: 10,
    },
    floatingActionMenuContainer: {
      position: "absolute" as const,
      right: 22,
      alignItems: "flex-end" as const,
      gap: 12,
    },
    floatingActionSecondaryButton: {
      minWidth: 156,
      height: 48,
      paddingHorizontal: 16,
      borderRadius: currentTheme.radii.pill,
      backgroundColor: currentTheme.colors.surfaceElevated,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      shadowColor: "#000000",
      shadowOpacity: 0.12,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      elevation: 8,
    },
    floatingActionSecondaryButtonText: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
  }));

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    Animated.spring(floatingActionMenuAnimation, {
      toValue: isFloatingActionMenuOpen ? 1 : 0,
      useNativeDriver: true,
      bounciness: 7,
      speed: 18,
    }).start();
  }, [floatingActionMenuAnimation, isFloatingActionMenuOpen]);

  useEffect(() => {
    if (!isFocused) {
      setIsFloatingActionMenuOpen(false);
    }
  }, [isFocused]);

  useEffect(() => {
    dashboardCardOrderRef.current = dashboardCardOrder;
  }, [dashboardCardOrder]);

  useEffect(() => () => clearDashboardDragState(), []);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardCardOrder = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(
          DASHBOARD_CARD_ORDER_STORAGE_KEY,
        );

        if (!isMounted || !storedValue) {
          return;
        }

        const parsedValue = JSON.parse(storedValue);

        if (
          Array.isArray(parsedValue) &&
          parsedValue.length === DEFAULT_DASHBOARD_CARD_ORDER.length &&
          DEFAULT_DASHBOARD_CARD_ORDER.every((key) => parsedValue.includes(key))
        ) {
          setDashboardCardOrder(parsedValue as DashboardCardKey[]);
        }
      } catch {
        // Keep default order when local preference is unavailable.
      }
    };

    void loadDashboardCardOrder();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuickAddFood = () => {
    setIsFloatingActionMenuOpen(false);
    router.push({
      pathname: "/discover",
      params: {
        quickAdd: "1",
        date: getDateKey(selectedDate),
        time: new Date()
          .toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
          .replace(" ", "")
          .toLowerCase(),
      },
    });
  };

  const handleStartWorkout = () => {
    setIsFloatingActionMenuOpen(false);
    startWorkout();
    router.push("/workout/active");
  };

  const toggleFloatingActionMenu = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFloatingActionMenuOpen((currentValue) => !currentValue);
  };

  const persistDashboardCardOrder = async (nextOrder: DashboardCardKey[]) => {
    try {
      await AsyncStorage.setItem(
        DASHBOARD_CARD_ORDER_STORAGE_KEY,
        JSON.stringify(nextOrder),
      );
    } catch {
      // Keep the in-memory order even if local persistence is unavailable.
    }
  };

  const clearDashboardDragState = () => {
    if (dragActivationTimeoutRef.current) {
      clearTimeout(dragActivationTimeoutRef.current);
      dragActivationTimeoutRef.current = null;
    }

    hasActivatedDragRef.current = false;
    activeDragCardRef.current = null;
  };

  const cancelPendingDashboardDrag = () => {
    if (dragActivationTimeoutRef.current) {
      clearTimeout(dragActivationTimeoutRef.current);
      dragActivationTimeoutRef.current = null;
    }

    hasActivatedDragRef.current = false;

    if (!draggingDashboardCard) {
      activeDragCardRef.current = null;
    }
  };

  const handleDashboardScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
  };

  const handleScrollViewLayout = (event: LayoutChangeEvent) => {
    scrollViewportHeightRef.current = event.nativeEvent.layout.height;
    scrollViewportTopRef.current = event.nativeEvent.layout.y;
  };

  const handleScrollViewContentSizeChange = (
    _width: number,
    height: number,
  ) => {
    scrollContentHeightRef.current = height;
  };

  const updateDragAutoScroll = (pageY: number) => {
    const viewportHeight = scrollViewportHeightRef.current;
    const viewportTop = scrollViewportTopRef.current;
    const maxScrollY = Math.max(
      scrollContentHeightRef.current - viewportHeight,
      0,
    );

    if (!viewportHeight || maxScrollY <= 0) {
      return;
    }

    const edgeThreshold = 120;
    const relativeTouchY = pageY - viewportTop;
    let scrollDelta = 0;

    if (relativeTouchY < edgeThreshold) {
      scrollDelta = relativeTouchY - edgeThreshold;
    } else if (relativeTouchY > viewportHeight - edgeThreshold) {
      scrollDelta = relativeTouchY - (viewportHeight - edgeThreshold);
    }

    if (scrollDelta === 0) {
      return;
    }

    const dampedScrollDelta = Math.max(Math.min(scrollDelta * 0.18, 18), -18);
    const nextScrollY = Math.max(
      0,
      Math.min(scrollOffsetYRef.current + dampedScrollDelta, maxScrollY),
    );

    if (nextScrollY === scrollOffsetYRef.current) {
      return;
    }

    scrollOffsetYRef.current = nextScrollY;
    scrollViewRef.current?.scrollTo({ y: nextScrollY, animated: false });
  };

  const handleDashboardCardLayout =
    (cardKey: DashboardCardKey) => (event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      dashboardCardLayoutsRef.current[cardKey] = { y, height };
    };

  const updateDashboardCardOrderWhileDragging = (
    cardKey: DashboardCardKey,
    desiredCardY: number,
  ) => {
    const activeLayout = dashboardCardLayoutsRef.current[cardKey];

    if (!activeLayout) {
      return;
    }

    const draggedCardCenter = desiredCardY + activeLayout.height / 2;
    const otherCardKeys = dashboardCardOrderRef.current.filter(
      (currentCardKey) => currentCardKey !== cardKey,
    );
    let insertionIndex = 0;

    otherCardKeys.forEach((otherCardKey) => {
      const otherLayout = dashboardCardLayoutsRef.current[otherCardKey];

      if (!otherLayout) {
        return;
      }

      const otherCardMidpoint = otherLayout.y + otherLayout.height / 2;

      if (draggedCardCenter >= otherCardMidpoint) {
        insertionIndex += 1;
      }
    });

    const nextOrder = [...otherCardKeys];
    nextOrder.splice(insertionIndex, 0, cardKey);

    if (
      nextOrder.every(
        (currentCardKey, index) =>
          currentCardKey === dashboardCardOrderRef.current[index],
      )
    ) {
      return;
    }

    LayoutAnimation.configureNext({
      duration: 180,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });

    void Haptics.selectionAsync();

    dashboardCardOrderRef.current = nextOrder;
    setDashboardCardOrder(nextOrder);
  };

  const finishDashboardCardDrag = () => {
    const draggedCard = activeDragCardRef.current;
    const nextOrder = [...dashboardCardOrderRef.current];

    clearDashboardDragState();
    LayoutAnimation.configureNext({
      duration: 180,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
    setDraggingDashboardCard(null);

    Animated.spring(dragOffsetY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 6,
      speed: 18,
    }).start();

    if (!draggedCard) {
      return;
    }

    void persistDashboardCardOrder(nextOrder);
  };

  const startDashboardCardDrag = (cardKey: DashboardCardKey) => {
    clearDashboardDragState();
    activeDragCardRef.current = cardKey;
    dragStartScrollYRef.current = scrollOffsetYRef.current;
    dragStartCardYRef.current =
      dashboardCardLayoutsRef.current[cardKey]?.y ?? 0;
    dragActivationTimeoutRef.current = setTimeout(() => {
      hasActivatedDragRef.current = true;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDraggingDashboardCard(cardKey);
      dragOffsetY.setValue(0);
    }, 220);
  };

  const createDashboardCardHandleResponder = (cardKey: DashboardCardKey) => ({
    onResponderGrant: (event: { nativeEvent: { pageY: number } }) => {
      dragStartPageYRef.current = event.nativeEvent.pageY;
      startDashboardCardDrag(cardKey);
    },
    onResponderMove: (event: { nativeEvent: { pageY: number } }) => {
      if (
        !hasActivatedDragRef.current ||
        activeDragCardRef.current !== cardKey
      ) {
        return;
      }

      updateDragAutoScroll(event.nativeEvent.pageY);

      const currentLayoutY =
        dashboardCardLayoutsRef.current[cardKey]?.y ??
        dragStartCardYRef.current;
      const desiredCardY =
        dragStartCardYRef.current +
        (event.nativeEvent.pageY - dragStartPageYRef.current) +
        (scrollOffsetYRef.current - dragStartScrollYRef.current);
      const dragY = desiredCardY - currentLayoutY;

      dragOffsetY.setValue(dragY);
      updateDashboardCardOrderWhileDragging(cardKey, desiredCardY);
    },
    onResponderRelease: () => {
      if (hasActivatedDragRef.current) {
        finishDashboardCardDrag();
        return;
      }

      cancelPendingDashboardDrag();
    },
    onResponderTerminate: () => {
      if (hasActivatedDragRef.current) {
        finishDashboardCardDrag();
        return;
      }

      cancelPendingDashboardDrag();
    },
    onResponderTerminationRequest: () => false,
  });

  const dashboardCardHandleResponders = {
    nutrition: createDashboardCardHandleResponder("nutrition"),
    exercise: createDashboardCardHandleResponder("exercise"),
    insights: createDashboardCardHandleResponder("insights"),
  };

  const renderDashboardCard = (cardKey: DashboardCardKey) => {
    const animatedStyle =
      draggingDashboardCard === cardKey
        ? {
            transform: [{ translateY: dragOffsetY }, { scale: 1.015 }],
            zIndex: 20,
            elevation: 20,
            opacity: 0.98,
          }
        : undefined;

    if (cardKey === "nutrition") {
      return (
        <Animated.View
          key={cardKey}
          onLayout={handleDashboardCardLayout(cardKey)}
          style={animatedStyle}
        >
          <TodaysNutritionCard
            protein={dailyMacroMetrics.protein}
            proteinGoal={dailyMacroMetrics.proteinGoal}
            fat={dailyMacroMetrics.fat}
            fatGoal={dailyMacroMetrics.fatGoal}
            carbs={dailyMacroMetrics.carbs}
            carbsGoal={dailyMacroMetrics.carbsGoal}
            calorieGoal={dailyMacroMetrics.calorieGoal}
            menuResponderHandlers={dashboardCardHandleResponders[cardKey]}
          />
        </Animated.View>
      );
    }

    if (cardKey === "exercise") {
      return (
        <Animated.View
          key={cardKey}
          onLayout={handleDashboardCardLayout(cardKey)}
          style={animatedStyle}
        >
          <TodaysExerciseCard
            metrics={dailyExerciseMetrics}
            unitPreference={unitPreference}
            menuResponderHandlers={dashboardCardHandleResponders[cardKey]}
          />
        </Animated.View>
      );
    }

    return (
      <Animated.View
        key={cardKey}
        onLayout={handleDashboardCardLayout(cardKey)}
        style={animatedStyle}
      >
        <InsightsCard
          entries={weightEntries}
          goal={weightGoal}
          unitPreference={unitPreference}
          menuResponderHandlers={dashboardCardHandleResponders[cardKey]}
        />
      </Animated.View>
    );
  };

  const applyFallbackDashboardState = () => {
    const nextMacroMetrics = getDailyMacroMetrics(selectedDate);
    const nextExerciseMetrics = getDailyExerciseMetrics(selectedDate);

    setDailyMacroMetrics(nextMacroMetrics);
    setDailyExerciseMetrics(nextExerciseMetrics);
    setWeightEntries([...mockWeightEntries]);
    setWeightGoal(mockGoal);
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoadingDashboard(true);

      try {
        const authenticatedUserId = await getAuthenticatedUserId();

        if (!isMounted) {
          return;
        }

        if (!authenticatedUserId) {
          applyFallbackDashboardState();
          setWeightGoal(mockGoal);
          setDashboardLoadError("Using local dashboard data right now.");
          return;
        }

        const snapshot: WorkoutDashboardSnapshot =
          await getWorkoutDashboardSnapshot(authenticatedUserId, selectedDate);

        if (!isMounted) {
          return;
        }

        setDailyMacroMetrics(snapshot.macroMetrics ?? EMPTY_MACRO_METRICS);
        setDailyExerciseMetrics(
          snapshot.exerciseMetrics ?? EMPTY_EXERCISE_METRICS,
        );
        setWeightEntries(snapshot.weightEntries);
        setWeightGoal(snapshot.weightGoal);
        setDashboardLoadError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        applyFallbackDashboardState();
        setDashboardLoadError("Using local dashboard data right now.");
      } finally {
        if (isMounted) {
          setIsLoadingDashboard(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.screen}
        contentContainerStyle={styles.screenContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={draggingDashboardCard === null}
        onLayout={handleScrollViewLayout}
        onContentSizeChange={handleScrollViewContentSizeChange}
        onScroll={handleDashboardScroll}
        scrollEventThrottle={16}
      >
        <DateCarousel
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
        />
        {isLoadingDashboard ? (
          <View style={styles.statusRow}>
            <ActivityIndicator
              size="small"
              color={theme.colors.iconSecondary}
            />
            <Text style={styles.statusText}>Syncing dashboard</Text>
          </View>
        ) : null}
        {dashboardLoadError ? (
          <Text style={styles.statusText}>{dashboardLoadError}</Text>
        ) : null}
        {dashboardCardOrder.map(renderDashboardCard)}
      </ScrollView>

      {isFloatingActionMenuOpen ? (
        <Pressable
          accessibilityLabel="Close add menu"
          onPress={() => setIsFloatingActionMenuOpen(false)}
          style={styles.floatingActionDismissOverlay}
        />
      ) : null}

      <Animated.View
        pointerEvents={isFloatingActionMenuOpen ? "auto" : "none"}
        style={[
          styles.floatingActionMenuContainer,
          {
            bottom: insets.bottom + 148,
            opacity: floatingActionMenuAnimation,
            transform: [
              {
                translateY: floatingActionMenuAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
              {
                scale: floatingActionMenuAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          style={styles.floatingActionSecondaryButton}
          onPress={handleStartWorkout}
        >
          <Text style={styles.floatingActionSecondaryButtonText}>
            Start Workout
          </Text>
          <Ionicons
            color={theme.colors.iconPrimary}
            name="barbell-outline"
            size={18}
          />
        </Pressable>

        <Pressable
          style={styles.floatingActionSecondaryButton}
          onPress={handleQuickAddFood}
        >
          <Text style={styles.floatingActionSecondaryButtonText}>Add Food</Text>
          <Ionicons
            color={theme.colors.iconPrimary}
            name="fast-food-outline"
            size={18}
          />
        </Pressable>
      </Animated.View>

      <Pressable
        accessibilityLabel="Add"
        onPress={toggleFloatingActionMenu}
        style={[styles.floatingActionButton, { bottom: insets.bottom + 78 }]}
      >
        <Animated.View
          style={{
            transform: [
              {
                rotate: floatingActionMenuAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "45deg"],
                }),
              },
            ],
          }}
        >
          <Ionicons color="#111418" name="add" size={30} />
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}
