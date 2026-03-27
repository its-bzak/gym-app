import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import StartWorkoutBar from "@/components/workout/StartWorkoutBar";
import ActivityCard from "@/components/social/ActivityCard";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { navigate } from "expo-router/build/global-state/routing";
import { useState } from "react";
import DateCarousel from "@/components/main/DateCarousel";
import DailyMacroMetricsSection from "@/components/main/DailyMetrics/DailyMacroMetricsSection";
import DailyExerciseMetricsSection from "@/components/main/DailyMetrics/DailyExerciseMetricsSection";
import { dailyMacroMetrics } from "@/mock/MainScreen/DailyMetricsSection";

export default function WorkoutScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        
        <DateCarousel />
        <DailyMacroMetricsSection
          protein={dailyMacroMetrics.protein}
          proteinGoal={dailyMacroMetrics.proteinGoal}
          fat={dailyMacroMetrics.fat}
          fatGoal={dailyMacroMetrics.fatGoal}
          carbs={dailyMacroMetrics.carbs}
          carbsGoal={dailyMacroMetrics.carbsGoal}
          calorieGoal={dailyMacroMetrics.calorieGoal}
        />
        <DailyExerciseMetricsSection />
        <Pressable style={styles.startButton} onPress={() => {navigate("/workout/active")}}>
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