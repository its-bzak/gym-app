import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import DateCarousel from "@/components/main/DateCarousel";
import DailyMacroMetricsSection from "@/components/main/DailyMetrics/DailyMacroMetricsSection";
import DailyExerciseMetricsSection from "@/components/main/DailyMetrics/DailyExerciseMetricsSection";
import {
  DEFAULT_METRICS_DATE,
  getDailyExerciseMetrics,
  getDailyMacroMetrics,
} from "@/mock/MainScreen/DailyMetricsSection";

export default function WorkoutScreen() {
  const [selectedDate, setSelectedDate] = useState(() => new Date(DEFAULT_METRICS_DATE));
  const dailyMacroMetrics = getDailyMacroMetrics(selectedDate);
  const dailyExerciseMetrics = getDailyExerciseMetrics(selectedDate);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        
        <DateCarousel selectedDate={selectedDate} onChangeDate={setSelectedDate} />
        <DailyMacroMetricsSection
          protein={dailyMacroMetrics.protein}
          proteinGoal={dailyMacroMetrics.proteinGoal}
          fat={dailyMacroMetrics.fat}
          fatGoal={dailyMacroMetrics.fatGoal}
          carbs={dailyMacroMetrics.carbs}
          carbsGoal={dailyMacroMetrics.carbsGoal}
          calorieGoal={dailyMacroMetrics.calorieGoal}
        />
        <DailyExerciseMetricsSection metrics={dailyExerciseMetrics} />
        <Pressable style={styles.startButton} onPress={() => {router.push("/workout/active")}}>
          <Text style={styles.startButtonText}>Start Workout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#151515",
  },
  screen: {
    flex: 1,
    backgroundColor: "#151515",
    paddingHorizontal: 36,
    paddingTop: 18,
  },
  datePill: {
    height: 42,
    borderRadius: 22,
    backgroundColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  dateText: {
    color: "#7C7C7C",
    fontSize: 16,
    lineHeight: 20,
  },
  startButton: {
    marginTop: "auto",
    marginBottom: 114,
    height: 66,
    borderRadius: 18,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    color: "#7C7C7C",
    fontSize: 22,
  },
});