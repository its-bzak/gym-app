import { getCompletedWorkoutHistory } from "@/db/sqlite";
import { getAuthenticatedUserId } from "@/services/profileService";
import { formatDate } from "@/utils/dateFormat";
import { formatWorkoutDuration, getWorkoutDurationSeconds } from "@/utils/statsHelper";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type WorkoutHistoryItem = {
  id: string;
  started_at: string;
  ended_at: string | null;
  completed_at: string | null;
  exercise_count: number;
  set_count: number;
  pending_sync: number;
};

const LOCAL_ANONYMOUS_USER_ID = "local-anonymous";

export default function HistoryScreen() {
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      const authenticatedUserId = await getAuthenticatedUserId().catch(() => null);
      const nextOwnerId = authenticatedUserId ?? LOCAL_ANONYMOUS_USER_ID;

      if (!isMounted) {
        return;
      }

      setHistory(getCompletedWorkoutHistory(nextOwnerId) as WorkoutHistoryItem[]);
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Completed workouts saved locally on this device.</Text>

        {history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No completed workouts yet</Text>
            <Text style={styles.emptyText}>Finish and save a workout to see it here.</Text>
          </View>
        ) : (
          history.map((entry) => {
            const duration = formatWorkoutDuration(
              getWorkoutDurationSeconds(entry.started_at, entry.ended_at)
            );

            return (
              <View key={entry.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>{formatDate(entry.completed_at ?? entry.started_at)}</Text>
                    <Text style={styles.cardSubtitle}>{duration}</Text>
                  </View>

                  {entry.pending_sync ? (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>Pending sync</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{entry.exercise_count} exercises</Text>
                  <Text style={styles.metaText}>{entry.set_count} sets</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#151515",
  },
  screen: {
    flex: 1,
    backgroundColor: "#151515",
  },
  content: {
    padding: 18,
    paddingTop: 72,
    paddingBottom: 32,
  },
  backButton: {
    position: "absolute",
    top: 18,
    left: 18,
    zIndex: 10,
    width: 64,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: "#F4F4F4",
    fontSize: 16,
    fontWeight: "500",
  },
  title: {
    color: "#F4F4F4",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#8B8B8B",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  emptyCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 24,
    padding: 20,
  },
  emptyTitle: {
    color: "#F4F4F4",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    color: "#A8A8A8",
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#F4F4F4",
    fontSize: 18,
    fontWeight: "600",
  },
  cardSubtitle: {
    color: "#A8A8A8",
    fontSize: 14,
    marginTop: 4,
  },
  pendingBadge: {
    borderRadius: 999,
    backgroundColor: "#2A2418",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pendingBadgeText: {
    color: "#F6D38A",
    fontSize: 12,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
  },
  metaText: {
    color: "#D0D0D0",
    fontSize: 14,
  },
});