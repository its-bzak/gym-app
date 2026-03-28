import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { mockExercises } from "@/mock/exercises";
import { useActiveWorkout } from "@/context/ActiveWorkoutContext";
import { Exercise } from "@/types/exercise";

export default function ExercisesScreen() {
  const { addExercise } = useActiveWorkout();

  const handleSelectExercise = (exercise: Exercise) => {
    addExercise(exercise);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercise Library</Text>

      <FlatList
        data={mockExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.exerciseRow}
            onPress={() => handleSelectExercise(item)}
          >
            <Text style={styles.exerciseName}>{item.name}</Text>
            <Text style={styles.muscleGroup}>{item.muscleGroup}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#151515",
    padding: 18,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    marginBottom: 20,
  },
  exerciseRow: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  exerciseName: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 4,
  },
  muscleGroup: {
    color: "#7C7C7C",
    fontSize: 14,
  },
});