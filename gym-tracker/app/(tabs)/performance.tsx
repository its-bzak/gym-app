import { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import CustomKeypad from "@/components/ui/CustomKeypad";
import { RedesignPerformanceScreen } from "@/design/components/dashboard";

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

type TargetsField = "calorieGoal" | "proteinGoal" | "carbsGoal" | "fatGoal" | null;
type GoalField = "startWeight" | "targetWeight" | "targetRate" | null;

function getWeekStart(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() - date.getDay());

  return date.toISOString().slice(0, 10);
}

function getWeekEnd(weekStart: string) {
  const date = new Date(`${weekStart}T00:00:00`);
  date.setDate(date.getDate() + 6);

  return date;
}

function formatWeekRangeLabel(weekStart: string) {
  const startDate = new Date(`${weekStart}T00:00:00`);
  const endDate = getWeekEnd(weekStart);
  const startMonth = startDate.toLocaleDateString("en-US", { month: "short" });
  const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  }

  return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
}

function getAverageWeightChangeKgPerWeek(entries: WeightEntry[]) {
  if (entries.length < 2) {
    return null;
  }

  const sortedEntries = [...entries].sort((left, right) => left.date.localeCompare(right.date));
  const firstEntry = sortedEntries[0];
  const lastEntry = sortedEntries[sortedEntries.length - 1];
  const firstDate = new Date(`${firstEntry.date}T00:00:00`);
  const lastDate = new Date(`${lastEntry.date}T00:00:00`);
  const elapsedDays = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

  if (elapsedDays <= 0) {
    return null;
  }

  return ((lastEntry.weightKg - firstEntry.weightKg) / elapsedDays) * 7;
}

function getWeeklyAverageTrendPoints(entries: WeightEntry[], unitPreference: UnitPreference) {
  const weeklyGroups = [...entries]
    .sort((left, right) => left.date.localeCompare(right.date))
    .reduce<Map<string, WeightEntry[]>>((aggregate, entry) => {
      const weekKey = getWeekStart(entry.date);
      const currentEntries = aggregate.get(weekKey) ?? [];
      currentEntries.push(entry);
      aggregate.set(weekKey, currentEntries);

      return aggregate;
    }, new Map());

  return Array.from(weeklyGroups.entries())
    .map(([weekKey, weeklyEntries]) => {
      const averageValue = convertWeightKgToUnit(
        weeklyEntries.reduce((sum, entry) => sum + entry.weightKg, 0) / Math.max(weeklyEntries.length, 1),
        unitPreference
      );
      const displayUnitLabel = unitPreference === "imperial" ? "lbs" : getWeightUnitLabel(unitPreference);

      return {
        label: formatWeekRangeLabel(weekKey),
        detailLabel: formatWeekRangeLabel(weekKey),
        value: averageValue,
        displayValue: `Week Avg: ${averageValue.toFixed(1)} ${displayUnitLabel}`,
      };
    })
    .slice(-6);
}

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

function getTargetStatus(goal: WeightGoal | null, estimatedGoalDate: string) {
  if (!goal || goal.goalType === "maintain") {
    return {
      label: "Maintaining",
      tone: "info" as const,
    };
  }

  if (estimatedGoalDate === "Goal reached") {
    return {
      label: "Goal Reached",
      tone: "success" as const,
    };
  }

  if (estimatedGoalDate === "Trend off target") {
    return {
      label: "Off Track",
      tone: "warning" as const,
    };
  }

  if (estimatedGoalDate === "No trend yet") {
    return {
      label: "No Trend Yet",
      tone: "info" as const,
    };
  }

  return {
    label: "On Track",
    tone: "success" as const,
  };
}

function getGoalFieldLabel(field: Exclude<GoalField, null>) {
  switch (field) {
    case "startWeight":
      return "Starting point";
    case "targetWeight":
      return "Goal weight";
    case "targetRate":
      return "Weekly pace";
  }
}

function getGoalFieldHelper(field: Exclude<GoalField, null>, unitPreference: UnitPreference) {
  const unitLabel = getWeightUnitLabel(unitPreference);

  switch (field) {
    case "startWeight":
      return `What's your current weight in ${unitLabel}?`;
    case "targetWeight":
      return `What's your goal weight in ${unitLabel}?`;
    case "targetRate":
      return `How much do you want to gain or lose per week in ${unitLabel}?`;
  }
}

function getTargetsFieldLabel(field: Exclude<TargetsField, null>) {
  switch (field) {
    case "calorieGoal":
      return "Calories";
    case "proteinGoal":
      return "Protein";
    case "carbsGoal":
      return "Carbs";
    case "fatGoal":
      return "Fat";
  }
}

function getTargetsFieldHelper(field: Exclude<TargetsField, null>) {
  switch (field) {
    case "calorieGoal":
      return "What's your daily energy target in kcal?";
    case "proteinGoal":
      return "What's your daily protein target in grams?";
    case "carbsGoal":
      return "What's your daily carbohydrate target in grams?";
    case "fatGoal":
      return "What's your daily fat target in grams?";
  }
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
  const [activeTargetsField, setActiveTargetsField] = useState<TargetsField>(null);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [activeGoalField, setActiveGoalField] = useState<GoalField>(null);
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
  const averageWeightChangeKgPerWeek = useMemo(() => getAverageWeightChangeKgPerWeek(weightEntries), [weightEntries]);
  const goalStartDeltaKg = useMemo(
    () => getGoalStartDelta(weightGoal, weightEntries),
    [weightEntries, weightGoal]
  );
  const latestWeight = useMemo(() => getLatestWeight(weightEntries), [weightEntries]);
  const trendPoints = useMemo(
    () => getWeeklyAverageTrendPoints(weightEntries, unitPreference),
    [unitPreference, weightEntries]
  );
  const targetStatus = useMemo(
    () => getTargetStatus(weightGoal, estimatedGoalDate),
    [estimatedGoalDate, weightGoal]
  );
  const volumeUnitLabel = unitPreference === "imperial" ? "lbs" : getWeightUnitLabel(unitPreference);

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
    setActiveTargetsField("calorieGoal");
    setIsTargetsModalVisible(true);
  };

  const openGoalModal = () => {
    resetGoalForm(resolvedWeightGoal);
    setGoalError(null);
    setActiveGoalField("startWeight");
    setIsGoalModalVisible(true);
  };

  const closeTargetsModal = () => {
    if (isSavingTargets) {
      return;
    }

    setTargetsError(null);
    setActiveTargetsField(null);
    setIsTargetsModalVisible(false);
  };

  const closeGoalModal = () => {
    if (isSavingGoal) {
      return;
    }

    setGoalError(null);
    setActiveGoalField(null);
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
    <>
      <RedesignPerformanceScreen
        pageTitle="Stats"
        statusMessage={isLoading ? "Syncing performance" : loadError ?? undefined}
        isLoading={isLoading}
        targetCompletionLabel="Target Completion Date"
        targetCompletionDate={estimatedGoalDate}
        targetStatusLabel={targetStatus.label}
        targetStatusTone={targetStatus.tone}
        primaryAction={{ label: "Update Weight Goal", onPress: openGoalModal }}
        secondaryAction={{ label: "Edit Nutrition Targets", onPress: openTargetsModal }}
        trendTitle="Weight Trend"
        trendValue={formatTrendValue(averageWeightChangeKgPerWeek ?? 0, unitPreference)}
        trendSupportingText="Avg. Rate"
        currentWeight={latestWeight === null ? "No Info" : formatWeight(latestWeight, unitPreference)}
        currentWeightSupportingText={
          goalStartDeltaKg === null
            ? "No goal baseline"
            : `${formatTrendValue(goalStartDeltaKg, unitPreference)} from start`
        }
        trendPoints={trendPoints}
        kpis={[
          {
            id: "total-reps",
            label: "Reps",
            value: formatMetricCount(lifetimeTrainingMetrics.totalReps, ""),
          },
          {
            id: "total-volume",
            label: "Volume",
            value: `${formatCompactNumber(
              Math.round(convertWeightKgToUnit(lifetimeTrainingMetrics.totalVolume, unitPreference))
            )} ${volumeUnitLabel}`,
          },
          {
            id: "workouts",
            label: "Workouts",
            value: formatMetricCount(lifetimeTrainingMetrics.totalWorkouts, ""),
          },
          {
            id: "hours",
            label: "Time",
            value: formatDurationTotal(lifetimeTrainingMetrics.totalDurationMins),
          },
        ]}
        nutritionPlan={{
          title: "Nutrition Plan",
          phase: nutritionGoal.programMode === "guided" ? "Guided Program" : "Manual Targets",
          items: [
            {
              label: "Calories",
              value: `${nutritionGoal.calorieGoal} kcal`,
            },
            {
              label: "Protein",
              value: `${formatCompactNumber(nutritionGoal.proteinGoal)} g`,
            },
            {
              label: "Carbs / Fats",
              value: `${formatCompactNumber(nutritionGoal.carbsGoal)} g / ${formatCompactNumber(nutritionGoal.fatGoal)} g`,
            },
          ],
          actionLabel: "Edit Nutrition Plan",
          onPressAction: openTargetsModal,
        }}
      />

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

                  <View style={styles.inputGroup}>
                    <View style={styles.inputHeadingRow}>
                      <Text style={styles.inputLabel}>Starting point</Text>
                      <Text style={styles.inputUnit}>{getWeightUnitLabel(unitPreference)}</Text>
                    </View>
                    <TextInput
                      style={[styles.input, activeGoalField === "startWeight" && styles.inputActive]}
                      value={goalForm.startWeight}
                      onChangeText={(value) => setGoalForm((current) => ({ ...current, startWeight: value }))}
                      placeholder={`Current weight (${getWeightUnitLabel(unitPreference)})`}
                      placeholderTextColor="#6F6F6F"
                      keyboardType="numeric"
                      showSoftInputOnFocus={false}
                      onFocus={() => {
                        Keyboard.dismiss();
                        setActiveGoalField("startWeight");
                      }}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <View style={styles.inputHeadingRow}>
                      <Text style={styles.inputLabel}>Goal weight</Text>
                      <Text style={styles.inputUnit}>{getWeightUnitLabel(unitPreference)}</Text>
                    </View>
                    <TextInput
                      style={[styles.input, activeGoalField === "targetWeight" && styles.inputActive]}
                      value={goalForm.targetWeight}
                      onChangeText={(value) => setGoalForm((current) => ({ ...current, targetWeight: value }))}
                      placeholder={`Target weight (${getWeightUnitLabel(unitPreference)})`}
                      placeholderTextColor="#6F6F6F"
                      keyboardType="numeric"
                      showSoftInputOnFocus={false}
                      onFocus={() => {
                        Keyboard.dismiss();
                        setActiveGoalField("targetWeight");
                      }}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <View style={styles.inputHeadingRow}>
                      <Text style={styles.inputLabel}>Weekly pace</Text>
                      <Text style={styles.inputUnit}>{`${getWeightUnitLabel(unitPreference)} / wk`}</Text>
                    </View>
                    <TextInput
                      style={[styles.input, activeGoalField === "targetRate" && styles.inputActive]}
                      value={goalForm.targetRate}
                      onChangeText={(value) => setGoalForm((current) => ({ ...current, targetRate: value }))}
                      placeholder={`Weekly change (${getWeightUnitLabel(unitPreference)})`}
                      placeholderTextColor="#6F6F6F"
                      keyboardType="numeric"
                      showSoftInputOnFocus={false}
                      onFocus={() => {
                        Keyboard.dismiss();
                        setActiveGoalField("targetRate");
                      }}
                    />
                  </View>

                  {activeGoalField ? (
                    <View style={styles.keypadSection}>
                      <View style={styles.keypadContextRow}>
                        <Text style={styles.keypadContextHelper}>{getGoalFieldHelper(activeGoalField, unitPreference)}</Text>
                      </View>
                      <CustomKeypad
                        mode="decimal"
                        value={goalForm[activeGoalField]}
                        onChange={(value) => setGoalForm((current) => ({ ...current, [activeGoalField]: value }))}
                        showClearKey={false}
                        showDoneKey={false}
                      />
                    </View>
                  ) : null}

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
                  <Text style={styles.modalTitle}>Edit Targets</Text>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputHeadingRow}>
                      <Text style={styles.inputLabel}>Calories</Text>
                      <Text style={styles.inputUnit}>kcal</Text>
                    </View>
                    <TextInput
                      style={[styles.input, activeTargetsField === "calorieGoal" && styles.inputActive]}
                      value={targetsForm.calorieGoal}
                      onChangeText={(value) => setTargetsForm((current) => ({ ...current, calorieGoal: value }))}
                      placeholder="Daily calories"
                      placeholderTextColor="#6F6F6F"
                      keyboardType="numeric"
                      showSoftInputOnFocus={false}
                      onFocus={() => {
                        Keyboard.dismiss();
                        setActiveTargetsField("calorieGoal");
                      }}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <View style={styles.inputHeadingRow}>
                      <Text style={styles.inputLabel}>Protein</Text>
                      <Text style={styles.inputUnit}>g</Text>
                    </View>
                    <TextInput
                      style={[styles.input, activeTargetsField === "proteinGoal" && styles.inputActive]}
                      value={targetsForm.proteinGoal}
                      onChangeText={(value) => setTargetsForm((current) => ({ ...current, proteinGoal: value }))}
                      placeholder="Daily protein"
                      placeholderTextColor="#6F6F6F"
                      keyboardType="numeric"
                      showSoftInputOnFocus={false}
                      onFocus={() => {
                        Keyboard.dismiss();
                        setActiveTargetsField("proteinGoal");
                      }}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <View style={styles.inputHeadingRow}>
                      <Text style={styles.inputLabel}>Carbs</Text>
                      <Text style={styles.inputUnit}>g</Text>
                    </View>
                    <TextInput
                      style={[styles.input, activeTargetsField === "carbsGoal" && styles.inputActive]}
                      value={targetsForm.carbsGoal}
                      onChangeText={(value) => setTargetsForm((current) => ({ ...current, carbsGoal: value }))}
                      placeholder="Daily carbs"
                      placeholderTextColor="#6F6F6F"
                      keyboardType="numeric"
                      showSoftInputOnFocus={false}
                      onFocus={() => {
                        Keyboard.dismiss();
                        setActiveTargetsField("carbsGoal");
                      }}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <View style={styles.inputHeadingRow}>
                      <Text style={styles.inputLabel}>Fat</Text>
                      <Text style={styles.inputUnit}>g</Text>
                    </View>
                    <TextInput
                      style={[styles.input, activeTargetsField === "fatGoal" && styles.inputActive]}
                      value={targetsForm.fatGoal}
                      onChangeText={(value) => setTargetsForm((current) => ({ ...current, fatGoal: value }))}
                      placeholder="Daily fat"
                      placeholderTextColor="#6F6F6F"
                      keyboardType="numeric"
                      showSoftInputOnFocus={false}
                      onFocus={() => {
                        Keyboard.dismiss();
                        setActiveTargetsField("fatGoal");
                      }}
                    />
                  </View>

                  {activeTargetsField ? (
                    <View style={styles.keypadSection}>
                      <View style={styles.keypadContextRow}>
                        <Text style={styles.keypadContextHelper}>{getTargetsFieldHelper(activeTargetsField)}</Text>
                      </View>
                      <CustomKeypad
                        mode="decimal"
                        value={targetsForm[activeTargetsField]}
                        onChange={(value) => setTargetsForm((current) => ({ ...current, [activeTargetsField]: value }))}
                        showClearKey={false}
                        showDoneKey={false}
                      />
                    </View>
                  ) : null}

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
    </>
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
  inputGroup: {
    gap: 6,
  },
  inputHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  inputLabel: {
    color: "#D7D7D7",
    fontSize: 13,
    fontWeight: "600",
  },
  inputUnit: {
    color: "#7E7E7E",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  inputHelper: {
    color: "#7E7E7E",
    fontSize: 12,
    lineHeight: 17,
  },
  input: {
    width: "100%",
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#202020",
    color: "#F4F4F4",
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#202020",
  },
  inputActive: {
    borderColor: "#5E8BFF",
  },
  keypadSection: {
    gap: 10,
  },
  keypadContextRow: {
    gap: 3,
  },
  keypadContextLabel: {
    color: "#F4F4F4",
    fontSize: 14,
    fontWeight: "600",
  },
  keypadContextHelper: {
    color: "#8E8E8E",
    fontSize: 12,
    lineHeight: 17,
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