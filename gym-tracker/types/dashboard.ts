import type { MacroBarProps } from "@/utils/calculateMacroBar";

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