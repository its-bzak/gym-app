import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getEquipmentForGym, getExercisesForGym, getGymsForUser, getUserJoinDateForGym } from "@/mock/mockDataService";
import { formatDate } from "@/utils/dateFormat";

const CURRENT_USER_ID = "user_ryan";

export default function GymsScreen() {
  const gyms = getGymsForUser(CURRENT_USER_ID);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Pressable style={styles.returnButton} onPress={() => router.back()}>
          <Text style={styles.returnButtonText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>My Gyms</Text>

        {gyms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No gyms yet</Text>
            <Text style={styles.emptyStateText}>
              Join a gym with a code and it will appear here.
            </Text>
          </View>
        ) : (
          gyms.map((gym) => {
            const equipmentCount = getEquipmentForGym(gym.id).length;
            const exerciseCount = getExercisesForGym(gym.id).length;
            const joinDate = getUserJoinDateForGym(CURRENT_USER_ID, gym.id);

            return (
              <View key={gym.id} style={styles.gymCard}>
                <View style={styles.gymHeaderRow}>
                  <Text style={styles.gymName}>{gym.name}</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>Member Since: <Text style={styles.statLabel}>{joinDate ? formatDate(joinDate) : "N/A"}</Text></Text>
                  </View>
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
    paddingHorizontal: 18,
    paddingTop: 68,
    paddingBottom: 32,
  },
  returnButton: {
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
  returnButtonText: {
    color: "#F4F4F4",
    fontSize: 16,
    fontWeight: "500",
  },
  title: {
    color: "#F4F4F4",
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 20,
  },
  subtitle: {
    color: "#8B8B8B",
    fontSize: 15,
    marginTop: 8,
    marginBottom: 20,
  },
  emptyState: {
    backgroundColor: "#1A1A1A",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    color: "#F4F4F4",
    fontSize: 18,
    fontWeight: "600",
  },
  emptyStateText: {
    color: "#A0A0A0",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  gymCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  gymHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  gymName: {
    color: "#F4F4F4",
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
  },
  activeBadge: {
    backgroundColor: "#212121",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeBadgeText: {
    color: "#BEBEBE",
    fontSize: 12,
    fontWeight: "600",
  },
  joinCodeLabel: {
    color: "#7C7C7C",
    fontSize: 13,
    marginTop: 16,
  },
  joinCodeValue: {
    color: "#F4F4F4",
    fontSize: 17,
    fontWeight: "500",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#212121",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statValue: {
    color: "#F4F4F4",
    fontSize: 20,
    fontWeight: "600",
  },
  statLabel: {
    color: "#8B8B8B",
    fontSize: 13,
    marginTop: 4,
  },
});