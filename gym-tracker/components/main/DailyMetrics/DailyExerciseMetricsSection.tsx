import { Text, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { DailyExerciseMetrics } from "@/types/dashboard";
import {
    convertWeightKgToUnit,
    getWeightUnitLabel,
    type UnitPreference,
} from "@/utils/unitSystem";

const defaultDailyExerciseMetrics: Omit<DailyExerciseMetrics, "date"> = {
    volume: 0,
    durationMins: 0,
    workoutType: "",
};

function formatVolume(volumeKg: number, unitPreference: UnitPreference) {
    const volume = convertWeightKgToUnit(volumeKg, unitPreference);
    const unitLabel = getWeightUnitLabel(unitPreference);

    if (volume < 1000) {
        return `${Math.round(volume)} ${unitLabel}`;
    }

    const volumeInThousands = volume / 1000;
    const formattedValue = Number.isInteger(volumeInThousands)
        ? volumeInThousands.toString()
        : volumeInThousands.toFixed(1);

    return `${formattedValue}k ${unitLabel}`;
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
    unitPreference: UnitPreference;
};

export default function DailyExerciseMetricsSection({
    metrics = defaultDailyExerciseMetrics,
    unitPreference,
}: DailyExerciseMetricsSectionProps) {
    const { theme } = useAppTheme();
    const styles = createThemedStyles(theme, (currentTheme) => ({
        container: {
            flexDirection: "row" as const,
            width: "100%",
        },
        volumeContainer: {
            flexDirection: "row" as const,
            flex: 1,
            alignItems: "center" as const,
            justifyContent: "center" as const,
        },
        durationContainer: {
            flexDirection: "row" as const,
            flex: 1,
            alignItems: "center" as const,
            justifyContent: "center" as const,
        },
        volumeIcon: {
            width: "15%",
            height: 24,
            justifyContent: "center" as const,
            alignItems: "center" as const,
            borderRadius: 12,
        },
        durationIcon: {
            width: "15%",
            height: 24,
            justifyContent: "center" as const,
            alignItems: "center" as const,
            borderRadius: 12,
        },
        metricText: {
            fontSize: currentTheme.typography.caption.fontSize + 1,
            lineHeight: currentTheme.typography.caption.lineHeight + 1,
            color: currentTheme.colors.textSecondary,
            fontWeight: currentTheme.typography.caption.fontWeight,
            alignSelf: "center" as const,
        },
        volumeText: {
            height: 20,
            width: "70%",
            backgroundColor: currentTheme.colors.surface,
            borderRadius: currentTheme.radii.md,
            marginLeft: 10,
            justifyContent: "center" as const,
            marginRight: 12,
            alignSelf: "center" as const,
            borderWidth: 1,
            borderColor: currentTheme.colors.borderMuted,
        },
        durationText: {
            height: 20,
            width: "70%",
            backgroundColor: currentTheme.colors.surface,
            borderRadius: currentTheme.radii.md,
            marginLeft: 10,
            justifyContent: "center" as const,
            marginRight: 12,
            alignSelf: "center" as const,
            borderWidth: 1,
            borderColor: currentTheme.colors.borderMuted,
        },
    }));

    return (
        <View style={styles.container}>
            <View style={styles.volumeContainer}>
                <View style={styles.volumeIcon}>
                    <Ionicons name="barbell" size={20} color={theme.colors.iconPrimary} />
                </View>
                <View style={styles.volumeText}>
                    <Text style={styles.metricText}>{formatVolume(metrics.volume, unitPreference)}</Text>
                </View>
            </View>
            <View style={styles.durationContainer}>
                <View style={styles.durationIcon}>
                    <Ionicons name="time-outline" size={20} color={theme.colors.iconPrimary} />
                </View>
                <View style={styles.durationText}>
                    <Text style={styles.metricText}>{formatDuration(metrics.durationMins)}</Text>
                </View>
            </View>
        </View>
    );
}