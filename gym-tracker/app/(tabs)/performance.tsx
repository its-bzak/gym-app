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
  upsertWeightGoal as upsertMockWeightGoal,
} from "@/mock/MainScreen/DailyMetricsSection";
import {
  getActiveGoalPlan,
  getLifetimeTrainingMetrics,
  getWeightEntries,
  type NutritionGoalInput,
  type WeightGoalInput,
  upsertActiveGoalPlan,
  upsertActiveNutritionGoal,
  upsertActiveWeightGoal,
} from "@/services/dashboardService";
import { useDisplayUnitPreference } from "@/hooks/use-display-unit-preference";
import { getAuthenticatedUserId } from "@/services/profileService";
import type { LifetimeTrainingMetrics, NutritionGoal, WeightEntry, WeightGoal } from "@/types/dashboard";
import {
  convertWeightKgToUnit,
  formatWeight,
  formatWeightValue,
  getWeightUnitLabel,
  convertWeightUnitToKg,
  type UnitPreference,
} from "@/utils/unitSystem";
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

function getTrendRateKgPerWeek(entries: WeightEntry[]): number | null {
  if (!entries.length) {
    return null;
  }

  const weeklyTrend = getWeightTrend(entries, 7);

  if (weeklyTrend.currentWeight === weeklyTrend.previousWeight) {
    return null;
  }

  return weeklyTrend.changeKg;
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

  const goalStartWeight = [...entries]
    .sort((left, right) => left.date.localeCompare(right.date))
    .find((entry) => entry.date >= goal.startedOn)?.weightKg ?? goal.startWeightKg;

  const latestWeight = getLatestWeight(entries);

  if (latestWeight === null) {
    return null;
  }

  return latestWeight - goalStartWeight;
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

function formatTrendValue(value: number, unitPreference: UnitPreference): string {
  return `${getTrendArrow(value)} ${formatWeight(Math.abs(value), unitPreference)}`;
}

function formatCompactNumber(value: number): string {
  const absoluteValue = Math.abs(value);

  if (absoluteValue < 1000) {
    return Math.floor(value).toString();
  }

  if (absoluteValue < 1000000) {
    const compactValue = Math.floor(absoluteValue / 100) / 10;
    const normalizedValue = Number.isInteger(compactValue)
      ? compactValue.toFixed(0)
      : compactValue.toFixed(1);

    return `${value < 0 ? "-" : ""}${normalizedValue}k`;
  }

  const compactValue = Math.floor(absoluteValue / 100000) / 10;
  const normalizedValue = Number.isInteger(compactValue)
    ? compactValue.toFixed(0)
    : compactValue.toFixed(1);

  return `${value < 0 ? "-" : ""}${normalizedValue}m`;
}

function formatMetricCount(value: number | null, suffix: string): string {
  if (value === null) {
    return "No Info";
  }

  return suffix ? `${formatCompactNumber(value)} ${suffix}` : formatCompactNumber(value);
}

function getGoalType(startWeightKg: number, targetWeightKg: number): WeightGoal["goalType"] {
  if (targetWeightKg < startWeightKg) {
    return "lose";
  }

  if (targetWeightKg > startWeightKg) {
    return "gain";
  }

  return "maintain";
}

function formatGoalRate(rateKgPerWeek: number, unitPreference: UnitPreference): string {
  if (rateKgPerWeek <= 0) {
    return `0 ${getWeightUnitLabel(unitPreference)} / week`;
  }

  return `${formatWeightValue(rateKgPerWeek, unitPreference, 1)} ${getWeightUnitLabel(unitPreference)} / week`;
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
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const { unitPreference } = useDisplayUnitPreference();
  const [targetsForm, setTargetsForm] = useState({
    calorieGoal: String(mockNutritionGoal.calorieGoal),
    proteinGoal: String(mockNutritionGoal.proteinGoal),
    carbsGoal: String(mockNutritionGoal.carbsGoal),
    fatGoal: String(mockNutritionGoal.fatGoal),
  });
  const [goalForm, setGoalForm] = useState({
    startWeight: String(mockGoal.startWeightKg),
    targetWeight: String(mockGoal.targetWeightKg),
    targetRate: String(mockGoal.targetRateKgPerWeek),
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

  const resolvedWeightGoal = useMemo<WeightGoal>(() => {
    if (weightGoal) {
      return weightGoal;
    }

    const latestWeightKg = getLatestWeight(weightEntries) ?? mockGoal.startWeightKg;

    return {
      ...mockGoal,
      goalType: "maintain",
      startWeightKg: latestWeightKg,
      targetWeightKg: latestWeightKg,
      targetRateKgPerWeek: 0,
      startedOn: new Date().toISOString().slice(0, 10),
    };
  }, [weightEntries, weightGoal]);

  const resetTargetsForm = (goal: NutritionGoal) => {
    setTargetsForm({
      calorieGoal: String(goal.calorieGoal),
      proteinGoal: String(goal.proteinGoal),
      carbsGoal: String(goal.carbsGoal),
      fatGoal: String(goal.fatGoal),
    });
  };

  const resetGoalForm = (goal: WeightGoal) => {
    setGoalForm({
      startWeight: formatWeightValue(goal.startWeightKg, unitPreference, 1),
      targetWeight: formatWeightValue(goal.targetWeightKg, unitPreference, 1),
      targetRate: formatWeightValue(goal.targetRateKgPerWeek, unitPreference, 1),
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

  const openGoalModal = () => {
    resetGoalForm(resolvedWeightGoal);
    setGoalError(null);
    setIsGoalModalVisible(true);
  };

  const closeTargetsModal = () => {
    if (isSavingTargets) {
      return;
    }

    setTargetsError(null);
    setIsTargetsModalVisible(false);
  };

  const closeGoalModal = () => {
    if (isSavingGoal) {
      return;
    }

    setGoalError(null);
    setIsGoalModalVisible(false);
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

  const handleSaveGoal = async () => {
    const startWeightValue = Number(goalForm.startWeight);
    const targetWeightValue = Number(goalForm.targetWeight);
    const targetRateValue = Number(goalForm.targetRate);

    if (
      [startWeightValue, targetWeightValue, targetRateValue].some(
        (value) => !Number.isFinite(value) || value < 0
      ) ||
      startWeightValue <= 0 ||
      targetWeightValue <= 0
    ) {
      setGoalError("Enter valid starting, target, and weekly rate values.");
      return;
    }

    const startWeightKg = convertWeightUnitToKg(startWeightValue, unitPreference);
    const targetWeightKg = convertWeightUnitToKg(targetWeightValue, unitPreference);
    const goalType = getGoalType(startWeightKg, targetWeightKg);
    const targetRateKgPerWeek =
      goalType === "maintain" ? 0 : convertWeightUnitToKg(targetRateValue, unitPreference);

    const nextGoal: WeightGoal = {
      ...resolvedWeightGoal,
      goalType,
      status: "active",
      startWeightKg,
      targetWeightKg,
      targetRateKgPerWeek,
      startedOn: weightGoal?.startedOn ?? new Date().toISOString().slice(0, 10),
    };

    const input: WeightGoalInput = {
      goalType: nextGoal.goalType,
      startWeightKg: nextGoal.startWeightKg,
      targetWeightKg: nextGoal.targetWeightKg,
      targetRateKgPerWeek: nextGoal.targetRateKgPerWeek,
    };

    setIsSavingGoal(true);
    setGoalError(null);

    try {
      if (authenticatedUserId) {
        const result = weightGoal
          ? await upsertActiveWeightGoal(authenticatedUserId, input)
          : await upsertActiveGoalPlan(authenticatedUserId, {
              weightGoal: input,
              nutritionGoal: {
                programMode: nutritionGoal.programMode,
                calorieGoal: nutritionGoal.calorieGoal,
                proteinGoal: nutritionGoal.proteinGoal,
                carbsGoal: nutritionGoal.carbsGoal,
                fatGoal: nutritionGoal.fatGoal,
                maintenanceCalories: nutritionGoal.maintenanceCalories ?? nutritionGoal.calorieGoal,
                plannedDailyEnergyDelta: nutritionGoal.plannedDailyEnergyDelta ?? 0,
                proteinPreference: nutritionGoal.proteinPreference,
                carbPreference: nutritionGoal.carbPreference,
                fatPreference: nutritionGoal.fatPreference,
                adaptiveEnabled: nutritionGoal.adaptiveEnabled,
              },
            });

        if (result.success && result.data) {
          setWeightGoal("bodyGoal" in result.data ? result.data.bodyGoal : result.data);
          setLoadError(null);
          setIsGoalModalVisible(false);
          return;
        }

        if (!result.shouldFallback) {
          setGoalError(result.error ?? "Could not save bodyweight goal.");
          return;
        }
      }

      const fallbackGoal = upsertMockWeightGoal(nextGoal);
      setWeightGoal(fallbackGoal);
      setLoadError("Using local progress data right now.");
      setIsGoalModalVisible(false);
    } finally {
      setIsSavingGoal(false);
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
              <View style={styles.summaryCardContent}>
                <Text style={styles.weightTrendValue}>{formatTrendValue(weightTrend.changeKg, unitPreference)}</Text>
                <Text style={styles.summaryFooterText}>in the last week</Text>
              </View>
              <Text style={styles.summaryBottomText}>
                {goalStartDeltaKg === null
                  ? "No active goal baseline"
                  : `${formatTrendValue(goalStartDeltaKg, unitPreference)} total`}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Projected Goal Date</Text>
              <View style={styles.summaryCardContent}>
                <Text style={styles.summaryGoalDate}>{estimatedGoalDate}</Text>
              </View>
              <Text style={styles.summaryBottomText}>based on current rate</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Bodyweight Goal</Text>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Current Goal</Text>
              <Pressable style={styles.sectionButton} onPress={openGoalModal}>
                <Text style={styles.sectionButtonText}>Edit Goal</Text>
              </Pressable>
            </View>

            <View style={styles.metricRowTop}>
              <View style={styles.metricBlockTop}>
                <Text style={styles.metricLabel}>Start Weight</Text>
                <Text style={styles.metricValue}>{formatWeight(resolvedWeightGoal.startWeightKg, unitPreference)}</Text>
              </View>
              <View style={styles.metricBlockTop}>
                <Text style={styles.metricLabel}>Goal Weight</Text>
                <Text style={styles.metricValue}>{formatWeight(resolvedWeightGoal.targetWeightKg, unitPreference)}</Text>
              </View>
              <View style={styles.metricBlockTop}>
                <Text style={styles.metricLabel}>Rate / Week</Text>
                <Text style={styles.metricValue}>{formatGoalRate(resolvedWeightGoal.targetRateKgPerWeek, unitPreference)}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Calorie & Macro Goals</Text>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Current Targets</Text>
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
                <Text style={styles.metricValue}>{`${formatCompactNumber(nutritionGoal.proteinGoal)} g`}</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Carbs</Text>
                <Text style={styles.metricValue}>{`${formatCompactNumber(nutritionGoal.carbsGoal)} g`}</Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Fat</Text>
                <Text style={styles.metricValue}>{`${formatCompactNumber(nutritionGoal.fatGoal)} g`}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Lifetime Training Metrics</Text>
          <View style={styles.trainingCard}>

            <View style={styles.metricRowTop}>
              <View style={styles.trainingMetricBlockTop}>
                <Text style={styles.metricLabel}>Set Count</Text>
                <Text style={styles.metricValue}>{formatMetricCount(lifetimeTrainingMetrics.totalSets, "")}</Text>
              </View>
              <View style={styles.trainingMetricBlockTop}>
                <Text style={styles.metricLabel}>Rep Count</Text>
                <Text style={styles.metricValue}>{formatMetricCount(lifetimeTrainingMetrics.totalReps, "")}</Text>
              </View>
              <View style={styles.trainingMetricBlockTop}>
                <Text style={styles.metricLabel}>Workouts</Text>
                <Text style={styles.metricValue}>{formatMetricCount(lifetimeTrainingMetrics.totalWorkouts, "")}</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.trainingMetricBlock}>
                <Text style={styles.metricLabel}>Activity Duration</Text>
                <Text style={styles.metricValue}>{formatDurationTotal(lifetimeTrainingMetrics.totalDurationMins)}</Text>
              </View>
              <View style={styles.trainingMetricBlock}>
                <Text style={styles.metricLabel}>Total Volume</Text>
                <Text style={styles.metricValue}>
                  {`${formatCompactNumber(
                    Math.round(convertWeightKgToUnit(lifetimeTrainingMetrics.totalVolume, unitPreference))
                  )} ${getWeightUnitLabel(unitPreference)}`}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent
          visible={isGoalModalVisible}
          onRequestClose={closeGoalModal}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Edit Goal</Text>
                  <Text style={styles.modalSubtitle}>Set your starting weight, goal weight, and ideal weekly pace.</Text>

                  <TextInput
                    style={styles.input}
                    value={goalForm.startWeight}
                    onChangeText={(value) => setGoalForm((current) => ({ ...current, startWeight: value }))}
                    placeholder={`Starting Weight (${getWeightUnitLabel(unitPreference)})`}
                    placeholderTextColor="#6F6F6F"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    value={goalForm.targetWeight}
                    onChangeText={(value) => setGoalForm((current) => ({ ...current, targetWeight: value }))}
                    placeholder={`Goal Weight (${getWeightUnitLabel(unitPreference)})`}
                    placeholderTextColor="#6F6F6F"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    value={goalForm.targetRate}
                    onChangeText={(value) => setGoalForm((current) => ({ ...current, targetRate: value }))}
                    placeholder={`Rate Per Week (${getWeightUnitLabel(unitPreference)})`}
                    placeholderTextColor="#6F6F6F"
                    keyboardType="numeric"
                  />

                  {goalError ? <Text style={styles.modalError}>{goalError}</Text> : null}

                  <View style={styles.modalActions}>
                    <Pressable style={styles.modalSecondaryButton} onPress={closeGoalModal}>
                      <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={styles.modalPrimaryButton} onPress={handleSaveGoal}>
                      <Text style={styles.modalPrimaryButtonText}>
                        {isSavingGoal ? "Saving..." : "Save Goal"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <Modal
          animationType="slide"
          transparent
          visible={isTargetsModalVisible}
          onRequestClose={closeTargetsModal}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>

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
    justifyContent: "space-between",
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
  summaryCardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 12,
  },
  summaryFooterText: {
    color: "#BDBDBD",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  summaryBottomText: {
    color: "#6C6C6C",
    fontSize: 12,
    alignSelf: "flex-start",
  },
  weightTrendValue: {
    color: "#F4F4F4",
    fontSize: 22,
    fontWeight: "500",
    lineHeight: 30,
    textAlign: "center",
  },
  summaryGoalDate: {
    color: "#F4F4F4",
    fontSize: 22,
    fontWeight: "500",
    lineHeight: 30,
    textAlign: "center",
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
    alignItems: "center",
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
  trainingMetricBlockTop: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    padding: 12,
    minHeight: 112,
    justifyContent: "space-between",
  },
  trainingMetricBlock: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    padding: 14,
    minHeight: 112,
    justifyContent: "space-between",
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
    paddingBottom: 18,
    paddingHorizontal: 18,
    marginTop: 2,
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