import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { mockProfile } from "@/mock/MainScreen/DailyMetricsSection";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContentContainer}>
        <Pressable style={styles.settingsButton} onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={24} color="#F4F4F4" />
        </Pressable>
        <View style={styles.profilePictureContainer}>

        </View>
        <Text style={styles.usernameText}>
          @{mockProfile.username}
          </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#151515",
  },
  mainContentContainer: {
    flex: 1,
    backgroundColor: "#151515",
    padding: 18,
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
});