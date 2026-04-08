import React from "react";
import { View, Text } from "react-native";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { WeightEntry } from "@/types/dashboard";
import { getWeightTrend } from "@/utils/weightProgress";
import { formatWeight, type UnitPreference } from "@/utils/unitSystem";

type WeightTrendSectionProps = {
    entries: WeightEntry[];
    unitPreference: UnitPreference;
};

export default function WeightTrendSection({
    entries,
    unitPreference,
}: WeightTrendSectionProps) {
    const { theme } = useAppTheme();
    const { changeKg } = getWeightTrend(entries);
    const styles = createThemedStyles(theme, (currentTheme) => ({
        container: {
            width: "100%",
            height: 85,
            backgroundColor: currentTheme.colors.surface,
            borderRadius: currentTheme.radii.md,
            padding: 10,
            marginBottom: 10,
            justifyContent: "center" as const,
        },
        title: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.body.fontSize - 1,
            lineHeight: currentTheme.typography.body.lineHeight - 1,
            fontWeight: currentTheme.typography.label.fontWeight,
            marginBottom: 6,
        },
        weightText: {
            color: currentTheme.colors.textPrimary,
            fontSize: currentTheme.typography.title.fontSize + 2,
            lineHeight: currentTheme.typography.title.lineHeight + 2,
            fontWeight: currentTheme.typography.title.fontWeight,
        },
        changeText: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.caption.fontSize,
            lineHeight: currentTheme.typography.caption.lineHeight,
            fontWeight: currentTheme.typography.caption.fontWeight,
            marginTop: 4,
        },
    }));

    const arrow = changeKg > 0.05 ? "↑" : changeKg < -0.05 ? "↓" : "→";

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Weight Trend</Text>
            <Text style={styles.weightText}>
                {arrow} {formatWeight(Math.abs(changeKg), unitPreference)}
            </Text>
            <Text style={styles.changeText}>
                in the past week
            </Text>
        </View>
    );
}
