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
import { getExercisesForGym, getUserGymOptions } from "@/mock/mockDataService";
import { Exercise } from "@/types/exercise";
import { SafeAreaView } from "react-native-safe-area-context";

const CURRENT_USER_ID = "user_ryan";

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function normalizeCategory(value?: string) {
  return value ? normalizeText(value).replace(/\s+/g, "_") : "unknown";
}

function formatCategoryLabel(value: string) {
  return value === "all"
    ? "Category"
    : value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export default function ExercisesScreen() {
  const { addExercise } = useActiveWorkout();
  const { exercises } = useLibrary();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrimaryMuscle, setSelectedPrimaryMuscle] = useState("All");
  const [selectedGymId, setSelectedGymId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openFilterMenu, setOpenFilterMenu] = useState<"primary" | "gym" | "category" | null>(null);

  const gymOptions = useMemo(
    () => [{ gymId: "all", gymName: "All Gyms" }, ...getUserGymOptions(CURRENT_USER_ID)],
    []
  );

  const primaryMuscleOptions = useMemo(() => {
    const uniquePrimaryMuscles = Array.from(
      new Set(exercises.flatMap((exercise) => exercise.primaryMuscles ?? []))
    ).sort((first, second) => first.localeCompare(second));

    return ["All", ...uniquePrimaryMuscles];
  }, [exercises]);

  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(exercises.map((exercise) => normalizeCategory(exercise.type)).filter(Boolean))
    ).sort((first, second) => first.localeCompare(second));

    return ["all", ...uniqueCategories];
  }, [exercises]);

  const availableGymExerciseNames = useMemo(() => {
    if (selectedGymId === "all") {
      return null;
    }

    return new Set(
      getExercisesForGym(selectedGymId).map((exercise) => normalizeText(exercise.name))
    );
  }, [selectedGymId]);

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

      const matchesGym =
        availableGymExerciseNames === null ||
        availableGymExerciseNames.has(normalizeText(exercise.name));

      const matchesCategory =
        selectedCategory === "all" || normalizeCategory(exercise.type) === selectedCategory;

      return matchesPrimaryMuscle && matchesSearch && matchesGym && matchesCategory;
    });
  }, [availableGymExerciseNames, exercises, searchQuery, selectedCategory, selectedPrimaryMuscle]);

  const activeFilterOptions = useMemo(() => {
    if (openFilterMenu === "primary") {
      return primaryMuscleOptions.map((muscle) => ({ label: muscle, value: muscle }));
    }

    if (openFilterMenu === "gym") {
      return gymOptions.map((gym) => ({ label: gym.gymName, value: gym.gymId }));
    }

    if (openFilterMenu === "category") {
      return categoryOptions.map((category) => ({
        label: formatCategoryLabel(category),
        value: category,
      }));
    }

    return [];
  }, [categoryOptions, gymOptions, openFilterMenu, primaryMuscleOptions]);

  const selectedGymLabel =
    gymOptions.find((gym) => gym.gymId === selectedGymId)?.gymName ?? "Gym";

  const handleFilterSelect = (value: string) => {
    if (openFilterMenu === "primary") {
      setSelectedPrimaryMuscle(value);
    }

    if (openFilterMenu === "gym") {
      setSelectedGymId(value);
    }

    if (openFilterMenu === "category") {
      setSelectedCategory(value);
    }

    setOpenFilterMenu(null);
  };

  const handleSelectExercise = (exercise: Exercise) => {
    addExercise(exercise);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Exercises</Text>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.push("/workout/new-exercise")}
          >
            <Text style={styles.headerButtonText}>Create New</Text>
          </Pressable>
        </View>

        <View style={styles.controlsContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search exercises"
            placeholderTextColor="#6F6F6F"
          />

          <View style={styles.controlsRow}>
            <Pressable
              style={styles.filterButton}
              onPress={() =>
                setOpenFilterMenu((currentValue) =>
                  currentValue === "primary" ? null : "primary"
                )
              }>
              <Text style={styles.filterButtonText} numberOfLines={1}>
                {selectedPrimaryMuscle === "All" ? "Filter" : selectedPrimaryMuscle}
              </Text>
            </Pressable>

            <Pressable
              style={styles.filterButton}
              onPress={() =>
                setOpenFilterMenu((currentValue) =>
                  currentValue === "gym" ? null : "gym"
                )
              }>
              <Text style={styles.filterButtonText} numberOfLines={1}>
                {selectedGymId === "all" ? "Gym" : selectedGymLabel}
              </Text>
            </Pressable>

            <Pressable
              style={styles.filterButton}
              onPress={() =>
                setOpenFilterMenu((currentValue) =>
                  currentValue === "category" ? null : "category"
                )
              }>
              <Text style={styles.filterButtonText} numberOfLines={1}>
                {formatCategoryLabel(selectedCategory)}
              </Text>
            </Pressable>
          </View>

          {openFilterMenu !== null && (
            <View style={styles.filterDropdown}>
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.filterDropdownContent}>
                {activeFilterOptions.map((option) => {
                  const isSelected =
                    (openFilterMenu === "primary" && option.value === selectedPrimaryMuscle) ||
                    (openFilterMenu === "gym" && option.value === selectedGymId) ||
                    (openFilterMenu === "category" && option.value === selectedCategory);

                  return (
                    <Pressable
                      key={`${openFilterMenu}-${option.value}`}
                      style={styles.filterOption}
                      onPress={() => handleFilterSelect(option.value)}>
                      <Text
                        style={[
                          styles.filterOptionText,
                          isSelected && styles.filterOptionTextSelected,
                        ]}>
                        {option.label}
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
                Try a different search or adjust the gym, category, or primary muscle filters.
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
    marginTop: 10,
  },
  searchInput: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    color: "#F4F4F4",
    paddingHorizontal: 16,
    fontSize: 16,
  },
  filterButton: {
    flex: 1,
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
    top: 114,
    right: 0,
    width: 220,
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