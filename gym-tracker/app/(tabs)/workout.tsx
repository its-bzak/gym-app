import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import DateCarousel from "@/components/main/DateCarousel";
import DailyMacroMetricsSection from "@/components/main/DailyMetrics/DailyMacroMetricsSection";
import DailyExerciseMetricsSection from "@/components/main/DailyMetrics/DailyExerciseMetricsSection";
import {
  DEFAULT_METRICS_DATE,
  getDailyExerciseMetrics,
  getDailyMacroMetrics,
  mockGoal,
  mockWeightEntries,
  upsertWeightEntry as upsertMockWeightEntry,
} from "@/mock/MainScreen/DailyMetricsSection";
import WeightTrendSection from "@/components/main/WeightTrend";
import GoalProgressSection from "@/components/main/GoalProgress";
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

type QuickActionModal = "weight" | "library" | null;

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
  const { startWorkout } = useActiveWorkout();
  const { unitPreference } = useDisplayUnitPreference();
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
    dataContainers: {
      flexDirection: "row" as const,
      marginTop: 18,
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
    weightTrendContainer: {
      flex: 1,
      height: 80,
      marginRight: 5,
    },
    goalProgressContainer: {
      flex: 1,
      height: 80,
      marginLeft: 5,
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
  }));

  const resetQuickActionForms = () => {
    setWeightInput("");
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
      <View style={styles.screen}>
        
        <DateCarousel selectedDate={selectedDate} onChangeDate={setSelectedDate} />
        {isLoadingDashboard ? (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={theme.colors.iconSecondary} />
            <Text style={styles.statusText}>Syncing dashboard</Text>
          </View>
        ) : null}
        {dashboardLoadError ? <Text style={styles.statusText}>{dashboardLoadError}</Text> : null}
        <DailyMacroMetricsSection
          protein={dailyMacroMetrics.protein}
          proteinGoal={dailyMacroMetrics.proteinGoal}
          fat={dailyMacroMetrics.fat}
          fatGoal={dailyMacroMetrics.fatGoal}
          carbs={dailyMacroMetrics.carbs}
          carbsGoal={dailyMacroMetrics.carbsGoal}
          calorieGoal={dailyMacroMetrics.calorieGoal}
        />
        <DailyExerciseMetricsSection
          metrics={dailyExerciseMetrics}
          unitPreference={unitPreference}
        />

        <View style={styles.dataContainers}>
          <View style={styles.weightTrendContainer}>
            <WeightTrendSection entries={weightEntries} unitPreference={unitPreference} />
          </View>
          <View style={styles.goalProgressContainer}>
            <GoalProgressSection
              entries={weightEntries}
              goal={weightGoal}
              unitPreference={unitPreference}
            />
          </View>
        </View>

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
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={activeQuickActionModal !== null}
        onRequestClose={closeQuickActionModal}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
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
                        onFocus={Keyboard.dismiss}
                      />
                    </View>

                    <CustomKeypad
                      mode="decimal"
                      value={weightInput}
                      onChange={setWeightInput}
                      showClearKey={false}
                      showDoneKey={false}
                    />
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