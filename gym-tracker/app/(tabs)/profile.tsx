import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { mockProfile } from "@/mock/MainScreen/DailyMetricsSection";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { ScrollView } from "react-native";
import { mockBadgeCategories } from "@/mock/badges";

export default function ProfileScreen() {
  const displayedBadges = mockBadgeCategories
    .flatMap((category) => category.badges)
    .filter((badge) => badge.isDisplayed)
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.settingsButton} onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={24} color="#F4F4F4" />
        </Pressable>
        <View style={styles.profilePictureContainer}>

        </View>
        <Text style={styles.usernameText}>
          @{mockProfile.username}
        </Text>
        <View style={styles.buttonsContainer}>
          <Pressable style={styles.routinesButton}>
            <Text style={styles.routinesButtonText}>Routines</Text>
          </Pressable>
          <Pressable style={styles.goalsButton}>
            <Text style={styles.goalsButtonText}>Goals</Text>
          </Pressable>
          <Pressable style={styles.exercisesButton}>
            <Text style={styles.exercisesButtonText}>Exercises</Text>
          </Pressable>
        </View>
        <View style={styles.bodyMapContainer}>
          {/* Placeholder for BodyMap component */}
        </View>
        <View style={styles.badgesContainer}>
          <View style={styles.badgeRow}>
            {displayedBadges.map((badge) => (
              <View key={badge.id} style={styles.badge}>
                <Text style={styles.badgeText}>{badge.name}</Text>
              </View>
            ))}
          </View>
          <Pressable style={styles.seeMoreBadgesButton} onPress={() => router.push("/badges")}>
            <Text style={styles.seeMoreBadgesButtonText}>See More Badges</Text>
          </Pressable>
        </View>
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
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#151515",
    paddingHorizontal: 18,
    paddingTop: 9,
  },
  settingsButton: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButtonText: {
    color: "#F4F4F4",
    fontSize: 16,
    fontWeight: "500",
  },
  profilePictureContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    backgroundColor: "#1A1A1A",
    marginBottom: 5,
  },
  usernameText: {
    color: "#8b8b8b",
    fontSize: 18,
    fontWeight: "400",
    textAlign: "center",
  },
  buttonsContainer: {
    marginTop: 20,
    width: "100%",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  routinesButton: {
    flex: 1,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  routinesButtonText: {
    color: "#F4F4F4",
    fontSize: 14,
    fontWeight: "500",
  },
  goalsButton: {
    flex: 1,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  goalsButtonText: {
    color: "#F4F4F4",
    fontSize: 14,
    fontWeight: "500",
  },
  exercisesButton: {
    flex: 1,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },
  exercisesButtonText: {
    color: "#F4F4F4",
    fontSize: 14,
    fontWeight: "500",
    },
  bodyMapContainer: {
    marginTop: 20,
    height: 360,
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
  },
  badgesContainer: {
    marginTop: 20,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  badge: {
    flex: 1,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  badgeText: {
    color: "#F4F4F4",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  seeMoreBadgesButton: {
    height: 30,
    borderRadius: 20,
    marginBottom: 40,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  seeMoreBadgesButtonText: {
    color: "#F4F4F4",
    fontSize: 14,
    fontWeight: "500",
  },
});