import { Text, View } from "react-native";
import type { GestureResponderHandlers } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DailyExerciseMetrics } from "@/types/dashboard";
import type { UnitPreference } from "@/utils/unitSystem";
import {
  formatDuration,
  formatVolume,
} from "@/components/main/DailyMetrics/DailyExerciseMetricsSection";

type ExerciseMetricSnapshot = Omit<DailyExerciseMetrics, "date">;

export interface TodaysExerciseCardProps {
  metrics: ExerciseMetricSnapshot;
  unitPreference: UnitPreference;
  onPressMenu?: () => void;
  onLongPressMenu?: () => void;
  menuResponderHandlers?: GestureResponderHandlers;
}

type MetricTileProps = {
  value: string;
};

const todaysExerciseCardClassNames = {
  cardContainer: "my-3 w-full rounded-[30px] bg-[#111418] px-5 py-5",
  cardHeader: "mb-5 flex-row items-start justify-between",
  cardTitle: "text-[22px] font-semibold tracking-[0.2px] text-white",
  menuButton: "h-10 w-10 items-center justify-center rounded-full bg-[#191F27]",
  displayPanel: "aspect-square w-full rounded-[26px] border border-[#252C35] bg-[#161B22]",
  metricRow: "mt-5 flex-row gap-3",
  metricTile: "flex-1 items-center justify-center rounded-[20px] border border-[#252C35] bg-[#161B22] px-4 py-3",
  metricTileValue: "text-[18px] font-normal leading-5 text-white",
} as const;

function formatExerciseVolumeValue(volumeKg: number, unitPreference: UnitPreference) {
  const formattedValue = formatVolume(volumeKg, unitPreference);

  if (unitPreference === "imperial") {
    return formattedValue.replace(/ lb\b/g, " lbs");
  }

  return formattedValue;
}

function MetricTile({ value }: MetricTileProps) {
  return (
    <View className={todaysExerciseCardClassNames.metricTile}>
      <Text className={todaysExerciseCardClassNames.metricTileValue}>{value}</Text>
    </View>
  );
}

export default function TodaysExerciseCard({
  metrics,
  unitPreference,
  onPressMenu,
  onLongPressMenu,
  menuResponderHandlers,
}: TodaysExerciseCardProps) {
  return (
    <View className={todaysExerciseCardClassNames.cardContainer}>
      <View className={todaysExerciseCardClassNames.cardHeader}>
        <Text className={todaysExerciseCardClassNames.cardTitle}>Today&apos;s Exercise</Text>

        <View
          accessibilityLabel="Exercise card menu"
          accessible
          className={todaysExerciseCardClassNames.menuButton}
          onStartShouldSetResponder={() => true}
          {...menuResponderHandlers}>
          <Ionicons color="#C9D3E3" name="menu-outline" size={18} />
        </View>
      </View>

      <View className={todaysExerciseCardClassNames.displayPanel}>
        <View className="flex-1" />
      </View>

      <View className={todaysExerciseCardClassNames.metricRow}>
        <MetricTile
          value={formatExerciseVolumeValue(metrics.volume, unitPreference)}
        />
        <MetricTile
          value={formatDuration(metrics.durationMins)}
        />
      </View>
    </View>
  );
}