import { Text, View } from "react-native";
import type { GestureResponderHandlers } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { calculateMacroBar, type MacroBarProps } from "@/utils/calculateMacroBar";

const nutritionCardClassNames = {
  cardContainer: "my-3 w-full rounded-[30px] bg-[#111418] px-5 py-5",
  cardHeader: "mb-6 flex-row items-start justify-between",
  cardTitle: "text-[22px] font-semibold tracking-[0.2px] text-white",
  menuButton: "h-10 w-10 items-center justify-center rounded-full bg-[#191F27]",
  ringFrame: "items-center justify-center",
  ringCenterContent: "absolute inset-0 items-center justify-center",
  calorieSection: "mb-7 items-center",
  calorieContent: "items-center",
  calorieValueText: "text-[40px] font-semibold leading-[44px] text-white",
  calorieGoalText: "mt-1 text-sm font-medium text-[#8FA0B5]",
  calorieUnitText: "mt-2 text-[11px] uppercase tracking-[1.2px] text-[#6E7D90]",
  macroRow: "flex-row items-start justify-between gap-3",
  macroItem: "flex-1 items-center",
  macroRingContent: "items-center px-2",
  macroValueText: "text-sm font-semibold text-white",
  macroGoalText: "text-[11px] text-[#8993A4]",
  macroLabelText: "mt-3 text-xs font-medium uppercase tracking-[0.8px] text-[#98A3B6]",
} as const;

type ProgressRingProps = {
  size: number;
  strokeWidth: number;
  progress: number;
  trackColor: string;
  progressColor: string;
  children?: React.ReactNode;
};

type MacroRingProps = {
  label: string;
  current: number;
  goal: number;
  color: string;
};

export interface TodaysNutritionCardProps extends MacroBarProps {
  onPressMenu?: () => void;
  onLongPressMenu?: () => void;
  menuResponderHandlers?: GestureResponderHandlers;
}

function clampProgress(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}

function ProgressRing({
  size,
  strokeWidth,
  progress,
  trackColor,
  progressColor,
  children,
}: ProgressRingProps) {
  const normalizedProgress = clampProgress(progress);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - normalizedProgress);
  const center = size / 2;

  return (
    <View className={nutritionCardClassNames.ringFrame} style={{ width: size, height: size }}>
      <Svg height={size} width={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={center}
          cy={center}
          fill="none"
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={center}
          cy={center}
          fill="none"
          r={radius}
          stroke={progressColor}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </Svg>

      <View className={nutritionCardClassNames.ringCenterContent}>{children}</View>
    </View>
  );
}

function MacroRing({ label, current, goal, color }: MacroRingProps) {
  const progress = goal > 0 ? current / goal : 0;

  return (
    <View className={nutritionCardClassNames.macroItem}>
      <ProgressRing
        progress={progress}
        progressColor={color}
        size={84}
        strokeWidth={8}
        trackColor="#2A313B">
        <View className={nutritionCardClassNames.macroRingContent}>
          <Text className={nutritionCardClassNames.macroValueText}>{Math.round(current)}g</Text>
          <Text className={nutritionCardClassNames.macroGoalText}>/{Math.round(goal)}g</Text>
        </View>
      </ProgressRing>

      <Text className={nutritionCardClassNames.macroLabelText}>{label}</Text>
    </View>
  );
}

export default function TodaysNutritionCard({
  protein,
  proteinGoal,
  fat,
  fatGoal,
  carbs,
  carbsGoal,
  calorieGoal,
  onPressMenu,
  onLongPressMenu,
  menuResponderHandlers,
}: TodaysNutritionCardProps) {
  const { totalCaloriesConsumed } = calculateMacroBar({
    protein,
    proteinGoal,
    fat,
    fatGoal,
    carbs,
    carbsGoal,
    calorieGoal,
  });

  const calorieProgress = calorieGoal > 0 ? totalCaloriesConsumed / calorieGoal : 0;

  return (
    <View className={nutritionCardClassNames.cardContainer}>
      <View className={nutritionCardClassNames.cardHeader}>
        <Text className={nutritionCardClassNames.cardTitle}>
          Today&apos;s Nutrition
        </Text>

        <View
          accessibilityLabel="Nutrition card menu"
          accessible
          className={nutritionCardClassNames.menuButton}
          onStartShouldSetResponder={() => true}
          {...menuResponderHandlers}>
          <Ionicons color="#C9D3E3" name="menu-outline" size={18} />
        </View>
      </View>

      <View className={nutritionCardClassNames.calorieSection}>
        <ProgressRing
          progress={calorieProgress}
          progressColor="#7CC7FF"
          size={196}
          strokeWidth={14}
          trackColor="#24303D">
          <View className={nutritionCardClassNames.calorieContent}>
            <Text className={nutritionCardClassNames.calorieValueText}>
              {Math.round(totalCaloriesConsumed)}
            </Text>
            <Text className={nutritionCardClassNames.calorieGoalText}>
              of {Math.round(calorieGoal)} kcal
            </Text>
            <Text className={nutritionCardClassNames.calorieUnitText}>
              kcal
            </Text>
          </View>
        </ProgressRing>
      </View>

      <View className={nutritionCardClassNames.macroRow}>
        <MacroRing color="#FF8DA1" current={protein} goal={proteinGoal} label="Protein" />
        <MacroRing color="#FFD36A" current={fat} goal={fatGoal} label="Fat" />
        <MacroRing color="#8DE58F" current={carbs} goal={carbsGoal} label="Carbs" />
      </View>
    </View>
  );
}