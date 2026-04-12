import React from "react";
import { View, Text } from "react-native";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { WeightEntry, WeightGoal } from "@/types/dashboard";
import ProgressBar from "@/design/components/primitives/ProgressBar";
import { getGoalProgress } from "@/utils/weightProgress";
import { formatWeight, type UnitPreference } from "@/utils/unitSystem";

type GoalProgressSectionProps = {
    entries: WeightEntry[];
    goal?: WeightGoal | null;
    unitPreference: UnitPreference;
};

export default function GoalProgressSection({
    entries,
    goal,
    unitPreference,
}: GoalProgressSectionProps) {
    const { theme } = useAppTheme();
    const styles = createThemedStyles(theme, (currentTheme) => ({
        container: {
            width: "100%",
            minHeight: 128,
            backgroundColor: currentTheme.colors.surface,
            borderRadius: currentTheme.radii.md,
            paddingTop: 14,
            paddingHorizontal: 14,
            paddingBottom: 8,
        },
        title: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.body.fontSize - 1,
            lineHeight: currentTheme.typography.body.lineHeight - 1,
            fontWeight: currentTheme.typography.label.fontWeight,
        },
        titleLeft: {
            textAlign: "left" as const,
        },
        titleRow: {
            flexDirection: "row" as const,
            alignItems: "center" as const,
            justifyContent: "space-between" as const,
            marginBottom: 12,
        },
        percentText: {
            color: currentTheme.colors.textPrimary,
            fontSize: currentTheme.typography.body.fontSize,
            lineHeight: currentTheme.typography.body.lineHeight,
            fontWeight: currentTheme.typography.label.fontWeight,
            textAlign: "right" as const,
        },
        progressWrap: {
            marginBottom: 8,
        },
        summaryRow: {
            flexDirection: "row" as const,
            alignItems: "flex-start" as const,
            justifyContent: "space-between" as const,
            gap: 12,
        },
        summaryLineText: {
            flex: 1,
            color: currentTheme.colors.textPrimary,
            fontSize: currentTheme.typography.caption.fontSize + 1,
            lineHeight: currentTheme.typography.caption.lineHeight + 1,
            fontWeight: currentTheme.typography.body.fontWeight,
        },
        summaryLineTextLeft: {
            textAlign: "left" as const,
        },
        summaryLineTextRight: {
            textAlign: "right" as const,
        },
    }));

    if (!goal) {
        return (
            <View style={styles.container}>
                <Text style={[styles.title, styles.titleLeft]}>Goal Progress</Text>
                <View style={styles.progressWrap}>
                    <ProgressBar value={0} max={1} tone="accent" />
                </View>
                <Text style={[styles.summaryLineText, styles.summaryLineTextLeft]}>No active goal yet</Text>
            </View>
        );
    }

    const { currentWeight, progressPercent, remainingKg, isComplete } =
        getGoalProgress(entries, goal);
    const netChangeKg = Math.abs(goal.startWeightKg - currentWeight);
    const isWeightLossGoal = goal.targetWeightKg < goal.startWeightKg;
    const completedLabel = isWeightLossGoal ? "You've lost" : "You've gained";

    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <Text style={[styles.title, styles.titleLeft]}>Goal Progress</Text>
                <Text style={styles.percentText}>{`${Math.round(progressPercent)}% completed`}</Text>
            </View>

            <View style={styles.progressWrap}>
                <ProgressBar value={progressPercent} max={100} tone="accent" />
            </View>

            <View style={styles.summaryRow}>
                <Text style={[styles.summaryLineText, styles.summaryLineTextLeft]}>
                    {completedLabel} {formatWeight(netChangeKg, unitPreference)}
                </Text>

                <Text style={[styles.summaryLineText, styles.summaryLineTextRight]}>
                    {isComplete
                        ? "You have reached your goal"
                        : `You have ${formatWeight(remainingKg, unitPreference)} to go`}
                </Text>
            </View>
        </View>
    );
}
