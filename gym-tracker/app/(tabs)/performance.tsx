import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Polyline } from "react-native-svg";

import NutritionSplitDonut from "@/components/performance/NutritionSplitDonut";
import GoalProgressSection from "@/components/main/GoalProgress";
import {
  getDailyExerciseMetrics as getMockDailyExerciseMetrics,
  mockGoal,
  mockNutritionGoal,
  mockWeightEntries,
} from "@/mock/MainScreen/DailyMetricsSection";
import { useGoalPlanWizard } from "@/context/GoalPlanWizardContext";
import { getActiveGoalPlan, getDailyExerciseMetrics, getWeightEntries } from "@/services/dashboardService";
import { getAuthenticatedUserId } from "@/services/profileService";
import type { NutritionGoal, NutritionProgramRecommendation, WeightEntry, WeightGoal } from "@/types/dashboard";
import { getCurrentDate } from "@/utils/dateFormat";
import { getWeightTrend } from "@/utils/weightProgress";

const EMPTY_EXERCISE_METRICS = {
  volume: 0,
  durationMins: 0,
  workoutType: "",
};

function WeightTrendMiniChart({ entries }: { entries: WeightEntry[] }) {
  const chartEntries = entries.slice(-7);
  const values = chartEntries.map((entry) => entry.weightKg);
  const width = 110;
  const height = 56;

  if (!values.length) {
    return <View style={{ height }} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length === 1 ? 0 : width / (values.length - 1);
  const points = values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / range) * (height - 12) - 6;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Svg width={width} height={height}>
      <Polyline points={points} fill="none" stroke="#D9D9D9" strokeWidth={1.5} />
      {values.map((value, index) => {
        const x = index * stepX;
        const y = height - ((value - min) / range) * (height - 12) - 6;

        return <Circle key={`${value}-${index}`} cx={x} cy={y} r={4.5} fill="#F5F5F5" />;
      })}
    </Svg>
  );
}

function getGoalTypeLabel(goalType: WeightGoal["goalType"]): string {
  if (goalType === "lose") {
    return "Fat Loss";
  }

  if (goalType === "gain") {
    return "Mass Gain";
  }

  return "Maintenance";
}

function getProgramModeLabel(mode: NutritionGoal["programMode"]): string {
  return mode === "guided" ? "Generated Program" : "Manual Program";
}

function getEstimatedGoalDate(goal: WeightGoal | null, latestWeightKg: number | null): string {
  if (!goal || goal.goalType === "maintain") {
    return "No target date";
  }

  const currentWeight = latestWeightKg ?? goal.startWeightKg;
  const remainingKg = Math.abs(goal.targetWeightKg - currentWeight);
  const weeklyRate = Math.abs(goal.targetRateKgPerWeek);

  if (!weeklyRate) {
    return "No target date";
  }

  const daysRemaining = Math.ceil((remainingKg / weeklyRate) * 7);
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + Math.max(daysRemaining, 0));

  return estimatedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getRecommendationStatusLabel(status: NutritionProgramRecommendation["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function PerformanceScreen() {
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal>(mockNutritionGoal);
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(mockGoal);
  const [latestRecommendation, setLatestRecommendation] =
    useState<NutritionProgramRecommendation | null>(null);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>(mockWeightEntries);
  const [exerciseMetrics, setExerciseMetrics] = useState(EMPTY_EXERCISE_METRICS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { startGoalFlow, startProgramFlow } = useGoalPlanWizard();

  const latestWeight = useMemo(() => {
    if (!weightEntries.length) {
      return null;
    }

    return weightEntries[weightEntries.length - 1].weightKg;
  }, [weightEntries]);

  const weightTrend = useMemo(() => getWeightTrend(weightEntries), [weightEntries]);
  const estimatedGoalDate = useMemo(
    () => getEstimatedGoalDate(weightGoal, latestWeight),
    [latestWeight, weightGoal]
  );

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
          setNutritionGoal({ ...mockNutritionGoal });
          setWeightGoal({ ...mockGoal });
          setLatestRecommendation(null);
          setWeightEntries([...mockWeightEntries]);
          setExerciseMetrics(getMockDailyExerciseMetrics(getCurrentDate()));
          setLoadError("Using local goals data right now.");
          return;
        }

        const [goalPlan, nextWeightEntries, nextExerciseMetrics] = await Promise.all([
          getActiveGoalPlan(nextAuthenticatedUserId),
          getWeightEntries(nextAuthenticatedUserId),
          getDailyExerciseMetrics(nextAuthenticatedUserId, getCurrentDate()),
        ]);

        if (!isMounted) {
          return;
        }

        setWeightEntries(nextWeightEntries);
        setExerciseMetrics(nextExerciseMetrics ?? EMPTY_EXERCISE_METRICS);

        if (goalPlan) {
          setNutritionGoal(goalPlan.nutritionGoal);
          setWeightGoal(goalPlan.bodyGoal);
          setLatestRecommendation(goalPlan.latestRecommendation);
          setLoadError(null);
          return;
        }

        setNutritionGoal({ ...mockNutritionGoal });
        setWeightGoal(null);
        setLatestRecommendation(null);
        setLoadError("No synced goal plan yet.");
      } catch {
        if (!isMounted) {
          return;
        }

        setNutritionGoal({ ...mockNutritionGoal });
        setWeightGoal({ ...mockGoal });
        setLatestRecommendation(null);
        setWeightEntries([...mockWeightEntries]);
        setExerciseMetrics(getMockDailyExerciseMetrics(getCurrentDate()));
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

  const openGoalWizard = () => {
    startGoalFlow(weightGoal, nutritionGoal, latestWeight);
    router.push("/performance/goal-type");
  };

  const openProgramWizard = () => {
    startProgramFlow(weightGoal, nutritionGoal, latestWeight);
    router.push("/performance/program-mode");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <Text style={styles.title}>Performance & Goals</Text>

        {isLoading ? (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#BDBDBD" />
            <Text style={styles.statusText}>Syncing goal plan</Text>
          </View>
        ) : null}
        {loadError ? <Text style={styles.statusText}>{loadError}</Text> : null}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Weight Trend</Text>
              <Text style={styles.summarySubtitle}>Last seven days</Text>
              <WeightTrendMiniChart entries={weightEntries} />
              <Text style={styles.summaryFooterText}>{`${weightTrend.changeKg >= 0 ? "+" : ""}${weightTrend.changeKg.toFixed(1)} kg`}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Estimated Goal Date</Text>
              <Text style={styles.summaryDate}>{estimatedGoalDate}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Weight Goal</Text>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>{weightGoal ? getGoalTypeLabel(weightGoal.goalType) : "No Active Goal"}</Text>
                <Text style={styles.sectionSubtitle}>Full-screen setup with step-by-step questions</Text>
              </View>
              <Pressable style={styles.sectionAction} onPress={openGoalWizard}>
                <Text style={styles.sectionActionText}>{weightGoal ? "Edit" : "New Goal"}</Text>
              </Pressable>
            </View>

            {weightGoal ? (
              <>
                <View style={styles.metricRow}>
                  <View style={styles.metricBlock}>
                    <Text style={styles.metricLabel}>Start</Text>
                    <Text style={styles.metricValue}>{weightGoal.startWeightKg.toFixed(1)} kg</Text>
                  </View>
                  <View style={styles.metricBlock}>
                    <Text style={styles.metricLabel}>Target</Text>
                    <Text style={styles.metricValue}>{weightGoal.targetWeightKg.toFixed(1)} kg</Text>
                  </View>
                  <View style={styles.metricBlock}>
                    <Text style={styles.metricLabel}>Rate</Text>
                    <Text style={styles.metricValue}>
                      {weightGoal.goalType === "maintain"
                        ? "Hold"
                        : `${weightGoal.targetRateKgPerWeek.toFixed(2)} kg/wk`}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressWrap}>
                  <GoalProgressSection entries={weightEntries} goal={weightGoal} />
                </View>
              </>
            ) : (
              <Text style={styles.emptyText}>Start a new goal to define the phase and target.</Text>
            )}
          </View>

          <Text style={styles.sectionHeading}>Nutrition Program</Text>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>{getProgramModeLabel(nutritionGoal.programMode)}</Text>
                <Text style={styles.sectionSubtitle}>Manual path or generated path across full-screen steps</Text>
              </View>
              <Pressable style={styles.sectionAction} onPress={openProgramWizard}>
                <Text style={styles.sectionActionText}>Create Program</Text>
              </Pressable>
            </View>

            <NutritionSplitDonut
              calories={nutritionGoal.calorieGoal}
              protein={nutritionGoal.proteinGoal}
              carbs={nutritionGoal.carbsGoal}
              fat={nutritionGoal.fatGoal}
            />
          </View>

          {latestRecommendation ? (
            <View style={styles.recommendationCard}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Adaptive Recommendation</Text>
                  <Text style={styles.sectionSubtitle}>{getRecommendationStatusLabel(latestRecommendation.status)}</Text>
                </View>
              </View>
              <Text style={styles.recommendationText}>{latestRecommendation.reasonSummary}</Text>
            </View>
          ) : null}

          <View style={styles.trainingCard}>
            <Text style={styles.sectionTitle}>Today&apos;s Training</Text>
            <Text style={styles.sectionSubtitle}>{exerciseMetrics.workoutType || "No session logged"}</Text>
            <View style={styles.metricRow}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Volume</Text>
                <Text style={styles.metricValue}>{exerciseMetrics.volume.toLocaleString()} kg</Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>Duration</Text>
                <Text style={styles.metricValue}>{exerciseMetrics.durationMins} min</Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
    fontWeight: "600",
  },
  summarySubtitle: {
    color: "#4E4E4E",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  summaryFooterText: {
    color: "#BDBDBD",
    fontSize: 13,
    marginTop: 10,
  },
  summaryDate: {
    color: "#F4F4F4",
    fontSize: 22,
    fontWeight: "500",
    lineHeight: 30,
    marginTop: 30,
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
  sectionAction: {
    minHeight: 34,
    borderRadius: 16,
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionActionText: {
    color: "#F4F4F4",
    fontSize: 13,
    fontWeight: "600",
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
  progressWrap: {
    marginTop: 18,
  },
  emptyText: {
    color: "#8E8E8E",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
  },
  recommendationCard: {
    backgroundColor: "#202020",
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
  },
  recommendationText: {
    color: "#D0D0D0",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
  },
  trainingCard: {
    backgroundColor: "#202020",
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
  },
});