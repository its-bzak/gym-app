import { supabase } from "@/lib/supabase";
import type {
  DailyExerciseMetrics,
  FoodLogDaySummary,
  FoodLogEntry,
  FoodLogMealSlot,
  GoalPlan,
  GoalType,
  LifetimeTrainingMetrics,
  NutritionGoal,
  NutritionProgramRecommendation,
  ProgramMode,
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

type BodyGoalRow = {
  id: string;
  user_id: string;
  goal_type: GoalType;
  status: WeightGoal["status"];
  start_weight_kg: number;
  target_weight_kg: number;
  target_rate_kg_per_week: number;
  started_on: string;
  completed_on: string | null;
  paused_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type NutritionProgramRow = {
  id: string;
  user_id: string;
  goal_id: string;
  program_mode: ProgramMode;
  is_active: boolean;
  calorie_target: number;
  protein_target_grams: number;
  fat_target_grams: number;
  carb_target_grams: number;
  maintenance_calorie_estimate: number | null;
  planned_daily_energy_delta: number | null;
  generated_summary: string | null;
  created_at: string;
  updated_at: string;
};

type NutritionProgramPreferencesRow = {
  id: string;
  program_id: string;
  protein_preference: NutritionGoal["proteinPreference"];
  carb_preference: NutritionGoal["carbPreference"];
  fat_preference: NutritionGoal["fatPreference"];
  meals_per_day: number | null;
  training_days_per_week: number | null;
  diet_notes: string | null;
  created_at: string;
  updated_at: string;
};

type AdaptiveProgramSettingsRow = {
  id: string;
  program_id: string;
  is_enabled: boolean;
  check_in_window_days: number;
  minimum_weight_entries: number;
  target_tolerance_percent: number;
  max_daily_calorie_adjustment: number;
  min_days_between_recommendations: number;
  last_evaluated_at: string | null;
  next_evaluation_on: string | null;
  created_at: string;
  updated_at: string;
};

type NutritionProgramRecommendationRow = {
  id: string;
  user_id: string;
  goal_id: string;
  program_id: string;
  status: NutritionProgramRecommendation["status"];
  reason_code: NutritionProgramRecommendation["reasonCode"];
  reason_summary: string;
  previous_calorie_target: number;
  recommended_calorie_target: number;
  previous_protein_target_grams: number;
  recommended_protein_target_grams: number;
  previous_fat_target_grams: number;
  recommended_fat_target_grams: number;
  previous_carb_target_grams: number;
  recommended_carb_target_grams: number;
  reviewed_at: string | null;
  created_at: string;
};

export type WorkoutDashboardSnapshot = {
  macroMetrics: MacroBarProps | null;
  exerciseMetrics: Omit<DailyExerciseMetrics, "date"> | null;
  weightEntries: WeightEntry[];
  weightGoal: WeightGoal | null;
};

export type NutritionGoalInput = {
  programMode: ProgramMode;
  proteinGoal: number;
  fatGoal: number;
  carbsGoal: number;
  calorieGoal: number;
  maintenanceCalories?: number | null;
  plannedDailyEnergyDelta?: number | null;
  proteinPreference: NutritionGoal["proteinPreference"];
  carbPreference: NutritionGoal["carbPreference"];
  fatPreference: NutritionGoal["fatPreference"];
  adaptiveEnabled: boolean;
};

export type WeightGoalInput = {
  goalType: GoalType;
  startWeightKg: number;
  targetWeightKg: number;
  targetRateKgPerWeek: number;
};

export type GoalPlanInput = {
  weightGoal: WeightGoalInput;
  nutritionGoal: NutritionGoalInput;
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

function mapWeightGoalRow(row: BodyGoalRow): WeightGoal {
  return {
    id: row.id,
    goalType: row.goal_type,
    status: row.status,
    startWeightKg: Number(row.start_weight_kg),
    targetWeightKg: Number(row.target_weight_kg),
    targetRateKgPerWeek: Math.abs(Number(row.target_rate_kg_per_week ?? 0)),
    startedOn: row.started_on,
  };
}

function mapNutritionProgramToGoal(
  programRow: NutritionProgramRow,
  preferencesRow: NutritionProgramPreferencesRow | null,
  adaptiveSettingsRow: AdaptiveProgramSettingsRow | null
): NutritionGoal {
  return {
    programMode: programRow.program_mode,
    proteinGoal: programRow.protein_target_grams,
    fatGoal: programRow.fat_target_grams,
    carbsGoal: programRow.carb_target_grams,
    calorieGoal: programRow.calorie_target,
    maintenanceCalories: programRow.maintenance_calorie_estimate,
    plannedDailyEnergyDelta: programRow.planned_daily_energy_delta,
    proteinPreference: preferencesRow?.protein_preference ?? "standard",
    carbPreference: preferencesRow?.carb_preference ?? "balanced",
    fatPreference: preferencesRow?.fat_preference ?? "balanced",
    adaptiveEnabled: adaptiveSettingsRow?.is_enabled ?? false,
  };
}

function mapNutritionGoalToMacroTargets(goal: NutritionGoal | null): Pick<
  MacroBarProps,
  "proteinGoal" | "fatGoal" | "carbsGoal" | "calorieGoal"
> {
  return {
    proteinGoal: goal?.proteinGoal ?? 0,
    fatGoal: goal?.fatGoal ?? 0,
    carbsGoal: goal?.carbsGoal ?? 0,
    calorieGoal: goal?.calorieGoal ?? 0,
  };
}

function mapRecommendationRow(
  row: NutritionProgramRecommendationRow
): NutritionProgramRecommendation {
  return {
    id: row.id,
    status: row.status,
    reasonCode: row.reason_code,
    reasonSummary: row.reason_summary,
    previousCalorieGoal: row.previous_calorie_target,
    recommendedCalorieGoal: row.recommended_calorie_target,
    previousProteinGoal: row.previous_protein_target_grams,
    recommendedProteinGoal: row.recommended_protein_target_grams,
    previousFatGoal: row.previous_fat_target_grams,
    recommendedFatGoal: row.recommended_fat_target_grams,
    previousCarbsGoal: row.previous_carb_target_grams,
    recommendedCarbsGoal: row.recommended_carb_target_grams,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

function normalizeSignedRateKgPerWeek(goalType: GoalType, targetRateKgPerWeek: number): number {
  if (goalType === "maintain") {
    return 0;
  }

  const normalizedRate = Math.abs(targetRateKgPerWeek);

  return goalType === "lose" ? -normalizedRate : normalizedRate;
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

async function getActiveBodyGoalRow(userId: string): Promise<BodyGoalRow | null> {
  const { data, error } = await supabase
    .from("body_goals")
    .select(
      "id, user_id, goal_type, status, start_weight_kg, target_weight_kg, target_rate_kg_per_week, started_on, completed_on, paused_on, notes, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle<BodyGoalRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getActiveNutritionProgramRow(userId: string): Promise<NutritionProgramRow | null> {
  const { data, error } = await supabase
    .from("nutrition_programs")
    .select(
      "id, user_id, goal_id, program_mode, is_active, calorie_target, protein_target_grams, fat_target_grams, carb_target_grams, maintenance_calorie_estimate, planned_daily_energy_delta, generated_summary, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle<NutritionProgramRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getNutritionProgramPreferences(
  programId: string
): Promise<NutritionProgramPreferencesRow | null> {
  const { data, error } = await supabase
    .from("nutrition_program_preferences")
    .select(
      "id, program_id, protein_preference, carb_preference, fat_preference, meals_per_day, training_days_per_week, diet_notes, created_at, updated_at"
    )
    .eq("program_id", programId)
    .maybeSingle<NutritionProgramPreferencesRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getAdaptiveProgramSettings(
  programId: string
): Promise<AdaptiveProgramSettingsRow | null> {
  const { data, error } = await supabase
    .from("adaptive_program_settings")
    .select(
      "id, program_id, is_enabled, check_in_window_days, minimum_weight_entries, target_tolerance_percent, max_daily_calorie_adjustment, min_days_between_recommendations, last_evaluated_at, next_evaluation_on, created_at, updated_at"
    )
    .eq("program_id", programId)
    .maybeSingle<AdaptiveProgramSettingsRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getLatestNutritionProgramRecommendation(
  userId: string,
  programId: string
): Promise<NutritionProgramRecommendation | null> {
  const { data, error } = await supabase
    .from("nutrition_program_recommendations")
    .select(
      "id, user_id, goal_id, program_id, status, reason_code, reason_summary, previous_calorie_target, recommended_calorie_target, previous_protein_target_grams, recommended_protein_target_grams, previous_fat_target_grams, recommended_fat_target_grams, previous_carb_target_grams, recommended_carb_target_grams, reviewed_at, created_at"
    )
    .eq("user_id", userId)
    .eq("program_id", programId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<NutritionProgramRecommendationRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRecommendationRow(data) : null;
}

export async function getActiveGoalPlan(userId: string): Promise<GoalPlan | null> {
  const [bodyGoalRow, nutritionProgramRow] = await Promise.all([
    getActiveBodyGoalRow(userId),
    getActiveNutritionProgramRow(userId),
  ]);

  if (!bodyGoalRow || !nutritionProgramRow) {
    return null;
  }

  const [preferencesRow, adaptiveSettingsRow, latestRecommendation] = await Promise.all([
    getNutritionProgramPreferences(nutritionProgramRow.id),
    getAdaptiveProgramSettings(nutritionProgramRow.id),
    getLatestNutritionProgramRecommendation(userId, nutritionProgramRow.id),
  ]);

  return {
    bodyGoal: mapWeightGoalRow(bodyGoalRow),
    nutritionGoal: mapNutritionProgramToGoal(
      nutritionProgramRow,
      preferencesRow,
      adaptiveSettingsRow
    ),
    latestRecommendation,
  };
}

export async function getActiveNutritionGoal(userId: string): Promise<NutritionGoal | null> {
  const goalPlan = await getActiveGoalPlan(userId);

  return goalPlan?.nutritionGoal ?? null;
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

export async function getLifetimeTrainingMetrics(userId: string): Promise<LifetimeTrainingMetrics> {
  const { data, error } = await supabase
    .from("daily_exercise_metrics")
    .select("volume_kg, duration_mins")
    .eq("user_id", userId)
    .returns<Array<Pick<DailyExerciseMetricsRow, "volume_kg" | "duration_mins">>>();

  if (error) {
    throw new Error(error.message);
  }

  return data.reduce<LifetimeTrainingMetrics>(
    (totals, row) => {
      totals.totalVolume += Number(row.volume_kg ?? 0);
      totals.totalDurationMins += Number(row.duration_mins ?? 0);
      totals.totalWorkouts += Number(row.volume_kg ?? 0) > 0 || Number(row.duration_mins ?? 0) > 0 ? 1 : 0;

      return totals;
    },
    {
      totalSets: null,
      totalVolume: 0,
      totalDurationMins: 0,
      totalWorkouts: 0,
      totalReps: null,
    }
  );
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
  const goalPlan = await getActiveGoalPlan(userId);

  return goalPlan?.bodyGoal ?? null;
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
  const values = [
    entry.energyKcal ?? 0,
    entry.protein,
    entry.fat,
    entry.carbs,
    entry.alcoholGrams ?? 0,
  ];
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

export async function updateFoodLogEntry(
  userId: string,
  entryId: string,
  date: Date | string,
  entry: FoodLogInput
): Promise<DashboardWriteResult<FoodLogDaySnapshot>> {
  const values = [entry.energyKcal ?? 0, entry.protein, entry.fat, entry.carbs, entry.alcoholGrams ?? 0];
  const hasNegativeValue = values.some((value) => !Number.isFinite(value) || value < 0);
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
      .update({
        entry_date: getDateKey(date),
        logged_at: entry.loggedAt ?? new Date().toISOString(),
        meal_slot: entry.mealSlot ?? "custom",
        name: entry.name?.trim() || null,
        energy_kcal: entry.energyKcal ?? null,
        protein_grams: entry.protein,
        fat_grams: entry.fat,
        carbs_grams: entry.carbs,
        alcohol_grams: entry.alcoholGrams ?? 0,
      })
      .eq("id", entryId)
      .eq("user_id", userId);

    if (error) {
      return {
        success: false,
        error: error.message,
        shouldFallback: true,
      };
    }

    return {
      success: true,
      data: await getFoodLogDay(userId, date),
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not update food entry.", error),
      shouldFallback: true,
    };
  }
}

export async function deleteFoodLogEntry(
  userId: string,
  entryId: string,
  date: Date | string
): Promise<DashboardWriteResult<FoodLogDaySnapshot>> {
  try {
    const { error } = await supabase
      .from("food_log_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", userId);

    if (error) {
      return {
        success: false,
        error: error.message,
        shouldFallback: true,
      };
    }

    return {
      success: true,
      data: await getFoodLogDay(userId, date),
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not delete food entry.", error),
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
  try {
    const existingPlan = await getActiveGoalPlan(userId);
    const latestWeightEntry = existingPlan ? null : (await getWeightEntries(userId)).at(-1) ?? null;

    const weightGoal = existingPlan
      ? {
          goalType: existingPlan.bodyGoal.goalType,
          startWeightKg: existingPlan.bodyGoal.startWeightKg,
          targetWeightKg: existingPlan.bodyGoal.targetWeightKg,
          targetRateKgPerWeek: existingPlan.bodyGoal.targetRateKgPerWeek,
        }
      : {
          goalType: "maintain" as const,
          startWeightKg: latestWeightEntry?.weightKg ?? 74,
          targetWeightKg: latestWeightEntry?.weightKg ?? 74,
          targetRateKgPerWeek: 0,
        };

    const result = await upsertActiveGoalPlan(userId, {
      weightGoal,
      nutritionGoal: goal,
    });

    return {
      success: result.success,
      error: result.error,
      shouldFallback: result.shouldFallback,
      data: result.data?.nutritionGoal,
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
  try {
    const existingPlan = await getActiveGoalPlan(userId);

    if (!existingPlan) {
      return {
        success: false,
        error: "Create a nutrition program before saving a bodyweight goal.",
        shouldFallback: true,
      };
    }

    const result = await upsertActiveGoalPlan(userId, {
      weightGoal: goal,
      nutritionGoal: {
        programMode: existingPlan.nutritionGoal.programMode,
        proteinGoal: existingPlan.nutritionGoal.proteinGoal,
        fatGoal: existingPlan.nutritionGoal.fatGoal,
        carbsGoal: existingPlan.nutritionGoal.carbsGoal,
        calorieGoal: existingPlan.nutritionGoal.calorieGoal,
        maintenanceCalories: existingPlan.nutritionGoal.maintenanceCalories,
        plannedDailyEnergyDelta: existingPlan.nutritionGoal.plannedDailyEnergyDelta,
        proteinPreference: existingPlan.nutritionGoal.proteinPreference,
        carbPreference: existingPlan.nutritionGoal.carbPreference,
        fatPreference: existingPlan.nutritionGoal.fatPreference,
        adaptiveEnabled: existingPlan.nutritionGoal.adaptiveEnabled,
      },
    });

    return {
      success: result.success,
      error: result.error,
      shouldFallback: result.shouldFallback,
      data: result.data?.bodyGoal,
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not save weight goal.", error),
      shouldFallback: true,
    };
  }
}

export async function upsertActiveGoalPlan(
  userId: string,
  goalPlan: GoalPlanInput
): Promise<DashboardWriteResult<GoalPlan>> {
  const goalValues = [
    goalPlan.weightGoal.startWeightKg,
    goalPlan.weightGoal.targetWeightKg,
    goalPlan.weightGoal.targetRateKgPerWeek,
  ];
  const nutritionValues = [
    goalPlan.nutritionGoal.calorieGoal,
    goalPlan.nutritionGoal.proteinGoal,
    goalPlan.nutritionGoal.fatGoal,
    goalPlan.nutritionGoal.carbsGoal,
  ];

  if (goalValues.some((value) => !Number.isFinite(value) || value < 0)) {
    return {
      success: false,
      error: "Bodyweight goal values must be valid non-negative numbers.",
    };
  }

  if (
    goalPlan.weightGoal.startWeightKg <= 0 ||
    goalPlan.weightGoal.targetWeightKg <= 0 ||
    nutritionValues.some((value) => !Number.isFinite(value) || value < 0) ||
    goalPlan.nutritionGoal.calorieGoal <= 0
  ) {
    return {
      success: false,
      error: "Enter valid target values before saving the goal plan.",
    };
  }

  try {
    const existingBodyGoal = await getActiveBodyGoalRow(userId);
    const existingNutritionProgram = await getActiveNutritionProgramRow(userId);

    let bodyGoalId = existingBodyGoal?.id;

    const goalPayload = {
      user_id: userId,
      goal_type: goalPlan.weightGoal.goalType,
      status: "active" as const,
      start_weight_kg: goalPlan.weightGoal.startWeightKg,
      target_weight_kg: goalPlan.weightGoal.targetWeightKg,
      target_rate_unit: "kg_per_week",
      target_rate_value:
        goalPlan.weightGoal.goalType === "maintain"
          ? 0
          : Math.abs(goalPlan.weightGoal.targetRateKgPerWeek),
      target_rate_kg_per_week: normalizeSignedRateKgPerWeek(
        goalPlan.weightGoal.goalType,
        goalPlan.weightGoal.targetRateKgPerWeek
      ),
      started_on: existingBodyGoal?.started_on ?? getDateKey(new Date()),
      completed_on: null,
      paused_on: null,
      notes: null,
    };

    if (existingBodyGoal) {
      const { data, error } = await supabase
        .from("body_goals")
        .update(goalPayload)
        .eq("id", existingBodyGoal.id)
        .select(
          "id, user_id, goal_type, status, start_weight_kg, target_weight_kg, target_rate_kg_per_week, started_on, completed_on, paused_on, notes, created_at, updated_at"
        )
        .single<BodyGoalRow>();

      if (error) {
        return {
          success: false,
          error: error.message,
          shouldFallback: true,
        };
      }

      bodyGoalId = data.id;
    } else {
      const { data, error } = await supabase
        .from("body_goals")
        .insert(goalPayload)
        .select(
          "id, user_id, goal_type, status, start_weight_kg, target_weight_kg, target_rate_kg_per_week, started_on, completed_on, paused_on, notes, created_at, updated_at"
        )
        .single<BodyGoalRow>();

      if (error) {
        return {
          success: false,
          error: error.message,
          shouldFallback: true,
        };
      }

      bodyGoalId = data.id;
    }

    const nutritionPayload = {
      user_id: userId,
      goal_id: bodyGoalId,
      program_mode: goalPlan.nutritionGoal.programMode,
      is_active: true,
      calorie_target: goalPlan.nutritionGoal.calorieGoal,
      protein_target_grams: goalPlan.nutritionGoal.proteinGoal,
      fat_target_grams: goalPlan.nutritionGoal.fatGoal,
      carb_target_grams: goalPlan.nutritionGoal.carbsGoal,
      maintenance_calorie_estimate: goalPlan.nutritionGoal.maintenanceCalories ?? null,
      planned_daily_energy_delta: goalPlan.nutritionGoal.plannedDailyEnergyDelta ?? null,
      generated_summary: null,
    };

    let nutritionProgramId = existingNutritionProgram?.id;

    if (existingNutritionProgram) {
      const { data, error } = await supabase
        .from("nutrition_programs")
        .update(nutritionPayload)
        .eq("id", existingNutritionProgram.id)
        .select(
          "id, user_id, goal_id, program_mode, is_active, calorie_target, protein_target_grams, fat_target_grams, carb_target_grams, maintenance_calorie_estimate, planned_daily_energy_delta, generated_summary, created_at, updated_at"
        )
        .single<NutritionProgramRow>();

      if (error) {
        return {
          success: false,
          error: error.message,
          shouldFallback: true,
        };
      }

      nutritionProgramId = data.id;
    } else {
      const { data, error } = await supabase
        .from("nutrition_programs")
        .insert(nutritionPayload)
        .select(
          "id, user_id, goal_id, program_mode, is_active, calorie_target, protein_target_grams, fat_target_grams, carb_target_grams, maintenance_calorie_estimate, planned_daily_energy_delta, generated_summary, created_at, updated_at"
        )
        .single<NutritionProgramRow>();

      if (error) {
        return {
          success: false,
          error: error.message,
          shouldFallback: true,
        };
      }

      nutritionProgramId = data.id;
    }

    const preferencesPayload = {
      program_id: nutritionProgramId,
      protein_preference: goalPlan.nutritionGoal.proteinPreference,
      carb_preference: goalPlan.nutritionGoal.carbPreference,
      fat_preference: goalPlan.nutritionGoal.fatPreference,
    };

    const { error: preferencesError } = await supabase
      .from("nutrition_program_preferences")
      .upsert(preferencesPayload, { onConflict: "program_id" });

    if (preferencesError) {
      return {
        success: false,
        error: preferencesError.message,
        shouldFallback: true,
      };
    }

    const adaptiveSettingsPayload = {
      program_id: nutritionProgramId,
      is_enabled: goalPlan.nutritionGoal.adaptiveEnabled,
    };

    const { error: adaptiveSettingsError } = await supabase
      .from("adaptive_program_settings")
      .upsert(adaptiveSettingsPayload, { onConflict: "program_id" });

    if (adaptiveSettingsError) {
      return {
        success: false,
        error: adaptiveSettingsError.message,
        shouldFallback: true,
      };
    }

    const updatedPlan = await getActiveGoalPlan(userId);

    return {
      success: true,
      data: updatedPlan ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not save goal plan.", error),
      shouldFallback: true,
    };
  }
}