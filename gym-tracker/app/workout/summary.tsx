import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useActiveWorkout } from "@/context/ActiveWorkoutContext";
import { mockExercisePRs } from "@/mock/exercisePRs";
import { exercises as baseExercises } from "@/mock/gymImplementation";
import {
  formatWorkoutDuration,
  getTotalSets,
  getTotalVolume,
  getWorkoutDurationSeconds,
  getWorkoutPRs,
  getWorkedMuscles,
} from "@/utils/statsHelper";

export default function WorkoutSummaryScreen() {
  const { workout, resumeWorkout, clearWorkout } = useActiveWorkout();

  const durationSeconds = getWorkoutDurationSeconds(workout.startedAt, workout.endedAt);
  const durationLabel = formatWorkoutDuration(durationSeconds);
  const totalSets = getTotalSets(workout.exercises);
  const totalVolume = getTotalVolume(workout.exercises);
  const prAchievements = getWorkoutPRs(workout.exercises, mockExercisePRs);
  const workedMuscles = getWorkedMuscles(workout.exercises, baseExercises);
  

  const handleBackToWorkout = () => {
    resumeWorkout();
    router.back();
  };

  const handleSaveWorkout = () => {
    // later:
    // 1. save to workout history / database
    // 2. update stored PR history
    clearWorkout();
    router.push("/");
  };

  if (!workout.startedAt || workout.exercises.length === 0) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <Text style={styles.title}>No workout to summarize</Text>

        <View style={styles.buttonGroup}>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/")}>
            <Text style={styles.primaryButtonText}>Go Home</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen}>
        <Text style={styles.title}>Workout Summary</Text>

        <View style={styles.muscleMapCard}>
          <Text style={styles.sectionTitle}>Muscles Worked</Text>
          <View style={styles.muscleMapPlaceholder}>
            <Text style={styles.placeholderText}>Muscle map coming soon</Text>
          </View>

          {workedMuscles.length > 0 && (
            <View style={styles.muscleChipsRow}>
              {workedMuscles.map((muscle) => (
                <View key={muscle} style={styles.muscleChip}>
                  <Text style={styles.muscleChipText}>{muscle}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{durationLabel}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalVolume}</Text>
            <Text style={styles.statLabel}>Volume</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
        </View>

        {prAchievements.length > 0 && (
          <View style={styles.prSection}>
            <Text style={styles.sectionTitle}>New PRs</Text>

            {prAchievements.map((achievement, index) => (
              <View
                key={`${achievement.exerciseId}-${achievement.type}-${index}`}
                style={styles.prCard}
              >
                <Text style={styles.prTitle}>
                  {achievement.type === "weight" ? "New Weight PR" : "New Volume PR"}
                </Text>
                <Text style={styles.prText}>
                  {achievement.exerciseName} · {achievement.value}
                  {achievement.type === "weight" ? " lbs" : " total volume"}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Exercises</Text>

        <ScrollView
          style={styles.exerciseList}
          contentContainerStyle={styles.exerciseListContent}
        >
          {workout.exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>

              {exercise.sets.length === 0 ? (
                <Text style={styles.emptyText}>No sets logged</Text>
              ) : (
                exercise.sets.map((set, index) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setText}>#{index + 1}</Text>
                    <Text style={styles.setText}>
                      {set.weight ? `${set.weight} lbs` : "- lbs"}
                    </Text>
                    <Text style={styles.setText}>
                      {set.reps ? `${set.reps} reps` : "- reps"}
                    </Text>
                  </View>
                ))
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.buttonGroup}>
          <Pressable style={styles.secondaryButton} onPress={handleBackToWorkout}>
            <Text style={styles.secondaryButtonText}>Back to Workout</Text>
          </Pressable>

          <Pressable style={styles.primaryButton} onPress={handleSaveWorkout}>
            <Text style={styles.primaryButtonText}>Save Workout</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  title: {
    color: "#F4F4F4",
    fontSize: 28,
    marginBottom: 8,
    fontWeight: "600",
  },
  subtitle: {
    color: "#A0A0A0",
    fontSize: 16,
    marginTop: 6,
    marginBottom: 18,
  },
  sectionTitle: {
    color: "#F4F4F4",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  muscleMapCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  muscleMapPlaceholder: {
    height: 320,
    borderRadius: 16,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#7C7C7C",
    fontSize: 15,
  },
  muscleChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  muscleChip: {
    backgroundColor: "#212121",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  muscleChipText: {
    color: "#B0B0B0",
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  statValue: {
    color: "#F4F4F4",
    fontSize: 18,
    fontWeight: "600",
  },
  statLabel: {
    color: "#7C7C7C",
    fontSize: 13,
    marginTop: 4,
  },
  prSection: {
    marginBottom: 14,
  },
  prCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  prTitle: {
    color: "#F4F4F4",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  prText: {
    color: "#B0B0B0",
    fontSize: 14,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseListContent: {
    paddingBottom: 16,
  },
  exerciseCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  exerciseName: {
    color: "#F4F4F4",
    fontSize: 18,
    marginBottom: 10,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#212121",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  setText: {
    color: "#B0B0B0",
    fontSize: 14,
  },
  emptyText: {
    color: "#7C7C7C",
    fontSize: 14,
  },
  buttonGroup: {
    gap: 10,
    marginTop: 8,
    paddingBottom: 24,
  },
  primaryButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#F4F4F4",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    height: 48,
    borderRadius: 18,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#B0B0B0",
    fontSize: 15,
    fontWeight: "500",
  },
});