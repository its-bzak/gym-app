import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { workoutSessions, workoutPlans, gyms } from "@/mockData";
import { router } from "expo-router";

//Workout type / selected mode, date strip (weekly), completed workouts, and start workout button above tabs

export default function WorkoutScreen() {
    const today = new Date().toDateString();

    const todaysWorkouts = workoutSessions.filter((session) => {
        if (!session.ended_at || session.is_deleted) return false;
    return new Date(session.ended_at).toDateString() === today;
    });

    const getWorkoutPlanName = (workoutPlanId: string | null) => {
        if (!workoutPlanId) return "Workout";
    return workoutPlans.find((plan) => plan.id === workoutPlanId)?.name ?? "Workout";
    };

    const getGymName = (gymId: string | null) => {
        if (!gymId) return "Unknown Gym";
    return gyms.find((gym) => gym.id === gymId)?.name ?? "Unknown Gym";
    };

    const getDurationInMinutes = (startedAt: string, endedAt: string | null) => {
        if (!endedAt) return 0;
    const start = new Date(startedAt).getTime();
    const end = new Date(endedAt).getTime();
    return Math.round((end - start) / 1000 / 60);
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.screen}>
                <View style={styles.content}>
                    <Text style={styles.title}>Workout</Text>
                    <Text style={styles.subtitle}>Today</Text>

                    <View style={styles.actionsContainer}>

                        <Pressable style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>Create Custom Exercise</Text>
                        </Pressable>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Today’s Workouts</Text>

                        {todaysWorkouts.length === 0 ? (
                        <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>No workouts logged today.</Text>
                        </View>
                        ) : (
                        <View style={styles.workoutList}>
                        {todaysWorkouts.map((session) => (
                            <Pressable key={session.id} style={styles.workoutCard}>
                            <Text style={styles.workoutName}>
                                {getWorkoutPlanName(session.workout_plan_id)}
                            </Text>

                            <Text style={styles.workoutMeta}>
                            {getGymName(session.gym_id)}
                            </Text>

                            <Text style={styles.workoutMeta}>
                            Duration: {getDurationInMinutes(session.started_at, session.ended_at)} min
                            </Text>

                            <Text style={styles.workoutTime}>
                            Completed at{" "}
                            {new Date(session.ended_at!).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                            </Text>
                            </Pressable>
                        ))}
                        </View>
                    )}
                    </View>
                </View>
            </ScrollView>
                <View style={styles.bottomContainer}>
                    <Pressable style={styles.primaryButton} onPress={() => router.push("/workout/active")}>
                        <Text style={styles.primaryButtonText}>Start Workout</Text>
                    </Pressable>
                </View>
        </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingTop: 64,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 8,
    color: "#a3a3a3",
    fontSize: 14,
  },
  actionsContainer: {
    marginTop: 24,
    gap: 12,
  },
  content: {
  flex: 1,
  },
  bottomContainer: {
  padding: 16,
  borderTopWidth: 1,
  borderColor: "#262626",
  backgroundColor: "#000",
 },
  primaryButton: {
  backgroundColor: "#fff",
  borderRadius: 16,
  paddingVertical: 16,
  alignItems: "center",
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#404040",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
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
    fontSize: 14,
  },
  workoutList: {
    gap: 12,
  },
  workoutCard: {
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 16,
    padding: 16,
  },
  workoutName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  workoutMeta: {
    marginTop: 6,
    color: "#d4d4d4",
    fontSize: 14,
  },
  workoutTime: {
    marginTop: 6,
    color: "#737373",
    fontSize: 13,
  },
});