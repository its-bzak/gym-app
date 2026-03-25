import { navigate } from "expo-router/build/global-state/routing";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const exercises = [
  { name: "Dumbbell Chest Press", selected: false },
  { name: "Pec Deck", selected: false },
  { name: "Supine Press", selected: true },
];

const sets = [
  { label: "#1", weight: "225lbs", reps: "8" },
  { label: "#2", weight: "225lbs", reps: "6" },
];

export default function ActiveScreen() {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topRow}>
          <Pressable style={styles.cancelButton} onPress={() => {navigate("/workout")}}>
            <Text style={styles.cancelText}>Cancel Workout</Text>
          </Pressable>
          <Text style={styles.timerText}>1:13:37</Text>
        </View>

        <View style={styles.exercisePanel}>
          {exercises.map((exercise) => (
            <View
              key={exercise.name}
              style={[styles.exerciseRow, exercise.selected && styles.exerciseRowSelected]}>
              <Text style={styles.exerciseText}>{exercise.name}</Text>
              <Text style={styles.removeText}>x</Text>
            </View>
          ))}

          <Pressable style={styles.addExerciseButton}>
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </Pressable>

          <View style={styles.paginationRow}>
            <View style={styles.paginationDot} />
            <View style={[styles.paginationDot, styles.paginationDotActive]} />
          </View>
        </View>

        <View style={styles.setsSection}>
          {sets.map((setItem) => (
            <View key={setItem.label} style={styles.setRow}>
              <Text style={styles.setIndex}>{setItem.label}</Text>

              <View style={styles.metricGroup}>
                <Text style={styles.metricLabel}>Weight:</Text>
                <View style={styles.metricValuePill}>
                  <Text style={styles.metricValueText}>{setItem.weight}</Text>
                </View>
              </View>

              <View style={styles.metricGroup}>
                <Text style={styles.metricLabel}>Reps:</Text>
                <View style={styles.repsValuePill}>
                  <Text style={styles.metricValueText}>{setItem.reps}</Text>
                </View>
              </View>

              <Text style={styles.removeText}>x</Text>
            </View>
          ))}

          <Pressable style={styles.addSetButton}>
            <Text style={styles.addSetText}>Add Set</Text>
          </Pressable>
        </View>

        <Pressable style={styles.finishButton} onPress={() => {navigate("/workout")}}>
          <Text style={styles.finishButtonText}>
            Finish Workout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0E0E0E",
  },
  screen: {
    flex: 1,
    backgroundColor: "#0E0E0E",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cancelButton: {
    height: 40,
    minWidth: 186,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  cancelText: {
    color: "#7C7C7C",
    fontSize: 16,
  },
  timerText: {
    color: "#7C7C7C",
    fontSize: 17,
  },
  exercisePanel: {
    marginTop: 12,
    height: 438,
    borderRadius: 24,
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
  },
  exerciseRow: {
    height: 40,
    borderRadius: 16,
    backgroundColor: "#212121",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  exerciseRowSelected: {
    borderWidth: 1,
    borderColor: "#656565",
  },
  exerciseText: {
    flex: 1,
    textAlign: "center",
    color: "#7C7C7C",
    fontSize: 15,
  },
  removeText: {
    color: "#7C7C7C",
    fontSize: 16,
    width: 14,
    textAlign: "center",
  },
  addExerciseButton: {
    alignSelf: "center",
    marginTop: 10,
    height: 42,
    minWidth: 170,
    borderRadius: 16,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  addExerciseText: {
    color: "#7C7C7C",
    fontSize: 15,
  },
  paginationRow: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  paginationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2D2D2D",
  },
  paginationDotActive: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#F4F4F4",
  },
  setsSection: {
    marginTop: 18,
    gap: 12,
  },
  setRow: {
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: "#212121",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  setIndex: {
    width: 34,
    color: "#7C7C7C",
    fontSize: 15,
  },
  metricGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  metricLabel: {
    color: "#7C7C7C",
    fontSize: 15,
    marginRight: 6,
  },
  metricValuePill: {
    minWidth: 72,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  repsValuePill: {
    minWidth: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  metricValueText: {
    color: "#7C7C7C",
    fontSize: 14,
  },
  addSetButton: {
    height: 44,
    borderRadius: 16,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "center",
  },
  addSetText: {
    color: "#7C7C7C",
    fontSize: 16,
  },
  finishButton: {
    marginTop: "auto",
    alignSelf: "center",
    width: "84%",
    height: 66,
    borderRadius: 18,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  finishButtonText: {
    color: "#7C7C7C",
    fontSize: 22,
  },
});