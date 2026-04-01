import { supabase } from "@/lib/supabase";
import type { DailyExerciseMetrics, WeightEntry, WeightGoal } from "@/types/dashboard";
import type { MacroBarProps } from "@/utils/calculateMacroBar";

export type DashboardWriteResult<T> = {
  success: boolean;
  error?: string;
  shouldFallback?: boolean;
  data?: T;
};

type DailyNutritionMetricsRow = {
  id: string;
  user_id: string;
  metric_date: string;
  protein_grams: number;
  protein_goal_grams: number;
  fat_grams: number;
  fat_goal_grams: number;
  carbs_grams: number;
  carbs_goal_grams: number;
  calorie_goal: number;
  created_at: string;
  updated_at: string;
};

type NutritionGoalRow = {
  id: string;
  user_id: string;
  protein_goal_grams: number;
  fat_goal_grams: number;
  carbs_goal_grams: number;
  calorie_goal: number;
  starts_on: string;
  ended_on: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type FoodLogEntryRow = {
  id: string;
  user_id: string;
  entry_date: string;
  protein_grams: number;
  fat_grams: number;
  carbs_grams: number;
  created_at: string;
  updated_at: string;
};

type DailyExerciseMetricsRow = {
  id: string;
  user_id: string;
  metric_date: string;
  volume_kg: number;
  duration_mins: number;
  workout_type: string | null;
  created_at: string;
  updated_at: string;
};

type BodyWeightEntryRow = {
  id: string;
  user_id: string;
  entry_date: string;
  weight_kg: number;
  created_at: string;
  updated_at: string;
};

type WeightGoalRow = {
  id: string;
  user_id: string;
  start_weight_kg: number;
  target_weight_kg: number;
  started_at: string;
  completed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkoutDashboardSnapshot = {
  macroMetrics: MacroBarProps | null;
  exerciseMetrics: Omit<DailyExerciseMetrics, "date"> | null;
  weightEntries: WeightEntry[];
  weightGoal: WeightGoal | null;
};

export type FoodLogInput = {
  protein: number;
  fat: number;
  carbs: number;
};

export function getDateKey(date: Date | string): string {
  if (typeof date === "string") {
    return date;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function mapDailyNutritionMetricsRow(row: DailyNutritionMetricsRow): MacroBarProps {
  return {
    protein: row.protein_grams,
    proteinGoal: row.protein_goal_grams,
    fat: row.fat_grams,
    fatGoal: row.fat_goal_grams,
    carbs: row.carbs_grams,
    carbsGoal: row.carbs_goal_grams,
    calorieGoal: row.calorie_goal,
  };
}

function mapNutritionGoalRow(row: NutritionGoalRow): Pick<
  MacroBarProps,
  "proteinGoal" | "fatGoal" | "carbsGoal" | "calorieGoal"
> {
  return {
    proteinGoal: row.protein_goal_grams,
    fatGoal: row.fat_goal_grams,
    carbsGoal: row.carbs_goal_grams,
    calorieGoal: row.calorie_goal,
  };
}

function mapDailyExerciseMetricsRow(
  row: DailyExerciseMetricsRow
): Omit<DailyExerciseMetrics, "date"> {
  return {
    volume: Number(row.volume_kg ?? 0),
    durationMins: row.duration_mins,
    workoutType: row.workout_type ?? "",
  };
}

function mapBodyWeightEntryRow(row: BodyWeightEntryRow): WeightEntry {
  return {
    date: row.entry_date,
    weightKg: Number(row.weight_kg),
  };
}

function mapWeightGoalRow(row: WeightGoalRow): WeightGoal {
  return {
    startWeightKg: Number(row.start_weight_kg),
    targetWeightKg: Number(row.target_weight_kg),
  };
}

function buildUnexpectedErrorMessage(prefix: string, error: unknown): string {
  if (error instanceof Error && error.message) {
    return `${prefix} ${error.message}`;
  }

  return prefix;
}

export async function getDailyNutritionMetrics(
  userId: string,
  date: Date | string
): Promise<MacroBarProps | null> {
  const dateKey = getDateKey(date);

  const [goalResponse, foodLogResponse] = await Promise.all([
    supabase
      .from("nutrition_goals")
      .select(
        "id, user_id, protein_goal_grams, fat_goal_grams, carbs_goal_grams, calorie_goal, starts_on, ended_on, is_active, created_at, updated_at"
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle<NutritionGoalRow>(),
    supabase
      .from("food_log_entries")
      .select(
        "id, user_id, entry_date, protein_grams, fat_grams, carbs_grams, created_at, updated_at"
      )
      .eq("user_id", userId)
      .eq("entry_date", dateKey)
      .returns<FoodLogEntryRow[]>(),
  ]);

  if (goalResponse.error) {
    throw new Error(goalResponse.error.message);
  }

  if (foodLogResponse.error) {
    throw new Error(foodLogResponse.error.message);
  }

  const goalMetrics = goalResponse.data
    ? mapNutritionGoalRow(goalResponse.data)
    : {
        proteinGoal: 0,
        fatGoal: 0,
        carbsGoal: 0,
        calorieGoal: 0,
      };

  const totals = (foodLogResponse.data ?? []).reduce(
    (aggregate, entry) => {
      aggregate.protein += entry.protein_grams;
      aggregate.fat += entry.fat_grams;
      aggregate.carbs += entry.carbs_grams;

      return aggregate;
    },
    {
      protein: 0,
      fat: 0,
      carbs: 0,
    }
  );

  if (!goalResponse.data && (foodLogResponse.data?.length ?? 0) === 0) {
    return null;
  }

  return {
    protein: totals.protein,
    fat: totals.fat,
    carbs: totals.carbs,
    ...goalMetrics,
  };
}

export async function getDailyExerciseMetrics(
  userId: string,
  date: Date | string
): Promise<Omit<DailyExerciseMetrics, "date"> | null> {
  const { data, error } = await supabase
    .from("daily_exercise_metrics")
    .select(
      "id, user_id, metric_date, volume_kg, duration_mins, workout_type, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("metric_date", getDateKey(date))
    .maybeSingle<DailyExerciseMetricsRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapDailyExerciseMetricsRow(data) : null;
}

export async function getWeightEntries(userId: string): Promise<WeightEntry[]> {
  const { data, error } = await supabase
    .from("body_weight_entries")
    .select("id, user_id, entry_date, weight_kg, created_at, updated_at")
    .eq("user_id", userId)
    .order("entry_date", { ascending: true })
    .returns<BodyWeightEntryRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapBodyWeightEntryRow);
}

export async function getActiveWeightGoal(userId: string): Promise<WeightGoal | null> {
  const { data, error } = await supabase
    .from("weight_goals")
    .select(
      "id, user_id, start_weight_kg, target_weight_kg, started_at, completed_at, is_active, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle<WeightGoalRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapWeightGoalRow(data) : null;
}

export async function getWorkoutDashboardSnapshot(
  userId: string,
  date: Date | string
): Promise<WorkoutDashboardSnapshot> {
  const [macroMetrics, exerciseMetrics, weightEntries, weightGoal] = await Promise.all([
    getDailyNutritionMetrics(userId, date),
    getDailyExerciseMetrics(userId, date),
    getWeightEntries(userId),
    getActiveWeightGoal(userId),
  ]);

  return {
    macroMetrics,
    exerciseMetrics,
    weightEntries,
    weightGoal,
  };
}

export async function appendFoodLogEntry(
  userId: string,
  date: Date | string,
  entry: FoodLogInput
): Promise<DashboardWriteResult<MacroBarProps>> {
  const values = Object.values(entry);
  const hasNegativeValue = values.some((value) => value < 0);
  const hasAnyPositiveValue = values.some((value) => value > 0);

  if (hasNegativeValue) {
    return {
      success: false,
      error: "Food values cannot be negative.",
    };
  }

  if (!hasAnyPositiveValue) {
    return {
      success: false,
      error: "Enter at least one food value greater than zero.",
    };
  }

  try {
    const { error } = await supabase
      .from("food_log_entries")
      .insert(
        {
          user_id: userId,
          entry_date: getDateKey(date),
          protein_grams: entry.protein,
          fat_grams: entry.fat,
          carbs_grams: entry.carbs,
        }
      );

    if (error) {
      return {
        success: false,
        error: error.message,
        shouldFallback: true,
      };
    }

    const updatedMetrics = await getDailyNutritionMetrics(userId, date);

    return {
      success: true,
      data: updatedMetrics ?? {
        protein: 0,
        proteinGoal: 0,
        fat: 0,
        fatGoal: 0,
        carbs: 0,
        carbsGoal: 0,
        calorieGoal: 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not save food entry.", error),
      shouldFallback: true,
    };
  }
}

export async function upsertWeightEntry(
  userId: string,
  date: Date | string,
  weightKg: number
): Promise<DashboardWriteResult<WeightEntry>> {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return {
      success: false,
      error: "Weight must be greater than zero.",
    };
  }

  try {
    const { data, error } = await supabase
      .from("body_weight_entries")
      .upsert(
        {
          user_id: userId,
          entry_date: getDateKey(date),
          weight_kg: weightKg,
        },
        {
          onConflict: "user_id,entry_date",
        }
      )
      .select("id, user_id, entry_date, weight_kg, created_at, updated_at")
      .single<BodyWeightEntryRow>();

    if (error) {
      return {
        success: false,
        error: error.message,
        shouldFallback: true,
      };
    }

    return {
      success: true,
      data: mapBodyWeightEntryRow(data),
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not save weight entry.", error),
      shouldFallback: true,
    };
  }
}