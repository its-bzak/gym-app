import { db } from "@/db/sqlite";
import type {
  DailyExerciseMetrics,
  FoodLogDaySummary,
  FoodLogEntry,
  FoodLogMealSlot,
  FoodLogSourceType,
  GoalPlan,
  GoalType,
  NutritionGoal,
  SavedFood,
  SavedRecipe,
  SavedRecipeIngredient,
  WeightEntry,
  WeightGoal,
} from "@/types/dashboard";
import type { MacroBarProps } from "@/utils/calculateMacroBar";

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
  source_type: FoodLogSourceType | null;
  source_id: string | null;
  mass_grams: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type SavedFoodRow = {
  id: string;
  user_id: string;
  name: string;
  normalized_name: string;
  reference_mass_grams: number;
  energy_kcal: number;
  protein_grams: number;
  fat_grams: number;
  carbs_grams: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type SavedRecipeRow = {
  id: string;
  user_id: string;
  name: string;
  normalized_name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type SavedRecipeItemRow = {
  id: string;
  recipe_id: string;
  saved_food_id: string;
  sort_order: number;
  mass_grams: number;
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
  deleted_at: string | null;
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
  deleted_at: string | null;
};

type NutritionGoalRow = {
  id: string;
  user_id: string;
  body_goal_id: string;
  program_mode: NutritionGoal["programMode"];
  calorie_goal: number;
  protein_goal: number;
  fat_goal: number;
  carbs_goal: number;
  maintenance_calories: number | null;
  planned_daily_energy_delta: number | null;
  protein_preference: NutritionGoal["proteinPreference"];
  carb_preference: NutritionGoal["carbPreference"];
  fat_preference: NutritionGoal["fatPreference"];
  adaptive_enabled: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type SyncOutboxStatusRow = {
  status: "pending" | "processing" | "failed";
};

type WorkoutSessionAggregateRow = {
  session_id: string;
  started_at: string;
  ended_at: string | null;
};

type WorkoutSetAggregateRow = {
  total_volume: number | null;
  total_sets: number | null;
  total_reps: number | null;
};

export type LocalGoalPlanSyncPayload = {
  bodyGoal: BodyGoalRow;
  nutritionGoal: NutritionGoalRow;
} | null;

let nutritionSchemaReady = false;

function createLocalUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const randomNibble = Math.floor(Math.random() * 16);
    const nextValue = character === "x" ? randomNibble : (randomNibble & 0x3) | 0x8;

    return nextValue.toString(16);
  });
}

function getDateKey(date: Date | string) {
  if (typeof date === "string") {
    return date;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function hasColumn(tableName: string, columnName: string) {
  const columns = db.getAllSync<{ name: string }>(`PRAGMA table_info(${tableName})`);

  return columns.some((column) => column.name === columnName);
}

function ensureColumn(tableName: string, columnName: string, definition: string) {
  if (hasColumn(tableName, columnName)) {
    return;
  }

  db.execSync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
}

function ensureNutritionSchema() {
  if (nutritionSchemaReady) {
    return;
  }

  db.execSync(`
    CREATE TABLE IF NOT EXISTS food_log_entries (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      logged_at TEXT NOT NULL,
      meal_slot TEXT,
      name TEXT,
      energy_kcal REAL,
      protein_grams REAL NOT NULL DEFAULT 0,
      fat_grams REAL NOT NULL DEFAULT 0,
      carbs_grams REAL NOT NULL DEFAULT 0,
      alcohol_grams REAL NOT NULL DEFAULT 0,
      source_type TEXT,
      source_id TEXT,
      mass_grams REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS saved_foods (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      reference_mass_grams REAL NOT NULL,
      energy_kcal REAL NOT NULL,
      protein_grams REAL NOT NULL,
      fat_grams REAL NOT NULL,
      carbs_grams REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      UNIQUE (user_id, normalized_name)
    );

    CREATE TABLE IF NOT EXISTS saved_recipes (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      UNIQUE (user_id, normalized_name)
    );

    CREATE TABLE IF NOT EXISTS saved_recipe_items (
      id TEXT PRIMARY KEY NOT NULL,
      recipe_id TEXT NOT NULL,
      saved_food_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      mass_grams REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES saved_recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (saved_food_id) REFERENCES saved_foods(id) ON DELETE CASCADE,
      UNIQUE (recipe_id, sort_order)
    );

    CREATE TABLE IF NOT EXISTS body_weight_entries (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      UNIQUE (user_id, entry_date)
    );

    CREATE TABLE IF NOT EXISTS body_goals (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      goal_type TEXT NOT NULL CHECK(goal_type IN ('lose', 'gain', 'maintain')),
      status TEXT NOT NULL CHECK(status IN ('draft', 'active', 'completed', 'paused', 'cancelled')),
      start_weight_kg REAL NOT NULL,
      target_weight_kg REAL NOT NULL,
      target_rate_kg_per_week REAL NOT NULL,
      started_on TEXT NOT NULL,
      completed_on TEXT,
      paused_on TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS nutrition_goals (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      body_goal_id TEXT NOT NULL,
      program_mode TEXT NOT NULL CHECK(program_mode IN ('manual', 'guided')),
      calorie_goal REAL NOT NULL,
      protein_goal REAL NOT NULL,
      fat_goal REAL NOT NULL,
      carbs_goal REAL NOT NULL,
      maintenance_calories REAL,
      planned_daily_energy_delta REAL,
      protein_preference TEXT NOT NULL CHECK(protein_preference IN ('standard', 'high')),
      carb_preference TEXT NOT NULL CHECK(carb_preference IN ('lower', 'balanced', 'higher')),
      fat_preference TEXT NOT NULL CHECK(fat_preference IN ('lower', 'balanced', 'higher')),
      adaptive_enabled INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      FOREIGN KEY (body_goal_id) REFERENCES body_goals(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_food_log_entries_user_date ON food_log_entries(user_id, entry_date);
    CREATE INDEX IF NOT EXISTS idx_food_log_entries_updated_at ON food_log_entries(updated_at);
    CREATE INDEX IF NOT EXISTS idx_saved_foods_user_name ON saved_foods(user_id, normalized_name);
    CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_name ON saved_recipes(user_id, normalized_name);
    CREATE INDEX IF NOT EXISTS idx_saved_recipe_items_recipe_id ON saved_recipe_items(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_body_weight_entries_user_date ON body_weight_entries(user_id, entry_date);
    CREATE INDEX IF NOT EXISTS idx_body_weight_entries_updated_at ON body_weight_entries(updated_at);
    CREATE INDEX IF NOT EXISTS idx_body_goals_user_id ON body_goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_body_goals_updated_at ON body_goals(updated_at);
    CREATE INDEX IF NOT EXISTS idx_nutrition_goals_user_id ON nutrition_goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_nutrition_goals_updated_at ON nutrition_goals(updated_at);
  `);

  ensureColumn("food_log_entries", "deleted_at", "TEXT");
  ensureColumn("food_log_entries", "source_type", "TEXT");
  ensureColumn("food_log_entries", "source_id", "TEXT");
  ensureColumn("food_log_entries", "mass_grams", "REAL");
  ensureColumn("saved_foods", "deleted_at", "TEXT");
  ensureColumn("saved_recipes", "deleted_at", "TEXT");
  ensureColumn("body_weight_entries", "deleted_at", "TEXT");
  ensureColumn("body_goals", "deleted_at", "TEXT");
  ensureColumn("nutrition_goals", "deleted_at", "TEXT");

  nutritionSchemaReady = true;
}

function enqueueSyncOperation(
  entityType: string,
  entityId: string,
  operation: "create" | "update" | "delete",
  payload: Record<string, unknown>
) {
  ensureNutritionSchema();

  const existing = db.getFirstSync<SyncOutboxStatusRow>(
    `
      SELECT status
      FROM sync_outbox
      WHERE entity_type = ?
        AND entity_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [entityType, entityId]
  );

  const now = new Date().toISOString();

  db.runSync(
    `
      INSERT INTO sync_outbox (
        id,
        entity_type,
        entity_id,
        operation,
        payload_json,
        status,
        attempt_count,
        next_retry_at,
        last_error,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?)
    `,
    [
      `outbox-${entityType}-${entityId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      entityType,
      entityId,
      operation,
      JSON.stringify(payload),
      existing?.status === "failed" ? "failed" : "pending",
      now,
      now,
    ]
  );
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
}) {
  if (entry.energy_kcal !== null && entry.energy_kcal !== undefined) {
    return Number(entry.energy_kcal);
  }

  return (
    entry.protein_grams * 4 +
    entry.fat_grams * 9 +
    entry.carbs_grams * 4 +
    (entry.alcohol_grams ?? 0) * 7
  );
}

function scaleNutritionByMass(
  nutrition: { energyKcal: number; protein: number; fat: number; carbs: number },
  referenceMassGrams: number,
  massGrams: number
) {
  if (referenceMassGrams <= 0 || massGrams <= 0) {
    return {
      energyKcal: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    };
  }

  const scale = massGrams / referenceMassGrams;

  return {
    energyKcal: Number((nutrition.energyKcal * scale).toFixed(2)),
    protein: Number((nutrition.protein * scale).toFixed(2)),
    fat: Number((nutrition.fat * scale).toFixed(2)),
    carbs: Number((nutrition.carbs * scale).toFixed(2)),
  };
}

function mapFoodLogEntryRow(row: FoodLogEntryRow): FoodLogEntry {
  return {
    id: row.id,
    entryDate: row.entry_date,
    loggedAt: row.logged_at,
    mealSlot: normalizeMealSlot(row.meal_slot),
    name: row.name?.trim() || "Quick entry",
    energyKcal: calculateEntryCalories(row),
    protein: Number(row.protein_grams ?? 0),
    fat: Number(row.fat_grams ?? 0),
    carbs: Number(row.carbs_grams ?? 0),
    alcoholGrams: Number(row.alcohol_grams ?? 0),
    sourceType: row.source_type ?? undefined,
    sourceId: row.source_id,
    massGrams: row.mass_grams,
  };
}

function mapSavedFoodRow(row: SavedFoodRow): SavedFood {
  return {
    id: row.id,
    name: row.name,
    referenceMassGrams: Number(row.reference_mass_grams),
    energyKcal: Number(row.energy_kcal),
    protein: Number(row.protein_grams),
    fat: Number(row.fat_grams),
    carbs: Number(row.carbs_grams),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildRecipeTotals(ingredients: SavedRecipeIngredient[]) {
  return ingredients.reduce(
    (aggregate, ingredient) => {
      aggregate.totalMassGrams += ingredient.massGrams;
      aggregate.energyKcal += ingredient.energyKcal;
      aggregate.protein += ingredient.protein;
      aggregate.fat += ingredient.fat;
      aggregate.carbs += ingredient.carbs;

      return aggregate;
    },
    {
      totalMassGrams: 0,
      energyKcal: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    }
  );
}

function mapWeightEntryRow(row: BodyWeightEntryRow): WeightEntry {
  return {
    date: row.entry_date,
    weightKg: Number(row.weight_kg),
  };
}

function mapBodyGoalRow(row: BodyGoalRow): WeightGoal {
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

function mapNutritionGoalRow(row: NutritionGoalRow): NutritionGoal {
  return {
    programMode: row.program_mode,
    proteinGoal: Number(row.protein_goal),
    fatGoal: Number(row.fat_goal),
    carbsGoal: Number(row.carbs_goal),
    calorieGoal: Number(row.calorie_goal),
    maintenanceCalories: row.maintenance_calories,
    plannedDailyEnergyDelta: row.planned_daily_energy_delta,
    proteinPreference: row.protein_preference,
    carbPreference: row.carb_preference,
    fatPreference: row.fat_preference,
    adaptiveEnabled: Boolean(row.adaptive_enabled),
  };
}

function buildFoodLogDaySummary(entries: FoodLogEntry[], nutritionGoal: NutritionGoal | null): FoodLogDaySummary {
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

function normalizeSignedRateKgPerWeek(goalType: GoalType, targetRateKgPerWeek: number) {
  if (goalType === "maintain") {
    return 0;
  }

  const normalizedRate = Math.abs(targetRateKgPerWeek);
  return goalType === "lose" ? -normalizedRate : normalizedRate;
}

function getActiveBodyGoalRow(userId: string) {
  ensureNutritionSchema();

  return db.getFirstSync<BodyGoalRow>(
    `
      SELECT
        id,
        user_id,
        goal_type,
        status,
        start_weight_kg,
        target_weight_kg,
        target_rate_kg_per_week,
        started_on,
        completed_on,
        paused_on,
        notes,
        created_at,
        updated_at,
        deleted_at
      FROM body_goals
      WHERE user_id = ?
        AND status = 'active'
        AND deleted_at IS NULL
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [userId]
  );
}

function getActiveNutritionGoalRow(userId: string) {
  ensureNutritionSchema();

  return db.getFirstSync<NutritionGoalRow>(
    `
      SELECT
        id,
        user_id,
        body_goal_id,
        program_mode,
        calorie_goal,
        protein_goal,
        fat_goal,
        carbs_goal,
        maintenance_calories,
        planned_daily_energy_delta,
        protein_preference,
        carb_preference,
        fat_preference,
        adaptive_enabled,
        is_active,
        created_at,
        updated_at,
        deleted_at
      FROM nutrition_goals
      WHERE user_id = ?
        AND is_active = 1
        AND deleted_at IS NULL
      ORDER BY updated_at DESC
      LIMIT 1
    `,
    [userId]
  );
}

function buildGoalPlan(userId: string): GoalPlan | null {
  const bodyGoal = getActiveBodyGoalRow(userId);
  const nutritionGoal = getActiveNutritionGoalRow(userId);

  if (!bodyGoal || !nutritionGoal) {
    return null;
  }

  return {
    bodyGoal: mapBodyGoalRow(bodyGoal),
    nutritionGoal: mapNutritionGoalRow(nutritionGoal),
    latestRecommendation: null,
  };
}

function getFoodLogEntriesByDateKeys(userId: string, dateKeys: string[]) {
  ensureNutritionSchema();

  if (dateKeys.length === 0) {
    return new Map<string, FoodLogEntry[]>();
  }

  const placeholders = dateKeys.map(() => "?").join(", ");
  const rows = db.getAllSync<FoodLogEntryRow>(
    `
      SELECT
        id,
        user_id,
        entry_date,
        logged_at,
        meal_slot,
        name,
        energy_kcal,
        protein_grams,
        fat_grams,
        carbs_grams,
        alcohol_grams,
        source_type,
        source_id,
        mass_grams,
        created_at,
        updated_at,
        deleted_at
      FROM food_log_entries
      WHERE user_id = ?
        AND deleted_at IS NULL
        AND entry_date IN (${placeholders})
      ORDER BY logged_at ASC
    `,
    [userId, ...dateKeys]
  );

  const entriesByDate = new Map<string, FoodLogEntry[]>();

  dateKeys.forEach((dateKey) => {
    entriesByDate.set(dateKey, []);
  });

  rows.forEach((row) => {
    const existingEntries = entriesByDate.get(row.entry_date) ?? [];
    existingEntries.push(mapFoodLogEntryRow(row));
    entriesByDate.set(row.entry_date, existingEntries);
  });

  return entriesByDate;
}

function hasPendingOutboxEntry(entityType: string, entityId: string) {
  const row = db.getFirstSync<{ id: string }>(
    `
      SELECT id
      FROM sync_outbox
      WHERE entity_type = ?
        AND entity_id = ?
      LIMIT 1
    `,
    [entityType, entityId]
  );

  return Boolean(row);
}

function getSavedFoodRowById(savedFoodId: string) {
  ensureNutritionSchema();

  return db.getFirstSync<SavedFoodRow>(
    `
      SELECT
        id,
        user_id,
        name,
        normalized_name,
        reference_mass_grams,
        energy_kcal,
        protein_grams,
        fat_grams,
        carbs_grams,
        created_at,
        updated_at,
        deleted_at
      FROM saved_foods
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [savedFoodId]
  );
}

function getActiveRecipeCountForSavedFood(savedFoodId: string, excludedRecipeId?: string) {
  ensureNutritionSchema();

  const row = excludedRecipeId
    ? db.getFirstSync<{ count: number }>(
        `
          SELECT COUNT(DISTINCT saved_recipes.id) AS count
          FROM saved_recipe_items
          INNER JOIN saved_recipes ON saved_recipes.id = saved_recipe_items.recipe_id
          WHERE saved_recipe_items.saved_food_id = ?
            AND saved_recipes.deleted_at IS NULL
            AND saved_recipes.id != ?
        `,
        [savedFoodId, excludedRecipeId]
      )
    : db.getFirstSync<{ count: number }>(
        `
          SELECT COUNT(DISTINCT saved_recipes.id) AS count
          FROM saved_recipe_items
          INNER JOIN saved_recipes ON saved_recipes.id = saved_recipe_items.recipe_id
          WHERE saved_recipe_items.saved_food_id = ?
            AND saved_recipes.deleted_at IS NULL
        `,
        [savedFoodId]
      );

  return Number(row?.count ?? 0);
}

function validateSavedRecipeIngredientRows(
  userId: string,
  ingredients: Array<{ savedFoodId: string; massGrams: number }>
) {
  ingredients.forEach((ingredient) => {
    const savedFood = getSavedFoodRowById(ingredient.savedFoodId);

    if (!savedFood || savedFood.user_id !== userId) {
      throw new Error("One or more saved foods could not be found.");
    }
  });
}

function buildSavedRecipe(recipeRow: SavedRecipeRow, itemRows: SavedRecipeItemRow[]) {
  const ingredients = itemRows
    .map((itemRow) => {
      const savedFood = getSavedFoodRowById(itemRow.saved_food_id);

      if (!savedFood) {
        return null;
      }

      const scaledNutrition = scaleNutritionByMass(
        {
          energyKcal: Number(savedFood.energy_kcal),
          protein: Number(savedFood.protein_grams),
          fat: Number(savedFood.fat_grams),
          carbs: Number(savedFood.carbs_grams),
        },
        Number(savedFood.reference_mass_grams),
        Number(itemRow.mass_grams)
      );

      return {
        id: itemRow.id,
        savedFoodId: savedFood.id,
        savedFoodName: savedFood.name,
        massGrams: Number(itemRow.mass_grams),
        energyKcal: scaledNutrition.energyKcal,
        protein: scaledNutrition.protein,
        fat: scaledNutrition.fat,
        carbs: scaledNutrition.carbs,
      } satisfies SavedRecipeIngredient;
    })
    .filter((ingredient): ingredient is SavedRecipeIngredient => Boolean(ingredient));

  const totals = buildRecipeTotals(ingredients);

  return {
    id: recipeRow.id,
    name: recipeRow.name,
    totalMassGrams: totals.totalMassGrams,
    energyKcal: totals.energyKcal,
    protein: totals.protein,
    fat: totals.fat,
    carbs: totals.carbs,
    ingredients,
    createdAt: recipeRow.created_at,
    updatedAt: recipeRow.updated_at,
  } satisfies SavedRecipe;
}

export function getSavedFoods(userId: string, searchTerm?: string) {
  ensureNutritionSchema();

  const normalizedSearchTerm = searchTerm?.trim().toLowerCase();
  const rows = normalizedSearchTerm
    ? db.getAllSync<SavedFoodRow>(
        `
          SELECT
            id,
            user_id,
            name,
            normalized_name,
            reference_mass_grams,
            energy_kcal,
            protein_grams,
            fat_grams,
            carbs_grams,
            created_at,
            updated_at,
            deleted_at
          FROM saved_foods
          WHERE user_id = ?
            AND deleted_at IS NULL
            AND normalized_name LIKE ?
          ORDER BY name COLLATE NOCASE ASC
        `,
        [userId, `%${normalizedSearchTerm}%`]
      )
    : db.getAllSync<SavedFoodRow>(
        `
          SELECT
            id,
            user_id,
            name,
            normalized_name,
            reference_mass_grams,
            energy_kcal,
            protein_grams,
            fat_grams,
            carbs_grams,
            created_at,
            updated_at,
            deleted_at
          FROM saved_foods
          WHERE user_id = ?
            AND deleted_at IS NULL
          ORDER BY name COLLATE NOCASE ASC
        `,
        [userId]
      );

  return rows.map(mapSavedFoodRow);
}

export function getSavedFoodById(userId: string, savedFoodId: string) {
  const savedFood = getSavedFoodRowById(savedFoodId);

  if (!savedFood || savedFood.user_id !== userId) {
    return null;
  }

  return mapSavedFoodRow(savedFood);
}

export function createSavedFood(
  userId: string,
  input: {
    name: string;
    referenceMassGrams: number;
    energyKcal: number;
    protein: number;
    fat: number;
    carbs: number;
  }
) {
  ensureNutritionSchema();

  const timestamp = new Date().toISOString();
  const savedFood: SavedFood = {
    id: createLocalUuid(),
    name: input.name.trim(),
    referenceMassGrams: input.referenceMassGrams,
    energyKcal: input.energyKcal,
    protein: input.protein,
    fat: input.fat,
    carbs: input.carbs,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.runSync(
    `
      INSERT INTO saved_foods (
        id,
        user_id,
        name,
        normalized_name,
        reference_mass_grams,
        energy_kcal,
        protein_grams,
        fat_grams,
        carbs_grams,
        created_at,
        updated_at,
        deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `,
    [
      savedFood.id,
      userId,
      savedFood.name,
      savedFood.name.toLowerCase(),
      savedFood.referenceMassGrams,
      savedFood.energyKcal,
      savedFood.protein,
      savedFood.fat,
      savedFood.carbs,
      savedFood.createdAt,
      savedFood.updatedAt,
    ]
  );

  return savedFood;
}

export function updateSavedFood(
  userId: string,
  savedFoodId: string,
  input: {
    name: string;
    referenceMassGrams: number;
    energyKcal: number;
    protein: number;
    fat: number;
    carbs: number;
  }
) {
  ensureNutritionSchema();

  const existingSavedFood = getSavedFoodRowById(savedFoodId);

  if (!existingSavedFood || existingSavedFood.user_id !== userId) {
    return null;
  }

  const updatedAt = new Date().toISOString();
  const trimmedName = input.name.trim();

  db.runSync(
    `
      UPDATE saved_foods
      SET name = ?,
          normalized_name = ?,
          reference_mass_grams = ?,
          energy_kcal = ?,
          protein_grams = ?,
          fat_grams = ?,
          carbs_grams = ?,
          updated_at = ?,
          deleted_at = NULL
      WHERE id = ?
        AND user_id = ?
    `,
    [
      trimmedName,
      trimmedName.toLowerCase(),
      input.referenceMassGrams,
      input.energyKcal,
      input.protein,
      input.fat,
      input.carbs,
      updatedAt,
      savedFoodId,
      userId,
    ]
  );

  return getSavedFoodById(userId, savedFoodId);
}

export function deleteSavedFood(userId: string, savedFoodId: string) {
  ensureNutritionSchema();

  const existingSavedFood = getSavedFoodRowById(savedFoodId);

  if (!existingSavedFood || existingSavedFood.user_id !== userId) {
    return false;
  }

  if (getActiveRecipeCountForSavedFood(savedFoodId) > 0) {
    throw new Error("Remove this food from active recipes before deleting it.");
  }

  const timestamp = new Date().toISOString();

  db.execSync("BEGIN TRANSACTION;");

  try {
    db.runSync(
      `
        UPDATE saved_foods
        SET updated_at = ?, deleted_at = ?
        WHERE id = ?
          AND user_id = ?
      `,
      [timestamp, timestamp, savedFoodId, userId]
    );

    db.runSync(
      `
        DELETE FROM saved_recipe_items
        WHERE saved_food_id = ?
      `,
      [savedFoodId]
    );

    db.execSync("COMMIT;");
    return true;
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }
}

export function getSavedRecipes(userId: string, searchTerm?: string) {
  ensureNutritionSchema();

  const normalizedSearchTerm = searchTerm?.trim().toLowerCase();
  const recipeRows = normalizedSearchTerm
    ? db.getAllSync<SavedRecipeRow>(
        `
          SELECT id, user_id, name, normalized_name, created_at, updated_at, deleted_at
          FROM saved_recipes
          WHERE user_id = ?
            AND deleted_at IS NULL
            AND normalized_name LIKE ?
          ORDER BY name COLLATE NOCASE ASC
        `,
        [userId, `%${normalizedSearchTerm}%`]
      )
    : db.getAllSync<SavedRecipeRow>(
        `
          SELECT id, user_id, name, normalized_name, created_at, updated_at, deleted_at
          FROM saved_recipes
          WHERE user_id = ?
            AND deleted_at IS NULL
          ORDER BY name COLLATE NOCASE ASC
        `,
        [userId]
      );

  const itemRows = db.getAllSync<SavedRecipeItemRow>(
    `
      SELECT id, recipe_id, saved_food_id, sort_order, mass_grams, created_at, updated_at
      FROM saved_recipe_items
      WHERE recipe_id IN (
        SELECT id FROM saved_recipes WHERE user_id = ? AND deleted_at IS NULL
      )
      ORDER BY recipe_id ASC, sort_order ASC
    `,
    [userId]
  );
  const itemsByRecipeId = new Map<string, SavedRecipeItemRow[]>();

  itemRows.forEach((itemRow) => {
    const existingItems = itemsByRecipeId.get(itemRow.recipe_id) ?? [];
    existingItems.push(itemRow);
    itemsByRecipeId.set(itemRow.recipe_id, existingItems);
  });

  return recipeRows.map((recipeRow) => buildSavedRecipe(recipeRow, itemsByRecipeId.get(recipeRow.id) ?? []));
}

export function getSavedRecipeById(userId: string, recipeId: string) {
  const recipeRow = db.getFirstSync<SavedRecipeRow>(
    `
      SELECT id, user_id, name, normalized_name, created_at, updated_at, deleted_at
      FROM saved_recipes
      WHERE id = ?
        AND user_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [recipeId, userId]
  );

  if (!recipeRow) {
    return null;
  }

  const itemRows = db.getAllSync<SavedRecipeItemRow>(
    `
      SELECT id, recipe_id, saved_food_id, sort_order, mass_grams, created_at, updated_at
      FROM saved_recipe_items
      WHERE recipe_id = ?
      ORDER BY sort_order ASC
    `,
    [recipeId]
  );

  return buildSavedRecipe(recipeRow, itemRows);
}

export function createSavedRecipe(
  userId: string,
  input: {
    name: string;
    ingredients: Array<{ savedFoodId: string; massGrams: number }>;
  }
) {
  ensureNutritionSchema();

  validateSavedRecipeIngredientRows(userId, input.ingredients);

  const timestamp = new Date().toISOString();
  const recipeId = createLocalUuid();

  db.execSync("BEGIN TRANSACTION;");

  try {
    db.runSync(
      `
        INSERT INTO saved_recipes (
          id,
          user_id,
          name,
          normalized_name,
          created_at,
          updated_at,
          deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, NULL)
      `,
      [recipeId, userId, input.name.trim(), input.name.trim().toLowerCase(), timestamp, timestamp]
    );

    input.ingredients.forEach((ingredient, index) => {
      db.runSync(
        `
          INSERT INTO saved_recipe_items (
            id,
            recipe_id,
            saved_food_id,
            sort_order,
            mass_grams,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          createLocalUuid(),
          recipeId,
          ingredient.savedFoodId,
          index,
          ingredient.massGrams,
          timestamp,
          timestamp,
        ]
      );
    });

    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }

  return getSavedRecipeById(userId, recipeId);
}

export function updateSavedRecipe(
  userId: string,
  recipeId: string,
  input: {
    name: string;
    ingredients: Array<{ savedFoodId: string; massGrams: number }>;
  }
) {
  ensureNutritionSchema();

  const existingRecipe = db.getFirstSync<SavedRecipeRow>(
    `
      SELECT id, user_id, name, normalized_name, created_at, updated_at, deleted_at
      FROM saved_recipes
      WHERE id = ?
        AND user_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [recipeId, userId]
  );

  if (!existingRecipe) {
    return null;
  }

  validateSavedRecipeIngredientRows(userId, input.ingredients);

  const timestamp = new Date().toISOString();
  const trimmedName = input.name.trim();

  db.execSync("BEGIN TRANSACTION;");

  try {
    db.runSync(
      `
        UPDATE saved_recipes
        SET name = ?, normalized_name = ?, updated_at = ?, deleted_at = NULL
        WHERE id = ?
          AND user_id = ?
      `,
      [trimmedName, trimmedName.toLowerCase(), timestamp, recipeId, userId]
    );

    db.runSync(
      `
        DELETE FROM saved_recipe_items
        WHERE recipe_id = ?
      `,
      [recipeId]
    );

    input.ingredients.forEach((ingredient, index) => {
      db.runSync(
        `
          INSERT INTO saved_recipe_items (
            id,
            recipe_id,
            saved_food_id,
            sort_order,
            mass_grams,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          createLocalUuid(),
          recipeId,
          ingredient.savedFoodId,
          index,
          ingredient.massGrams,
          timestamp,
          timestamp,
        ]
      );
    });

    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }

  return getSavedRecipeById(userId, recipeId);
}

export function deleteSavedRecipe(userId: string, recipeId: string) {
  ensureNutritionSchema();

  const existingRecipe = db.getFirstSync<SavedRecipeRow>(
    `
      SELECT id, user_id, name, normalized_name, created_at, updated_at, deleted_at
      FROM saved_recipes
      WHERE id = ?
        AND user_id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [recipeId, userId]
  );

  if (!existingRecipe) {
    return false;
  }

  const timestamp = new Date().toISOString();

  db.execSync("BEGIN TRANSACTION;");

  try {
    db.runSync(
      `
        UPDATE saved_recipes
        SET updated_at = ?, deleted_at = ?
        WHERE id = ?
          AND user_id = ?
      `,
      [timestamp, timestamp, recipeId, userId]
    );

    db.runSync(
      `
        DELETE FROM saved_recipe_items
        WHERE recipe_id = ?
      `,
      [recipeId]
    );

    db.execSync("COMMIT;");
    return true;
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }
}

export function calculateSavedFoodNutrition(savedFood: SavedFood, massGrams: number) {
  return scaleNutritionByMass(
    {
      energyKcal: savedFood.energyKcal,
      protein: savedFood.protein,
      fat: savedFood.fat,
      carbs: savedFood.carbs,
    },
    savedFood.referenceMassGrams,
    massGrams
  );
}

export function calculateSavedRecipeNutrition(savedRecipe: SavedRecipe, massGrams: number) {
  return scaleNutritionByMass(
    {
      energyKcal: savedRecipe.energyKcal,
      protein: savedRecipe.protein,
      fat: savedRecipe.fat,
      carbs: savedRecipe.carbs,
    },
    savedRecipe.totalMassGrams,
    massGrams
  );
}

export function getLocalActiveGoalPlan(userId: string) {
  ensureNutritionSchema();
  return buildGoalPlan(userId);
}

export function getLocalActiveNutritionGoal(userId: string) {
  ensureNutritionSchema();
  return buildGoalPlan(userId)?.nutritionGoal ?? null;
}

export function getLocalFoodLogDay(userId: string, date: Date | string) {
  ensureNutritionSchema();

  const dateKey = getDateKey(date);
  const entries = getFoodLogEntriesByDateKeys(userId, [dateKey]).get(dateKey) ?? [];
  const nutritionGoal = getLocalActiveNutritionGoal(userId);

  return {
    date: dateKey,
    entries,
    nutritionGoal,
    summary: buildFoodLogDaySummary(entries, nutritionGoal),
  };
}

export function getLocalFoodLogDays(userId: string, dates: Array<Date | string>) {
  ensureNutritionSchema();

  const dateKeys = Array.from(new Set(dates.map((date) => getDateKey(date))));
  const nutritionGoal = getLocalActiveNutritionGoal(userId);
  const entriesByDate = getFoodLogEntriesByDateKeys(userId, dateKeys);

  return dateKeys.map((dateKey) => {
    const entries = entriesByDate.get(dateKey) ?? [];

    return {
      date: dateKey,
      entries,
      nutritionGoal,
      summary: buildFoodLogDaySummary(entries, nutritionGoal),
    };
  });
}

export function getLocalDailyNutritionMetrics(userId: string, date: Date | string): MacroBarProps {
  return getLocalFoodLogDay(userId, date).summary;
}

export function insertLocalFoodLogEntry(
  userId: string,
  date: Date | string,
  entry: {
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
  }
) {
  ensureNutritionSchema();

  const entryId = createLocalUuid();
  const timestamp = new Date().toISOString();

  db.execSync("BEGIN TRANSACTION;");

  try {
    db.runSync(
      `
        INSERT INTO food_log_entries (
          id,
          user_id,
          entry_date,
          logged_at,
          meal_slot,
          name,
          energy_kcal,
          protein_grams,
          fat_grams,
          carbs_grams,
          alcohol_grams,
          source_type,
          source_id,
          mass_grams,
          created_at,
          updated_at,
          deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      `,
      [
        entryId,
        userId,
        getDateKey(date),
        entry.loggedAt ?? timestamp,
        entry.mealSlot ?? "custom",
        entry.name?.trim() || null,
        entry.energyKcal ?? null,
        entry.protein,
        entry.fat,
        entry.carbs,
        entry.alcoholGrams ?? 0,
        entry.sourceType ?? null,
        entry.sourceId ?? null,
        entry.massGrams ?? null,
        timestamp,
        timestamp,
      ]
    );

    enqueueSyncOperation("food_log_entry", entryId, "create", {
      userId,
      date: getDateKey(date),
    });

    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }

  return getLocalFoodLogDay(userId, date);
}

export function updateLocalFoodLogEntry(
  userId: string,
  entryId: string,
  date: Date | string,
  entry: {
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
  }
) {
  ensureNutritionSchema();

  const timestamp = new Date().toISOString();

  db.execSync("BEGIN TRANSACTION;");

  try {
    db.runSync(
      `
        UPDATE food_log_entries
        SET
          entry_date = ?,
          logged_at = ?,
          meal_slot = ?,
          name = ?,
          energy_kcal = ?,
          protein_grams = ?,
          fat_grams = ?,
          carbs_grams = ?,
          alcohol_grams = ?,
          source_type = ?,
          source_id = ?,
          mass_grams = ?,
          updated_at = ?,
          deleted_at = NULL
        WHERE id = ?
          AND user_id = ?
      `,
      [
        getDateKey(date),
        entry.loggedAt ?? timestamp,
        entry.mealSlot ?? "custom",
        entry.name?.trim() || null,
        entry.energyKcal ?? null,
        entry.protein,
        entry.fat,
        entry.carbs,
        entry.alcoholGrams ?? 0,
        entry.sourceType ?? null,
        entry.sourceId ?? null,
        entry.massGrams ?? null,
        timestamp,
        entryId,
        userId,
      ]
    );

    enqueueSyncOperation("food_log_entry", entryId, "update", {
      userId,
      date: getDateKey(date),
    });

    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }

  return getLocalFoodLogDay(userId, date);
}

export function deleteLocalFoodLogEntry(userId: string, entryId: string, date: Date | string) {
  ensureNutritionSchema();

  const timestamp = new Date().toISOString();

  db.execSync("BEGIN TRANSACTION;");

  try {
    db.runSync(
      `
        UPDATE food_log_entries
        SET updated_at = ?, deleted_at = ?
        WHERE id = ?
          AND user_id = ?
      `,
      [timestamp, timestamp, entryId, userId]
    );

    enqueueSyncOperation("food_log_entry", entryId, "delete", {
      userId,
      date: getDateKey(date),
    });

    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }

  return getLocalFoodLogDay(userId, date);
}

export function getLocalWeightEntries(userId: string) {
  ensureNutritionSchema();

  const rows = db.getAllSync<BodyWeightEntryRow>(
    `
      SELECT id, user_id, entry_date, weight_kg, created_at, updated_at, deleted_at
      FROM body_weight_entries
      WHERE user_id = ?
        AND deleted_at IS NULL
      ORDER BY entry_date ASC
    `,
    [userId]
  );

  return rows.map(mapWeightEntryRow);
}

export function upsertLocalWeightEntry(userId: string, date: Date | string, weightKg: number) {
  ensureNutritionSchema();

  const entryDate = getDateKey(date);
  const existingRow = db.getFirstSync<BodyWeightEntryRow>(
    `
      SELECT id, user_id, entry_date, weight_kg, created_at, updated_at, deleted_at
      FROM body_weight_entries
      WHERE user_id = ?
        AND entry_date = ?
      LIMIT 1
    `,
    [userId, entryDate]
  );
  const timestamp = new Date().toISOString();
  const entryId = existingRow?.id ?? createLocalUuid();

  db.execSync("BEGIN TRANSACTION;");

  try {
    if (existingRow) {
      db.runSync(
        `
          UPDATE body_weight_entries
          SET weight_kg = ?, updated_at = ?, deleted_at = NULL
          WHERE id = ?
        `,
        [weightKg, timestamp, entryId]
      );
    } else {
      db.runSync(
        `
          INSERT INTO body_weight_entries (
            id,
            user_id,
            entry_date,
            weight_kg,
            created_at,
            updated_at,
            deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, NULL)
        `,
        [entryId, userId, entryDate, weightKg, timestamp, timestamp]
      );
    }

    enqueueSyncOperation("weight_entry", entryId, existingRow ? "update" : "create", {
      userId,
      entryDate,
    });

    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }

  return {
    date: entryDate,
    weightKg,
  };
}

export function upsertLocalGoalPlan(
  userId: string,
  goalPlan: {
    weightGoal: {
      goalType: GoalType;
      startWeightKg: number;
      targetWeightKg: number;
      targetRateKgPerWeek: number;
    };
    nutritionGoal: {
      programMode: NutritionGoal["programMode"];
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
  }
) {
  ensureNutritionSchema();

  const existingBodyGoal = getActiveBodyGoalRow(userId);
  const existingNutritionGoal = getActiveNutritionGoalRow(userId);
  const timestamp = new Date().toISOString();
  const bodyGoalId = existingBodyGoal?.id ?? createLocalUuid();
  const nutritionGoalId = existingNutritionGoal?.id ?? createLocalUuid();

  db.execSync("BEGIN TRANSACTION;");

  try {
    if (existingBodyGoal) {
      db.runSync(
        `
          UPDATE body_goals
          SET
            goal_type = ?,
            status = 'active',
            start_weight_kg = ?,
            target_weight_kg = ?,
            target_rate_kg_per_week = ?,
            completed_on = NULL,
            paused_on = NULL,
            notes = NULL,
            updated_at = ?,
            deleted_at = NULL
          WHERE id = ?
        `,
        [
          goalPlan.weightGoal.goalType,
          goalPlan.weightGoal.startWeightKg,
          goalPlan.weightGoal.targetWeightKg,
          normalizeSignedRateKgPerWeek(
            goalPlan.weightGoal.goalType,
            goalPlan.weightGoal.targetRateKgPerWeek
          ),
          timestamp,
          bodyGoalId,
        ]
      );
    } else {
      db.runSync(
        `
          INSERT INTO body_goals (
            id,
            user_id,
            goal_type,
            status,
            start_weight_kg,
            target_weight_kg,
            target_rate_kg_per_week,
            started_on,
            completed_on,
            paused_on,
            notes,
            created_at,
            updated_at,
            deleted_at
          ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, NULL)
        `,
        [
          bodyGoalId,
          userId,
          goalPlan.weightGoal.goalType,
          goalPlan.weightGoal.startWeightKg,
          goalPlan.weightGoal.targetWeightKg,
          normalizeSignedRateKgPerWeek(
            goalPlan.weightGoal.goalType,
            goalPlan.weightGoal.targetRateKgPerWeek
          ),
          getDateKey(new Date()),
          timestamp,
          timestamp,
        ]
      );
    }

    if (existingNutritionGoal) {
      db.runSync(
        `
          UPDATE nutrition_goals
          SET
            body_goal_id = ?,
            program_mode = ?,
            calorie_goal = ?,
            protein_goal = ?,
            fat_goal = ?,
            carbs_goal = ?,
            maintenance_calories = ?,
            planned_daily_energy_delta = ?,
            protein_preference = ?,
            carb_preference = ?,
            fat_preference = ?,
            adaptive_enabled = ?,
            is_active = 1,
            updated_at = ?,
            deleted_at = NULL
          WHERE id = ?
        `,
        [
          bodyGoalId,
          goalPlan.nutritionGoal.programMode,
          goalPlan.nutritionGoal.calorieGoal,
          goalPlan.nutritionGoal.proteinGoal,
          goalPlan.nutritionGoal.fatGoal,
          goalPlan.nutritionGoal.carbsGoal,
          goalPlan.nutritionGoal.maintenanceCalories ?? null,
          goalPlan.nutritionGoal.plannedDailyEnergyDelta ?? null,
          goalPlan.nutritionGoal.proteinPreference,
          goalPlan.nutritionGoal.carbPreference,
          goalPlan.nutritionGoal.fatPreference,
          goalPlan.nutritionGoal.adaptiveEnabled ? 1 : 0,
          timestamp,
          nutritionGoalId,
        ]
      );
    } else {
      db.runSync(
        `
          INSERT INTO nutrition_goals (
            id,
            user_id,
            body_goal_id,
            program_mode,
            calorie_goal,
            protein_goal,
            fat_goal,
            carbs_goal,
            maintenance_calories,
            planned_daily_energy_delta,
            protein_preference,
            carb_preference,
            fat_preference,
            adaptive_enabled,
            is_active,
            created_at,
            updated_at,
            deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)
        `,
        [
          nutritionGoalId,
          userId,
          bodyGoalId,
          goalPlan.nutritionGoal.programMode,
          goalPlan.nutritionGoal.calorieGoal,
          goalPlan.nutritionGoal.proteinGoal,
          goalPlan.nutritionGoal.fatGoal,
          goalPlan.nutritionGoal.carbsGoal,
          goalPlan.nutritionGoal.maintenanceCalories ?? null,
          goalPlan.nutritionGoal.plannedDailyEnergyDelta ?? null,
          goalPlan.nutritionGoal.proteinPreference,
          goalPlan.nutritionGoal.carbPreference,
          goalPlan.nutritionGoal.fatPreference,
          goalPlan.nutritionGoal.adaptiveEnabled ? 1 : 0,
          timestamp,
          timestamp,
        ]
      );
    }

    enqueueSyncOperation("goal_plan", userId, existingBodyGoal || existingNutritionGoal ? "update" : "create", {
      userId,
    });

    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }

  return buildGoalPlan(userId);
}

function getWorkoutSessionsForRange(userId: string, date?: Date | string) {
  ensureNutritionSchema();

  if (date) {
    const dateKey = getDateKey(date);
    return db.getAllSync<WorkoutSessionAggregateRow>(
      `
        SELECT id as session_id, started_at, ended_at
        FROM workout_sessions
        WHERE user_id = ?
          AND status = 'completed'
          AND substr(started_at, 1, 10) = ?
      `,
      [userId, dateKey]
    );
  }

  return db.getAllSync<WorkoutSessionAggregateRow>(
    `
      SELECT id as session_id, started_at, ended_at
      FROM workout_sessions
      WHERE user_id = ?
        AND status = 'completed'
    `,
    [userId]
  );
}

function getWorkoutSetAggregates(userId: string, date?: Date | string) {
  ensureNutritionSchema();

  if (date) {
    const dateKey = getDateKey(date);
    return db.getFirstSync<WorkoutSetAggregateRow>(
      `
        SELECT
          SUM(CASE WHEN wss.reps IS NOT NULL AND wss.weight IS NOT NULL THEN wss.reps * wss.weight ELSE 0 END) as total_volume,
          COUNT(wss.id) as total_sets,
          SUM(COALESCE(wss.reps, 0)) as total_reps
        FROM workout_sessions ws
        LEFT JOIN workout_session_exercises wse ON wse.workout_session_id = ws.id
        LEFT JOIN workout_session_sets wss ON wss.workout_session_exercise_id = wse.id
        WHERE ws.user_id = ?
          AND ws.status = 'completed'
          AND substr(ws.started_at, 1, 10) = ?
      `,
      [userId, dateKey]
    );
  }

  return db.getFirstSync<WorkoutSetAggregateRow>(
    `
      SELECT
        SUM(CASE WHEN wss.reps IS NOT NULL AND wss.weight IS NOT NULL THEN wss.reps * wss.weight ELSE 0 END) as total_volume,
        COUNT(wss.id) as total_sets,
        SUM(COALESCE(wss.reps, 0)) as total_reps
      FROM workout_sessions ws
      LEFT JOIN workout_session_exercises wse ON wse.workout_session_id = ws.id
      LEFT JOIN workout_session_sets wss ON wss.workout_session_exercise_id = wse.id
      WHERE ws.user_id = ?
        AND ws.status = 'completed'
    `,
    [userId]
  );
}

function getDurationMinutes(sessions: WorkoutSessionAggregateRow[]) {
  return sessions.reduce((total, session) => {
    if (!session.ended_at) {
      return total;
    }

    const startedAt = new Date(session.started_at).getTime();
    const endedAt = new Date(session.ended_at).getTime();

    if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt) || endedAt <= startedAt) {
      return total;
    }

    return total + Math.round((endedAt - startedAt) / 60000);
  }, 0);
}

export function getLocalDailyExerciseMetrics(userId: string, date: Date | string): Omit<DailyExerciseMetrics, "date"> | null {
  ensureNutritionSchema();

  const sessions = getWorkoutSessionsForRange(userId, date);

  if (sessions.length === 0) {
    return null;
  }

  const aggregates = getWorkoutSetAggregates(userId, date);

  return {
    volume: Number(aggregates?.total_volume ?? 0),
    durationMins: getDurationMinutes(sessions),
    workoutType: "Strength",
  };
}

export function getLocalLifetimeTrainingMetrics(userId: string) {
  ensureNutritionSchema();

  const sessions = getWorkoutSessionsForRange(userId);
  const aggregates = getWorkoutSetAggregates(userId);

  return {
    totalSets: aggregates?.total_sets ?? 0,
    totalVolume: Number(aggregates?.total_volume ?? 0),
    totalDurationMins: getDurationMinutes(sessions),
    totalWorkouts: sessions.length,
    totalReps: aggregates?.total_reps ?? 0,
  };
}

export function getFoodLogEntrySyncPayload(entryId: string) {
  ensureNutritionSchema();

  return db.getFirstSync<FoodLogEntryRow>(
    `
      SELECT
        id,
        user_id,
        entry_date,
        logged_at,
        meal_slot,
        name,
        energy_kcal,
        protein_grams,
        fat_grams,
        carbs_grams,
        alcohol_grams,
        created_at,
        updated_at,
        deleted_at
      FROM food_log_entries
      WHERE id = ?
      LIMIT 1
    `,
    [entryId]
  );
}

export function getWeightEntrySyncPayload(entryId: string) {
  ensureNutritionSchema();

  return db.getFirstSync<BodyWeightEntryRow>(
    `
      SELECT id, user_id, entry_date, weight_kg, created_at, updated_at, deleted_at
      FROM body_weight_entries
      WHERE id = ?
      LIMIT 1
    `,
    [entryId]
  );
}

export function getGoalPlanSyncPayload(userId: string): LocalGoalPlanSyncPayload {
  ensureNutritionSchema();

  const bodyGoal = getActiveBodyGoalRow(userId);
  const nutritionGoal = getActiveNutritionGoalRow(userId);

  if (!bodyGoal || !nutritionGoal) {
    return null;
  }

  return {
    bodyGoal,
    nutritionGoal,
  };
}

export function upsertPulledFoodLogEntries(userId: string, remoteEntries: FoodLogEntryRow[]) {
  ensureNutritionSchema();

  const remoteIds = new Set(remoteEntries.map((entry) => entry.id));

  db.execSync("BEGIN TRANSACTION;");

  try {
    remoteEntries.forEach((entry) => {
      db.runSync(
        `
          INSERT INTO food_log_entries (
            id,
            user_id,
            entry_date,
            logged_at,
            meal_slot,
            name,
            energy_kcal,
            protein_grams,
            fat_grams,
            carbs_grams,
            alcohol_grams,
            source_type,
            source_id,
            mass_grams,
            created_at,
            updated_at,
            deleted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
          ON CONFLICT(id) DO UPDATE SET
            user_id = excluded.user_id,
            entry_date = excluded.entry_date,
            logged_at = excluded.logged_at,
            meal_slot = excluded.meal_slot,
            name = excluded.name,
            energy_kcal = excluded.energy_kcal,
            protein_grams = excluded.protein_grams,
            fat_grams = excluded.fat_grams,
            carbs_grams = excluded.carbs_grams,
            alcohol_grams = excluded.alcohol_grams,
              source_type = excluded.source_type,
              source_id = excluded.source_id,
              mass_grams = excluded.mass_grams,
            updated_at = excluded.updated_at,
            deleted_at = NULL
        `,
        [
          entry.id,
          entry.user_id,
          entry.entry_date,
          entry.logged_at,
          entry.meal_slot,
          entry.name,
          entry.energy_kcal,
          entry.protein_grams,
          entry.fat_grams,
          entry.carbs_grams,
          entry.alcohol_grams,
          entry.source_type,
          entry.source_id,
          entry.mass_grams,
          entry.created_at,
          entry.updated_at,
        ]
      );
    });

    const localIds = db.getAllSync<{ id: string }>(
      `
        SELECT id
        FROM food_log_entries
        WHERE user_id = ?
          AND deleted_at IS NULL
      `,
      [userId]
    );

    localIds.forEach(({ id }) => {
      if (remoteIds.has(id) || hasPendingOutboxEntry("food_log_entry", id)) {
        return;
      }

      db.runSync("DELETE FROM food_log_entries WHERE id = ?", [id]);
    });

    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }
}

export function upsertPulledWeightEntries(userId: string, remoteEntries: BodyWeightEntryRow[]) {
  ensureNutritionSchema();

  const remoteIds = new Set(remoteEntries.map((entry) => entry.id));

  db.execSync("BEGIN TRANSACTION;");

  try {
    remoteEntries.forEach((entry) => {
      db.runSync(
        `
          INSERT INTO body_weight_entries (
            id,
            user_id,
            entry_date,
            weight_kg,
            created_at,
            updated_at,
            deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, NULL)
          ON CONFLICT(id) DO UPDATE SET
            user_id = excluded.user_id,
            entry_date = excluded.entry_date,
            weight_kg = excluded.weight_kg,
            updated_at = excluded.updated_at,
            deleted_at = NULL
        `,
        [
          entry.id,
          entry.user_id,
          entry.entry_date,
          entry.weight_kg,
          entry.created_at,
          entry.updated_at,
        ]
      );
    });

    const localIds = db.getAllSync<{ id: string }>(
      `
        SELECT id
        FROM body_weight_entries
        WHERE user_id = ?
          AND deleted_at IS NULL
      `,
      [userId]
    );

    localIds.forEach(({ id }) => {
      if (remoteIds.has(id) || hasPendingOutboxEntry("weight_entry", id)) {
        return;
      }

      db.runSync("DELETE FROM body_weight_entries WHERE id = ?", [id]);
    });

    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }
}

export function upsertPulledGoalPlan(
  userId: string,
  bodyGoal: BodyGoalRow | null,
  nutritionGoal: {
    id: string;
    user_id: string;
    goal_id: string;
    program_mode: NutritionGoal["programMode"];
    calorie_target: number;
    protein_target_grams: number;
    fat_target_grams: number;
    carb_target_grams: number;
    maintenance_calorie_estimate: number | null;
    planned_daily_energy_delta: number | null;
    created_at: string;
    updated_at: string;
  } | null,
  preferences: {
    protein_preference: NutritionGoal["proteinPreference"];
    carb_preference: NutritionGoal["carbPreference"];
    fat_preference: NutritionGoal["fatPreference"];
  } | null,
  adaptiveSettings: {
    is_enabled: boolean;
  } | null
) {
  ensureNutritionSchema();

  db.execSync("BEGIN TRANSACTION;");

  try {
    if (!bodyGoal || !nutritionGoal) {
      if (!hasPendingOutboxEntry("goal_plan", userId)) {
        db.runSync("UPDATE nutrition_goals SET deleted_at = ?, is_active = 0 WHERE user_id = ? AND deleted_at IS NULL", [
          new Date().toISOString(),
          userId,
        ]);
        db.runSync("UPDATE body_goals SET deleted_at = ? WHERE user_id = ? AND deleted_at IS NULL AND status = 'active'", [
          new Date().toISOString(),
          userId,
        ]);
      }

      db.execSync("COMMIT;");
      return;
    }

    db.runSync(
      `
        INSERT INTO body_goals (
          id,
          user_id,
          goal_type,
          status,
          start_weight_kg,
          target_weight_kg,
          target_rate_kg_per_week,
          started_on,
          completed_on,
          paused_on,
          notes,
          created_at,
          updated_at,
          deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
        ON CONFLICT(id) DO UPDATE SET
          goal_type = excluded.goal_type,
          status = excluded.status,
          start_weight_kg = excluded.start_weight_kg,
          target_weight_kg = excluded.target_weight_kg,
          target_rate_kg_per_week = excluded.target_rate_kg_per_week,
          started_on = excluded.started_on,
          completed_on = excluded.completed_on,
          paused_on = excluded.paused_on,
          notes = excluded.notes,
          updated_at = excluded.updated_at,
          deleted_at = NULL
      `,
      [
        bodyGoal.id,
        bodyGoal.user_id,
        bodyGoal.goal_type,
        bodyGoal.status,
        bodyGoal.start_weight_kg,
        bodyGoal.target_weight_kg,
        bodyGoal.target_rate_kg_per_week,
        bodyGoal.started_on,
        bodyGoal.completed_on,
        bodyGoal.paused_on,
        bodyGoal.notes,
        bodyGoal.created_at,
        bodyGoal.updated_at,
      ]
    );

    db.runSync(
      `
        INSERT INTO nutrition_goals (
          id,
          user_id,
          body_goal_id,
          program_mode,
          calorie_goal,
          protein_goal,
          fat_goal,
          carbs_goal,
          maintenance_calories,
          planned_daily_energy_delta,
          protein_preference,
          carb_preference,
          fat_preference,
          adaptive_enabled,
          is_active,
          created_at,
          updated_at,
          deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NULL)
        ON CONFLICT(id) DO UPDATE SET
          body_goal_id = excluded.body_goal_id,
          program_mode = excluded.program_mode,
          calorie_goal = excluded.calorie_goal,
          protein_goal = excluded.protein_goal,
          fat_goal = excluded.fat_goal,
          carbs_goal = excluded.carbs_goal,
          maintenance_calories = excluded.maintenance_calories,
          planned_daily_energy_delta = excluded.planned_daily_energy_delta,
          protein_preference = excluded.protein_preference,
          carb_preference = excluded.carb_preference,
          fat_preference = excluded.fat_preference,
          adaptive_enabled = excluded.adaptive_enabled,
          is_active = 1,
          updated_at = excluded.updated_at,
          deleted_at = NULL
      `,
      [
        nutritionGoal.id,
        nutritionGoal.user_id,
        nutritionGoal.goal_id,
        nutritionGoal.program_mode,
        nutritionGoal.calorie_target,
        nutritionGoal.protein_target_grams,
        nutritionGoal.fat_target_grams,
        nutritionGoal.carb_target_grams,
        nutritionGoal.maintenance_calorie_estimate,
        nutritionGoal.planned_daily_energy_delta,
        preferences?.protein_preference ?? "standard",
        preferences?.carb_preference ?? "balanced",
        preferences?.fat_preference ?? "balanced",
        adaptiveSettings?.is_enabled ? 1 : 0,
        nutritionGoal.created_at,
        nutritionGoal.updated_at,
      ]
    );

    db.runSync(
      `
        UPDATE nutrition_goals
        SET is_active = CASE WHEN id = ? THEN 1 ELSE 0 END,
            deleted_at = CASE WHEN id = ? THEN NULL ELSE COALESCE(deleted_at, ?) END
        WHERE user_id = ?
      `,
      [nutritionGoal.id, nutritionGoal.id, nutritionGoal.updated_at, userId]
    );

    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }
}
