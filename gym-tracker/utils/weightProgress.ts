import type { WeightEntry, WeightGoal } from "@/types/dashboard";

export function getLatestWeight(entries: WeightEntry[]) {
    if (!entries.length) return null;
    return entries[entries.length - 1].weightKg;
}

export function getAverageWeight(
    entries: WeightEntry[],
    days: number = 7
) {
    if (!entries.length) return null;

    const recentEntries = entries.slice(-days);

    const total = recentEntries.reduce(
        (sum, entry) => sum + entry.weightKg,
        0
    );

    return total / recentEntries.length;
}

export function getWeightTrend(
    entries: WeightEntry[],
    windowSize: number = 7
) {
    if (entries.length < windowSize * 2) {
        return {
            currentWeight: 0,
            previousWeight: 0,
            changeKg: 0,
            chartData: entries.map((e) => e.weightKg),
        };
    }

    const chartData = entries.map((entry) => entry.weightKg);

    const currentWeek = entries.slice(-windowSize);
    const previousWeek = entries.slice(-windowSize * 2, -windowSize);

    const average = (arr: WeightEntry[]) =>
        arr.reduce((sum, entry) => sum + entry.weightKg, 0) / arr.length;

    const currentWeight = average(currentWeek);
    const previousWeight = average(previousWeek);
    const changeKg = currentWeight - previousWeight;

    return {
        currentWeight,
        previousWeight,
        changeKg,
        chartData,
    };
}

export function getGoalProgress(entries: WeightEntry[], goal: WeightGoal) {
    const currentWeight = getAverageWeight(entries, 7);

    if (currentWeight === null) {
        return {
            currentWeight: 0,
            progressPercent: 0,
            remainingKg: 0,
            isComplete: false,
        };
    }

    const { startWeightKg, targetWeightKg } = goal;

    const isWeightLossGoal = targetWeightKg < startWeightKg;
    const totalNeeded = Math.abs(startWeightKg - targetWeightKg);
    const completed = Math.abs(startWeightKg - currentWeight);

    const rawProgress =
        totalNeeded === 0 ? 1 : completed / totalNeeded;

    const progressPercent = Math.min(Math.max(rawProgress * 100, 0), 100);
    const remainingKg = Math.max(Math.abs(currentWeight - targetWeightKg), 0);

    const isComplete = isWeightLossGoal
        ? currentWeight <= targetWeightKg
        : currentWeight >= targetWeightKg;

    return {
        currentWeight,
        progressPercent,
        remainingKg,
        isComplete,
    };
}