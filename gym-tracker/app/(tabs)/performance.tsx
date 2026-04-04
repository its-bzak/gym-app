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

import {
  getLifetimeTrainingMetrics as getMockLifetimeTrainingMetrics,
  mockGoal,
  mockNutritionGoal,
  mockWeightEntries,
  upsertNutritionGoal as upsertMockNutritionGoal,
} from "@/mock/MainScreen/DailyMetricsSection";
import {
  getActiveGoalPlan,
  getLifetimeTrainingMetrics,
  getWeightEntries,
  type NutritionGoalInput,
  upsertActiveNutritionGoal,
} from "@/services/dashboardService";
import { getAuthenticatedUserId } from "@/services/profileService";
import type { LifetimeTrainingMetrics, NutritionGoal, WeightEntry, WeightGoal } from "@/types/dashboard";
import { getLatestWeight, getWeightTrend } from "@/utils/weightProgress";

const EMPTY_LIFETIME_TRAINING_METRICS: LifetimeTrainingMetrics = {
  totalSets: null,
  totalVolume: 0,
  totalDurationMins: 0,
  totalWorkouts: 0,
  totalReps: null,
};

function getProgramModeLabel(mode: NutritionGoal["programMode"]): string {
  return mode === "guided" ? "Generated Program" : "Manual Program";
}

function getTrendRateKgPerWeek(entries: WeightEntry[], windowSize: number = 14): number | null {
  if (entries.length < 2) {
    return null;
  }

  const recentEntries = entries.slice(-windowSize);
  const firstEntry = recentEntries[0];
  const lastEntry = recentEntries[recentEntries.length - 1];
  const msPerDay = 1000 * 60 * 60 * 24;
  const elapsedDays = Math.max(
    1,
    Math.round((new Date(lastEntry.date).getTime() - new Date(firstEntry.date).getTime()) / msPerDay)
  );

  return ((lastEntry.weightKg - firstEntry.weightKg) / elapsedDays) * 7;
}

function getEstimatedGoalDate(goal: WeightGoal | null, entries: WeightEntry[]): string {
  if (!goal || goal.goalType === "maintain") {
    return "No target date";
  }

  const currentWeight = getLatestWeight(entries) ?? goal.startWeightKg;

  if (goal.goalType === "lose" && currentWeight <= goal.targetWeightKg) {
    return "Goal reached";
  }

  if (goal.goalType === "gain" && currentWeight >= goal.targetWeightKg) {
    return "Goal reached";
  }

  const actualRateKgPerWeek = getTrendRateKgPerWeek(entries);

  if (!actualRateKgPerWeek || Math.abs(actualRateKgPerWeek) < 0.01) {
    return "No trend yet";
  }

  if (goal.goalType === "lose" && actualRateKgPerWeek >= 0) {
    return "Trend off target";
  }

  if (goal.goalType === "gain" && actualRateKgPerWeek <= 0) {
    return "Trend off target";
  }

  const remainingKg = Math.abs(goal.targetWeightKg - currentWeight);
  const daysRemaining = Math.ceil((remainingKg / Math.abs(actualRateKgPerWeek)) * 7);
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + Math.max(daysRemaining, 0));

  return estimatedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDurationTotal(durationMins: number): string {
  const hours = Math.floor(durationMins / 60);
  const minutes = durationMins % 60;

  if (!hours) {
    return `${minutes} min`;
  }

  if (!minutes) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

function getGoalStartDelta(goal: WeightGoal | null, entries: WeightEntry[]): number | null {
  if (!goal) {
    return null;
  }

  const latestWeight = getLatestWeight(entries);

  if (latestWeight === null) {
    return null;
  }

  return latestWeight - goal.startWeightKg;
}

function getTrendArrow(value: number): string {
  if (value > 0.05) {
    return "↑";
  }

  if (value < -0.05) {
    return "↓";
  }

  return "→";
}

function formatTrendValue(value: number): string {
  return `${getTrendArrow(value)} ${Math.abs(value).toFixed(1)} kg`;
}

function formatMetricCount(value: number | null, suffix: string): string {
  if (value === null) {
    return "Not tracked yet";
  }

  return `${value.toLocaleString()} ${suffix}`;
}

export default function PerformanceScreen() {
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal>(mockNutritionGoal);
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(mockGoal);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>(mockWeightEntries);
  const [lifetimeTrainingMetrics, setLifetimeTrainingMetrics] = useState<LifetimeTrainingMetrics>(
    EMPTY_LIFETIME_TRAINING_METRICS
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  const [isTargetsModalVisible, setIsTargetsModalVisible] = useState(false);
  const [targetsError, setTargetsError] = useState<string | null>(null);
  const [isSavingTargets, setIsSavingTargets] = useState(false);
  const [targetsForm, setTargetsForm] = useState({
    calorieGoal: String(mockNutritionGoal.calorieGoal),
    proteinGoal: String(mockNutritionGoal.proteinGoal),
    carbsGoal: String(mockNutritionGoal.carbsGoal),
    fatGoal: String(mockNutritionGoal.fatGoal),
  });

  const weightTrend = useMemo(() => getWeightTrend(weightEntries), [weightEntries]);
  const estimatedGoalDate = useMemo(
    () => getEstimatedGoalDate(weightGoal, weightEntries),
    [weightEntries, weightGoal]
  );
  const trendRateKgPerWeek = useMemo(() => getTrendRateKgPerWeek(weightEntries), [weightEntries]);
  const goalStartDeltaKg = useMemo(
    () => getGoalStartDelta(weightGoal, weightEntries),
    [weightEntries, weightGoal]
  );

  const resetTargetsForm = (goal: NutritionGoal) => {
    setTargetsForm({
      calorieGoal: String(goal.calorieGoal),
      proteinGoal: String(goal.proteinGoal),
      carbsGoal: String(goal.carbsGoal),
      fatGoal: String(goal.fatGoal),
    });
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

        setAuthenticatedUserId(nextAuthenticatedUserId);

        if (!nextAuthenticatedUserId) {
          setNutritionGoal({ ...mockNutritionGoal });
          setWeightGoal({ ...mockGoal });
          setWeightEntries([...mockWeightEntries]);
          setLifetimeTrainingMetrics(getMockLifetimeTrainingMetrics());
          resetTargetsForm(mockNutritionGoal);
          setLoadError("Using local progress data right now.");
          return;
        }

        const [goalPlan, nextWeightEntries, nextLifetimeTrainingMetrics] = await Promise.all([
          getActiveGoalPlan(nextAuthenticatedUserId),
          getWeightEntries(nextAuthenticatedUserId),
          getLifetimeTrainingMetrics(nextAuthenticatedUserId),
        ]);

        if (!isMounted) {
          return;
        }

        setWeightEntries(nextWeightEntries);
        setLifetimeTrainingMetrics(nextLifetimeTrainingMetrics);

        if (goalPlan) {
          setNutritionGoal(goalPlan.nutritionGoal);
          setWeightGoal(goalPlan.bodyGoal);
          resetTargetsForm(goalPlan.nutritionGoal);
          setLoadError(null);
          return;
        }

        setNutritionGoal({ ...mockNutritionGoal });
        setWeightGoal(null);
        resetTargetsForm(mockNutritionGoal);
        setLoadError("No synced progress targets yet.");
      } catch {
        if (!isMounted) {
          return;
        }

        setAuthenticatedUserId(null);
        setNutritionGoal({ ...mockNutritionGoal });
        setWeightGoal({ ...mockGoal });
        setWeightEntries([...mockWeightEntries]);
        setLifetimeTrainingMetrics(getMockLifetimeTrainingMetrics());
        resetTargetsForm(mockNutritionGoal);
        setLoadError("Using local progress data right now.");
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

  const openTargetsModal = () => {
    resetTargetsForm(nutritionGoal);
    setTargetsError(null);
    setIsTargetsModalVisible(true);
  };

  const closeTargetsModal = () => {
    if (isSavingTargets) {
      return;
    }

    setTargetsError(null);
    setIsTargetsModalVisible(false);
  };

  const handleSaveTargets = async () => {
    const calorieGoal = Number(targetsForm.calorieGoal);
    const proteinGoal = Number(targetsForm.proteinGoal);
    const carbsGoal = Number(targetsForm.carbsGoal);
    const fatGoal = Number(targetsForm.fatGoal);
    const values = [calorieGoal, proteinGoal, carbsGoal, fatGoal];

    if (values.some((value) => !Number.isFinite(value) || value < 0) || calorieGoal <= 0) {
      setTargetsError("Enter valid calorie and macro targets.");
      return;
    }

    const nextGoal: NutritionGoal = {
      ...nutritionGoal,
      programMode: "manual",
      calorieGoal,
      proteinGoal,
      carbsGoal,
      fatGoal,
      adaptiveEnabled: false,
    };

    const input: NutritionGoalInput = {
      programMode: nextGoal.programMode,
      calorieGoal: nextGoal.calorieGoal,
      proteinGoal: nextGoal.proteinGoal,
      carbsGoal: nextGoal.carbsGoal,
      fatGoal: nextGoal.fatGoal,
      maintenanceCalories: nextGoal.maintenanceCalories ?? nextGoal.calorieGoal,
      plannedDailyEnergyDelta: nextGoal.plannedDailyEnergyDelta ?? 0,
      proteinPreference: nextGoal.proteinPreference,
      carbPreference: nextGoal.carbPreference,
      fatPreference: nextGoal.fatPreference,
      adaptiveEnabled: false,
    };

    setIsSavingTargets(true);
    setTargetsError(null);

    try {
      if (authenticatedUserId) {
        const result = await upsertActiveNutritionGoal(authenticatedUserId, input);

        if (result.success && result.data) {
          setNutritionGoal(result.data);
          setLoadError(null);
          setIsTargetsModalVisible(false);
          return;
        }

        if (!result.shouldFallback) {
          setTargetsError(result.error ?? "Could not save nutrition targets.");
          return;
        }
      }

      const fallbackGoal = upsertMockNutritionGoal(nextGoal);
      setNutritionGoal(fallbackGoal);
      setLoadError("Using local progress data right now.");
      setIsTargetsModalVisible(false);
    } finally {
      setIsSavingTargets(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <Text style={styles.title}>Performance & Goals</Text>

        {isLoading ? (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#BDBDBD" />
            <Text style={styles.statusText}>Syncing performance</Text>
          </View>
        ) : null}
        {loadError ? <Text style={styles.statusText}>{loadError}</Text> : null}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Weight Trend</Text>
              <Text style={styles.weightTrendValue}>{formatTrendValue(weightTrend.changeKg)}</Text>
              <Text style={styles.summaryFooterText}>{`in the last week`}</Text>
              <Text style={styles.weightSummaryFooterText}>
                {goalStartDeltaKg === null
                  ? "No active goal baseline"
                  : `${formatTrendValue(goalStartDeltaKg)} total`}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Projected Goal Date</Text>
              <Text style={styles.summaryGoalDate}>{estimatedGoalDate}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Calorie & Macro Goals</Text>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>{getProgramModeLabel(nutritionGoal.programMode)}</Text>
              </View>
              <Pressable style={styles.sectionButton} onPress={openTargetsModal}>
                <Text style={styles.sectionButtonText}>Edit Targets</Text>
              </Pressable>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Calories</Text>
                <Text style={styles.metricValue}>{nutritionGoal.calorieGoal}</Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Protein</Text>
                <Text style={styles.metricValue}>{`${nutritionGoal.proteinGoal} g`}</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Carbs</Text>
                <Text style={styles.metricValue}>{`${nutritionGoal.carbsGoal} g`}</Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Fat</Text>
                <Text style={styles.metricValue}>{`${nutritionGoal.fatGoal} g`}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Lifetime Training Metrics</Text>
          <View style={styles.trainingCard}>
            <Text style={styles.sectionTitle}>All-time totals</Text>
            <Text style={styles.sectionSubtitle}>Built from recorded training history</Text>

            <View style={styles.metricRowTop}>
              <View style={styles.metricBlockTop}>
                <Text style={styles.metricLabel}>Total Sets</Text>
                <Text style={styles.metricValue}>{formatMetricCount(lifetimeTrainingMetrics.totalSets, "sets")}</Text>
              </View>
              <View style={styles.metricBlockTop}>
                <Text style={styles.metricLabel}>Total Reps</Text>
                <Text style={styles.metricValue}>{formatMetricCount(lifetimeTrainingMetrics.totalReps, "reps")}</Text>
              </View>
              <View style={styles.metricBlockTop}>
                <Text style={styles.metricLabel}>Total Workouts</Text>
                <Text style={styles.metricValue}>{formatMetricCount(lifetimeTrainingMetrics.totalWorkouts, "workouts")}</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Total Duration</Text>
                <Text style={styles.metricValue}>{formatDurationTotal(lifetimeTrainingMetrics.totalDurationMins)}</Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Total Volume</Text>
                <Text style={styles.metricValue}>{`${Math.round(lifetimeTrainingMetrics.totalVolume).toLocaleString()} kg`}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent
          visible={isTargetsModalVisible}
          onRequestClose={closeTargetsModal}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Set calorie and macro goals</Text>
                  <Text style={styles.modalSubtitle}>Choose the daily targets you want the app to display.</Text>

                  <TextInput
                    style={styles.input}
                    value={targetsForm.calorieGoal}
                    onChangeText={(value) => setTargetsForm((current) => ({ ...current, calorieGoal: value }))}
                    placeholder="Calories"
                    placeholderTextColor="#6F6F6F"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    value={targetsForm.proteinGoal}
                    onChangeText={(value) => setTargetsForm((current) => ({ ...current, proteinGoal: value }))}
                    placeholder="Protein (g)"
                    placeholderTextColor="#6F6F6F"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    value={targetsForm.carbsGoal}
                    onChangeText={(value) => setTargetsForm((current) => ({ ...current, carbsGoal: value }))}
                    placeholder="Carbs (g)"
                    placeholderTextColor="#6F6F6F"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    value={targetsForm.fatGoal}
                    onChangeText={(value) => setTargetsForm((current) => ({ ...current, fatGoal: value }))}
                    placeholder="Fat (g)"
                    placeholderTextColor="#6F6F6F"
                    keyboardType="numeric"
                  />

                  {targetsError ? <Text style={styles.modalError}>{targetsError}</Text> : null}

                  <View style={styles.modalActions}>
                    <Pressable style={styles.modalSecondaryButton} onPress={closeTargetsModal}>
                      <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={styles.modalPrimaryButton} onPress={handleSaveTargets}>
                      <Text style={styles.modalPrimaryButtonText}>
                        {isSavingTargets ? "Saving..." : "Save Targets"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
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
    paddingHorizontal: 8,
  },
  title: {
    color: "#F4F4F4",
    fontSize: 24,
    fontWeight: "600",
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 16,
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
    paddingHorizontal: 14,
    paddingBottom: 120,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#202020",
    borderRadius: 22,
    padding: 16,
    minHeight: 164,
  },
  summaryTitle: {
    color: "#F4F4F4",
    fontSize: 18,
    marginBottom: 12,
    fontWeight: "600",
  },
  summarySubtitle: {
    color: "#6C6C6C",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  summaryFooterText: {
    color: "#BDBDBD",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  weightSummaryFooterText: {
    color: "#6C6C6C",
    fontSize: 12,
  },
  weightTrendValue: {
    color: "#F4F4F4",
    fontSize: 22,
    fontWeight: "500",
    lineHeight: 30,
  },
  summaryGoalDate: {
    color: "#F4F4F4",
    fontSize: 22,
    fontWeight: "500",
    lineHeight: 30,
  },
  metricRowTop: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  sectionHeading: {
    color: "#F4F4F4",
    fontSize: 20,
    fontWeight: "500",
    marginTop: 26,
    marginBottom: 10,
  },
  sectionCard: {
    backgroundColor: "#202020",
    borderRadius: 22,
    padding: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    color: "#F4F4F4",
    fontSize: 18,
    fontWeight: "600",
  },
  sectionSubtitle: {
    color: "#6C6C6C",
    fontSize: 13,
    marginTop: 4,
    maxWidth: 230,
    lineHeight: 18,
  },
  sectionButton: {
    borderRadius: 16,
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sectionButtonText: {
    color: "#121212",
    fontSize: 13,
    fontWeight: "700",
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  metricBlock: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    padding: 14,
  },
  metricBlockTop: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    padding: 12,
  },
  metricLabel: {
    color: "#8E8E8E",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metricValue: {
    color: "#F4F4F4",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  trainingCard: {
    backgroundColor: "#202020",
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#151515",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 12,
  },
  modalTitle: {
    color: "#F4F4F4",
    fontSize: 22,
    fontWeight: "700",
  },
  modalSubtitle: {
    color: "#8E8E8E",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#202020",
    color: "#F4F4F4",
    paddingHorizontal: 16,
    fontSize: 16,
  },
  modalError: {
    color: "#F28B82",
    fontSize: 13,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalSecondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#202020",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryButtonText: {
    color: "#F4F4F4",
    fontSize: 15,
    fontWeight: "600",
  },
  modalPrimaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryButtonText: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "700",
  },
});