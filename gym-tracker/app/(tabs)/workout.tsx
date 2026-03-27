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
        <View style={styles.mainButtonContainer}>
    
          <View style={styles.secondaryButtonContainer}>
            <View style={styles.logFoodButton}>
                <Text style={styles.secondaryButtonText}>Log Food</Text>
            </View>

            <View style={styles.logWeightButton}>
                <Text style={styles.secondaryButtonText}>Log Weight</Text>
            </View>
          </View>

          <View style={styles.startButton} onTouchStart={() => router.push("/workout/active")}>
              <Text style={styles.startButtonText}>Start Workout</Text>
          </View>

        </View>
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
    display: "flex",
    flexDirection: "column",
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
    marginBottom: 35,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    color: "#7C7C7C",
    fontSize: 18,
  },
    secondaryButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12, // 👈 THIS is important
  },
  logFoodButton: {
    flex: 1,
    height: 40,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  logWeightButton: {
    flex: 1,
    height: 40,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  secondaryButtonText: {
    color: "#7C7C7C",
    fontSize: 16,
  },
  mainButtonContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
});