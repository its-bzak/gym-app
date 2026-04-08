import { useEffect, useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  Keyboard,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
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

const GOAL_WEIGHT_PICKER_STEP_WIDTH = 20;
const GOAL_WEIGHT_PICKER_VISIBLE_HEIGHT = 132;
const GOAL_WEIGHT_MIN_LBS = 60;
const GOAL_WEIGHT_MAX_LBS = 300;
const GOAL_RATE_PERCENT_MIN = 0.001;
const GOAL_RATE_PERCENT_MAX = 0.015;
const GOAL_RATE_PERCENT_STEP = 0.001;
const GOAL_SLIDER_HORIZONTAL_INSET = 12;
const GOAL_SLIDER_THUMB_SIZE = 18;

type TargetsField = "calorieGoal" | "proteinGoal" | "carbsGoal" | "fatGoal" | null;

type TargetStatusResult = {
  label: string;
  tone: "success" | "warning" | "danger" | "info";
};

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

function getClosestPickerIndex(offset: number, itemCount: number, itemSize: number) {
  return Math.max(0, Math.min(itemCount - 1, Math.round(offset / itemSize)));
}

function getRateDisplayUnitLabel(unitPreference: UnitPreference) {
  return unitPreference === "imperial" ? "lbs" : "kg";
}

function getGoalRatePercentOptions() {
  const optionCount = Math.round((GOAL_RATE_PERCENT_MAX - GOAL_RATE_PERCENT_MIN) / GOAL_RATE_PERCENT_STEP);
  return Array.from({ length: optionCount + 1 }, (_, index) =>
    Number((GOAL_RATE_PERCENT_MIN + index * GOAL_RATE_PERCENT_STEP).toFixed(3))
  );
}

function formatGoalRatePercent(percentValue: number) {
  return `${(percentValue * 100).toFixed(1)}% body weight / wk`;
}

function isMultipleOf(value: number, step: number) {
  return Math.abs(value / step - Math.round(value / step)) < 0.001;
}

function formatGoalWeightValue(value: number, unitPreference: UnitPreference) {
  return `${value.toFixed(unitPreference === "imperial" ? 0 : 1)} ${getWeightUnitLabel(unitPreference)}`;
}

function getGoalWeightPickerOptions(unitPreference: UnitPreference) {
  if (unitPreference === "imperial") {
    const optionCount = Math.round((GOAL_WEIGHT_MAX_LBS - GOAL_WEIGHT_MIN_LBS) / 1);
    return Array.from({ length: optionCount + 1 }, (_, index) => GOAL_WEIGHT_MIN_LBS + index);
  }

  const minimumKg = Math.ceil(convertWeightUnitToKg(GOAL_WEIGHT_MIN_LBS, "imperial") * 2) / 2;
  const maximumKg = Math.floor(convertWeightUnitToKg(GOAL_WEIGHT_MAX_LBS, "imperial") * 2) / 2;
  const optionCount = Math.round((maximumKg - minimumKg) / 0.5);
  return Array.from({ length: optionCount + 1 }, (_, index) => Number((minimumKg + index * 0.5).toFixed(1)));
}

function getGoalWeightTickType(value: number, unitPreference: UnitPreference) {
  if (unitPreference === "imperial") {
    if (isMultipleOf(value, 10)) {
      return "major";
    }

    if (isMultipleOf(value, 5)) {
      return "mid";
    }

    return "minor";
  }

  if (isMultipleOf(value, 5)) {
    return "major";
  }

  if (isMultipleOf(value, 2.5)) {
    return "mid";
  }

  return "minor";
}

function getClosestGoalWeightOption(value: number, options: number[]) {
  return options.reduce((closestOption, option) => {
    if (Math.abs(option - value) < Math.abs(closestOption - value)) {
      return option;
    }

    return closestOption;
  }, options[0]);
}

function getClosestGoalRatePercent(percentValue: number) {
  const clampedPercent = Math.min(GOAL_RATE_PERCENT_MAX, Math.max(GOAL_RATE_PERCENT_MIN, percentValue));
  const stepIndex = Math.round((clampedPercent - GOAL_RATE_PERCENT_MIN) / GOAL_RATE_PERCENT_STEP);

  return Number((GOAL_RATE_PERCENT_MIN + stepIndex * GOAL_RATE_PERCENT_STEP).toFixed(3));
}

function getProjectedGoalDatePreview(
  startWeightKg: number,
  targetWeightKg: number,
  targetRateKgPerWeek: number
) {
  const goalType = getGoalType(startWeightKg, targetWeightKg);

  if (goalType === "maintain") {
    return "No target date";
  }

  if (targetRateKgPerWeek <= 0) {
    return "Choose a pace";
  }

  const remainingKg = Math.abs(targetWeightKg - startWeightKg);

  if (remainingKg < 0.01) {
    return "Goal reached";
  }

  const daysRemaining = Math.ceil((remainingKg / targetRateKgPerWeek) * 7);
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + Math.max(daysRemaining, 0));

  return projectedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type WeeklyAveragePoint = {
  weekStart: string;
  averageKg: number;
};

function getWeeklyAverageSeries(entries: WeightEntry[], startDate?: string): WeeklyAveragePoint[] {
  const filteredEntries = [...entries]
    .filter((entry) => (startDate ? entry.date >= startDate : true))
    .sort((left, right) => left.date.localeCompare(right.date));

  const weeklyGroups = filteredEntries.reduce<Map<string, WeightEntry[]>>((aggregate, entry) => {
    const weekKey = getWeekStart(entry.date);
    const currentEntries = aggregate.get(weekKey) ?? [];
    currentEntries.push(entry);
    aggregate.set(weekKey, currentEntries);

    return aggregate;
  }, new Map());

  return Array.from(weeklyGroups.entries()).map(([weekStart, weeklyEntries]) => ({
    weekStart,
    averageKg: weeklyEntries.reduce((sum, entry) => sum + entry.weightKg, 0) / Math.max(weeklyEntries.length, 1),
  }));
}

function getAverageWeightChangeKgPerWeek(entries: WeightEntry[], startDate?: string) {
  const weeklySeries = getWeeklyAverageSeries(entries, startDate);

  if (weeklySeries.length < 2) {
    return null;
  }

  const firstPoint = weeklySeries[0];
  const lastPoint = weeklySeries[weeklySeries.length - 1];
  const firstDate = new Date(`${firstPoint.weekStart}T00:00:00`);
  const lastDate = new Date(`${lastPoint.weekStart}T00:00:00`);
  const elapsedDays = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

  if (elapsedDays <= 0) {
    return null;
  }

  return ((lastPoint.averageKg - firstPoint.averageKg) / elapsedDays) * 7;
}

function getEntriesSinceDate(entries: WeightEntry[], startDate: string) {
  return [...entries]
    .filter((entry) => entry.date >= startDate)
    .sort((left, right) => left.date.localeCompare(right.date));
}

function getSignedTargetRateKgPerWeek(goal: WeightGoal | null) {
  if (!goal || goal.goalType === "maintain") {
    return 0;
  }

  const targetRate = Math.abs(goal.targetRateKgPerWeek ?? 0);

  if (goal.goalType === "lose") {
    return -targetRate;
  }

  if (goal.goalType === "gain") {
    return targetRate;
  }

  return 0;
}

function getActualGoalRateKgPerWeek(goal: WeightGoal | null, entries: WeightEntry[]) {
  if (!goal) {
    return null;
  }

  return getAverageWeightChangeKgPerWeek(entries, goal.startedOn);
}

function getWeeklyAverageTrendPoints(entries: WeightEntry[], unitPreference: UnitPreference) {
  return getWeeklyAverageSeries(entries)
    .map(({ weekStart, averageKg }) => {
      const averageValue = convertWeightKgToUnit(
        averageKg,
        unitPreference
      );
      const displayUnitLabel = unitPreference === "imperial" ? "lbs" : getWeightUnitLabel(unitPreference);

      return {
        label: formatWeekRangeLabel(weekStart),
        detailLabel: formatWeekRangeLabel(weekStart),
        value: averageValue,
        displayValue: `Week Avg: ${averageValue.toFixed(1)} ${displayUnitLabel}`,
      };
    })
    .slice(-6);
}

function getProgramModeLabel(mode: NutritionGoal["programMode"]): string {
  return mode === "guided" ? "Generated Program" : "Manual Program";
}

function getEstimatedGoalDate(goal: WeightGoal | null, entries: WeightEntry[]): string {
  if (!goal || goal.goalType === "maintain") {
    return "No target date";
  }

  const weeklySeries = getWeeklyAverageSeries(entries, goal.startedOn);
  const currentWeight = weeklySeries[weeklySeries.length - 1]?.averageKg ?? getLatestWeight(entries) ?? goal.startWeightKg;

  if (goal.goalType === "lose" && currentWeight <= goal.targetWeightKg) {
    return "Goal reached";
  }

  if (goal.goalType === "gain" && currentWeight >= goal.targetWeightKg) {
    return "Goal reached";
  }

  const actualRateKgPerWeek = getActualGoalRateKgPerWeek(goal, entries);

  if (!actualRateKgPerWeek || Math.abs(actualRateKgPerWeek) < 0.01) {
    return "No trend yet";
  }

  if (goal.goalType === "gain" && actualRateKgPerWeek <= 0) {
    return "Trend off target";
  }

  if (goal.goalType === "lose" && actualRateKgPerWeek >= 0) {
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

function getTargetGoalDate(goal: WeightGoal | null): string {
  if (!goal || goal.goalType === "maintain") {
    return "No target date";
  }

  const targetRateKgPerWeek = Math.abs(goal.targetRateKgPerWeek ?? 0);

  if (targetRateKgPerWeek <= 0) {
    return "No target date";
  }

  const remainingKg = Math.abs(goal.targetWeightKg - goal.startWeightKg);

  if (remainingKg < 0.01) {
    return "Goal reached";
  }

  const daysRemaining = Math.ceil((remainingKg / targetRateKgPerWeek) * 7);
  const targetDate = new Date(`${goal.startedOn}T00:00:00`);
  targetDate.setDate(targetDate.getDate() + Math.max(daysRemaining, 0));

  return targetDate.toLocaleDateString("en-US", {
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
    return `0 ${unitPreference === "imperial" ? "lbs" : getWeightUnitLabel(unitPreference)} / week`;
  }

  return `${formatWeightValue(rateKgPerWeek, unitPreference, 1)} ${unitPreference === "imperial" ? "lbs" : getWeightUnitLabel(unitPreference)} / week`;
}

function getTargetStatus(goal: WeightGoal | null, entries: WeightEntry[]): TargetStatusResult {
  if (!goal || goal.goalType === "maintain") {
    return {
      label: "Maintaining",
      tone: "info" as const,
    };
  }

  const currentWeight = getLatestWeight(entries) ?? goal.startWeightKg;

  if (goal.goalType === "lose" && currentWeight <= goal.targetWeightKg) {
    return {
      label: "Goal Reached",
      tone: "success" as const,
    };
  }

  if (goal.goalType === "gain" && currentWeight >= goal.targetWeightKg) {
    return {
      label: "Goal Reached",
      tone: "success" as const,
    };
  }

  const actualRateKgPerWeek = getActualGoalRateKgPerWeek(goal, entries);

  if (actualRateKgPerWeek === null || Math.abs(actualRateKgPerWeek) < 0.01) {
    return {
      label: "No Trend Yet",
      tone: "info" as const,
    };
  }

  const targetRateKgPerWeek = getSignedTargetRateKgPerWeek(goal);
  const differenceKgPerWeek = Math.abs(actualRateKgPerWeek - targetRateKgPerWeek);

  if (differenceKgPerWeek >= 0.2) {
    return {
      label: "Off Target",
      tone: "danger" as const,
    };
  }

  if (differenceKgPerWeek >= 0.1) {
    return {
      label: "Slightly Off Target",
      tone: "warning" as const,
    };
  }

  return {
    label: "On Track",
    tone: "success" as const,
  };
}

function getCompletionDateDisplay(goal: WeightGoal | null, entries: WeightEntry[]) {
  const targetStatus = getTargetStatus(goal, entries);
  const estimatedDate = getEstimatedGoalDate(goal, entries);
  const shouldShowEstimate =
    targetStatus.label === "Off Target" ||
    targetStatus.label === "Slightly Off Target";

  return {
    targetLabel: "Target Completion Date",
    targetValue: getTargetGoalDate(goal),
    estimatedLabel: shouldShowEstimate ? "Estimated Completion Date" : undefined,
    estimatedValue: shouldShowEstimate ? estimatedDate : undefined,
  };
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
  const goalWeightPickerRef = useRef<ScrollView | null>(null);
  const goalWeightHapticValueRef = useRef<number | null>(null);
  const goalRateHapticPercentRef = useRef<number | null>(null);
  const [goalWeightPickerWidth, setGoalWeightPickerWidth] = useState(0);
  const [goalSliderWidth, setGoalSliderWidth] = useState(0);
  const { unitPreference } = useDisplayUnitPreference();
  const [targetsForm, setTargetsForm] = useState({
    calorieGoal: String(mockNutritionGoal.calorieGoal),
    proteinGoal: String(mockNutritionGoal.proteinGoal),
    carbsGoal: String(mockNutritionGoal.carbsGoal),
    fatGoal: String(mockNutritionGoal.fatGoal),
  });
  const [goalTargetWeightValue, setGoalTargetWeightValue] = useState<number>(
    Number(formatWeightValue(mockGoal.targetWeightKg, unitPreference, 1))
  );
  const [goalRatePercent, setGoalRatePercent] = useState<number>(GOAL_RATE_PERCENT_MIN);

  const weightTrend = useMemo(() => getWeightTrend(weightEntries), [weightEntries]);
  const targetCompletion = useMemo(
    () => getCompletionDateDisplay(weightGoal, weightEntries),
    [weightEntries, weightGoal]
  );
  const averageWeightChangeKgPerWeek = useMemo(
    () => getActualGoalRateKgPerWeek(weightGoal, weightEntries),
    [weightEntries, weightGoal]
  );
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
    () => getTargetStatus(weightGoal, weightEntries),
    [weightEntries, weightGoal]
  );
  const signedTargetRateKgPerWeek = useMemo(() => getSignedTargetRateKgPerWeek(weightGoal), [weightGoal]);
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

  const currentGoalStartWeightKg = latestWeight ?? resolvedWeightGoal.startWeightKg;
  const goalRatePercentOptions = useMemo(() => getGoalRatePercentOptions(), []);
  const selectedGoalRateKgPerWeek = currentGoalStartWeightKg * goalRatePercent;
  const selectedGoalRateValue = convertWeightKgToUnit(selectedGoalRateKgPerWeek, unitPreference);
  const selectedGoalTargetWeightKg = convertWeightUnitToKg(goalTargetWeightValue, unitPreference);
  const goalWeightOptions = useMemo(() => getGoalWeightPickerOptions(unitPreference), [unitPreference]);
  const goalWeightPickerInset = useMemo(
    () => Math.max(goalWeightPickerWidth / 2 - GOAL_WEIGHT_PICKER_STEP_WIDTH / 2, 0),
    [goalWeightPickerWidth]
  );
  const selectedGoalWeightIndex = useMemo(() => {
    const closestOption = getClosestGoalWeightOption(goalTargetWeightValue, goalWeightOptions);
    return goalWeightOptions.findIndex((value) => Math.abs(value - closestOption) < 0.001);
  }, [goalTargetWeightValue, goalWeightOptions]);
  const goalSliderTrackWidth = useMemo(
    () => Math.max(goalSliderWidth - GOAL_SLIDER_HORIZONTAL_INSET * 2, 0),
    [goalSliderWidth]
  );
  const goalSliderThumbLeft = useMemo(() => {
    if (goalSliderTrackWidth <= 0) {
      return GOAL_SLIDER_HORIZONTAL_INSET - GOAL_SLIDER_THUMB_SIZE / 2;
    }

    const progress = (goalRatePercent - GOAL_RATE_PERCENT_MIN) / (GOAL_RATE_PERCENT_MAX - GOAL_RATE_PERCENT_MIN);
    return GOAL_SLIDER_HORIZONTAL_INSET + progress * goalSliderTrackWidth - GOAL_SLIDER_THUMB_SIZE / 2;
  }, [goalRatePercent, goalSliderTrackWidth]);
  const goalSliderActiveWidth = useMemo(() => {
    if (goalSliderTrackWidth <= 0) {
      return 0;
    }

    const progress = (goalRatePercent - GOAL_RATE_PERCENT_MIN) / (GOAL_RATE_PERCENT_MAX - GOAL_RATE_PERCENT_MIN);
    return progress * goalSliderTrackWidth;
  }, [goalRatePercent, goalSliderTrackWidth]);
  const projectedGoalDatePreview = useMemo(
    () => getProjectedGoalDatePreview(currentGoalStartWeightKg, selectedGoalTargetWeightKg, selectedGoalRateKgPerWeek),
    [currentGoalStartWeightKg, selectedGoalRateKgPerWeek, selectedGoalTargetWeightKg]
  );

  const triggerSelectionHaptic = () => {
    void Haptics.selectionAsync();
  };

  const updateGoalRatePercent = (nextPercent: number) => {
    if (Math.abs((goalRateHapticPercentRef.current ?? -1) - nextPercent) >= 0.0005) {
      triggerSelectionHaptic();
      goalRateHapticPercentRef.current = nextPercent;
    }

    setGoalRatePercent(nextPercent);
  };

  const updateGoalTargetWeightValue = (nextValue: number) => {
    if (Math.abs((goalWeightHapticValueRef.current ?? Number.NaN) - nextValue) >= 0.001) {
      triggerSelectionHaptic();
      goalWeightHapticValueRef.current = nextValue;
    }

    setGoalTargetWeightValue(nextValue);
  };

  const handleGoalRateSliderPosition = (locationX: number) => {
    if (goalSliderWidth <= 0) {
      return;
    }

    const clampedX = Math.max(
      GOAL_SLIDER_HORIZONTAL_INSET,
      Math.min(goalSliderWidth - GOAL_SLIDER_HORIZONTAL_INSET, locationX)
    );
    const normalizedPosition = goalSliderTrackWidth <= 0
      ? 0
      : (clampedX - GOAL_SLIDER_HORIZONTAL_INSET) / goalSliderTrackWidth;
    const nextPercent = GOAL_RATE_PERCENT_MIN + normalizedPosition * (GOAL_RATE_PERCENT_MAX - GOAL_RATE_PERCENT_MIN);
    updateGoalRatePercent(getClosestGoalRatePercent(nextPercent));
  };

  const handleGoalSliderLayout = (event: LayoutChangeEvent) => {
    setGoalSliderWidth(event.nativeEvent.layout.width);
  };

  const handleGoalWeightPickerLayout = (event: LayoutChangeEvent) => {
    setGoalWeightPickerWidth(event.nativeEvent.layout.width);
  };

  const handleGoalWeightPickerPosition = (offsetX: number) => {
    const nextIndex = getClosestPickerIndex(offsetX, goalWeightOptions.length, GOAL_WEIGHT_PICKER_STEP_WIDTH);
    updateGoalTargetWeightValue(goalWeightOptions[nextIndex]);
  };

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
    setActiveTargetsField("calorieGoal");
    setIsTargetsModalVisible(true);
  };

  const openGoalModal = () => {
    const nextTargetWeightValue = getClosestGoalWeightOption(
      Number(formatWeightValue(resolvedWeightGoal.targetWeightKg, unitPreference, 1)),
      goalWeightOptions
    );
    const nextRatePercent =
      currentGoalStartWeightKg > 0
        ? getClosestGoalRatePercent(resolvedWeightGoal.targetRateKgPerWeek / currentGoalStartWeightKg)
        : GOAL_RATE_PERCENT_MIN;

    setGoalTargetWeightValue(nextTargetWeightValue);
    goalWeightHapticValueRef.current = nextTargetWeightValue;
    goalRateHapticPercentRef.current = nextRatePercent;
    setGoalRatePercent(nextRatePercent);
    setGoalError(null);
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
    setIsGoalModalVisible(false);
  };

  useEffect(() => {
    if (!isGoalModalVisible || goalWeightPickerWidth <= 0) {
      return;
    }

    requestAnimationFrame(() => {
      goalWeightPickerRef.current?.scrollTo({
        x: selectedGoalWeightIndex * GOAL_WEIGHT_PICKER_STEP_WIDTH,
        animated: false,
      });
    });
  }, [goalWeightPickerWidth, isGoalModalVisible, selectedGoalWeightIndex]);

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
    if (!Number.isFinite(goalTargetWeightValue) || goalTargetWeightValue <= 0 || goalRatePercent <= 0) {
      setGoalError("Choose a valid goal weight and weekly pace.");
      return;
    }

    const startWeightKg = currentGoalStartWeightKg;
    const targetWeightKg = selectedGoalTargetWeightKg;
    const goalType = getGoalType(startWeightKg, targetWeightKg);
    const targetRateKgPerWeek =
      goalType === "maintain" ? 0 : selectedGoalRateKgPerWeek;

    const nextGoal: WeightGoal = {
      ...resolvedWeightGoal,
      goalType,
      status: "active",
      startWeightKg,
      targetWeightKg,
      targetRateKgPerWeek,
      startedOn: new Date().toISOString().slice(0, 10),
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
        targetCompletionLabel={targetCompletion.targetLabel}
        targetCompletionDate={targetCompletion.targetValue}
        estimatedCompletionLabel={targetCompletion.estimatedLabel}
        estimatedCompletionDate={targetCompletion.estimatedValue}
        targetStatusLabel={targetStatus.label}
        targetStatusTone={targetStatus.tone}
        primaryAction={{ label: "Update Weight Goal", onPress: openGoalModal }}
        secondaryAction={{ label: "Edit Nutrition Targets", onPress: openTargetsModal }}
        trendTitle="Weight Trend"
        trendValue={formatTrendValue(averageWeightChangeKgPerWeek ?? 0, unitPreference)}
        trendSupportingText="Avg. Rate"
        targetPaceValue={formatTrendValue(signedTargetRateKgPerWeek, unitPreference)}
        targetPaceSupportingText={formatGoalRate(Math.abs(signedTargetRateKgPerWeek), unitPreference)}
        actualPaceValue={formatTrendValue(averageWeightChangeKgPerWeek ?? 0, unitPreference)}
        actualPaceSupportingText={
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

                  <View style={styles.goalModalSection}>
                    <View style={styles.inputHeadingRow}>
                      <Text style={styles.inputLabel}>Target weight</Text>
                      <Text style={styles.inputUnit}>{getWeightUnitLabel(unitPreference)}</Text>
                    </View>
                    <Text style={styles.goalPickerSelectedValue}>
                      {formatGoalWeightValue(goalTargetWeightValue, unitPreference)}
                    </Text>
                    <View style={styles.goalPickerScrollContainer} onLayout={handleGoalWeightPickerLayout}>
                      <View style={styles.goalPickerCenterIndicator} pointerEvents="none">
                        <View style={styles.goalPickerCenterArrow} />
                        <View style={styles.goalPickerCenterLine} />
                      </View>
                      <ScrollView
                        ref={goalWeightPickerRef}
                        style={styles.goalPickerScroll}
                        contentContainerStyle={[
                          styles.goalPickerScrollContent,
                          { paddingHorizontal: goalWeightPickerInset },
                        ]}
                        horizontal
                        bounces={false}
                        showsHorizontalScrollIndicator={false}
                        decelerationRate="normal"
                        onScroll={(event) => handleGoalWeightPickerPosition(event.nativeEvent.contentOffset.x)}
                        onMomentumScrollEnd={(event) =>
                          handleGoalWeightPickerPosition(event.nativeEvent.contentOffset.x)
                        }
                        onScrollEndDrag={(event) =>
                          handleGoalWeightPickerPosition(event.nativeEvent.contentOffset.x)
                        }
                        scrollEventThrottle={16}>
                        {goalWeightOptions.map((weightOption) => {
                          const isSelected = Math.abs(weightOption - goalTargetWeightValue) < 0.001;
                          const tickType = getGoalWeightTickType(weightOption, unitPreference);
                          const showsLabel = tickType === "major";

                          return (
                            <Pressable
                              key={`goal-weight-${weightOption}`}
                              style={[styles.goalPickerOption, showsLabel && styles.goalPickerOptionMajor]}
                              onPress={() => {
                                updateGoalTargetWeightValue(weightOption);
                                goalWeightPickerRef.current?.scrollTo({
                                  x: goalWeightOptions.indexOf(weightOption) * GOAL_WEIGHT_PICKER_STEP_WIDTH,
                                  animated: true,
                                });
                              }}>
                              <View
                                style={[
                                  styles.goalPickerTick,
                                  tickType === "major"
                                    ? styles.goalPickerTickMajor
                                    : tickType === "mid"
                                      ? styles.goalPickerTickMid
                                      : styles.goalPickerTickMinor,
                                  isSelected && styles.goalPickerTickSelected,
                                ]}
                              />
                              {showsLabel ? (
                                <Text
                                  numberOfLines={1}
                                  style={[styles.goalPickerTickLabel, isSelected && styles.goalPickerTickLabelSelected]}>
                                  {unitPreference === "imperial" ? weightOption.toFixed(0) : weightOption.toFixed(0)}
                                </Text>
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={styles.goalModalSection}>
                    <View style={styles.inputHeadingRow}>
                      <Text style={styles.inputLabel}>Weekly pace</Text>
                      <Text style={styles.inputUnit}>% body weight / wk</Text>
                    </View>
                    <Text style={styles.goalSliderValue}>{formatGoalRatePercent(goalRatePercent)}</Text>
                    <Text style={styles.goalSliderHelper}>{`${selectedGoalRateValue.toFixed(1)} ${getRateDisplayUnitLabel(unitPreference)} / wk`}</Text>
                    <View
                      style={styles.goalSliderTrackWrap}
                      onLayout={handleGoalSliderLayout}
                      onStartShouldSetResponder={() => true}
                      onMoveShouldSetResponder={() => true}
                      onResponderGrant={(event) => handleGoalRateSliderPosition(event.nativeEvent.locationX)}
                      onResponderMove={(event) => handleGoalRateSliderPosition(event.nativeEvent.locationX)}>
                      <View style={styles.goalSliderTrack} />
                      <View style={[styles.goalSliderActiveTrack, { width: goalSliderActiveWidth }]} pointerEvents="none" />
                      <View style={styles.goalSliderStepsRow} pointerEvents="none">
                        {goalRatePercentOptions.map((rateOption) => {
                          const isSelected = Math.abs(rateOption - goalRatePercent) < 0.0005;

                          return <View key={`goal-rate-${rateOption}`} style={[styles.goalSliderStepDot, isSelected && styles.goalSliderStepDotSelected]} />;
                        })}
                      </View>
                      <View style={[styles.goalSliderThumb, { left: goalSliderThumbLeft }]} pointerEvents="none" />
                    </View>
                    <View style={styles.goalSliderLabelsRow}>
                      <Text style={styles.goalSliderLabel}>0.1%</Text>
                      <Text style={styles.goalSliderLabel}>1.5%</Text>
                    </View>
                  </View>

                  <View style={styles.goalProjectionCard}>
                    <Text style={styles.goalProjectionLabel}>Projected Goal Date</Text>
                    <Text style={styles.goalProjectionValue}>{projectedGoalDatePreview}</Text>
                  </View>

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
  goalModalSection: {
    gap: 10,
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
  goalPickerScrollContainer: {
    height: GOAL_WEIGHT_PICKER_VISIBLE_HEIGHT,
    borderRadius: 18,
    backgroundColor: "#202020",
    overflow: "hidden",
    justifyContent: "center",
  },
  goalPickerSelectedValue: {
    color: "#F4F4F4",
    fontSize: 18,
    fontWeight: "700",
  },
  goalPickerCenterIndicator: {
    position: "absolute",
    top: 10,
    bottom: 16,
    left: "50%",
    marginLeft: -12,
    width: 24,
    alignItems: "center",
    zIndex: 3,
  },
  goalPickerCenterArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#5E8BFF",
  },
  goalPickerCenterLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: "#5E8BFF",
  },
  goalPickerScroll: {
    flex: 1,
  },
  goalPickerScrollContent: {
    alignItems: "flex-end",
    minHeight: GOAL_WEIGHT_PICKER_VISIBLE_HEIGHT,
  },
  goalPickerOption: {
    width: GOAL_WEIGHT_PICKER_STEP_WIDTH,
    height: GOAL_WEIGHT_PICKER_VISIBLE_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 14,
    gap: 8,
  },
  goalPickerOptionMajor: {
    overflow: "visible",
  },
  goalPickerTick: {
    width: 2,
    borderRadius: 999,
    backgroundColor: "#6A6A6A",
  },
  goalPickerTickMinor: {
    height: 16,
  },
  goalPickerTickMid: {
    height: 26,
  },
  goalPickerTickMajor: {
    height: 38,
  },
  goalPickerTickSelected: {
    backgroundColor: "#F4F4F4",
  },
  goalPickerTickLabel: {
    color: "#8E8E8E",
    fontSize: 12,
    fontWeight: "600",
    width: 40,
    textAlign: "center",
  },
  goalPickerTickLabelSelected: {
    color: "#F4F4F4",
  },
  goalSliderValue: {
    color: "#F4F4F4",
    fontSize: 18,
    fontWeight: "700",
  },
  goalSliderHelper: {
    color: "#8E8E8E",
    fontSize: 12,
    lineHeight: 17,
  },
  goalSliderTrackWrap: {
    justifyContent: "center",
    height: 40,
  },
  goalSliderTrack: {
    position: "absolute",
    left: GOAL_SLIDER_HORIZONTAL_INSET,
    right: GOAL_SLIDER_HORIZONTAL_INSET,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#343434",
  },
  goalSliderActiveTrack: {
    position: "absolute",
    left: GOAL_SLIDER_HORIZONTAL_INSET,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#5E8BFF",
  },
  goalSliderStepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: GOAL_SLIDER_HORIZONTAL_INSET,
  },
  goalSliderThumb: {
    position: "absolute",
    top: 7,
    width: GOAL_SLIDER_THUMB_SIZE,
    height: GOAL_SLIDER_THUMB_SIZE,
    borderRadius: 999,
    backgroundColor: "#F4F4F4",
    borderWidth: 2,
    borderColor: "#5E8BFF",
  },
  goalSliderStepButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  goalSliderStepDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#5A5A5A",
  },
  goalSliderStepDotSelected: {
    backgroundColor: "#F4F4F4",
    transform: [{ scale: 1.4 }],
  },
  goalSliderLabelsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  goalSliderLabel: {
    color: "#8E8E8E",
    fontSize: 12,
    fontWeight: "600",
  },
  goalProjectionCard: {
    borderRadius: 18,
    backgroundColor: "#202020",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  goalProjectionLabel: {
    color: "#8E8E8E",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  goalProjectionValue: {
    color: "#F4F4F4",
    fontSize: 20,
    fontWeight: "700",
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