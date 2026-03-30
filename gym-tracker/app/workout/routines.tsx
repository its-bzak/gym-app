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
import { mockRoutines } from "@/mock/routines";
import { Routine } from "@/types/routine";

export default function RoutinesScreen() {
  const { addRoutine } = useActiveWorkout();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRoutines = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return mockRoutines.filter((routine) => {
      if (normalizedQuery.length === 0) {
        return true;
      }

      return (
        routine.name.toLowerCase().includes(normalizedQuery) ||
        routine.exercises.some((exercise) =>
          exercise.exercise.name.toLowerCase().includes(normalizedQuery)
        )
      );
    });
  }, [searchQuery]);

  const handleSelectRoutine = (routine: Routine) => {
    addRoutine(routine);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Choose Routine</Text>

        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search routines"
          placeholderTextColor="#6F6F6F"
        />

        <FlatList
          style={styles.routineList}
          data={filteredRoutines}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No matching routines</Text>
              <Text style={styles.emptyStateText}>
                Try another routine name or exercise search.
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
    marginBottom: 20,
  },
  searchInput: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    color: "#F4F4F4",
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 14,
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