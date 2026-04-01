import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
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
import { useActiveWorkout } from "@/context/ActiveWorkoutContext";
import { Ionicons } from "@expo/vector-icons";
import type { WeightEntry, WeightGoal } from "@/types/dashboard";
import type { MacroBarProps } from "@/utils/calculateMacroBar";
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
    const nextWeightKg = Number(weightInput);

    if (!Number.isFinite(nextWeightKg) || nextWeightKg <= 0) {
      setQuickActionError("Enter a valid weight greater than zero.");
      return;
    }

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
            <ActivityIndicator size="small" color="#8B8B8B" />
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
        <DailyExerciseMetricsSection metrics={dailyExerciseMetrics} />

        <View style={styles.dataContainers}>
          <View style={styles.weightTrendContainer}>
            <WeightTrendSection entries={weightEntries} />
          </View>
          <View style={styles.goalProgressContainer}>
            <GoalProgressSection entries={weightEntries} goal={weightGoal} />
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
                    hour: "12",
                  },
                })
              }>
                <Ionicons name="fast-food-outline" size={20} color="#7C7C7C" />
            </Pressable>

            <Pressable style={styles.logWeightButton} onPress={() => openQuickActionModal("weight")}>
                <Ionicons name="scale-outline" size={20} color="#7C7C7C" />
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
                      <Text style={styles.metricLabel}>Weight (kg)</Text>
                      <TextInput
                        style={styles.metricInput}
                        value={weightInput}
                        onChangeText={setWeightInput}
                        keyboardType="numeric"
                        editable={!isSavingQuickAction}
                      />
                    </View>
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
                        <ActivityIndicator size="small" color="#F4F4F4" />
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#151515",
  },
  screen: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#151515",
    paddingHorizontal: 18,
    paddingTop: 9,
  },
  datePill: {
    height: 42,
    borderRadius: 22,
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  dateText: {
    color: "#7C7C7C",
    fontSize: 16,
    lineHeight: 20,
  },
  dataContainers: {
    flexDirection: "row",
    marginTop: 18,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  statusText: {
    color: "#7C7C7C",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  weightTrendContainer: {
    flex: 1,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    marginRight: 5,
  },
  goalProgressContainer: {
    flex: 1,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    marginLeft: 5,
  },
  bodyMapContainer: {
    marginTop: 20,
    height: 360,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
  },
  startButton: {
    marginBottom: 45,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    color: "#7C7C7C",
    fontSize: 18,
  },
    secondaryButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  logFoodButton: {
    flex: 1,
    height: 40,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  logWeightButton: {
    flex: 1,
    height: 40,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  routinesAndExercisesButton: {
    flex: 2,
    height: 40,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  secondaryButtonText: {
    color: "#7C7C7C",
    fontSize: 16,
  },
  mainButtonContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#161616",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
  },
  modalHandle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#3A3A3A",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#F4F4F4",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalSubtitle: {
    color: "#8E8E8E",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 16,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricField: {
    flex: 1,
  },
  fullWidthField: {
    marginTop: 10,
  },
  metricLabel: {
    color: "#B5B5B5",
    fontSize: 13,
    marginBottom: 6,
  },
  metricInput: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#202020",
    color: "#F4F4F4",
    paddingHorizontal: 14,
    fontSize: 15,
  },
  libraryActionButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#202020",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  libraryActionButtonText: {
    color: "#F4F4F4",
    fontSize: 15,
    fontWeight: "600",
  },
  quickActionError: {
    color: "#F28B82",
    fontSize: 13,
    marginTop: 12,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  modalSecondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#202020",
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#313131",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryButtonText: {
    color: "#B0B0B0",
    fontSize: 15,
    fontWeight: "600",
  },
  modalPrimaryButtonText: {
    color: "#F4F4F4",
    fontSize: 15,
    fontWeight: "600",
  },
});