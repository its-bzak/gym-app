import { MacroBarProps } from "@/utils/calculateMacroBar";
import { getCurrentDate } from "@/utils/dateFormat";
import type {
    DailyExerciseMetrics,
    DatedMacroMetrics,
    FoodLogDaySummary,
    FoodLogEntry,
    FoodLogMealSlot,
    NutritionGoal,
    WeightEntry,
    WeightGoal,
} from "@/types/dashboard";

type WeightTrendSectionProps = {
    entries: WeightEntry[];
};

type GoalProgressSectionProps = {
    entries: WeightEntry[];
    goal: WeightGoal;
};

export const dailyMacroMetricsByDate: DatedMacroMetrics[] = [
    {
        date: "2026-03-25",
        protein: 164,
        proteinGoal: 200,
        fat: 42,
        fatGoal: 55,
        carbs: 198,
        carbsGoal: 230,
        calorieGoal: 2500,
    },
    {
        date: "2026-03-26",
        protein: 187,
        proteinGoal: 200,
        fat: 47,
        fatGoal: 55,
        carbs: 225,
        carbsGoal: 230,
        calorieGoal: 2500,
    },
    {
        date: "2026-03-27",
        protein: 201,
        proteinGoal: 200,
        fat: 51,
        fatGoal: 55,
        carbs: 214,
        carbsGoal: 230,
        calorieGoal: 2500,
    },
    {
        date: "2026-03-28",
        protein: 143,
        proteinGoal: 200,
        fat: 36,
        fatGoal: 55,
        carbs: 161,
        carbsGoal: 230,
        calorieGoal: 2500,
    },
    {
        date: "2026-03-29",
        protein: 0,
        proteinGoal: 200,
        fat: 0,
        fatGoal: 55,
        carbs: 0,
        carbsGoal: 230,
        calorieGoal: 2500,
    },
];

export const dailyExerciseMetricsByDate: DailyExerciseMetrics[] = [
    {
        date: "2026-03-25",
        volume: 15000,
        durationMins: 90,
        workoutType: "Strength Training",
    },
    {
        date: "2026-03-26",
        volume: 23195,
        durationMins: 74,
        workoutType: "Upper Body",
    },
    {
        date: "2026-03-27",
        volume: 41367,
        durationMins: 98,
        workoutType: "Strength Training",
    },
    {
        date: "2026-03-28",
        volume: 12480,
        durationMins: 52,
        workoutType: "Strength Training",
    },
    {
        date: "2026-03-29",
        volume: 0,
        durationMins: 0,
        workoutType: "Strength Training",
    },
];

export const mockWeightEntries: WeightEntry[] = [
    { date: "2026-03-25", weightKg: 74 },
    { date: "2026-03-26", weightKg: 74 },
    { date: "2026-03-27", weightKg: 73.8 },
    { date: "2026-03-28", weightKg: 73.7 },
    { date: "2026-03-29", weightKg: 73.6 },
    { date: "2026-03-30", weightKg: 73.5 },
    { date: "2026-03-31", weightKg: 73.5 },
    { date: "2026-04-01", weightKg: 73.3 },
    { date: "2026-04-02", weightKg: 73.1 },
    { date: "2026-04-03", weightKg: 72.8 },
    { date: "2026-04-04", weightKg: 72.7 },
    { date: "2026-04-05", weightKg: 72.7 },
    { date: "2026-04-06", weightKg: 72.5 },
    { date: "2026-04-07", weightKg: 72.3 },
    { date: "2026-04-08", weightKg: 72.2 },
    { date: "2026-04-09", weightKg: 72.3 },
    { date: "2026-04-10", weightKg: 72 },
    { date: "2026-04-11", weightKg: 71.8 },
    { date: "2026-04-12", weightKg: 71.5 },
    { date: "2026-04-13", weightKg: 71.2 },
    { date: "2026-04-14", weightKg: 71.2 },
    { date: "2026-04-15", weightKg: 71 },
];

export const mockGoal: WeightGoal = {
    startWeightKg: 74,
    targetWeightKg: 67,
};

export const mockNutritionGoal = {
    proteinGoal: 200,
    fatGoal: 55,
    carbsGoal: 230,
    calorieGoal: 2500,
};

export const mockFoodLogEntries: FoodLogEntry[] = [
    {
        id: "food_log_1",
        entryDate: "2026-04-01",
        loggedAt: "2026-04-01T14:00:00.000Z",
        mealSlot: "snack",
        name: "Smacks By Kellogg's",
        energyKcal: 302,
        protein: 6,
        fat: 1,
        carbs: 65,
        alcoholGrams: 0,
    },
    {
        id: "food_log_2",
        entryDate: "2026-04-01",
        loggedAt: "2026-04-01T14:10:00.000Z",
        mealSlot: "snack",
        name: "Whey 80 Profesional Proteina Chocolate",
        energyKcal: 117,
        protein: 22,
        fat: 2,
        carbs: 3,
        alcoholGrams: 0,
    },
    {
        id: "food_log_3",
        entryDate: "2026-04-01",
        loggedAt: "2026-04-01T14:20:00.000Z",
        mealSlot: "snack",
        name: "Peanut Butter Crema De Cacahuete",
        energyKcal: 204,
        protein: 9,
        fat: 17,
        carbs: 3,
        alcoholGrams: 0,
    },
];


export const DEFAULT_METRICS_DATE = getCurrentDate();

export const defaultDailyMacroMetrics: MacroBarProps = stripDateFromMacroMetrics(
    dailyMacroMetricsByDate.find((entry) => entry.date === DEFAULT_METRICS_DATE) ?? dailyMacroMetricsByDate[0]
);

export const defaultDailyExerciseMetrics = stripDateFromExerciseMetrics(
    dailyExerciseMetricsByDate.find((entry) => entry.date === DEFAULT_METRICS_DATE) ?? dailyExerciseMetricsByDate[0]
);

export function getDateKey(date: Date | string) {
    if (typeof date === "string") {
        return date;
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function getDailyMacroMetrics(date: Date | string): MacroBarProps {
    const matchedMetrics = dailyMacroMetricsByDate.find((entry) => entry.date === getDateKey(date));

    return matchedMetrics
        ? stripDateFromMacroMetrics(matchedMetrics)
        : defaultDailyMacroMetrics;
}

export function getDailyExerciseMetrics(date: Date | string) {
    const matchedMetrics = dailyExerciseMetricsByDate.find((entry) => entry.date === getDateKey(date));

    return matchedMetrics
        ? stripDateFromExerciseMetrics(matchedMetrics)
        : defaultDailyExerciseMetrics;
}

export function upsertDailyMacroMetrics(date: Date | string, metrics: MacroBarProps): MacroBarProps {
    const dateKey = getDateKey(date);
    const existingEntry = dailyMacroMetricsByDate.find((entry) => entry.date === dateKey);

    if (existingEntry) {
        existingEntry.protein = metrics.protein;
        existingEntry.proteinGoal = metrics.proteinGoal;
        existingEntry.fat = metrics.fat;
        existingEntry.fatGoal = metrics.fatGoal;
        existingEntry.carbs = metrics.carbs;
        existingEntry.carbsGoal = metrics.carbsGoal;
        existingEntry.calorieGoal = metrics.calorieGoal;

        return stripDateFromMacroMetrics(existingEntry);
    }

    const newEntry: DatedMacroMetrics = {
        date: dateKey,
        ...metrics,
    };

    dailyMacroMetricsByDate.push(newEntry);

    return stripDateFromMacroMetrics(newEntry);
}

export function addFoodLogEntry(
    date: Date | string,
    entry: Pick<MacroBarProps, "protein" | "fat" | "carbs">
): MacroBarProps {
    const dateKey = getDateKey(date);
    const existingEntry = dailyMacroMetricsByDate.find((item) => item.date === dateKey);

    if (existingEntry) {
        existingEntry.protein += entry.protein;
        existingEntry.fat += entry.fat;
        existingEntry.carbs += entry.carbs;

        return stripDateFromMacroMetrics(existingEntry);
    }

    const newEntry: DatedMacroMetrics = {
        date: dateKey,
        protein: entry.protein,
        fat: entry.fat,
        carbs: entry.carbs,
        ...mockNutritionGoal,
    };

    dailyMacroMetricsByDate.push(newEntry);

    return stripDateFromMacroMetrics(newEntry);
}

export function getFoodLogEntriesForDate(date: Date | string): FoodLogEntry[] {
    const dateKey = getDateKey(date);

    return mockFoodLogEntries
        .filter((entry) => entry.entryDate === dateKey)
        .sort((left, right) => left.loggedAt.localeCompare(right.loggedAt));
}

export function getFoodLogDay(date: Date | string): {
    date: string;
    summary: FoodLogDaySummary;
    entries: FoodLogEntry[];
    nutritionGoal: NutritionGoal;
} {
    const entries = getFoodLogEntriesForDate(date);

    const totals = entries.reduce(
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
        date: getDateKey(date),
        summary: {
            protein: totals.protein,
            fat: totals.fat,
            carbs: totals.carbs,
            consumedCalories: totals.consumedCalories,
            ...mockNutritionGoal,
        },
        entries,
        nutritionGoal: mockNutritionGoal,
    };
}

function buildFoodLogId(): string {
    return `food_log_${Date.now()}`;
}

function buildLoggedAt(date: Date | string, mealSlot?: FoodLogMealSlot): string {
    const dateKey = getDateKey(date);

    if (mealSlot === "breakfast") {
        return `${dateKey}T08:00:00.000Z`;
    }

    if (mealSlot === "lunch") {
        return `${dateKey}T12:00:00.000Z`;
    }

    if (mealSlot === "dinner") {
        return `${dateKey}T18:00:00.000Z`;
    }

    if (mealSlot === "snack") {
        return `${dateKey}T15:00:00.000Z`;
    }

    return `${dateKey}T12:00:00.000Z`;
}

export function appendFoodLogEntryDetailed(
    date: Date | string,
    entry: {
        name?: string;
        mealSlot?: FoodLogMealSlot;
        loggedAt?: string;
        energyKcal?: number;
        protein: number;
        fat: number;
        carbs: number;
        alcoholGrams?: number;
    }
): FoodLogEntry {
    const dateKey = getDateKey(date);
    const nextEntry: FoodLogEntry = {
        id: buildFoodLogId(),
        entryDate: dateKey,
        loggedAt: entry.loggedAt ?? buildLoggedAt(date, entry.mealSlot),
        mealSlot: entry.mealSlot ?? "custom",
        name: entry.name?.trim() || "Quick entry",
        energyKcal:
            entry.energyKcal ?? entry.protein * 4 + entry.fat * 9 + entry.carbs * 4 + (entry.alcoholGrams ?? 0) * 7,
        protein: entry.protein,
        fat: entry.fat,
        carbs: entry.carbs,
        alcoholGrams: entry.alcoholGrams ?? 0,
    };

    mockFoodLogEntries.push(nextEntry);
    addFoodLogEntry(date, {
        protein: entry.protein,
        fat: entry.fat,
        carbs: entry.carbs,
    });

    return nextEntry;
}

export function updateFoodLogEntryDetailed(
    entryId: string,
    date: Date | string,
    entry: {
        name?: string;
        mealSlot?: FoodLogMealSlot;
        loggedAt?: string;
        energyKcal?: number;
        protein: number;
        fat: number;
        carbs: number;
        alcoholGrams?: number;
    }
): FoodLogEntry | null {
    const existingIndex = mockFoodLogEntries.findIndex((item) => item.id === entryId);

    if (existingIndex === -1) {
        return null;
    }

    const nextEntryDate = getDateKey(date);
    const nextEntry: FoodLogEntry = {
        ...mockFoodLogEntries[existingIndex],
        entryDate: nextEntryDate,
        loggedAt: entry.loggedAt ?? buildLoggedAt(date, entry.mealSlot),
        mealSlot: entry.mealSlot ?? "custom",
        name: entry.name?.trim() || "Quick entry",
        energyKcal:
            entry.energyKcal ?? entry.protein * 4 + entry.fat * 9 + entry.carbs * 4 + (entry.alcoholGrams ?? 0) * 7,
        protein: entry.protein,
        fat: entry.fat,
        carbs: entry.carbs,
        alcoholGrams: entry.alcoholGrams ?? 0,
    };

    mockFoodLogEntries[existingIndex] = nextEntry;

    return nextEntry;
}

export function deleteFoodLogEntryDetailed(entryId: string): boolean {
    const existingIndex = mockFoodLogEntries.findIndex((item) => item.id === entryId);

    if (existingIndex === -1) {
        return false;
    }

    mockFoodLogEntries.splice(existingIndex, 1);
    return true;
}

export function upsertWeightEntry(date: Date | string, weightKg: number): WeightEntry {
    const dateKey = getDateKey(date);
    const existingEntry = mockWeightEntries.find((entry) => entry.date === dateKey);

    if (existingEntry) {
        existingEntry.weightKg = weightKg;
    } else {
        mockWeightEntries.push({
            date: dateKey,
            weightKg,
        });
    }

    mockWeightEntries.sort((left, right) => left.date.localeCompare(right.date));

    return mockWeightEntries.find((entry) => entry.date === dateKey) as WeightEntry;
}

export function upsertNutritionGoal(goal: NutritionGoal): NutritionGoal {
    mockNutritionGoal.proteinGoal = goal.proteinGoal;
    mockNutritionGoal.fatGoal = goal.fatGoal;
    mockNutritionGoal.carbsGoal = goal.carbsGoal;
    mockNutritionGoal.calorieGoal = goal.calorieGoal;

    return { ...mockNutritionGoal };
}

export function upsertWeightGoal(goal: WeightGoal): WeightGoal {
    mockGoal.startWeightKg = goal.startWeightKg;
    mockGoal.targetWeightKg = goal.targetWeightKg;

    return { ...mockGoal };
}

function stripDateFromMacroMetrics({ date, ...metrics }: DatedMacroMetrics): MacroBarProps {
    return metrics;
}

function stripDateFromExerciseMetrics({ date, ...metrics }: DailyExerciseMetrics) {
    return metrics;
}

export const mockProfile = {
    username: "testuser",
    email: "testuser@example.com",
    height_cm: 170,
    weight_kg: 74,
    age: 21,
    units: "metric",
    sex: "male",
    experience_level: "intermediate",
}