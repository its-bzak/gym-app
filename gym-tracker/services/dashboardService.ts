import { supabase } from "@/lib/supabase";
import type {
  DailyExerciseMetrics,
  FoodLogDaySummary,
  FoodLogEntry,
  FoodLogMealSlot,
  NutritionGoal,
  WeightEntry,
  WeightGoal,
} from "@/types/dashboard";
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
  logged_at: string;
  meal_slot: string | null;
  name: string | null;
  energy_kcal: number | null;
  protein_grams: number;
  fat_grams: number;
  carbs_grams: number;
  alcohol_grams: number;
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

export type NutritionGoalInput = {
  proteinGoal: number;
  fatGoal: number;
  carbsGoal: number;
  calorieGoal: number;
};

export type WeightGoalInput = {
  startWeightKg: number;
  targetWeightKg: number;
};

export type FoodLogInput = {
  name?: string;
  loggedAt?: string;
  mealSlot?: FoodLogMealSlot;
  energyKcal?: number | null;
  protein: number;
  fat: number;
  carbs: number;
  alcoholGrams?: number;
};

export type FoodLogDaySnapshot = {
  date: string;
  summary: FoodLogDaySummary;
  entries: FoodLogEntry[];
  nutritionGoal: NutritionGoal | null;
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

function mapNutritionGoalToGoal(row: NutritionGoalRow): NutritionGoal {
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

function normalizeMealSlot(value?: string | null): FoodLogMealSlot {
  if (value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack") {
    return value;
  }

  return "custom";
}

function calculateEntryCalories(entry: {
  protein_grams: number;
  fat_grams: number;
  carbs_grams: number;
  alcohol_grams?: number;
  energy_kcal?: number | null;
}): number {
  if (entry.energy_kcal !== null && entry.energy_kcal !== undefined) {
    return Number(entry.energy_kcal);
  }

  const proteinCalories = entry.protein_grams * 4;
  const fatCalories = entry.fat_grams * 9;
  const carbCalories = entry.carbs_grams * 4;
  const alcoholCalories = (entry.alcohol_grams ?? 0) * 7;

  return proteinCalories + fatCalories + carbCalories + alcoholCalories;
}

function mapFoodLogEntryRow(row: FoodLogEntryRow): FoodLogEntry {
  return {
    id: row.id,
    entryDate: row.entry_date,
    loggedAt: row.logged_at,
    mealSlot: normalizeMealSlot(row.meal_slot),
    name: row.name?.trim() || "Quick entry",
    energyKcal: calculateEntryCalories(row),
    protein: row.protein_grams,
    fat: row.fat_grams,
    carbs: row.carbs_grams,
    alcoholGrams: row.alcohol_grams ?? 0,
  };
}

function mapWeightGoalRow(row: WeightGoalRow): WeightGoal {
  return {
    startWeightKg: Number(row.start_weight_kg),
    targetWeightKg: Number(row.target_weight_kg),
  };
}

function buildFoodLogDaySummary(
  entries: FoodLogEntry[],
  nutritionGoal: NutritionGoal | null
): FoodLogDaySummary {
  const consumed = entries.reduce(
    (aggregate, entry) => {
      aggregate.protein += entry.protein;
      aggregate.fat += entry.fat;
      aggregate.carbs += entry.carbs;
      aggregate.consumedCalories += entry.energyKcal;

      return aggregate;
    },
    {
      protein: 0,
      fat: 0,
      carbs: 0,
      consumedCalories: 0,
    }
  );

  return {
    protein: consumed.protein,
    fat: consumed.fat,
    carbs: consumed.carbs,
    proteinGoal: nutritionGoal?.proteinGoal ?? 0,
    fatGoal: nutritionGoal?.fatGoal ?? 0,
    carbsGoal: nutritionGoal?.carbsGoal ?? 0,
    calorieGoal: nutritionGoal?.calorieGoal ?? 0,
    consumedCalories: consumed.consumedCalories,
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
  const daySnapshot = await getFoodLogDay(userId, date);

  return daySnapshot.summary;
}

export async function getActiveNutritionGoal(userId: string): Promise<NutritionGoal | null> {
  const { data, error } = await supabase
    .from("nutrition_goals")
    .select(
      "id, user_id, protein_goal_grams, fat_goal_grams, carbs_goal_grams, calorie_goal, starts_on, ended_on, is_active, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle<NutritionGoalRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapNutritionGoalToGoal(data) : null;
}

export async function getFoodLogEntriesForDate(
  userId: string,
  date: Date | string
): Promise<FoodLogEntry[]> {
  const { data, error } = await supabase
    .from("food_log_entries")
    .select(
      "id, user_id, entry_date, logged_at, meal_slot, name, energy_kcal, protein_grams, fat_grams, carbs_grams, alcohol_grams, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("entry_date", getDateKey(date))
    .order("logged_at", { ascending: true })
    .returns<FoodLogEntryRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapFoodLogEntryRow);
}

export async function getFoodLogDay(
  userId: string,
  date: Date | string
): Promise<FoodLogDaySnapshot> {
  const [nutritionGoal, entries] = await Promise.all([
    getActiveNutritionGoal(userId),
    getFoodLogEntriesForDate(userId, date),
  ]);

  return {
    date: getDateKey(date),
    summary: buildFoodLogDaySummary(entries, nutritionGoal),
    entries,
    nutritionGoal,
  };
}

export async function getFoodLogDays(
  userId: string,
  dates: Array<Date | string>
): Promise<FoodLogDaySnapshot[]> {
  const dateKeys = Array.from(new Set(dates.map((date) => getDateKey(date))));

  if (dateKeys.length === 0) {
    return [];
  }

  const [nutritionGoal, entriesResult] = await Promise.all([
    getActiveNutritionGoal(userId),
    supabase
      .from("food_log_entries")
      .select(
        "id, user_id, entry_date, logged_at, meal_slot, name, energy_kcal, protein_grams, fat_grams, carbs_grams, alcohol_grams, created_at, updated_at"
      )
      .eq("user_id", userId)
      .in("entry_date", dateKeys)
      .order("logged_at", { ascending: true })
      .returns<FoodLogEntryRow[]>(),
  ]);

  if (entriesResult.error) {
    throw new Error(entriesResult.error.message);
  }

  const entriesByDate = new Map<string, FoodLogEntry[]>();

  dateKeys.forEach((dateKey) => {
    entriesByDate.set(dateKey, []);
  });

  entriesResult.data.map(mapFoodLogEntryRow).forEach((entry) => {
    const existingEntries = entriesByDate.get(entry.entryDate) ?? [];
    existingEntries.push(entry);
    entriesByDate.set(entry.entryDate, existingEntries);
  });

  return dateKeys.map((dateKey) => {
    const entries = entriesByDate.get(dateKey) ?? [];

    return {
      date: dateKey,
      summary: buildFoodLogDaySummary(entries, nutritionGoal),
      entries,
      nutritionGoal,
    };
  });
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
          logged_at: entry.loggedAt ?? new Date().toISOString(),
          meal_slot: entry.mealSlot ?? "custom",
          name: entry.name?.trim() || null,
          energy_kcal: entry.energyKcal ?? null,
          protein_grams: entry.protein,
          fat_grams: entry.fat,
          carbs_grams: entry.carbs,
          alcohol_grams: entry.alcoholGrams ?? 0,
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

export async function upsertActiveNutritionGoal(
  userId: string,
  goal: NutritionGoalInput
): Promise<DashboardWriteResult<NutritionGoal>> {
  const values = [goal.proteinGoal, goal.fatGoal, goal.carbsGoal, goal.calorieGoal];

  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    return {
      success: false,
      error: "Nutrition goals must be non-negative numbers.",
    };
  }

  try {
    const { data: existingGoal, error: existingGoalError } = await supabase
      .from("nutrition_goals")
      .select("id, starts_on")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle<{ id: string; starts_on: string }>();

    if (existingGoalError) {
      return {
        success: false,
        error: existingGoalError.message,
        shouldFallback: true,
      };
    }

    const payload = {
      user_id: userId,
      protein_goal_grams: goal.proteinGoal,
      fat_goal_grams: goal.fatGoal,
      carbs_goal_grams: goal.carbsGoal,
      calorie_goal: goal.calorieGoal,
      starts_on: existingGoal?.starts_on ?? getDateKey(new Date()),
      ended_on: null,
      is_active: true,
    };

    const query = existingGoal
      ? supabase
          .from("nutrition_goals")
          .update(payload)
          .eq("id", existingGoal.id)
      : supabase.from("nutrition_goals").insert(payload);

    const { error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
        shouldFallback: true,
      };
    }

    const updatedGoal = await getActiveNutritionGoal(userId);

    return {
      success: true,
      data: updatedGoal ?? goal,
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not save nutrition goals.", error),
      shouldFallback: true,
    };
  }
}

export async function upsertActiveWeightGoal(
  userId: string,
  goal: WeightGoalInput
): Promise<DashboardWriteResult<WeightGoal>> {
  const values = [goal.startWeightKg, goal.targetWeightKg];

  if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
    return {
      success: false,
      error: "Weight goal values must be greater than zero.",
    };
  }

  try {
    const { data: existingGoal, error: existingGoalError } = await supabase
      .from("weight_goals")
      .select("id, started_at")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle<{ id: string; started_at: string }>();

    if (existingGoalError) {
      return {
        success: false,
        error: existingGoalError.message,
        shouldFallback: true,
      };
    }

    const payload = {
      user_id: userId,
      start_weight_kg: goal.startWeightKg,
      target_weight_kg: goal.targetWeightKg,
      started_at: existingGoal?.started_at ?? new Date().toISOString(),
      completed_at: null,
      is_active: true,
    };

    const query = existingGoal
      ? supabase
          .from("weight_goals")
          .update(payload)
          .eq("id", existingGoal.id)
      : supabase.from("weight_goals").insert(payload);

    const { error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
        shouldFallback: true,
      };
    }

    const updatedGoal = await getActiveWeightGoal(userId);

    return {
      success: true,
      data: updatedGoal ?? goal,
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not save weight goal.", error),
      shouldFallback: true,
    };
  }
}