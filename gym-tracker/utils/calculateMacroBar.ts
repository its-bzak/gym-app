export type MacroBarProps = {
    protein: number;
    proteinGoal: number;
    fat: number;
    fatGoal: number;
    carbs: number;
    carbsGoal: number;
    calorieGoal: number;
};

export function calculateMacroBar({
    protein,
    fat,
    carbs,
    calorieGoal,
}: MacroBarProps) {
    const proteinCalories = protein * 4;
    const fatCalories = fat * 9;
    const carbCalories = carbs * 4;

    const totalCaloriesConsumed =
        proteinCalories + fatCalories + carbCalories;

    const isOverflow = totalCaloriesConsumed > calorieGoal;

    const widthBase = isOverflow
        ? totalCaloriesConsumed
        : calorieGoal;

    if (widthBase <= 0) {
        return {
            proteinPercent: 0,
            fatPercent: 0,
            carbsPercent: 0,
            remainingPercent: 100,
            totalCaloriesConsumed,
            isOverflow: false,
        };
    }

    const proteinPercent = (proteinCalories / widthBase) * 100;
    const fatPercent = (fatCalories / widthBase) * 100;
    const carbsPercent = (carbCalories / widthBase) * 100;

    const remainingPercent = isOverflow
        ? 0
        : Math.max(
              100 - (proteinPercent + fatPercent + carbsPercent),
              0
          );

    return {
        proteinPercent,
        fatPercent,
        carbsPercent,
        remainingPercent,
        totalCaloriesConsumed,
        isOverflow,
    };
}