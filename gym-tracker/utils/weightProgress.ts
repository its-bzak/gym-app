import type { WeightEntry, WeightGoal } from "@/types/dashboard";

function sortEntriesByDate(entries: WeightEntry[]) {
    return [...entries].sort((left, right) => left.date.localeCompare(right.date));
}

function getDateOffset(dateString: string, offsetDays: number) {
    const date = new Date(`${dateString}T00:00:00`);
    date.setDate(date.getDate() + offsetDays);

    return date.toISOString().slice(0, 10);
}

function getAverageFromEntries(entries: WeightEntry[]) {
    if (!entries.length) {
        return null;
    }

    const total = entries.reduce((sum, entry) => sum + entry.weightKg, 0);

    return total / entries.length;
}

function getEntriesBetween(entries: WeightEntry[], startDate: string, endDate: string) {
    return entries.filter((entry) => entry.date >= startDate && entry.date <= endDate);
}

export function getLatestWeight(entries: WeightEntry[]) {
    if (!entries.length) return null;
    const sortedEntries = sortEntriesByDate(entries);
    return sortedEntries[sortedEntries.length - 1].weightKg;
}

export function getAverageWeight(
    entries: WeightEntry[],
    days: number = 7
) {
    if (!entries.length) return null;

    const sortedEntries = sortEntriesByDate(entries);
    const latestEntry = sortedEntries[sortedEntries.length - 1];
    const startDate = getDateOffset(latestEntry.date, -(days - 1));
    const recentEntries = getEntriesBetween(sortedEntries, startDate, latestEntry.date);

    return getAverageFromEntries(recentEntries);
}

export function getWeightTrend(
    entries: WeightEntry[],
    windowSize: number = 7
) {
    if (!entries.length) {
        return {
            currentWeight: 0,
            previousWeight: 0,
            changeKg: 0,
            chartData: [],
        };
    }

    const sortedEntries = sortEntriesByDate(entries);
    const chartData = sortedEntries.map((entry) => entry.weightKg);
    const latestEntry = sortedEntries[sortedEntries.length - 1];
    const currentStartDate = getDateOffset(latestEntry.date, -(windowSize - 1));
    const previousEndDate = getDateOffset(currentStartDate, -1);
    const previousStartDate = getDateOffset(previousEndDate, -(windowSize - 1));

    const currentWeek = getEntriesBetween(sortedEntries, currentStartDate, latestEntry.date);
    const previousWeek = getEntriesBetween(sortedEntries, previousStartDate, previousEndDate);

    const currentWeight = getAverageFromEntries(currentWeek) ?? sortedEntries[sortedEntries.length - 1].weightKg;
    const previousWeight = getAverageFromEntries(previousWeek) ?? currentWeight;
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