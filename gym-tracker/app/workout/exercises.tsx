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
import { useActiveWorkout } from "@/context/ActiveWorkoutContext";
import { useLibrary } from "@/context/LibraryContext";
import { Exercise } from "@/types/exercise";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExercisesScreen() {
  const { addExercise } = useActiveWorkout();
  const { exercises } = useLibrary();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrimaryMuscle, setSelectedPrimaryMuscle] = useState("All");
  const [isFilterMenuVisible, setIsFilterMenuVisible] = useState(false);

  const primaryMuscleOptions = useMemo(() => {
    const uniquePrimaryMuscles = Array.from(
      new Set(exercises.flatMap((exercise) => exercise.primaryMuscles ?? []))
    ).sort((first, second) => first.localeCompare(second));

    return ["All", ...uniquePrimaryMuscles];
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const matchesPrimaryMuscle =
        selectedPrimaryMuscle === "All" ||
        (exercise.primaryMuscles ?? []).includes(selectedPrimaryMuscle);

      const matchesSearch =
        normalizedQuery.length === 0 ||
        exercise.name.toLowerCase().includes(normalizedQuery) ||
        exercise.muscleGroup.toLowerCase().includes(normalizedQuery) ||
        (exercise.primaryMuscles ?? []).some((muscle) =>
          muscle.toLowerCase().includes(normalizedQuery)
        );

      return matchesPrimaryMuscle && matchesSearch;
    });
  }, [exercises, searchQuery, selectedPrimaryMuscle]);

  const handleSelectExercise = (exercise: Exercise) => {
    addExercise(exercise);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Exercise Library</Text>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.push("/workout/new-exercise")}
          >
            <Text style={styles.headerButtonText}>New</Text>
          </Pressable>
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises"
              placeholderTextColor="#6F6F6F"
            />

            <Pressable
              style={styles.filterButton}
              onPress={() => setIsFilterMenuVisible((currentValue) => !currentValue)}>
              <Text style={styles.filterButtonText} numberOfLines={1}>
                {selectedPrimaryMuscle === "All" ? "Filter" : selectedPrimaryMuscle}
              </Text>
            </Pressable>
          </View>

          {isFilterMenuVisible && (
            <View style={styles.filterDropdown}>
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.filterDropdownContent}>
                {primaryMuscleOptions.map((muscle) => {
                  const isSelected = muscle === selectedPrimaryMuscle;

                  return (
                    <Pressable
                      key={muscle}
                      style={styles.filterOption}
                      onPress={() => {
                        setSelectedPrimaryMuscle(muscle);
                        setIsFilterMenuVisible(false);
                      }}>
                      <Text
                        style={[
                          styles.filterOptionText,
                          isSelected && styles.filterOptionTextSelected,
                        ]}>
                        {muscle}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <FlatList
          style={styles.exerciseList}
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No matching exercises</Text>
              <Text style={styles.emptyStateText}>
                Try a different search or choose another primary muscle.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.exerciseRow}
              onPress={() => handleSelectExercise(item)}
            >
              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.muscleGroup}>
                Primary: {(item.primaryMuscles ?? []).join(", ") || item.muscleGroup}
              </Text>
            </Pressable>
          )}
        />
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back to Workout</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#151515",
    padding: 18,
  },
  title: {
    color: "#fff",
    fontSize: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  headerButton: {
    minWidth: 72,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  headerButtonText: {
    color: "#F4F4F4",
    fontSize: 14,
    fontWeight: "600",
  },
  controlsContainer: {
    position: "relative",
    zIndex: 10,
    marginBottom: 14,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    color: "#F4F4F4",
    paddingHorizontal: 16,
    fontSize: 16,
  },
  filterButton: {
    width: 120,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  filterButtonText: {
    color: "#F4F4F4",
    fontSize: 14,
    fontWeight: "500",
  },
  filterDropdown: {
    position: "absolute",
    top: 56,
    right: 0,
    width: 200,
    maxHeight: 240,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    overflow: "hidden",
  },
  filterDropdownContent: {
    paddingVertical: 8,
  },
  filterOption: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  filterOptionText: {
    color: "#A0A0A0",
    fontSize: 14,
    fontWeight: "500",
  },
  filterOptionTextSelected: {
    color: "#F4F4F4",
  },
  exerciseList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
    justifyContent: "flex-start",
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
  backButton: {
    height: 50,
    borderRadius: 18,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  backButtonText: {
    color: "#7C7C7C",
    fontSize: 18,
  },
});