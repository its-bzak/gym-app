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

export type WeightEntry = {
  date: string;
  weightKg: number;
};

export type WeightGoal = {
  startWeightKg: number;
  targetWeightKg: number;
};

export type NutritionGoal = {
  proteinGoal: number;
  fatGoal: number;
  carbsGoal: number;
  calorieGoal: number;
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