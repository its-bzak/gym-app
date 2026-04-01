import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import GoalProgressSection from "@/components/main/GoalProgress";
import WeightTrendSection from "@/components/main/WeightTrend";
import {
  getDailyExerciseMetrics as getMockDailyExerciseMetrics,
  mockGoal,
  mockNutritionGoal,
  mockWeightEntries,
  upsertNutritionGoal as upsertMockNutritionGoal,
  upsertWeightGoal as upsertMockWeightGoal,
} from "@/mock/MainScreen/DailyMetricsSection";
import {
  getActiveNutritionGoal,
  getActiveWeightGoal,
  getDailyExerciseMetrics,
  getWeightEntries,
  type NutritionGoalInput,
  type WeightGoalInput,
  upsertActiveNutritionGoal,
  upsertActiveWeightGoal,
} from "@/services/dashboardService";
import { getAuthenticatedUserId } from "@/services/profileService";
import type { NutritionGoal, WeightEntry, WeightGoal } from "@/types/dashboard";
import { getCurrentDate } from "@/utils/dateFormat";

type GoalModal = "nutrition" | "weight" | null;

const EMPTY_EXERCISE_METRICS = {
  volume: 0,
  durationMins: 0,
  workoutType: "",
};

export default function PerformanceScreen() {
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal>(mockNutritionGoal);
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(mockGoal);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>(mockWeightEntries);
  const [exerciseMetrics, setExerciseMetrics] = useState(EMPTY_EXERCISE_METRICS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<GoalModal>(null);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [nutritionForm, setNutritionForm] = useState({
    calorieGoal: "",
    proteinGoal: "",
    fatGoal: "",
    carbsGoal: "",
  });
  const [weightForm, setWeightForm] = useState({
    startWeightKg: "",
    targetWeightKg: "",
  });

  const latestWeight = useMemo(() => {
    if (!weightEntries.length) {
      return null;
    }

    return weightEntries[weightEntries.length - 1].weightKg;
  }, [weightEntries]);

  const applyFallbackState = () => {
    setNutritionGoal({ ...mockNutritionGoal });
    setWeightGoal({ ...mockGoal });
    setWeightEntries([...mockWeightEntries]);
    setExerciseMetrics(getMockDailyExerciseMetrics(getCurrentDate()));
  };

  useEffect(() => {
    let isMounted = true;

    const loadPerformance = async () => {
      setIsLoading(true);

      try {
        const nextAuthenticatedUserId = await getAuthenticatedUserId();

        if (!isMounted) {
          return;
        }

        if (!nextAuthenticatedUserId) {
          setAuthenticatedUserId(null);
          applyFallbackState();
          setLoadError("Using local goals data right now.");
          return;
        }

        setAuthenticatedUserId(nextAuthenticatedUserId);

        const [nextNutritionGoal, nextWeightGoal, nextWeightEntries, nextExerciseMetrics] = await Promise.all([
          getActiveNutritionGoal(nextAuthenticatedUserId),
          getActiveWeightGoal(nextAuthenticatedUserId),
          getWeightEntries(nextAuthenticatedUserId),
          getDailyExerciseMetrics(nextAuthenticatedUserId, getCurrentDate()),
        ]);

        if (!isMounted) {
          return;
        }

        setNutritionGoal(nextNutritionGoal ?? { ...mockNutritionGoal });
        setWeightGoal(nextWeightGoal);
        setWeightEntries(nextWeightEntries);
        setExerciseMetrics(nextExerciseMetrics ?? EMPTY_EXERCISE_METRICS);
        setLoadError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setAuthenticatedUserId(null);
        applyFallbackState();
        setLoadError("Using local goals data right now.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPerformance();

    return () => {
      isMounted = false;
    };
  }, []);

  const openNutritionModal = () => {
    setNutritionForm({
      calorieGoal: String(nutritionGoal.calorieGoal ?? 0),
      proteinGoal: String(nutritionGoal.proteinGoal ?? 0),
      fatGoal: String(nutritionGoal.fatGoal ?? 0),
      carbsGoal: String(nutritionGoal.carbsGoal ?? 0),
    });
    setSaveError(null);
    setActiveModal("nutrition");
  };

  const openWeightModal = () => {
    setWeightForm({
      startWeightKg: String(weightGoal?.startWeightKg ?? latestWeight ?? 0),
      targetWeightKg: String(weightGoal?.targetWeightKg ?? latestWeight ?? 0),
    });
    setSaveError(null);
    setActiveModal("weight");
  };

  const closeModal = () => {
    if (isSavingGoal) {
      return;
    }

    setActiveModal(null);
    setSaveError(null);
  };

  const handleSaveNutritionGoal = async () => {
    const nextGoal: NutritionGoalInput = {
      calorieGoal: Number(nutritionForm.calorieGoal),
      proteinGoal: Number(nutritionForm.proteinGoal),
      fatGoal: Number(nutritionForm.fatGoal),
      carbsGoal: Number(nutritionForm.carbsGoal),
    };

    if (Object.values(nextGoal).some((value) => !Number.isFinite(value) || value < 0)) {
      setSaveError("Enter valid non-negative goal values.");
      return;
    }

    setIsSavingGoal(true);
    setSaveError(null);

    try {
      if (authenticatedUserId) {
        const result = await upsertActiveNutritionGoal(authenticatedUserId, nextGoal);

        if (result.success && result.data) {
          try {
            upsertMockNutritionGoal(result.data);
          } catch {
            // Best-effort local mirror only.
          }

          setNutritionGoal(result.data);
          setLoadError(null);
          setActiveModal(null);
          return;
        }

        if (!result.shouldFallback) {
          setSaveError(result.error ?? "Could not save nutrition goals.");
          return;
        }
      }

      const fallbackGoal = upsertMockNutritionGoal(nextGoal);
      setNutritionGoal(fallbackGoal);
      setLoadError("Using local goals data right now.");
      setActiveModal(null);
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleSaveWeightGoal = async () => {
    const nextGoal: WeightGoalInput = {
      startWeightKg: Number(weightForm.startWeightKg),
      targetWeightKg: Number(weightForm.targetWeightKg),
    };

    if (Object.values(nextGoal).some((value) => !Number.isFinite(value) || value <= 0)) {
      setSaveError("Enter valid weights greater than zero.");
      return;
    }

    setIsSavingGoal(true);
    setSaveError(null);

    try {
      if (authenticatedUserId) {
        const result = await upsertActiveWeightGoal(authenticatedUserId, nextGoal);

        if (result.success && result.data) {
          try {
            upsertMockWeightGoal(result.data);
          } catch {
            // Best-effort local mirror only.
          }

          setWeightGoal(result.data);
          setLoadError(null);
          setActiveModal(null);
          return;
        }

        if (!result.shouldFallback) {
          setSaveError(result.error ?? "Could not save weight goal.");
          return;
        }
      }

      const fallbackGoal = upsertMockWeightGoal(nextGoal);
      setWeightGoal(fallbackGoal);
      setLoadError("Using local goals data right now.");
      setActiveModal(null);
    } finally {
      setIsSavingGoal(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerEyebrow}>Goals</Text>
            <Text style={styles.headerTitle}>Performance</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#BDBDBD" />
            <Text style={styles.statusText}>Syncing goals</Text>
          </View>
        ) : null}
        {loadError ? <Text style={styles.statusText}>{loadError}</Text> : null}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.goalCard}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Nutrition Goals</Text>
                <Text style={styles.cardSubtitle}>Daily calorie and macro targets</Text>
              </View>
              <Pressable style={styles.cardActionButton} onPress={openNutritionModal}>
                <Text style={styles.cardActionText}>Edit</Text>
              </Pressable>
            </View>

            <View style={styles.goalMetricGrid}>
              <View style={styles.goalMetricChip}>
                <Text style={styles.goalMetricLabel}>Calories</Text>
                <Text style={styles.goalMetricValue}>{nutritionGoal.calorieGoal}</Text>
              </View>
              <View style={styles.goalMetricChip}>
                <Text style={styles.goalMetricLabel}>Protein</Text>
                <Text style={styles.goalMetricValue}>{nutritionGoal.proteinGoal}g</Text>
              </View>
              <View style={styles.goalMetricChip}>
                <Text style={styles.goalMetricLabel}>Fat</Text>
                <Text style={styles.goalMetricValue}>{nutritionGoal.fatGoal}g</Text>
              </View>
              <View style={styles.goalMetricChip}>
                <Text style={styles.goalMetricLabel}>Carbs</Text>
                <Text style={styles.goalMetricValue}>{nutritionGoal.carbsGoal}g</Text>
              </View>
            </View>
          </View>

          <View style={styles.goalCard}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Weight Goal</Text>
                <Text style={styles.cardSubtitle}>Target bodyweight tracking</Text>
              </View>
              <Pressable style={styles.cardActionButton} onPress={openWeightModal}>
                <Text style={styles.cardActionText}>Edit</Text>
              </Pressable>
            </View>

            {weightGoal ? (
              <View style={styles.weightGoalRow}>
                <View style={styles.weightGoalMetric}>
                  <Text style={styles.goalMetricLabel}>Start</Text>
                  <Text style={styles.goalMetricValue}>{weightGoal.startWeightKg.toFixed(1)} kg</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#666666" />
                <View style={styles.weightGoalMetric}>
                  <Text style={styles.goalMetricLabel}>Target</Text>
                  <Text style={styles.goalMetricValue}>{weightGoal.targetWeightKg.toFixed(1)} kg</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyCardText}>No active weight goal yet.</Text>
            )}
          </View>

          <View style={styles.summaryCardRow}>
            <View style={styles.summaryCardColumn}>
              <WeightTrendSection entries={weightEntries} />
            </View>
            <View style={styles.summaryCardColumn}>
              <GoalProgressSection entries={weightEntries} goal={weightGoal} />
            </View>
          </View>

          <View style={styles.goalCard}>
            <Text style={styles.cardTitle}>Today&apos;s Training</Text>
            <Text style={styles.cardSubtitle}>Current performance snapshot</Text>

            <View style={styles.goalMetricGrid}>
              <View style={styles.goalMetricChip}>
                <Text style={styles.goalMetricLabel}>Volume</Text>
                <Text style={styles.goalMetricValue}>{exerciseMetrics.volume.toLocaleString()} kg</Text>
              </View>
              <View style={styles.goalMetricChip}>
                <Text style={styles.goalMetricLabel}>Duration</Text>
                <Text style={styles.goalMetricValue}>{exerciseMetrics.durationMins} min</Text>
              </View>
              <View style={styles.goalMetricChipWide}>
                <Text style={styles.goalMetricLabel}>Workout</Text>
                <Text style={styles.goalMetricValue}>{exerciseMetrics.workoutType || "No session logged"}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      <Modal animationType="slide" transparent visible={activeModal !== null} onRequestClose={closeModal}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHandle} />

                {activeModal === "nutrition" ? (
                  <>
                    <Text style={styles.modalTitle}>Edit nutrition goals</Text>
                    <Text style={styles.modalSubtitle}>Set the targets used across Food Log and Workout.</Text>

                    <View style={styles.modalGrid}>
                      <TextInput
                        style={styles.modalInputHalf}
                        value={nutritionForm.calorieGoal}
                        onChangeText={(value) => setNutritionForm((current) => ({ ...current, calorieGoal: value }))}
                        placeholder="Calories"
                        placeholderTextColor="#6F6F6F"
                        keyboardType="numeric"
                        editable={!isSavingGoal}
                      />
                      <TextInput
                        style={styles.modalInputHalf}
                        value={nutritionForm.proteinGoal}
                        onChangeText={(value) => setNutritionForm((current) => ({ ...current, proteinGoal: value }))}
                        placeholder="Protein"
                        placeholderTextColor="#6F6F6F"
                        keyboardType="numeric"
                        editable={!isSavingGoal}
                      />
                      <TextInput
                        style={styles.modalInputHalf}
                        value={nutritionForm.fatGoal}
                        onChangeText={(value) => setNutritionForm((current) => ({ ...current, fatGoal: value }))}
                        placeholder="Fat"
                        placeholderTextColor="#6F6F6F"
                        keyboardType="numeric"
                        editable={!isSavingGoal}
                      />
                      <TextInput
                        style={styles.modalInputHalf}
                        value={nutritionForm.carbsGoal}
                        onChangeText={(value) => setNutritionForm((current) => ({ ...current, carbsGoal: value }))}
                        placeholder="Carbs"
                        placeholderTextColor="#6F6F6F"
                        keyboardType="numeric"
                        editable={!isSavingGoal}
                      />
                    </View>
                  </>
                ) : null}

                {activeModal === "weight" ? (
                  <>
                    <Text style={styles.modalTitle}>Edit weight goal</Text>
                    <Text style={styles.modalSubtitle}>Set the starting point and target you want to track.</Text>

                    <View style={styles.modalGrid}>
                      <TextInput
                        style={styles.modalInputHalf}
                        value={weightForm.startWeightKg}
                        onChangeText={(value) => setWeightForm((current) => ({ ...current, startWeightKg: value }))}
                        placeholder="Start weight"
                        placeholderTextColor="#6F6F6F"
                        keyboardType="numeric"
                        editable={!isSavingGoal}
                      />
                      <TextInput
                        style={styles.modalInputHalf}
                        value={weightForm.targetWeightKg}
                        onChangeText={(value) => setWeightForm((current) => ({ ...current, targetWeightKg: value }))}
                        placeholder="Target weight"
                        placeholderTextColor="#6F6F6F"
                        keyboardType="numeric"
                        editable={!isSavingGoal}
                      />
                    </View>
                  </>
                ) : null}

                {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}

                <View style={styles.modalButtonRow}>
                  <Pressable style={styles.modalSecondaryButton} onPress={closeModal}>
                    <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalPrimaryButton}
                    onPress={activeModal === "nutrition" ? handleSaveNutritionGoal : handleSaveWeightGoal}>
                    {isSavingGoal ? (
                      <ActivityIndicator size="small" color="#F4F4F4" />
                    ) : (
                      <Text style={styles.modalPrimaryButtonText}>Save</Text>
                    )}
                  </Pressable>
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
    backgroundColor: "#151515",
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  headerRow: {
    marginBottom: 16,
  },
  headerEyebrow: {
    color: "#7D7D7D",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    color: "#F4F4F4",
    fontSize: 28,
    fontWeight: "600",
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 6,
  },
  statusText: {
    color: "#7C7C7C",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  scrollContent: {
    paddingBottom: 100,
    gap: 12,
  },
  goalCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 24,
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    color: "#F4F4F4",
    fontSize: 18,
    fontWeight: "600",
  },
  cardSubtitle: {
    color: "#7D7D7D",
    fontSize: 13,
    marginTop: 4,
  },
  cardActionButton: {
    minWidth: 64,
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  cardActionText: {
    color: "#F4F4F4",
    fontSize: 13,
    fontWeight: "600",
  },
  goalMetricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  goalMetricChip: {
    width: "48%",
    borderRadius: 18,
    backgroundColor: "#202020",
    padding: 14,
  },
  goalMetricChipWide: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#202020",
    padding: 14,
  },
  goalMetricLabel: {
    color: "#8E8E8E",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  goalMetricValue: {
    color: "#F4F4F4",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  weightGoalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
  },
  weightGoalMetric: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#202020",
    padding: 14,
  },
  emptyCardText: {
    color: "#7D7D7D",
    fontSize: 14,
    marginTop: 16,
  },
  summaryCardRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCardColumn: {
    flex: 1,
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
    fontSize: 24,
    fontWeight: "600",
  },
  modalSubtitle: {
    color: "#8E8E8E",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 16,
  },
  modalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modalInputHalf: {
    width: "48%",
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#202020",
    color: "#F4F4F4",
    paddingHorizontal: 16,
    fontSize: 16,
  },
  saveError: {
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
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryButtonText: {
    color: "#B0B0B0",
    fontSize: 15,
    fontWeight: "600",
  },
  modalPrimaryButtonText: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "700",
  },
});