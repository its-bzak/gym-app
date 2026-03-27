import { StyleSheet, Text, View } from "react-native";
import { MacroBarProps, calculateMacroBar } from "@/utils/calculateMacroBar";
import { defaultDailyMacroMetrics } from "@/mock/MainScreen/DailyMetricsSection";

export default function DailyMacroMetricsSection(props: MacroBarProps = defaultDailyMacroMetrics) {
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

const styles = StyleSheet.create({
    metricsContainer: {
        width: "100%",
        borderRadius: 10,
        paddingTop: 5,
        marginBottom: 5,
    },
    macroTextContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },
    leftMacroTextGroup: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        flexShrink: 1,
    },
    macroText: {
        color: "hsl(0, 0%, 60%)",
        fontSize: 10,
        fontWeight: "500",
    },
    calorieText: {
        color: "hsl(0, 0%, 60%)",
        fontSize: 10,
        fontWeight: "500",
        marginLeft: 12,
    },
    macroBarContainer: {
        width: "100%",
        height: 15,
        flexDirection: "row",
        overflow: "hidden",
        borderRadius: 8,
        marginBottom: 5,
        backgroundColor: "hsl(0, 0%, 17%)",
    },
    macroSegment: {
        height: "100%",
    },
    proteinSegment: {
        backgroundColor: "#E8B5B8",
    },
    fatSegment: {
        backgroundColor: "#E6E0AE",
    },
    carbSegment: {
        backgroundColor: "#6EC1DF",
    },
    remainingSegment: {
        backgroundColor: "#B5B5B5",
    },
});