import type { MacroBarProps } from "@/utils/calculateMacroBar";

export type FoodLogMealSlot =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "custom";

export type DatedMacroMetrics = MacroBarProps & {
  date: string;
};

export type DailyExerciseMetrics = {
  date: string;
  volume: number;
  durationMins: number;
  workoutType: string;
};

export type LifetimeTrainingMetrics = {
  totalSets: number | null;
  totalVolume: number;
  totalDurationMins: number;
  totalWorkouts: number;
  totalReps: number | null;
};

export type WeightEntry = {
  date: string;
  weightKg: number;
};

export type GoalType = "lose" | "gain" | "maintain";

export type GoalStatus = "draft" | "active" | "completed" | "paused" | "cancelled";

export type ProgramMode = "manual" | "guided";

export type ProteinPreference = "standard" | "high";

export type CarbPreference = "lower" | "balanced" | "higher";

export type FatPreference = "lower" | "balanced" | "higher";

export type RecommendationStatus = "pending" | "approved" | "rejected" | "expired";

export type RecommendationReasonCode =
  | "losing_too_fast"
  | "losing_too_slow"
  | "gaining_too_fast"
  | "gaining_too_slow"
  | "maintenance_drift"
  | "insufficient_data";

export type WeightGoal = {
  id?: string;
  goalType: GoalType;
  status: GoalStatus;
  startWeightKg: number;
  targetWeightKg: number;
  targetRateKgPerWeek: number;
  startedOn: string;
};

export type NutritionGoal = {
  programMode: ProgramMode;
  proteinGoal: number;
  fatGoal: number;
  carbsGoal: number;
  calorieGoal: number;
  maintenanceCalories?: number | null;
  plannedDailyEnergyDelta?: number | null;
  proteinPreference: ProteinPreference;
  carbPreference: CarbPreference;
  fatPreference: FatPreference;
  adaptiveEnabled: boolean;
};

export type NutritionProgramRecommendation = {
  id: string;
  status: RecommendationStatus;
  reasonCode: RecommendationReasonCode;
  reasonSummary: string;
  previousCalorieGoal: number;
  recommendedCalorieGoal: number;
  previousProteinGoal: number;
  recommendedProteinGoal: number;
  previousFatGoal: number;
  recommendedFatGoal: number;
  previousCarbsGoal: number;
  recommendedCarbsGoal: number;
  createdAt: string;
  reviewedAt?: string | null;
};

export type GoalPlan = {
  bodyGoal: WeightGoal;
  nutritionGoal: NutritionGoal;
  latestRecommendation: NutritionProgramRecommendation | null;
};

export type FoodLogEntry = {
  id: string;
  entryDate: string;
  loggedAt: string;
  mealSlot: FoodLogMealSlot;
  name: string;
  energyKcal: number;
  protein: number;
  fat: number;
  carbs: number;
  alcoholGrams: number;
};

export type FoodLogDaySummary = MacroBarProps & {
  consumedCalories: number;
};