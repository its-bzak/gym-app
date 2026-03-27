import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { defaultDailyExerciseMetrics, type DailyExerciseMetrics } from "@/mock/MainScreen/DailyMetricsSection";

function formatVolume(volumeKg: number) {
    if (volumeKg < 1000) {
        return `${volumeKg} kg`;
    }

    const volumeInThousands = volumeKg / 1000;
    const formattedValue = Number.isInteger(volumeInThousands)
        ? volumeInThousands.toString()
        : volumeInThousands.toFixed(1);

    return `${formattedValue}k kg`;
}

function formatDuration(durationMins: number) {
    const hours = Math.floor(durationMins / 60);
    const minutes = durationMins % 60;

    if (hours === 0) {
        return `${minutes} mins`;
    }

    if (minutes === 0) {
        return `${hours}hr`;
    }

    return `${hours}hr ${minutes} mins`;
}


type DailyExerciseMetricsSectionProps = {
    metrics?: Omit<DailyExerciseMetrics, "date">;
};

export default function DailyExerciseMetricsSection({
    metrics = defaultDailyExerciseMetrics,
}: DailyExerciseMetricsSectionProps) {
    return (
        <View style={styles.container}>
            <View style={styles.volumeContainer}>
                <View style={styles.volumeIcon}>
                    <Ionicons name="barbell" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.volumeText}>
                    <Text style={styles.metricText}>{formatVolume(metrics.volume)}</Text>
                </View>
            </View>
            <View style={styles.durationContainer}>
                <View style={styles.durationIcon}>
                    <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.durationText}>
                    <Text style={styles.metricText}>{formatDuration(metrics.durationMins)}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        display: "flex",
        flexDirection: "row",
        width: "100%",
    },
    volumeContainer: {
        display: "flex",
        flexDirection: "row",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    durationContainer: {
        display: "flex",
        flexDirection: "row",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    volumeIcon: {
        width: "15%",
        height: 24,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
    },
    durationIcon: {
        width: "15%",
        height: 24,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
    },
    metricText: {
        fontSize: 12,
        color: "hsl(0, 0%, 60%)",
        alignSelf: "center",
    },
    volumeText: {
        fontSize: 12,
        height: 20,
        width: "70%",
        backgroundColor: "hsl(0, 0%, 17%)",
        borderRadius: 8,
        marginLeft: 10,
        justifyContent: "center",
        marginRight: 12,
        color: "hsl(0, 0%, 60%)",
        alignSelf: "center",
    },
    durationText: {
        fontSize: 12,
        height: 20,
        width: "70%",
        backgroundColor: "hsl(0, 0%, 17%)",
        borderRadius: 8,
        marginLeft: 10,
        justifyContent: "center",
        marginRight: 12,
        color: "hsl(0, 0%, 60%)",
        alignSelf: "center",
    },
});