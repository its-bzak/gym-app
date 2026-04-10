import {
  calculateSavedFoodNutrition,
  calculateSavedRecipeNutrition,
  createSavedFood,
  createSavedRecipe,
  deleteSavedFood,
  deleteSavedRecipe,
  deleteLocalFoodLogEntry,
  getLocalActiveGoalPlan,
  getLocalActiveNutritionGoal,
  getLocalDailyExerciseMetrics,
  getLocalDailyNutritionMetrics,
  getLocalFoodLogDay,
  getLocalFoodLogDays,
  getLocalLifetimeTrainingMetrics,
  getLocalWeightEntries,
  getSavedFoodById,
  getSavedFoods,
  getSavedRecipeById,
  getSavedRecipes,
  insertLocalFoodLogEntry,
  updateSavedFood,
  updateSavedRecipe,
  upsertLocalGoalPlan,
  upsertLocalWeightEntry,
  updateLocalFoodLogEntry,
} from "@/db/nutrition";
import type {
  DailyExerciseMetrics,
  FoodLogDaySummary,
  FoodLogEntry,
  FoodLogMealSlot,
  FoodLogSourceType,
  GoalPlan,
  GoalType,
  LifetimeTrainingMetrics,
  NutritionGoal,
  ProgramMode,
  SavedFood,
  SavedRecipe,
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
  sourceType?: FoodLogSourceType;
  sourceId?: string | null;
  massGrams?: number | null;
};

export type SavedFoodInput = {
  name: string;
  referenceMassGrams: number;
  energyKcal: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type SavedRecipeInput = {
  name: string;
  ingredients: Array<{ savedFoodId: string; massGrams: number }>;
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

function buildUnexpectedErrorMessage(prefix: string, error: unknown) {
  if (error instanceof Error && error.message) {
    return `${prefix} ${error.message}`;
  }

  return prefix;
}

function validateFoodLogInput(entry: FoodLogInput) {
  const values = [entry.energyKcal ?? 0, entry.protein, entry.fat, entry.carbs, entry.alcoholGrams ?? 0];
  const hasNegativeValue = values.some((value) => !Number.isFinite(value) || value < 0);
  const hasAnyPositiveValue = values.some((value) => value > 0);

  if (hasNegativeValue) {
    return "Food values cannot be negative.";
  }

  if (!hasAnyPositiveValue) {
    return "Enter at least one food value greater than zero.";
  }

  return null;
}

function validateGoalPlan(goalPlan: GoalPlanInput) {
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
    return "Bodyweight goal values must be valid non-negative numbers.";
  }

  if (
    goalPlan.weightGoal.startWeightKg <= 0 ||
    goalPlan.weightGoal.targetWeightKg <= 0 ||
    nutritionValues.some((value) => !Number.isFinite(value) || value < 0) ||
    goalPlan.nutritionGoal.calorieGoal <= 0
  ) {
    return "Enter valid target values before saving the goal plan.";
  }

  return null;
}

export async function getDailyNutritionMetrics(
  userId: string,
  date: Date | string
): Promise<MacroBarProps | null> {
  return getLocalDailyNutritionMetrics(userId, date);
}

export async function getActiveGoalPlan(userId: string): Promise<GoalPlan | null> {
  return getLocalActiveGoalPlan(userId);
}

export async function getActiveNutritionGoal(userId: string): Promise<NutritionGoal | null> {
  return getLocalActiveNutritionGoal(userId);
}

export async function getFoodLogEntriesForDate(
  userId: string,
  date: Date | string
): Promise<FoodLogEntry[]> {
  return getLocalFoodLogDay(userId, date).entries;
}

export async function getFoodLogDay(
  userId: string,
  date: Date | string
): Promise<FoodLogDaySnapshot> {
  return getLocalFoodLogDay(userId, date);
}

export async function getFoodLogDays(
  userId: string,
  dates: Array<Date | string>
): Promise<FoodLogDaySnapshot[]> {
  return getLocalFoodLogDays(userId, dates);
}

export async function getSavedFoodLibrary(userId: string, searchTerm?: string): Promise<SavedFood[]> {
  return getSavedFoods(userId, searchTerm);
}

export async function getSavedRecipeLibrary(userId: string, searchTerm?: string): Promise<SavedRecipe[]> {
  return getSavedRecipes(userId, searchTerm);
}

export async function getSavedFood(userId: string, savedFoodId: string): Promise<SavedFood | null> {
  return getSavedFoodById(userId, savedFoodId);
}

export async function getSavedRecipe(userId: string, recipeId: string): Promise<SavedRecipe | null> {
  return getSavedRecipeById(userId, recipeId);
}

export async function createSavedFoodDefinition(
  userId: string,
  input: SavedFoodInput
): Promise<DashboardWriteResult<SavedFood>> {
  const trimmedName = input.name.trim();
  const values = [input.referenceMassGrams, input.energyKcal, input.protein, input.fat, input.carbs];

  if (!trimmedName) {
    return {
      success: false,
      error: "Food name is required.",
    };
  }

  if (values.some((value) => !Number.isFinite(value) || value < 0) || input.referenceMassGrams <= 0) {
    return {
      success: false,
      error: "Enter valid non-negative nutrition values and a mass greater than zero.",
    };
  }

  try {
    return {
      success: true,
      data: createSavedFood(userId, {
        ...input,
        name: trimmedName,
      }),
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not save food.", error),
      shouldFallback: false,
    };
  }
}

export async function updateSavedFoodDefinition(
  userId: string,
  savedFoodId: string,
  input: SavedFoodInput
): Promise<DashboardWriteResult<SavedFood>> {
  const trimmedName = input.name.trim();
  const values = [input.referenceMassGrams, input.energyKcal, input.protein, input.fat, input.carbs];

  if (!trimmedName) {
    return {
      success: false,
      error: "Food name is required.",
    };
  }

  if (values.some((value) => !Number.isFinite(value) || value < 0) || input.referenceMassGrams <= 0) {
    return {
      success: false,
      error: "Enter valid non-negative nutrition values and a mass greater than zero.",
    };
  }

  try {
    const savedFood = updateSavedFood(userId, savedFoodId, {
      ...input,
      name: trimmedName,
    });

    return {
      success: Boolean(savedFood),
      data: savedFood ?? undefined,
      error: savedFood ? undefined : "Could not update food.",
      shouldFallback: false,
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not update food.", error),
      shouldFallback: false,
    };
  }
}

export async function deleteSavedFoodDefinition(
  userId: string,
  savedFoodId: string
): Promise<DashboardWriteResult<null>> {
  try {
    const deleted = deleteSavedFood(userId, savedFoodId);

    return {
      success: deleted,
      error: deleted ? undefined : "Could not delete food.",
      shouldFallback: false,
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not delete food.", error),
      shouldFallback: false,
    };
  }
}

export async function createSavedRecipeDefinition(
  userId: string,
  input: SavedRecipeInput
): Promise<DashboardWriteResult<SavedRecipe>> {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    return {
      success: false,
      error: "Recipe name is required.",
    };
  }

  if (input.ingredients.length === 0) {
    return {
      success: false,
      error: "Add at least one saved food to the recipe.",
    };
  }

  if (input.ingredients.some((ingredient) => !Number.isFinite(ingredient.massGrams) || ingredient.massGrams <= 0)) {
    return {
      success: false,
      error: "Each recipe ingredient needs a mass greater than zero.",
    };
  }

  try {
    const recipe = createSavedRecipe(userId, {
      name: trimmedName,
      ingredients: input.ingredients,
    });

    return {
      success: Boolean(recipe),
      data: recipe ?? undefined,
      error: recipe ? undefined : "Could not save recipe.",
      shouldFallback: false,
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not save recipe.", error),
      shouldFallback: false,
    };
  }
}

export async function updateSavedRecipeDefinition(
  userId: string,
  recipeId: string,
  input: SavedRecipeInput
): Promise<DashboardWriteResult<SavedRecipe>> {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    return {
      success: false,
      error: "Recipe name is required.",
    };
  }

  if (input.ingredients.length === 0) {
    return {
      success: false,
      error: "Add at least one saved food to the recipe.",
    };
  }

  if (input.ingredients.some((ingredient) => !Number.isFinite(ingredient.massGrams) || ingredient.massGrams <= 0)) {
    return {
      success: false,
      error: "Each recipe ingredient needs a mass greater than zero.",
    };
  }

  try {
    const recipe = updateSavedRecipe(userId, recipeId, {
      name: trimmedName,
      ingredients: input.ingredients,
    });

    return {
      success: Boolean(recipe),
      data: recipe ?? undefined,
      error: recipe ? undefined : "Could not update recipe.",
      shouldFallback: false,
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not update recipe.", error),
      shouldFallback: false,
    };
  }
}

export async function deleteSavedRecipeDefinition(
  userId: string,
  recipeId: string
): Promise<DashboardWriteResult<null>> {
  try {
    const deleted = deleteSavedRecipe(userId, recipeId);

    return {
      success: deleted,
      error: deleted ? undefined : "Could not delete recipe.",
      shouldFallback: false,
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not delete recipe.", error),
      shouldFallback: false,
    };
  }
}

export async function buildSavedFoodLogEntry(
  userId: string,
  sourceType: Extract<FoodLogSourceType, "saved_food" | "recipe">,
  sourceId: string,
  massGrams: number
): Promise<DashboardWriteResult<Required<Pick<FoodLogInput, "name" | "energyKcal" | "protein" | "fat" | "carbs" | "sourceType" | "sourceId" | "massGrams">>>> {
  if (!Number.isFinite(massGrams) || massGrams <= 0) {
    return {
      success: false,
      error: "Mass must be greater than zero.",
    };
  }

  try {
    if (sourceType === "saved_food") {
      const savedFood = getSavedFoodById(userId, sourceId);

      if (!savedFood) {
        return {
          success: false,
          error: "Could not find that saved food.",
        };
      }

      const derivedNutrition = calculateSavedFoodNutrition(savedFood, massGrams);

      return {
        success: true,
        data: {
          name: savedFood.name,
          energyKcal: derivedNutrition.energyKcal,
          protein: derivedNutrition.protein,
          fat: derivedNutrition.fat,
          carbs: derivedNutrition.carbs,
          sourceType,
          sourceId,
          massGrams,
        },
      };
    }

    const savedRecipe = getSavedRecipeById(userId, sourceId);

    if (!savedRecipe) {
      return {
        success: false,
        error: "Could not find that recipe.",
      };
    }

    const derivedNutrition = calculateSavedRecipeNutrition(savedRecipe, massGrams);

    return {
      success: true,
      data: {
        name: savedRecipe.name,
        energyKcal: derivedNutrition.energyKcal,
        protein: derivedNutrition.protein,
        fat: derivedNutrition.fat,
        carbs: derivedNutrition.carbs,
        sourceType,
        sourceId,
        massGrams,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not load saved nutrition item.", error),
      shouldFallback: false,
    };
  }
}

export async function getDailyExerciseMetrics(
  userId: string,
  date: Date | string
): Promise<Omit<DailyExerciseMetrics, "date"> | null> {
  return getLocalDailyExerciseMetrics(userId, date);
}

export async function getLifetimeTrainingMetrics(userId: string): Promise<LifetimeTrainingMetrics> {
  return getLocalLifetimeTrainingMetrics(userId);
}

export async function getWeightEntries(userId: string): Promise<WeightEntry[]> {
  return getLocalWeightEntries(userId);
}

export async function getActiveWeightGoal(userId: string): Promise<WeightGoal | null> {
  return getLocalActiveGoalPlan(userId)?.bodyGoal ?? null;
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
  const validationError = validateFoodLogInput(entry);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  try {
    const snapshot = insertLocalFoodLogEntry(userId, date, entry);

    return {
      success: true,
      data: snapshot.summary,
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not save food entry.", error),
      shouldFallback: false,
    };
  }
}

export async function updateFoodLogEntry(
  userId: string,
  entryId: string,
  date: Date | string,
  entry: FoodLogInput
): Promise<DashboardWriteResult<FoodLogDaySnapshot>> {
  const validationError = validateFoodLogInput(entry);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  try {
    return {
      success: true,
      data: updateLocalFoodLogEntry(userId, entryId, date, entry),
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not update food entry.", error),
      shouldFallback: false,
    };
  }
}

export async function deleteFoodLogEntry(
  userId: string,
  entryId: string,
  date: Date | string
): Promise<DashboardWriteResult<FoodLogDaySnapshot>> {
  try {
    return {
      success: true,
      data: deleteLocalFoodLogEntry(userId, entryId, date),
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not delete food entry.", error),
      shouldFallback: false,
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
    return {
      success: true,
      data: upsertLocalWeightEntry(userId, date, weightKg),
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not save weight entry.", error),
      shouldFallback: false,
    };
  }
}

export async function upsertActiveNutritionGoal(
  userId: string,
  goal: NutritionGoalInput
): Promise<DashboardWriteResult<NutritionGoal>> {
  try {
    const existingPlan = getLocalActiveGoalPlan(userId);
    const latestWeightEntry = existingPlan ? null : getLocalWeightEntries(userId).at(-1) ?? null;

    const result = upsertLocalGoalPlan(userId, {
      weightGoal: existingPlan
        ? {
            goalType: existingPlan.bodyGoal.goalType,
            startWeightKg: existingPlan.bodyGoal.startWeightKg,
            targetWeightKg: existingPlan.bodyGoal.targetWeightKg,
            targetRateKgPerWeek: existingPlan.bodyGoal.targetRateKgPerWeek,
          }
        : {
            goalType: "maintain",
            startWeightKg: latestWeightEntry?.weightKg ?? 74,
            targetWeightKg: latestWeightEntry?.weightKg ?? 74,
            targetRateKgPerWeek: 0,
          },
      nutritionGoal: goal,
    });

    return {
      success: true,
      data: result?.nutritionGoal,
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not save nutrition goals.", error),
      shouldFallback: false,
    };
  }
}

export async function upsertActiveWeightGoal(
  userId: string,
  goal: WeightGoalInput
): Promise<DashboardWriteResult<WeightGoal>> {
  const existingPlan = getLocalActiveGoalPlan(userId);

  if (!existingPlan) {
    return {
      success: false,
      error: "Create a nutrition program before saving a bodyweight goal.",
      shouldFallback: false,
    };
  }

  try {
    const result = upsertLocalGoalPlan(userId, {
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
      success: true,
      data: result?.bodyGoal,
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not save weight goal.", error),
      shouldFallback: false,
    };
  }
}

export async function upsertActiveGoalPlan(
  userId: string,
  goalPlan: GoalPlanInput
): Promise<DashboardWriteResult<GoalPlan>> {
  const validationError = validateGoalPlan(goalPlan);

  if (validationError) {
    return {
      success: false,
      error: validationError,
    };
  }

  try {
    return {
      success: true,
      data: upsertLocalGoalPlan(userId, goalPlan) ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not save goal plan.", error),
      shouldFallback: false,
    };
  }
}