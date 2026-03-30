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
import { useActiveWorkout } from "@/context/ActiveWorkoutContext";
import { useLibrary } from "@/context/LibraryContext";
import { getExercisesForGym, getUserGymOptions } from "@/mock/mockDataService";
import { Routine } from "@/types/routine";

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

export default function RoutinesScreen() {
  const { addRoutine } = useActiveWorkout();
  const { routines, exercises } = useLibrary();
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
      new Set(
        routines.flatMap((routine) =>
          routine.exercises.flatMap((exercise) => exercise.exercise.primaryMuscles ?? [])
        )
      )
    ).sort((first, second) => first.localeCompare(second));

    return ["All", ...uniquePrimaryMuscles];
  }, [routines]);

  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        exercises.map((exercise) => normalizeCategory(exercise.category)).filter(Boolean)
      )
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

  const filteredRoutines = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return routines.filter((routine) => {
      const routineExercises = routine.exercises.map((routineExercise) => {
        return (
          exercises.find((exercise) => exercise.id === routineExercise.exercise.id) ??
          exercises.find(
            (exercise) => normalizeText(exercise.name) === normalizeText(routineExercise.exercise.name)
          ) ??
          routineExercise.exercise
        );
      });

      const matchesPrimaryMuscle =
        selectedPrimaryMuscle === "All" ||
        routineExercises.some((exercise) =>
          (exercise.primaryMuscles ?? []).includes(selectedPrimaryMuscle)
        );

      const matchesGym =
        availableGymExerciseNames === null ||
        routineExercises.every((exercise) =>
          availableGymExerciseNames.has(normalizeText(exercise.name))
        );

      const matchesCategory =
        selectedCategory === "all" ||
        routineExercises.some((exercise) => normalizeCategory(exercise.category) === selectedCategory);

      const matchesSearch =
        normalizedQuery.length === 0 ||
        routine.name.toLowerCase().includes(normalizedQuery) ||
        routineExercises.some((exercise) =>
          exercise.name.toLowerCase().includes(normalizedQuery) ||
          exercise.muscleGroup.toLowerCase().includes(normalizedQuery) ||
          (exercise.primaryMuscles ?? []).some((muscle) =>
            muscle.toLowerCase().includes(normalizedQuery)
          )
        );

      return matchesPrimaryMuscle && matchesGym && matchesCategory && matchesSearch;
    });
  }, [availableGymExerciseNames, exercises, routines, searchQuery, selectedCategory, selectedPrimaryMuscle]);

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

  const handleSelectRoutine = (routine: Routine) => {
    addRoutine(routine);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Routines</Text>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.push("/workout/new-routine")}
          >
            <Text style={styles.headerButtonText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.controlsContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search routines"
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
                {selectedPrimaryMuscle === "All" ? "Primary" : selectedPrimaryMuscle}
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
          style={styles.routineList}
          data={filteredRoutines}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No matching routines</Text>
              <Text style={styles.emptyStateText}>
                Try another search or adjust the gym, category, or primary muscle filters.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.routineCard}
              onPress={() => handleSelectRoutine(item)}
            >
              <View style={styles.routineHeader}>
                <Text style={styles.routineName}>{item.name}</Text>
                <Text style={styles.exerciseCount}>{item.exercises.length} exercises</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.exerciseChipRow}
              >
                {item.exercises.map((exercise) => (
                  <View key={`${item.id}-${exercise.exercise.id}`} style={styles.exerciseChip}>
                    <Text style={styles.exerciseChipText}>{exercise.exercise.name}</Text>
                  </View>
                ))}
              </ScrollView>
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
    color: "#F4F4F4",
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
  searchInput: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    color: "#F4F4F4",
    paddingHorizontal: 16,
    fontSize: 16,
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
  routineList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  routineCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  routineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  routineName: {
    color: "#F4F4F4",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  exerciseCount: {
    color: "#7C7C7C",
    fontSize: 13,
  },
  exerciseChipRow: {
    gap: 8,
    marginTop: 14,
    paddingRight: 4,
  },
  exerciseChip: {
    backgroundColor: "#212121",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exerciseChipText: {
    color: "#B0B0B0",
    fontSize: 13,
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