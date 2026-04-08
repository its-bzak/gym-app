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
            height: 85,
            backgroundColor: currentTheme.colors.surface,
            borderRadius: currentTheme.radii.md,
            padding: 10,
            marginBottom: 20,
        },
        title: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.body.fontSize - 1,
            lineHeight: currentTheme.typography.body.lineHeight - 1,
            fontWeight: currentTheme.typography.label.fontWeight,
            marginBottom: 8,
        },
        progressWrap: {
            marginBottom: 8,
        },
        subText: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.caption.fontSize,
            lineHeight: currentTheme.typography.caption.lineHeight,
            fontWeight: currentTheme.typography.caption.fontWeight,
        },
    }));

    if (!goal) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Goal Progress</Text>
                <View style={styles.progressWrap}>
                    <ProgressBar value={0} max={1} tone="accent" />
                </View>
                <Text style={styles.subText}>No active goal yet</Text>
            </View>
        );
    }

    const { currentWeight, progressPercent, remainingKg, isComplete } =
        getGoalProgress(entries, goal);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Goal Progress</Text>

            <View style={styles.progressWrap}>
                <ProgressBar value={progressPercent} max={100} tone="accent" />
            </View>

            <Text style={styles.subText}>
                {isComplete
                    ? "Goal reached"
                    : `${formatWeight(remainingKg, unitPreference)} to go`}
            </Text>
        </View>
    );
}
