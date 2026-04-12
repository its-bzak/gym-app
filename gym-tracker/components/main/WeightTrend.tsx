import React from "react";
import { View, Text } from "react-native";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { WeightEntry } from "@/types/dashboard";
import { getAverageWeight, getWeightTrend } from "@/utils/weightProgress";
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
    const averageWeightKg = getAverageWeight(entries, 7);
    const styles = createThemedStyles(theme, (currentTheme) => ({
        container: {
            width: "100%",
            minHeight: 128,
            backgroundColor: currentTheme.colors.surface,
            borderRadius: currentTheme.radii.md,
            paddingTop: 14,
            paddingHorizontal: 14,
            paddingBottom: 10,
            justifyContent: "center" as const,
        },
        title: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.body.fontSize - 1,
            lineHeight: currentTheme.typography.body.lineHeight - 1,
            fontWeight: currentTheme.typography.label.fontWeight,
            marginBottom: 12,
        },
        metricsRow: {
            flexDirection: "row" as const,
            gap: 12,
        },
        metricColumn: {
            flex: 1,
        },
        metricColumnLeft: {
            alignItems: "flex-start" as const,
        },
        metricColumnRight: {
            alignItems: "flex-end" as const,
        },
        metricLabel: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.caption.fontSize,
            lineHeight: currentTheme.typography.caption.lineHeight,
            fontWeight: currentTheme.typography.caption.fontWeight,
            marginBottom: 6,
        },
        metricLabelLeft: {
            textAlign: "left" as const,
        },
        metricLabelRight: {
            textAlign: "right" as const,
        },
        weightText: {
            color: currentTheme.colors.textPrimary,
            fontSize: currentTheme.typography.title.fontSize + 2,
            lineHeight: currentTheme.typography.title.lineHeight + 2,
            fontWeight: currentTheme.typography.title.fontWeight,
        },
        weightTextLeft: {
            textAlign: "left" as const,
        },
        weightTextRight: {
            textAlign: "right" as const,
        },
        changeText: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.caption.fontSize,
            lineHeight: currentTheme.typography.caption.lineHeight,
            fontWeight: currentTheme.typography.caption.fontWeight,
            marginTop: 4,
        },
        changeTextLeft: {
            textAlign: "left" as const,
        },
        changeTextRight: {
            textAlign: "right" as const,
        },
    }));

    const arrow = changeKg > 0.05 ? "↑" : changeKg < -0.05 ? "↓" : "→";

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Weight Trend</Text>
            <View style={styles.metricsRow}>
                <View style={[styles.metricColumn, styles.metricColumnLeft]}>
                    <Text style={[styles.metricLabel, styles.metricLabelLeft]}>Net Change</Text>
                    <Text style={[styles.weightText, styles.weightTextLeft]}>
                        {arrow} {formatWeight(Math.abs(changeKg), unitPreference)}
                    </Text>
                    <Text style={[styles.changeText, styles.changeTextLeft]}>
                        in the past week
                    </Text>
                </View>

                <View style={[styles.metricColumn, styles.metricColumnRight]}>
                    <Text style={[styles.metricLabel, styles.metricLabelRight]}>Estimated True Weight</Text>
                    <Text style={[styles.weightText, styles.weightTextRight]}>
                        {averageWeightKg === null ? "No data yet" : formatWeight(averageWeightKg, unitPreference)}
                    </Text>
                    <Text style={[styles.changeText, styles.changeTextRight]}>
                        seven day average
                    </Text>
                </View>
            </View>
        </View>
    );
}
