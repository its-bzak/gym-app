import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { WeightEntry, WeightGoal } from "@/types/dashboard";
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
    if (!goal) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Goal Progress</Text>
                <View style={styles.progressTrack} />
                <Text style={styles.subText}>No active goal yet</Text>
            </View>
        );
    }

    const { currentWeight, progressPercent, remainingKg, isComplete } =
        getGoalProgress(entries, goal);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Goal Progress</Text>

            <View style={styles.progressTrack}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${progressPercent}%` },
                    ]}
                />
            </View>

            <Text style={styles.subText}>
                {isComplete
                    ? "Goal reached"
                    : `${formatWeight(remainingKg, unitPreference)} to go`}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: 85,
        backgroundColor: "#1E1E1E",
        borderRadius: 10,
        padding: 10,
        marginBottom: 20,
    },
    title: {
        color: "#BDBDBD",
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 8,
    },
    mainText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 16,
    },
    progressTrack: {
        width: "100%",
        height: 12,
        backgroundColor: "#2A2A2A",
        borderRadius: 999,
        overflow: "hidden",
        marginBottom: 8,
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#6EC1DF",
        borderRadius: 999,
    },
    subText: {
        color: "#7C7C7C",
        fontSize: 13,
    },
});