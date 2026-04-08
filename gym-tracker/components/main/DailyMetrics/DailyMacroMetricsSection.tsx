import { Text, View } from "react-native";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import { MacroBarProps, calculateMacroBar } from "@/utils/calculateMacroBar";

const defaultDailyMacroMetrics: MacroBarProps = {
    protein: 0,
    proteinGoal: 0,
    fat: 0,
    fatGoal: 0,
    carbs: 0,
    carbsGoal: 0,
    calorieGoal: 0,
};

export default function DailyMacroMetricsSection(props: MacroBarProps = defaultDailyMacroMetrics) {
    const { theme } = useAppTheme();
    const {
        protein,
        proteinGoal,
        fat,
        fatGoal,
        carbs,
        carbsGoal,
        calorieGoal,
    } = props;

    const {
        proteinPercent,
        fatPercent,
        carbsPercent,
        remainingPercent,
        totalCaloriesConsumed,
        isOverflow,
    } = calculateMacroBar(props);

    const styles = createThemedStyles(theme, (currentTheme) => ({
        metricsContainer: {
            width: "100%",
            borderRadius: currentTheme.radii.md,
            paddingTop: 5,
            marginBottom: 5,
        },
        macroTextContainer: {
            flexDirection: "row" as const,
            justifyContent: "space-between" as const,
            alignItems: "center" as const,
            marginBottom: 5,
        },
        leftMacroTextGroup: {
            flexDirection: "row" as const,
            alignItems: "center" as const,
            gap: 14,
            flexShrink: 1,
        },
        macroText: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.caption.fontSize - 1,
            lineHeight: currentTheme.typography.caption.lineHeight - 1,
            fontWeight: currentTheme.typography.label.fontWeight,
        },
        calorieText: {
            color: currentTheme.colors.textSecondary,
            fontSize: currentTheme.typography.caption.fontSize - 1,
            lineHeight: currentTheme.typography.caption.lineHeight - 1,
            fontWeight: currentTheme.typography.label.fontWeight,
            marginLeft: 12,
        },
        macroBarContainer: {
            width: "100%",
            height: 15,
            flexDirection: "row" as const,
            overflow: "hidden" as const,
            borderRadius: currentTheme.radii.md,
            marginBottom: 5,
            backgroundColor: currentTheme.colors.macroCaloriesTrack,
        },
        macroSegment: {
            height: "100%",
        },
        proteinSegment: {
            backgroundColor: currentTheme.colors.macroProtein,
        },
        fatSegment: {
            backgroundColor: currentTheme.colors.macroFat,
        },
        carbSegment: {
            backgroundColor: currentTheme.colors.macroCarbs,
        },
        remainingSegment: {
            backgroundColor: currentTheme.colors.border,
        },
    }));

    return (
        <View style={styles.metricsContainer}>
            <View style={styles.macroTextContainer}>
                <View style={styles.leftMacroTextGroup}>
                    <Text style={styles.macroText}>
                        P) {protein}/{proteinGoal}g
                    </Text>
                    <Text style={styles.macroText}>
                        F) {fat}/{fatGoal}g
                    </Text>
                    <Text style={styles.macroText}>
                        C) {carbs}/{carbsGoal}g
                    </Text>
                </View>

                <Text style={styles.calorieText}>
                    {totalCaloriesConsumed}/{calorieGoal}kcal
                </Text>
            </View>

            <View style={styles.macroBarContainer}>
                <View
                    style={[
                        styles.macroSegment,
                        styles.proteinSegment,
                        { width: `${proteinPercent}%` },
                    ]}
                />
                <View
                    style={[
                        styles.macroSegment,
                        styles.fatSegment,
                        { width: `${fatPercent}%` },
                    ]}
                />
                <View
                    style={[
                        styles.macroSegment,
                        styles.carbSegment,
                        { width: `${carbsPercent}%` },
                    ]}
                />
                {!isOverflow && (
                    <View
                        style={[
                            styles.macroSegment,
                            styles.remainingSegment,
                            { width: `${remainingPercent}%` },
                        ]}
                    />
                )}
            </View>
        </View>
    );
}