import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { WeightEntry } from "@/mock/MainScreen/DailyMetricsSection";
import { getWeightTrend } from "@/utils/weightProgress";

type WeightTrendSectionProps = {
    entries: WeightEntry[];
};

export default function WeightTrendSection({
    entries,
}: WeightTrendSectionProps) {
    const { currentWeight, changeKg } = getWeightTrend(entries);

    const isDown = changeKg < 0;
    const formattedChange = Math.abs(changeKg).toFixed(1);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Weight Trend</Text>
            <Text style={styles.weightText}>
                {isDown ? "↓" : "↑"} {formattedChange} kg
            </Text>
            <Text style={styles.changeText}>
                in the past week
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
        marginBottom: 10,
    },
    title: {
        color: "#BDBDBD",
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 6,
    },
    weightText: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "700",
    },
    changeText: {
        color: "#7C7C7C",
        fontSize: 12,
        marginTop: 4,
        marginBottom: 12,
    },
    chartPlaceholder: {
        height: 120,
        borderRadius: 8,
        backgroundColor: "#2A2A2A",
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderText: {
        color: "#7C7C7C",
    },
});