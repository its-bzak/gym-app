import { MacroBarProps } from "@/utils/calculateMacroBar";

export const dailyMacroMetrics: MacroBarProps = {
    protein: 187,
    proteinGoal: 200,

    fat: 47,
    fatGoal: 55,

    carbs: 225,
    carbsGoal: 230,

    calorieGoal: 2500,
};

export const dailyExerciseMetrics = {
    volume: 41367,
    durationMins: 98,
    workoutType: "Strength Training",
};

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