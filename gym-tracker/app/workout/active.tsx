import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";

// Show workout name, timer, end workout button, exercise CTA

export default function ActiveWorkoutScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Active Workout</Text>
          <Text style={styles.timer}>00:00</Text>
        </View>

        {/* Exercises */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercises</Text>

          {/* Empty state */}
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No exercises added yet.</Text>
          </View>
        </View>

        {/* Add Exercise */}
        <Pressable style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Exercise</Text>
        </Pressable>

      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <Pressable style={styles.finishButton} onPress={() => router.back()}>
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    padding: 20,
    paddingTop: 64,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  timer: {
    marginTop: 6,
    color: "#a3a3a3",
    fontSize: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 16,
    padding: 16,
  },
  emptyText: {
    color: "#a3a3a3",
  },
  addButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#404040",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#262626",
    backgroundColor: "#000",
  },
  finishButton: {
    backgroundColor: "#22c55e",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  finishButtonText: {
    color: "#000",
    fontWeight: "700",
  },
});