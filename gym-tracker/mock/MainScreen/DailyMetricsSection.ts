import { MacroBarProps } from "@/utils/calculateMacroBar";

export type DatedMacroMetrics = MacroBarProps & {
    date: string;
};

export type DailyExerciseMetrics = {
    date: string;
    volume: number;
    durationMins: number;
    workoutType: string;
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

export const DEFAULT_METRICS_DATE = "2026-03-27";

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