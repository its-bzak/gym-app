import { router } from "expo-router";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getGymsForUser as getMockGymsForUser,
  joinGymByCode as joinMockGymByCode,
  getUserJoinDateForGym as getMockUserJoinDateForGym,
} from "@/mock/mockDataService";
import {
  getGymsForUser as getSupabaseGymsForUser,
  joinGymByCode as joinSupabaseGymByCode,
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

async function buildSupabaseGymCards(userId: string): Promise<GymCard[]> {
  const gyms = await getSupabaseGymsForUser(userId);

  return Promise.all(
    gyms.map(async (gym) => ({
      id: gym.id,
      name: gym.name,
      joinDate: await getSupabaseUserJoinDateForGym(userId, gym.id),
    }))
  );
}

export default function GymsScreen() {
  const [gymCards, setGymCards] = useState<GymCard[]>(() => buildFallbackGymCards());
  const [isLoadingGyms, setIsLoadingGyms] = useState(true);
  const [gymLoadError, setGymLoadError] = useState<string | null>(null);
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null);
  const [isJoiningGym, setIsJoiningGym] = useState(false);

  const closeJoinModal = () => {
    if (isJoiningGym) {
      return;
    }

    setIsJoinModalVisible(false);
    setJoinCode("");
    setJoinCodeError(null);
  };

  const openJoinModal = () => {
    setJoinCode("");
    setJoinCodeError(null);
    setIsJoinModalVisible(true);
  };

  const resetJoinModal = () => {
    setIsJoinModalVisible(false);
    setJoinCode("");
    setJoinCodeError(null);
  };

  const loadGyms = async () => {
    setIsLoadingGyms(true);

    try {
      const nextAuthenticatedUserId = await getAuthenticatedUserId();
      setAuthenticatedUserId(nextAuthenticatedUserId);

      if (!nextAuthenticatedUserId) {
        setGymCards(buildFallbackGymCards());
        setGymLoadError("Using local gym data right now.");
        return;
      }

      const cards = await buildSupabaseGymCards(nextAuthenticatedUserId);
      setGymCards(cards);
      setGymLoadError(null);
    } catch {
      setGymCards(buildFallbackGymCards());
      setGymLoadError("Using local gym data right now.");
    } finally {
      setIsLoadingGyms(false);
    }
  };

  const handleJoinGym = async () => {
    const trimmedJoinCode = joinCode.trim();

    if (!trimmedJoinCode) {
      setJoinCodeError("Join code is required.");
      return;
    }

    setIsJoiningGym(true);
    setJoinCodeError(null);

    try {
      if (authenticatedUserId) {
        const result = await joinSupabaseGymByCode(authenticatedUserId, trimmedJoinCode);

        if (result.success) {
          try {
            joinMockGymByCode(CURRENT_USER_ID, trimmedJoinCode);
          } catch {
            // Best-effort local mirror only.
          }

          await loadGyms();
          resetJoinModal();
          return;
        }

        if (!result.shouldFallback) {
          setJoinCodeError(result.error ?? "Could not join gym.");
          return;
        }
      }

      const fallbackResult = joinMockGymByCode(CURRENT_USER_ID, trimmedJoinCode);

      if (!fallbackResult.success) {
        setJoinCodeError(fallbackResult.error ?? "Could not join gym.");
        setGymLoadError("Using local gym data right now.");
        setGymCards(buildFallbackGymCards());
        return;
      }

      setGymLoadError("Using local gym data right now.");
      setGymCards(buildFallbackGymCards());
      resetJoinModal();
    } finally {
      setIsJoiningGym(false);
    }
  };

  useEffect(() => {
    const hydrateGyms = async () => {
      await loadGyms();
    };

    void hydrateGyms();
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

        <Pressable style={styles.joinButton} onPress={openJoinModal}>
          <Text style={styles.joinButtonText}>Join with Code</Text>
        </Pressable>

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

      <Modal
        animationType="fade"
        transparent
        visible={isJoinModalVisible}
        onRequestClose={closeJoinModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Join a gym</Text>
            <Text style={styles.modalMessage}>
              Enter the gym join code to add it to your account.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={joinCode}
              onChangeText={(value) => {
                setJoinCode(value);
                setJoinCodeError(null);
              }}
              placeholder="Enter join code"
              placeholderTextColor="#6F6F6F"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isJoiningGym}
            />

            {joinCodeError ? <Text style={styles.modalErrorText}>{joinCodeError}</Text> : null}

            <View style={styles.modalButtonRow}>
              <Pressable style={styles.modalSecondaryButton} onPress={closeJoinModal}>
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </Pressable>

              <Pressable style={styles.modalPrimaryButton} onPress={handleJoinGym}>
                {isJoiningGym ? (
                  <ActivityIndicator size="small" color="#F4F4F4" />
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>Join Gym</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 12,
  },
  joinButton: {
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: "#232323",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  joinButtonText: {
    color: "#F4F4F4",
    fontSize: 15,
    fontWeight: "600",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: "#161616",
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    color: "#F4F4F4",
    fontSize: 22,
    fontWeight: "600",
  },
  modalMessage: {
    color: "#A0A0A0",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  modalInput: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#202020",
    color: "#F4F4F4",
    paddingHorizontal: 16,
    fontSize: 16,
    marginTop: 18,
  },
  modalErrorText: {
    color: "#F28B82",
    fontSize: 13,
    marginTop: 10,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  modalSecondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#202020",
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#313131",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryButtonText: {
    color: "#B0B0B0",
    fontSize: 15,
    fontWeight: "600",
  },
  modalPrimaryButtonText: {
    color: "#F4F4F4",
    fontSize: 15,
    fontWeight: "600",
  },
});