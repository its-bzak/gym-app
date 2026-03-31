import {
  getDisplayUnitPreference,
  getUserProfileById,
  setDisplayUnitPreference,
  type DisplayUnitPreference,
} from "@/mock/mockDataService";
import { formatDate } from "@/utils/dateFormat";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CURRENT_USER_ID = "user_ryan";
const CONTACT_EMAIL = "support@gymtracker.app";

const unitOptions: Array<{
  value: DisplayUnitPreference;
  label: string;
  description: string;
}> = [
  {
    value: "imperial",
    label: "Imperial",
    description: "Pounds, feet, and inches",
  },
  {
    value: "metric",
    label: "Metric",
    description: "Kilograms, centimeters",
  },
];

export default function SettingsScreen() {
  const profile = getUserProfileById(CURRENT_USER_ID);
  const [selectedUnit, setSelectedUnit] = useState<DisplayUnitPreference>(() =>
    getDisplayUnitPreference(CURRENT_USER_ID)
  );

  const profileRows = [
    { label: "Username", value: profile ? `@${profile.username}` : "Unavailable" },
    { label: "Name", value: profile?.name ?? "Unavailable" },
    {
      label: "Date of birth",
      value: profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : "Unavailable",
    },
  ];

  const handleSave = () => {
    const savedUnit = setDisplayUnitPreference(CURRENT_USER_ID, selectedUnit);

    Alert.alert("Settings updated", `Display units set to ${savedUnit}.`);
  };

  const handleContact = async () => {
    const emailUrl = `mailto:${CONTACT_EMAIL}?subject=Gym%20Tracker%20Support`;

    try {
      await Linking.openURL(emailUrl);
    } catch {
      Alert.alert("Contact unavailable", `Email us at ${CONTACT_EMAIL}.`);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => router.replace("/login"),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Pressable style={styles.returnButton} onPress={() => router.back()}>
          <Text style={styles.returnButtonText}>Back</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Profile details, app units, and account actions.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarBadge}>
              <Ionicons name="person-outline" size={24} color="#F4F4F4" />
            </View>
            <View style={styles.profileHeaderText}>
              <Text style={styles.sectionTitle}>Profile</Text>
              <Text style={styles.sectionSubtitle}>Current signed-in account</Text>
            </View>
          </View>

          <View style={styles.infoList}>
            {profileRows.map((row) => (
              <View key={row.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Display units</Text>
          <Text style={styles.sectionSubtitle}>Choose how measurements appear across the app.</Text>

          <View style={styles.unitOptionList}>
            {unitOptions.map((option) => {
              const isSelected = selectedUnit === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={[styles.unitOption, isSelected && styles.unitOptionSelected]}
                  onPress={() => setSelectedUnit(option.value)}>
                  <View style={styles.unitOptionTextBlock}>
                    <Text style={styles.unitLabel}>{option.label}</Text>
                    <Text style={styles.unitDescription}>{option.description}</Text>
                  </View>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.sectionSubtitle}>Need help or want to report an issue?</Text>

          <Pressable style={styles.secondaryActionButton} onPress={handleContact}>
            <Ionicons name="mail-outline" size={18} color="#F4F4F4" />
            <Text style={styles.secondaryActionButtonText}>Contact support</Text>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.sectionSubtitle}>End the current session on this device.</Text>

          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#F27979" />
            <Text style={styles.logoutButtonText}>Log out</Text>
          </Pressable>
        </View>

        <Pressable style={styles.confirmChangesButton} onPress={handleSave}>
          <Text style={styles.confirmChangesButtonText}>Confirm changes</Text>
        </Pressable>
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
    paddingTop: 72,
    paddingBottom: 36,
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
  header: {
    marginBottom: 20,
  },
  title: {
    color: "#F4F4F4",
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    color: "#8B8B8B",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  profileCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  avatarBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
  },
  profileHeaderText: {
    flex: 1,
  },
  sectionCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#F4F4F4",
    fontSize: 19,
    fontWeight: "600",
  },
  sectionSubtitle: {
    color: "#8B8B8B",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 14,
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    backgroundColor: "#212121",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  infoLabel: {
    color: "#8B8B8B",
    fontSize: 13,
    marginBottom: 6,
  },
  infoValue: {
    color: "#F4F4F4",
    fontSize: 17,
    fontWeight: "600",
  },
  unitOptionList: {
    gap: 10,
  },
  unitOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#212121",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "#212121",
  },
  unitOptionSelected: {
    borderColor: "#5E8BFF",
    backgroundColor: "#20273A",
  },
  unitOptionTextBlock: {
    flex: 1,
    paddingRight: 14,
  },
  unitLabel: {
    color: "#F4F4F4",
    fontSize: 16,
    fontWeight: "600",
  },
  unitDescription: {
    color: "#9A9A9A",
    fontSize: 13,
    marginTop: 4,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#6E6E6E",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#5E8BFF",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#5E8BFF",
  },
  secondaryActionButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryActionButtonText: {
    color: "#F4F4F4",
    fontSize: 15,
    fontWeight: "600",
  },
  logoutButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#241A1A",
    borderWidth: 1,
    borderColor: "#4A2A2A",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutButtonText: {
    color: "#F27979",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmChangesButton: {
    marginTop: 8,
    width: "100%",
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmChangesButtonText: {
    color: "#151515",
    fontSize: 16,
    fontWeight: "700",
  },
});