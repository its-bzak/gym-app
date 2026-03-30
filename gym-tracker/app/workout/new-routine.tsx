import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLibrary } from "@/context/LibraryContext";

export default function NewRoutineScreen() {
  const { exercises, addCustomRoutine, hasRoutineNamed } = useLibrary();
  const [routineName, setRoutineName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredExercises = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return exercises.filter((exercise) => {
      if (normalizedQuery.length === 0) {
        return true;
      }

      return (
        exercise.name.toLowerCase().includes(normalizedQuery) ||
        exercise.muscleGroup.toLowerCase().includes(normalizedQuery) ||
        (exercise.primaryMuscles ?? []).some((muscle) =>
          muscle.toLowerCase().includes(normalizedQuery)
        )
      );
    });
  }, [exercises, searchQuery]);

  const selectedExercises = useMemo(() => {
    return selectedExerciseIds
      .map((exerciseId) => exercises.find((exercise) => exercise.id === exerciseId))
      .filter((exercise) => exercise !== undefined);
  }, [exercises, selectedExerciseIds]);

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExerciseIds((prev) => {
      if (prev.includes(exerciseId)) {
        return prev.filter((id) => id !== exerciseId);
      }

      return [...prev, exerciseId];
    });
  };

  const handleSaveRoutine = () => {
    const trimmedName = routineName.trim();

    if (!trimmedName) {
      setErrorMessage("Routine name is required.");
      return;
    }

    if (hasRoutineNamed(trimmedName)) {
      setErrorMessage("That routine already exists in your library.");
      return;
    }

    if (selectedExercises.length === 0) {
      setErrorMessage("Select at least one exercise for the routine.");
      return;
    }

    addCustomRoutine(trimmedName, selectedExercises);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <Text style={styles.title}>New Routine</Text>
              <Text style={styles.subtitle}>
                Build a routine from exercises already available in your library.
              </Text>

              <Text style={styles.label}>Routine Name</Text>
              <TextInput
                style={styles.input}
                value={routineName}
                onChangeText={(value) => {
                  setRoutineName(value);
                  setErrorMessage(null);
                }}
                placeholder="Ex: Pull Day A"
                placeholderTextColor="#6F6F6F"
              />

              <Text style={styles.label}>Search Exercises</Text>
              <TextInput
                style={styles.input}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by exercise or muscle"
                placeholderTextColor="#6F6F6F"
              />

              <Text style={styles.label}>Selected Exercises</Text>
              {selectedExercises.length === 0 ? (
                <View style={styles.emptySelectedState}>
                  <Text style={styles.emptySelectedText}>
                    Tap exercises below to add them to this routine.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectedChipRow}
                  style={styles.selectedScroll}
                >
                  {selectedExercises.map((exercise) => (
                    <Pressable
                      key={exercise.id}
                      style={styles.selectedChip}
                      onPress={() => toggleExerciseSelection(exercise.id)}
                    >
                      <Text style={styles.selectedChipText}>{exercise.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.label}>Available Exercises</Text>

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No matching exercises</Text>
              <Text style={styles.emptyStateText}>
                Adjust the search or create a new exercise first.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedExerciseIds.includes(item.id);

            return (
              <Pressable
                style={[styles.exerciseRow, isSelected && styles.exerciseRowSelected]}
                onPress={() => {
                  toggleExerciseSelection(item.id);
                  setErrorMessage(null);
                }}
              >
                <View>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseDetails}>
                    {(item.primaryMuscles ?? []).join(", ") || item.muscleGroup}
                  </Text>
                </View>
                <Text style={styles.selectionIndicator}>{isSelected ? "Added" : "Add"}</Text>
              </Pressable>
            );
          }}
          ListFooterComponent={
            <View style={styles.footerActions}>
              <Pressable style={styles.primaryButton} onPress={handleSaveRoutine}>
                <Text style={styles.primaryButtonText}>Save Routine</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#151515",
  },
  container: {
    flex: 1,
    backgroundColor: "#151515",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 18,
    paddingBottom: 32,
  },
  title: {
    color: "#F4F4F4",
    fontSize: 28,
    fontWeight: "600",
  },
  subtitle: {
    color: "#A0A0A0",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 20,
  },
  label: {
    color: "#D0D0D0",
    fontSize: 14,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    color: "#F4F4F4",
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 14,
  },
  selectedScroll: {
    marginBottom: 14,
  },
  selectedChipRow: {
    gap: 8,
    paddingRight: 4,
  },
  selectedChip: {
    backgroundColor: "#2A2A2A",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedChipText: {
    color: "#F4F4F4",
    fontSize: 13,
  },
  emptySelectedState: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  emptySelectedText: {
    color: "#A0A0A0",
    fontSize: 14,
  },
  errorText: {
    color: "#F28B82",
    fontSize: 14,
    marginBottom: 12,
  },
  exerciseRow: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  exerciseRowSelected: {
    borderWidth: 1,
    borderColor: "#4B4B4B",
  },
  exerciseName: {
    color: "#F4F4F4",
    fontSize: 17,
    fontWeight: "500",
  },
  exerciseDetails: {
    color: "#7C7C7C",
    fontSize: 13,
    marginTop: 4,
  },
  selectionIndicator: {
    color: "#C8C8C8",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  emptyStateTitle: {
    color: "#F4F4F4",
    fontSize: 17,
    fontWeight: "600",
  },
  emptyStateText: {
    color: "#A0A0A0",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  footerActions: {
    marginTop: 8,
  },
  primaryButton: {
    height: 50,
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
    height: 50,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    color: "#A0A0A0",
    fontSize: 16,
  },
});