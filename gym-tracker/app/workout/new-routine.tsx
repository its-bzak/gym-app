import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLibrary } from "@/context/LibraryContext";
import {
  getExercisesForGym as getMockExercisesForGym,
  getUserGymOptions as getMockUserGymOptions,
} from "@/mock/mockDataService";
import {
  getExercisesForGym as getSupabaseExercisesForGym,
  getUserGymOptions as getSupabaseUserGymOptions,
  type GymOption,
} from "@/services/gymService";
import { getAuthenticatedUserId } from "@/services/profileService";

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

export default function NewRoutineScreen() {
  const { routineId } = useLocalSearchParams<{ routineId?: string }>();
  const {
    exercises,
    routines,
    addCustomRoutine,
    updateCustomRoutine,
    deleteCustomRoutine,
    hasRoutineNamed,
    isCustomRoutine,
  } = useLibrary();
  const [routineName, setRoutineName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrimaryMuscle, setSelectedPrimaryMuscle] = useState("All");
  const [selectedGymId, setSelectedGymId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openFilterMenu, setOpenFilterMenu] = useState<"primary" | "gym" | "category" | null>(null);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userGymOptions, setUserGymOptions] = useState<GymOption[]>(() => getMockUserGymOptions(CURRENT_USER_ID));
  const [availableGymExerciseNames, setAvailableGymExerciseNames] = useState<Set<string> | null>(null);
  const [isSyncingGymData, setIsSyncingGymData] = useState(true);
  const [gymDataStatus, setGymDataStatus] = useState<string | null>(null);
  const hasMissingNameError = errorMessage === "Routine name is required.";

  const editingRoutine = useMemo(() => {
    if (!routineId || !isCustomRoutine(routineId)) {
      return null;
    }

    return routines.find((routine) => routine.id === routineId) ?? null;
  }, [isCustomRoutine, routineId, routines]);

  useEffect(() => {
    if (!editingRoutine) {
      return;
    }

    setRoutineName(editingRoutine.name);
    setSelectedExerciseIds(editingRoutine.exercises.map((exercise) => exercise.exercise.id));
  }, [editingRoutine]);

  useEffect(() => {
    let isMounted = true;

    const loadGymOptions = async () => {
      try {
        const authenticatedUserId = await getAuthenticatedUserId();

        if (!isMounted) {
          return;
        }

        if (!authenticatedUserId) {
          setGymDataStatus("Using local gym data right now.");
          return;
        }

        const nextGymOptions = await getSupabaseUserGymOptions(authenticatedUserId);

        if (!isMounted) {
          return;
        }

        setUserGymOptions(nextGymOptions);
        setGymDataStatus(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setUserGymOptions(getMockUserGymOptions(CURRENT_USER_ID));
        setGymDataStatus("Using local gym data right now.");
      } finally {
        if (isMounted) {
          setIsSyncingGymData(false);
        }
      }
    };

    void loadGymOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedGymId === "all") {
      setAvailableGymExerciseNames(null);
      return;
    }

    let isMounted = true;

    const loadAvailableExercises = async () => {
      try {
        setAvailableGymExerciseNames(new Set());

        const availableExercises = await getSupabaseExercisesForGym(selectedGymId);

        if (!isMounted) {
          return;
        }

        setAvailableGymExerciseNames(
          new Set(availableExercises.map((exercise) => normalizeText(exercise.name)))
        );
        setGymDataStatus(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setAvailableGymExerciseNames(
          new Set(
            getMockExercisesForGym(selectedGymId).map((exercise) => normalizeText(exercise.name))
          )
        );
        setGymDataStatus("Using local gym data right now.");
      }
    };

    void loadAvailableExercises();

    return () => {
      isMounted = false;
    };
  }, [selectedGymId]);

  const gymOptions = useMemo(
    () => [{ gymId: "all", gymName: "All Gyms" }, ...userGymOptions],
    [userGymOptions]
  );

  const primaryMuscleOptions = useMemo(() => {
    const uniquePrimaryMuscles = Array.from(
      new Set(exercises.flatMap((exercise) => exercise.primaryMuscles ?? []))
    ).sort((first, second) => first.localeCompare(second));

    return ["All", ...uniquePrimaryMuscles];
  }, [exercises]);

  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(exercises.map((exercise) => normalizeCategory(exercise.category)).filter(Boolean))
    ).sort((first, second) => first.localeCompare(second));

    return ["all", ...uniqueCategories];
  }, [exercises]);

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

  const filteredExercises = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const matchesPrimaryMuscle =
        selectedPrimaryMuscle === "All" ||
        (exercise.primaryMuscles ?? []).includes(selectedPrimaryMuscle);

      const matchesGym =
        availableGymExerciseNames === null ||
        availableGymExerciseNames.has(normalizeText(exercise.name));

      const matchesCategory =
        selectedCategory === "all" || normalizeCategory(exercise.category) === selectedCategory;

      if (normalizedQuery.length === 0) {
        return matchesPrimaryMuscle && matchesGym && matchesCategory;
      }

      const matchesSearch =
        exercise.name.toLowerCase().includes(normalizedQuery) ||
        exercise.muscleGroup.toLowerCase().includes(normalizedQuery) ||
        (exercise.primaryMuscles ?? []).some((muscle) =>
          muscle.toLowerCase().includes(normalizedQuery)
        );

      return matchesPrimaryMuscle && matchesGym && matchesCategory && matchesSearch;
    });
  }, [availableGymExerciseNames, exercises, searchQuery, selectedCategory, selectedPrimaryMuscle]);

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

  const handleSaveRoutine = () => {
    const trimmedName = routineName.trim();

    if (!trimmedName) {
      setErrorMessage("Routine name is required.");
      return;
    }

    if (hasRoutineNamed(trimmedName, editingRoutine?.id)) {
      setErrorMessage("You already have a routine with this name.");
      return;
    }

    if (selectedExercises.length === 0) {
      setErrorMessage("Select at least one exercise for the routine.");
      return;
    }

    if (editingRoutine) {
      updateCustomRoutine(editingRoutine.id, trimmedName, selectedExercises);
    } else {
      addCustomRoutine(trimmedName, selectedExercises);
    }

    router.back();
  };

  const handleDeleteRoutine = () => {
    if (!editingRoutine) {
      return;
    }

    Alert.alert("Delete routine", "Delete this custom routine from your library?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteCustomRoutine(editingRoutine.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListHeaderComponentStyle={styles.listHeader}
          ListHeaderComponent={
            <>
              <TextInput
                style={[styles.input, hasMissingNameError && styles.inputError]}
                value={routineName}
                onChangeText={(value) => {
                  setRoutineName(value);
                  setErrorMessage(null);
                }}
                placeholder="My Awesome Routine"
                placeholderTextColor="#6F6F6F"
              />

              <View style={styles.controlsContainer}>
                {isSyncingGymData ? (
                  <View style={styles.statusBanner}>
                    <ActivityIndicator size="small" color="#BFBFBF" />
                    <Text style={styles.statusBannerText}>Syncing gym filters</Text>
                  </View>
                ) : null}
                {gymDataStatus ? (
                  <View style={styles.statusBanner}>
                    <Text style={styles.statusBannerText}>{gymDataStatus}</Text>
                  </View>
                ) : null}

                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by exercise or muscle"
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

                {openFilterMenu !== null ? (
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
                ) : null}
              </View>

              {selectedExercises.length === 0 ? (
                <View style={styles.emptySelectedState}>
                  <Text style={styles.emptySelectedText}>Selected exercises will appear here</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.selectedChipRow}
                  style={styles.selectedScroll}>
                  {selectedExercises.map((exercise) => (
                    <Pressable
                      key={exercise.id}
                      style={styles.selectedChip}
                      onPress={() => toggleExerciseSelection(exercise.id)}>
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
                Adjust the search or change the gym, category, or primary muscle filters.
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
                }}>
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
                <Text style={styles.primaryButtonText}>
                  {editingRoutine ? "Update Routine" : "Save Routine"}
                </Text>
              </Pressable>

              {editingRoutine ? (
                <Pressable style={styles.deleteButton} onPress={handleDeleteRoutine}>
                  <Text style={styles.deleteButtonText}>Delete Routine</Text>
                </Pressable>
              ) : null}

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
  listHeader: {
    zIndex: 20,
    elevation: 20,
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
  inputError: {
    borderWidth: 1,
    borderColor: "#F28B82",
  },
  controlsContainer: {
    position: "relative",
    zIndex: 30,
    elevation: 30,
    marginBottom: 14,
  },
  statusBanner: {
    minHeight: 42,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  statusBannerText: {
    color: "#A8A8A8",
    fontSize: 13,
    textAlign: "center",
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
    marginBottom: 12,
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
    top: 120,
    right: 70,
    width: 220,
    maxHeight: 240,
    zIndex: 40,
    elevation: 40,
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
  selectedScroll: {
    marginBottom: 14,
  },
  selectedChipRow: {
    gap: 8,
    paddingRight: 4,
  },
  selectedChip: {
    height: 44,
    backgroundColor: "#2A2A2A",
    borderRadius: 999,
    justifyContent: "center",
    alignContent: "center",
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
    alignSelf: "center",
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
    zIndex: 0,
    elevation: 0,
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
  deleteButton: {
    height: 50,
    borderRadius: 18,
    backgroundColor: "#2A1515",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  deleteButtonText: {
    color: "#F28B82",
    fontSize: 16,
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
