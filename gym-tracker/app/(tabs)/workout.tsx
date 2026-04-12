import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  LayoutChangeEvent,
  LayoutAnimation,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  UIManager,
  View,
} from "react-native";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import DateCarousel from "@/components/main/DateCarousel";
import TodaysExerciseCard from "@/components/main/TodaysExerciseCard";
import TodaysNutritionCard from "@/components/main/TodaysNutritionCard";
import InsightsCard from "../../components/main/InsightsCard";
import {
  DEFAULT_METRICS_DATE,
  getDailyExerciseMetrics,
  getDailyMacroMetrics,
  mockGoal,
  mockWeightEntries,
  upsertWeightEntry as upsertMockWeightEntry,
} from "@/mock/MainScreen/DailyMetricsSection";
import CustomKeypad from "@/components/ui/CustomKeypad";
import { useActiveWorkout } from "@/context/ActiveWorkoutContext";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import { useDisplayUnitPreference } from "@/hooks/use-display-unit-preference";
import { Ionicons } from "@expo/vector-icons";
import type { WeightEntry, WeightGoal } from "@/types/dashboard";
import type { MacroBarProps } from "@/utils/calculateMacroBar";
import { convertWeightUnitToKg, getWeightUnitLabel } from "@/utils/unitSystem";
import {
  getDateKey,
  getWorkoutDashboardSnapshot,
  type WorkoutDashboardSnapshot,
  upsertWeightEntry,
} from "@/services/dashboardService";
import { getAuthenticatedUserId } from "@/services/profileService";

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
const DEFAULT_DASHBOARD_CARD_ORDER = ["nutrition", "exercise", "insights"] as const;

type QuickActionModal = "weight" | "library" | null;
type DashboardCardKey = (typeof DEFAULT_DASHBOARD_CARD_ORDER)[number];

export default function WorkoutScreen() {
  const { theme } = useAppTheme();
  const [selectedDate, setSelectedDate] = useState(() => new Date(DEFAULT_METRICS_DATE));
  const [dailyMacroMetrics, setDailyMacroMetrics] = useState<MacroBarProps>(() =>
    getDailyMacroMetrics(selectedDate)
  );
  const [dailyExerciseMetrics, setDailyExerciseMetrics] = useState(() =>
    getDailyExerciseMetrics(selectedDate)
  );
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>(mockWeightEntries);
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(mockGoal);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardLoadError, setDashboardLoadError] = useState<string | null>(null);
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  const [activeQuickActionModal, setActiveQuickActionModal] = useState<QuickActionModal>(null);
  const [isSavingQuickAction, setIsSavingQuickAction] = useState(false);
  const [quickActionError, setQuickActionError] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [isWeightKeypadVisible, setIsWeightKeypadVisible] = useState(false);
  const [dashboardCardOrder, setDashboardCardOrder] = useState<DashboardCardKey[]>([
    ...DEFAULT_DASHBOARD_CARD_ORDER,
  ]);
  const [draggingDashboardCard, setDraggingDashboardCard] = useState<DashboardCardKey | null>(null);
  const { startWorkout } = useActiveWorkout();
  const { unitPreference } = useDisplayUnitPreference();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const dragOffsetY = useRef(new Animated.Value(0)).current;
  const dashboardCardLayoutsRef = useRef<Partial<Record<DashboardCardKey, { y: number; height: number }>>>({});
  const dashboardCardOrderRef = useRef<DashboardCardKey[]>([...DEFAULT_DASHBOARD_CARD_ORDER]);
  const activeDragCardRef = useRef<DashboardCardKey | null>(null);
  const dragActivationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    bodyMapContainer: {
      marginTop: 20,
      height: 360,
      borderRadius: currentTheme.radii.xl,
      backgroundColor: currentTheme.colors.surface,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    startButton: {
      marginBottom: 45,
      height: 50,
      borderRadius: currentTheme.components.button.radius,
      backgroundColor: currentTheme.colors.accent,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    startButtonText: {
      color: currentTheme.colors.onAccent,
      fontSize: currentTheme.typography.label.fontSize + 2,
      lineHeight: currentTheme.typography.label.lineHeight + 2,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
    secondaryButtonContainer: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      marginBottom: 12,
    },
    logFoodButton: {
      flex: 1,
      height: 40,
      backgroundColor: currentTheme.colors.surface,
      borderRadius: currentTheme.radii.lg,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    logWeightButton: {
      flex: 1,
      height: 40,
      backgroundColor: currentTheme.colors.surface,
      borderRadius: currentTheme.radii.lg,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginLeft: 6,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    routinesAndExercisesButton: {
      flex: 2,
      height: 40,
      backgroundColor: currentTheme.colors.surface,
      borderRadius: currentTheme.radii.lg,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginLeft: 6,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    secondaryButtonText: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.body.fontWeight,
    },
    mainButtonContainer: {
      flex: 1,
      flexDirection: "column" as const,
      justifyContent: "flex-end" as const,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: currentTheme.colors.surfaceOverlay,
      justifyContent: "flex-end" as const,
    },
    modalSheet: {
      backgroundColor: currentTheme.colors.surfaceElevated,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 28,
      borderTopWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    modalHandle: {
      alignSelf: "center" as const,
      width: 46,
      height: 5,
      borderRadius: currentTheme.radii.pill,
      backgroundColor: currentTheme.colors.border,
      marginBottom: 16,
    },
    modalTitle: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.title.fontSize,
      lineHeight: currentTheme.typography.title.lineHeight,
      fontWeight: currentTheme.typography.title.fontWeight,
      marginBottom: 8,
    },
    modalSubtitle: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.body.fontWeight,
      marginTop: 6,
      marginBottom: 16,
    },
    fullWidthField: {
      marginTop: 10,
    },
    metricLabel: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.caption.fontWeight,
      marginBottom: 6,
    },
    metricInput: {
      minHeight: 46,
      borderRadius: currentTheme.components.input.radius,
      backgroundColor: currentTheme.colors.inputBackground,
      borderWidth: 1,
      borderColor: currentTheme.colors.inputBorder,
      color: currentTheme.colors.textPrimary,
      paddingHorizontal: 14,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.body.fontWeight,
    },
    libraryActionButton: {
      minHeight: 50,
      borderRadius: currentTheme.radii.lg,
      backgroundColor: currentTheme.colors.surface,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    libraryActionButtonText: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
    quickActionError: {
      color: currentTheme.colors.danger,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.caption.fontWeight,
      marginTop: 12,
    },
    modalButtonRow: {
      flexDirection: "row" as const,
      gap: 10,
      marginTop: 18,
    },
    modalSecondaryButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: currentTheme.radii.lg,
      backgroundColor: currentTheme.colors.surface,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
    },
    modalPrimaryButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: currentTheme.radii.lg,
      backgroundColor: currentTheme.colors.accent,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    modalSecondaryButtonText: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
    modalPrimaryButtonText: {
      color: currentTheme.colors.onAccent,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
    dashboardOrderCopy: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.body.fontWeight,
      marginBottom: 14,
    },
    dashboardOrderList: {
      gap: 10,
      marginBottom: 18,
    },
    dashboardOrderRow: {
      minHeight: 48,
      borderRadius: currentTheme.radii.lg,
      backgroundColor: currentTheme.colors.surface,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      paddingHorizontal: 14,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
    },
    dashboardOrderLabel: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
      textTransform: "capitalize" as const,
    },
  }));

  useEffect(() => {
    if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    dashboardCardOrderRef.current = dashboardCardOrder;
  }, [dashboardCardOrder]);

  useEffect(() => () => clearDashboardDragState(), []);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardCardOrder = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(DASHBOARD_CARD_ORDER_STORAGE_KEY);

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

  const resetQuickActionForms = () => {
    setWeightInput("");
    setIsWeightKeypadVisible(false);
  };

  const closeQuickActionModal = () => {
    if (isSavingQuickAction) {
      return;
    }

    setActiveQuickActionModal(null);
    setQuickActionError(null);
    resetQuickActionForms();
  };

  const openQuickActionModal = (modal: QuickActionModal) => {
    resetQuickActionForms();
    setQuickActionError(null);
    setActiveQuickActionModal(modal);
    setIsWeightKeypadVisible(modal === "weight");
  };

  const dismissWeightKeypad = () => {
    Keyboard.dismiss();
    setIsWeightKeypadVisible(false);
  };

  const persistDashboardCardOrder = async (nextOrder: DashboardCardKey[]) => {
    try {
      await AsyncStorage.setItem(DASHBOARD_CARD_ORDER_STORAGE_KEY, JSON.stringify(nextOrder));
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

  const handleDashboardScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
  };

  const handleScrollViewLayout = (event: LayoutChangeEvent) => {
    scrollViewportHeightRef.current = event.nativeEvent.layout.height;
    scrollViewportTopRef.current = event.nativeEvent.layout.y;
  };

  const handleScrollViewContentSizeChange = (_width: number, height: number) => {
    scrollContentHeightRef.current = height;
  };

  const updateDragAutoScroll = (pageY: number) => {
    const viewportHeight = scrollViewportHeightRef.current;
    const viewportTop = scrollViewportTopRef.current;
    const maxScrollY = Math.max(scrollContentHeightRef.current - viewportHeight, 0);

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
    const nextScrollY = Math.max(0, Math.min(scrollOffsetYRef.current + dampedScrollDelta, maxScrollY));

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

  const updateDashboardCardOrderWhileDragging = (cardKey: DashboardCardKey, desiredCardY: number) => {
    const activeLayout = dashboardCardLayoutsRef.current[cardKey];

    if (!activeLayout) {
      return;
    }

    const draggedCardCenter = desiredCardY + activeLayout.height / 2;
    const otherCardKeys = dashboardCardOrderRef.current.filter((currentCardKey) => currentCardKey !== cardKey);
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

    if (nextOrder.every((currentCardKey, index) => currentCardKey === dashboardCardOrderRef.current[index])) {
      return;
    }

    LayoutAnimation.configureNext({
      duration: 180,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });

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
    dragStartCardYRef.current = dashboardCardLayoutsRef.current[cardKey]?.y ?? 0;
    dragActivationTimeoutRef.current = setTimeout(() => {
      hasActivatedDragRef.current = true;
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
        if (!hasActivatedDragRef.current || activeDragCardRef.current !== cardKey) {
          return;
        }

        updateDragAutoScroll(event.nativeEvent.pageY);

        const currentLayoutY = dashboardCardLayoutsRef.current[cardKey]?.y ?? dragStartCardYRef.current;
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
        <Animated.View key={cardKey} onLayout={handleDashboardCardLayout(cardKey)} style={animatedStyle}>
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
        <Animated.View key={cardKey} onLayout={handleDashboardCardLayout(cardKey)} style={animatedStyle}>
          <TodaysExerciseCard
            metrics={dailyExerciseMetrics}
            unitPreference={unitPreference}
            menuResponderHandlers={dashboardCardHandleResponders[cardKey]}
          />
        </Animated.View>
      );
    }

    return (
      <Animated.View key={cardKey} onLayout={handleDashboardCardLayout(cardKey)} style={animatedStyle}>
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
          setAuthenticatedUserId(null);
          applyFallbackDashboardState();
          setWeightGoal(mockGoal);
          setDashboardLoadError("Using local dashboard data right now.");
          return;
        }

        setAuthenticatedUserId(authenticatedUserId);

        const snapshot: WorkoutDashboardSnapshot = await getWorkoutDashboardSnapshot(
          authenticatedUserId,
          selectedDate
        );

        if (!isMounted) {
          return;
        }

        setDailyMacroMetrics(snapshot.macroMetrics ?? EMPTY_MACRO_METRICS);
        setDailyExerciseMetrics(snapshot.exerciseMetrics ?? EMPTY_EXERCISE_METRICS);
        setWeightEntries(snapshot.weightEntries);
        setWeightGoal(snapshot.weightGoal);
        setDashboardLoadError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setAuthenticatedUserId(null);
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

  const handleSaveWeight = async () => {
    const nextWeightValue = Number(weightInput);

    if (!Number.isFinite(nextWeightValue) || nextWeightValue <= 0) {
      setQuickActionError("Enter a valid weight greater than zero.");
      return;
    }

    const nextWeightKg = convertWeightUnitToKg(nextWeightValue, unitPreference);

    setIsSavingQuickAction(true);
    setQuickActionError(null);

    try {
      if (authenticatedUserId) {
        const result = await upsertWeightEntry(authenticatedUserId, selectedDate, nextWeightKg);

        if (result.success && result.data) {
          try {
            upsertMockWeightEntry(selectedDate, result.data.weightKg);
          } catch {
            // Best-effort local mirror only.
          }

          setWeightEntries((previousEntries) => {
            const remainingEntries = previousEntries.filter(
              (entry) => entry.date !== result.data?.date
            );

            return [...remainingEntries, result.data as WeightEntry].sort((left, right) =>
              left.date.localeCompare(right.date)
            );
          });
          setDashboardLoadError(null);
          setActiveQuickActionModal(null);
          resetQuickActionForms();
          return;
        }

        if (!result.shouldFallback) {
          setQuickActionError(result.error ?? "Could not save weight entry.");
          return;
        }
      }

      const fallbackEntry = upsertMockWeightEntry(selectedDate, nextWeightKg);
      setWeightEntries([...mockWeightEntries]);
      setDashboardLoadError("Using local dashboard data right now.");
      setActiveQuickActionModal(null);
      resetQuickActionForms();
    } finally {
      setIsSavingQuickAction(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.screen}
        showsVerticalScrollIndicator={false}
        scrollEnabled={draggingDashboardCard === null}
        onLayout={handleScrollViewLayout}
        onContentSizeChange={handleScrollViewContentSizeChange}
        onScroll={handleDashboardScroll}
        scrollEventThrottle={16}>
        
        <DateCarousel selectedDate={selectedDate} onChangeDate={setSelectedDate} />
        {isLoadingDashboard ? (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={theme.colors.iconSecondary} />
            <Text style={styles.statusText}>Syncing dashboard</Text>
          </View>
        ) : null}
        {dashboardLoadError ? <Text style={styles.statusText}>{dashboardLoadError}</Text> : null}
        {dashboardCardOrder.map(renderDashboardCard)}

        <View style={styles.bodyMapContainer}>
          {/* Placeholder for BodyMap component */}
        </View>

        <View style={styles.mainButtonContainer}>
    
          <View style={styles.secondaryButtonContainer}>
            <Pressable
              style={styles.logFoodButton}
              onPress={() =>
                router.push({
                  pathname: "/discover",
                  params: {
                    quickAdd: "1",
                    date: getDateKey(selectedDate),
                    time: new Date().toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    }).replace(" ", "").toLowerCase(),
                  },
                })
              }>
                <Ionicons name="fast-food-outline" size={20} color={theme.colors.iconSecondary} />
            </Pressable>

            <Pressable style={styles.logWeightButton} onPress={() => openQuickActionModal("weight")}>
                <Ionicons name="scale-outline" size={20} color={theme.colors.iconSecondary} />
            </Pressable>

            <Pressable
              style={styles.routinesAndExercisesButton}
              onPress={() => openQuickActionModal("library")}>
                <Text style={styles.secondaryButtonText}>Routines / Exercises</Text>
            </Pressable>

          </View>

          <Pressable style={styles.startButton} onPress={() => {
            startWorkout();
            router.push("/workout/active");
          }}>
              <Text style={styles.startButtonText}>Start Workout</Text>
          </Pressable>

        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={activeQuickActionModal !== null}
        onRequestClose={closeQuickActionModal}>
        <TouchableWithoutFeedback onPress={dismissWeightKeypad} accessible={false}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={dismissWeightKeypad} accessible={false}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />

                {activeQuickActionModal === "weight" ? (
                  <>
                    <Text style={styles.modalTitle}>Log weight</Text>

                    <Text style={styles.modalSubtitle}>
                      Save a weight reading for this date.
                    </Text>

                    <View style={styles.fullWidthField}>
                      <Text style={styles.metricLabel}>{`Weight (${getWeightUnitLabel(unitPreference)})`}</Text>
                      <TextInput
                        style={styles.metricInput}
                        value={weightInput}
                        onChangeText={setWeightInput}
                        keyboardType="numeric"
                        editable={!isSavingQuickAction}
                        showSoftInputOnFocus={false}
                        onFocus={() => {
                          Keyboard.dismiss();
                          setIsWeightKeypadVisible(true);
                        }}
                      />
                    </View>

                    {isWeightKeypadVisible ? (
                      <CustomKeypad
                        mode="decimal"
                        value={weightInput}
                        onChange={setWeightInput}
                        onDone={() => setIsWeightKeypadVisible(false)}
                        showClearKey={false}
                        showDoneKey={false}
                      />
                    ) : null}
                  </>
                ) : null}

                {activeQuickActionModal === "library" ? (
                  <>
                    <Text style={styles.modalTitle}>Choose library</Text>

                    <Pressable
                      style={styles.libraryActionButton}
                      onPress={() => {
                        setActiveQuickActionModal(null);
                        router.push("/workout/exercises");
                      }}>
                      <Text style={styles.libraryActionButtonText}>Exercise Library</Text>
                    </Pressable>

                    <Pressable
                      style={styles.libraryActionButton}
                      onPress={() => {
                        setActiveQuickActionModal(null);
                        router.push("/workout/routines");
                      }}>
                      <Text style={styles.libraryActionButtonText}>Routine Library</Text>
                    </Pressable>
                  </>
                ) : null}

                {quickActionError ? <Text style={styles.quickActionError}>{quickActionError}</Text> : null}

                <View style={styles.modalButtonRow}>
                  <Pressable style={styles.modalSecondaryButton} onPress={closeQuickActionModal}>
                    <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                  </Pressable>

                  {activeQuickActionModal === "weight" ? (
                    <Pressable style={styles.modalPrimaryButton} onPress={handleSaveWeight}>
                      {isSavingQuickAction ? (
                        <ActivityIndicator size="small" color={theme.colors.onAccent} />
                      ) : (
                        <Text style={styles.modalPrimaryButtonText}>Save Weight</Text>
                      )}
                    </Pressable>
                  ) : null}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}