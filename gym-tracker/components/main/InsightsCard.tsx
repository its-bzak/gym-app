import { Text, View } from "react-native";
import type { GestureResponderHandlers } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import WeightTrendSection from "@/components/main/WeightTrend";
import GoalProgressSection from "@/components/main/GoalProgress";
import type { WeightEntry, WeightGoal } from "@/types/dashboard";
import type { UnitPreference } from "@/utils/unitSystem";

const insightsCardClassNames = {
  cardContainer: "my-3 w-full rounded-[30px] bg-[#111418] px-5 py-5",
  cardHeader: "mb-5 flex-row items-start justify-between",
  cardTitle: "text-[22px] font-semibold tracking-[0.2px] text-white",
  menuButton: "h-10 w-10 items-center justify-center rounded-full bg-[#191F27]",
  contentColumn: "gap-3",
} as const;

export interface InsightsCardProps {
  entries: WeightEntry[];
  goal?: WeightGoal | null;
  unitPreference: UnitPreference;
  menuResponderHandlers?: GestureResponderHandlers;
}

export default function InsightsCard({
  entries,
  goal,
  unitPreference,
  menuResponderHandlers,
}: InsightsCardProps) {
  return (
    <View className={insightsCardClassNames.cardContainer}>
      <View className={insightsCardClassNames.cardHeader}>
        <Text className={insightsCardClassNames.cardTitle}>Insights</Text>

        <View
          accessibilityLabel="Insights card menu"
          accessible
          className={insightsCardClassNames.menuButton}
          onStartShouldSetResponder={() => true}
          {...menuResponderHandlers}>
          <Ionicons color="#C9D3E3" name="menu-outline" size={18} />
        </View>
      </View>

      <View className={insightsCardClassNames.contentColumn}>
        <WeightTrendSection entries={entries} unitPreference={unitPreference} />
        <GoalProgressSection entries={entries} goal={goal} unitPreference={unitPreference} />
      </View>
    </View>
  );
}