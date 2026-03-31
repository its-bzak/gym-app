import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getGymsForUser as getMockGymsForUser,
  getUserJoinDateForGym as getMockUserJoinDateForGym,
} from "@/mock/mockDataService";
import {
  getGymsForUser as getSupabaseGymsForUser,
  getUserJoinDateForGym as getSupabaseUserJoinDateForGym,
} from "@/services/gymService";
import { getAuthenticatedUserId } from "@/services/profileService";
import { formatDate } from "@/utils/dateFormat";
import { useEffect, useState } from "react";

const CURRENT_USER_ID = "user_ryan";

type GymCard = {
  id: string;
  name: string;
  joinDate: string | null;
};

function buildFallbackGymCards(): GymCard[] {
  return getMockGymsForUser(CURRENT_USER_ID).map((gym) => ({
    id: gym.id,
    name: gym.name,
    joinDate: getMockUserJoinDateForGym(CURRENT_USER_ID, gym.id),
  }));
}

export default function GymsScreen() {
  const [gymCards, setGymCards] = useState<GymCard[]>(() => buildFallbackGymCards());
  const [isLoadingGyms, setIsLoadingGyms] = useState(true);
  const [gymLoadError, setGymLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadGyms = async () => {
      try {
        const authenticatedUserId = await getAuthenticatedUserId();

        if (!isMounted) {
          return;
        }

        if (!authenticatedUserId) {
          setGymLoadError("Using local gym data right now.");
          return;
        }

        const gyms = await getSupabaseGymsForUser(authenticatedUserId);
        const cards = await Promise.all(
          gyms.map(async (gym) => ({
            id: gym.id,
            name: gym.name,
            joinDate: await getSupabaseUserJoinDateForGym(authenticatedUserId, gym.id),
          }))
        );

        if (!isMounted) {
          return;
        }

        setGymCards(cards);
        setGymLoadError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setGymLoadError("Using local gym data right now.");
      } finally {
        if (isMounted) {
          setIsLoadingGyms(false);
        }
      }
    };

    void loadGyms();

    return () => {
      isMounted = false;
    };
  }, []);

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

        {isLoadingGyms ? (
          <View style={styles.statusBanner}>
            <ActivityIndicator size="small" color="#BFBFBF" />
            <Text style={styles.statusBannerText}>Syncing gyms</Text>
          </View>
        ) : null}
        {gymLoadError ? (
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>{gymLoadError}</Text>
          </View>
        ) : null}

        {gymCards.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No gyms yet</Text>
            <Text style={styles.emptyStateText}>
              Join a gym with a code and it will appear here.
            </Text>
          </View>
        ) : (
          gymCards.map((gym) => {
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
                    <Text style={styles.statValue}>Member Since: <Text style={styles.statLabel}>{gym.joinDate ? formatDate(gym.joinDate) : "N/A"}</Text></Text>
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
    marginBottom: 12,
  },
  statusBannerText: {
    color: "#A8A8A8",
    fontSize: 13,
    textAlign: "center",
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