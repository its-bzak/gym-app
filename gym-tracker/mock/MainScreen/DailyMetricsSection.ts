import { MacroBarProps } from "@/utils/calculateMacroBar";
import { getCurrentDate } from "@/utils/dateFormat";
import type {
    DailyExerciseMetrics,
    DatedMacroMetrics,
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