import {
  getDisplayUnitPreference,
  getUserProfileById,
  setDisplayUnitPreference,
  updateUserProfile,
  type DisplayUnitPreference,
} from "@/mock/mockDataService";
import { formatDate } from "@/utils/dateFormat";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const [name, setName] = useState(profile?.name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (!profile?.dateOfBirth) {
      return 6;
    }

    return Number(profile.dateOfBirth.split("-")[1]);
  });
  const [selectedDay, setSelectedDay] = useState(() => {
    if (!profile?.dateOfBirth) {
      return 14;
    }

    return Number(profile.dateOfBirth.split("-")[2]);
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    if (!profile?.dateOfBirth) {
      return 1998;
    }

    return Number(profile.dateOfBirth.split("-")[0]);
  });
  const [isBirthDateModalVisible, setIsBirthDateModalVisible] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [usernameError, setUsernameError] = useState(false);

  const monthOptions = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();

    return Array.from({ length: 90 }, (_, index) => currentYear - 13 - index);
  }, []);

  const dayOptions = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => index + 1);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedDay > dayOptions.length) {
      setSelectedDay(dayOptions.length);
    }
  }, [dayOptions, selectedDay]);

  const dateOfBirthIso = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(
    Math.min(selectedDay, dayOptions.length)
  ).padStart(2, "0")}`;
  const formattedBirthDate = formatDate(dateOfBirthIso);

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const hasNameError = trimmedName.length === 0;
    const hasUsernameError = trimmedUsername.length === 0;

    setNameError(hasNameError);
    setUsernameError(hasUsernameError);

    if (hasNameError || hasUsernameError) {
      Alert.alert("Missing information", "Name and username are required.");
      return;
    }

    const updatedProfileResult = updateUserProfile(CURRENT_USER_ID, {
      name: trimmedName,
      username: trimmedUsername,
      dateOfBirth: dateOfBirthIso,
    });

    if (!updatedProfileResult.success) {
      Alert.alert("Could not save profile", updatedProfileResult.error ?? "Please try again.");
      return;
    }

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
      <Modal
        animationType="slide"
        transparent
        visible={isBirthDateModalVisible}
        onRequestClose={() => setIsBirthDateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select date of birth</Text>
              <Pressable onPress={() => setIsBirthDateModalVisible(false)}>
                <Text style={styles.modalDoneText}>Done</Text>
              </Pressable>
            </View>

            <View style={styles.birthPickerColumns}>
              <View style={styles.birthPickerColumn}>
                <Text style={styles.birthPickerLabel}>Month</Text>
                <ScrollView style={styles.birthPickerScroll} showsVerticalScrollIndicator={false}>
                  {monthOptions.map((month, index) => {
                    const monthValue = index + 1;
                    const isSelected = selectedMonth === monthValue;

                    return (
                      <Pressable
                        key={month}
                        style={[
                          styles.birthPickerOption,
                          isSelected && styles.birthPickerOptionSelected,
                        ]}
                        onPress={() => setSelectedMonth(monthValue)}>
                        <Text
                          style={[
                            styles.birthPickerOptionText,
                            isSelected && styles.birthPickerOptionTextSelected,
                          ]}>
                          {month}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.birthPickerColumnDay}>
                <Text style={styles.birthPickerLabel}>Day</Text>
                <ScrollView style={styles.birthPickerScroll} showsVerticalScrollIndicator={false}>
                  {dayOptions.map((day) => {
                    const isSelected = selectedDay === day;

                    return (
                      <Pressable
                        key={day}
                        style={[
                          styles.birthPickerOption,
                          isSelected && styles.birthPickerOptionSelected,
                        ]}
                        onPress={() => setSelectedDay(day)}>
                        <Text
                          style={[
                            styles.birthPickerOptionText,
                            isSelected && styles.birthPickerOptionTextSelected,
                          ]}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.birthPickerColumnDay}>
                <Text style={styles.birthPickerLabel}>Year</Text>
                <ScrollView style={styles.birthPickerScroll} showsVerticalScrollIndicator={false}>
                  {yearOptions.map((year) => {
                    const isSelected = selectedYear === year;

                    return (
                      <Pressable
                        key={year}
                        style={[
                          styles.birthPickerOption,
                          isSelected && styles.birthPickerOptionSelected,
                        ]}
                        onPress={() => setSelectedYear(year)}>
                        <Text
                          style={[
                            styles.birthPickerOptionText,
                            isSelected && styles.birthPickerOptionTextSelected,
                          ]}>
                          {year}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Pressable style={styles.returnButton} onPress={() => router.back()}>
          <Text style={styles.returnButtonText}>Back</Text>
        </Pressable>


        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarBadge}>
              <Ionicons name="person-outline" size={24} color="#F4F4F4" />
            </View>
            <View style={styles.profileHeaderText}>
              <Text style={styles.sectionTitle}>Profile</Text>
            </View>
          </View>

          <View style={styles.infoList}>
            <View style={styles.fieldBlock}>
              <Text style={styles.infoLabel}>Name</Text>
              <TextInput
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  if (nameError) {
                    setNameError(false);
                  }
                }}
                placeholder="Enter your name"
                placeholderTextColor="#6F6F6F"
                style={[styles.textInput, nameError && styles.textInputError]}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.infoLabel}>Username</Text>
              <TextInput
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  if (usernameError) {
                    setUsernameError(false);
                  }
                }}
                placeholder="Choose a username"
                placeholderTextColor="#6F6F6F"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.textInput, usernameError && styles.textInputError]}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.infoLabel}>Date of birth</Text>
              <Pressable
                style={styles.birthDateButton}
                onPress={() => setIsBirthDateModalVisible(true)}>
                <Text style={styles.birthDateButtonText}>{formattedBirthDate}</Text>
                <Ionicons name="chevron-down" size={18} color="#A8A8A8" />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Unit System</Text>

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
    marginBottom: 8,
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
  fieldBlock: {
    gap: 8,
  },
  infoLabel: {
    color: "#8B8B8B",
    fontSize: 13,
  },
  textInput: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#212121",
    borderWidth: 1,
    borderColor: "#212121",
    color: "#F4F4F4",
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 14,
  },
  textInputError: {
    borderColor: "#A94A4A",
    backgroundColor: "#261B1B",
  },
  birthDateButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: 14,
  },
  birthDateButtonText: {
    color: "#F4F4F4",
    fontSize: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#161616",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    minHeight: 420,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  modalTitle: {
    color: "#F4F4F4",
    fontSize: 20,
    fontWeight: "700",
  },
  modalDoneText: {
    color: "#7CA2FF",
    fontSize: 16,
    fontWeight: "600",
  },
  birthPickerColumns: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  birthPickerColumn: {
    flex: 1.4,
  },
  birthPickerColumnDay: {
    flex: 1,
  },
  birthPickerLabel: {
    color: "#8B8B8B",
    fontSize: 13,
    marginBottom: 10,
  },
  birthPickerScroll: {
    maxHeight: 300,
  },
  birthPickerOption: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  birthPickerOptionSelected: {
    backgroundColor: "#20273A",
    borderWidth: 1,
    borderColor: "#5E8BFF",
  },
  birthPickerOptionText: {
    color: "#C7C7C7",
    fontSize: 15,
    fontWeight: "500",
  },
  birthPickerOptionTextSelected: {
    color: "#F4F4F4",
    fontWeight: "700",
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