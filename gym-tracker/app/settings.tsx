import {
  getDisplayUnitPreference as getMockDisplayUnitPreference,
  getUserProfileById as getMockUserProfileById,
  setDisplayUnitPreference as setMockDisplayUnitPreference,
  updateUserProfile as updateMockUserProfile,
  type DisplayUnitPreference,
} from "@/mock/mockDataService";
import { getFailedSyncOutboxEntries, getSyncDiagnostics } from "@/db/sqlite";
import { syncPendingLocalChanges } from "@/services/localSyncService";
import {
  getAuthenticatedUserId,
  getDisplayUnitPreference as getSupabaseDisplayUnitPreference,
  getUserProfileById as getSupabaseUserProfileById,
  setDisplayUnitPreference as setSupabaseDisplayUnitPreference,
  updateUserProfile as updateSupabaseUserProfile,
} from "@/services/profileService";
import { formatDate } from "@/utils/dateFormat";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { supabase } from "@/lib/supabase";
import { V2_ROUTES } from "@/v2/navigation/routes";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const CURRENT_USER_ID = "user_ryan";
const CONTACT_EMAIL = "support@gymtracker.app";
const MIN_BIRTH_YEAR = 1900;
const BIRTH_PICKER_ITEM_HEIGHT = 54;
const BIRTH_PICKER_VISIBLE_HEIGHT = 216;
const BIRTH_PICKER_VERTICAL_INSET = (BIRTH_PICKER_VISIBLE_HEIGHT - BIRTH_PICKER_ITEM_HEIGHT) / 2;

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

function clampBirthDateParts(year: number, month: number, day: number) {
  const today = new Date();
  const maxYear = today.getFullYear();
  const safeYear = Math.min(Math.max(year, MIN_BIRTH_YEAR), maxYear);
  const safeMonth = Math.min(Math.max(month, 1), 12);
  let maxDay = new Date(safeYear, safeMonth, 0).getDate();

  if (safeYear === maxYear && safeMonth === today.getMonth() + 1) {
    maxDay = Math.min(maxDay, today.getDate());
  }

  return {
    year: safeYear,
    month: safeMonth,
    day: Math.min(Math.max(day, 1), maxDay),
  };
}

function getClosestPickerIndex(offsetY: number, itemCount: number) {
  return Math.max(0, Math.min(itemCount - 1, Math.round(offsetY / BIRTH_PICKER_ITEM_HEIGHT)));
}

function BirthPickerFadeMask() {
  return (
    <View pointerEvents="none" style={styles.birthPickerFadeOverlay}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="birth-picker-fade-top" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#161616" />
            <Stop offset="0%" stopColor="#161616" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="birth-picker-fade-bottom" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#161616" stopOpacity="0" />
            <Stop offset="0%" stopColor="#161616" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="0%" fill="url(#birth-picker-fade-top)" />
        <Rect x="0" y="25%" width="100%" height="0%" fill="url(#birth-picker-fade-bottom)" />
      </Svg>
    </View>
  );
}

export default function SettingsScreen() {
  const fallbackProfile = getMockUserProfileById(CURRENT_USER_ID);
  const fallbackDateParts = useMemo(() => {
    if (!fallbackProfile?.dateOfBirth) {
      return clampBirthDateParts(1998, 6, 14);
    }

    const [year, month, day] = fallbackProfile.dateOfBirth.split("-").map(Number);
    return clampBirthDateParts(year, month, day);
  }, [fallbackProfile?.dateOfBirth]);
  const [selectedUnit, setSelectedUnit] = useState<DisplayUnitPreference>(() =>
    getMockDisplayUnitPreference(CURRENT_USER_ID)
  );
  const [name, setName] = useState(fallbackProfile?.name ?? "");
  const [username, setUsername] = useState(fallbackProfile?.username ?? "");
  const [selectedMonth, setSelectedMonth] = useState(fallbackDateParts.month);
  const [selectedDay, setSelectedDay] = useState(fallbackDateParts.day);
  const [selectedYear, setSelectedYear] = useState(fallbackDateParts.year);
  const [isBirthDateModalVisible, setIsBirthDateModalVisible] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [usernameError, setUsernameError] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(true);
  const [isSyncingLocalChanges, setIsSyncingLocalChanges] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [syncDiagnostics, setSyncDiagnostics] = useState(() => getSyncDiagnostics());
  const [failedSyncEntries, setFailedSyncEntries] = useState(() => getFailedSyncOutboxEntries());
  const monthPickerRef = useRef<ScrollView | null>(null);
  const dayPickerRef = useRef<ScrollView | null>(null);
  const yearPickerRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    let isMounted = true;

    const applyLoadedDateOfBirth = (dateOfBirth: string | null) => {
      if (!dateOfBirth) {
        return;
      }

      const [year, month, day] = dateOfBirth.split("-").map(Number);
      const clampedDate = clampBirthDateParts(year, month, day);

      setSelectedYear(clampedDate.year);
      setSelectedMonth(clampedDate.month);
      setSelectedDay(clampedDate.day);
    };

    const loadProfileSettings = async () => {
      try {
        const authenticatedUserId = await getAuthenticatedUserId();

        if (!isMounted || !authenticatedUserId) {
          return;
        }

        const [profile, unitPreference] = await Promise.all([
          getSupabaseUserProfileById(authenticatedUserId),
          getSupabaseDisplayUnitPreference(authenticatedUserId),
        ]);

        if (!isMounted) {
          return;
        }

        if (profile) {
          setName(profile.name);
          setUsername(profile.username);
          applyLoadedDateOfBirth(profile.dateOfBirth);
        }

        setSelectedUnit(unitPreference);
        setProfileLoadError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setProfileLoadError("Using local settings data right now.");
      } finally {
        if (isMounted) {
          setIsSyncingProfile(false);
        }
      }
    };

    void loadProfileSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setSyncDiagnostics(getSyncDiagnostics());
    setFailedSyncEntries(getFailedSyncOutboxEntries());
  }, []);

  const today = useMemo(() => new Date(), []);

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
    const currentYear = today.getFullYear();

    return Array.from({ length: currentYear - MIN_BIRTH_YEAR + 1 }, (_, index) => currentYear - index);
  }, [today]);

  const availableMonthValues = useMemo(() => {
    const maxMonth = selectedYear === today.getFullYear() ? today.getMonth() + 1 : 12;

    return Array.from({ length: maxMonth }, (_, index) => index + 1);
  }, [selectedYear, today]);

  const dayOptions = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const maxDay = selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1
      ? Math.min(daysInMonth, today.getDate())
      : daysInMonth;

    return Array.from({ length: maxDay }, (_, index) => index + 1);
  }, [selectedMonth, selectedYear, today]);

  useEffect(() => {
    if (!availableMonthValues.includes(selectedMonth)) {
      setSelectedMonth(availableMonthValues[availableMonthValues.length - 1] ?? 1);
    }
  }, [availableMonthValues, selectedMonth]);

  useEffect(() => {
    if (selectedDay > dayOptions.length) {
      setSelectedDay(dayOptions.length);
    }
  }, [dayOptions, selectedDay]);

  useEffect(() => {
    if (!isBirthDateModalVisible) {
      return;
    }

    const frameId = requestAnimationFrame(() => {
      monthPickerRef.current?.scrollTo({
        y: availableMonthValues.indexOf(selectedMonth) * BIRTH_PICKER_ITEM_HEIGHT,
        animated: false,
      });
      dayPickerRef.current?.scrollTo({
        y: dayOptions.indexOf(selectedDay) * BIRTH_PICKER_ITEM_HEIGHT,
        animated: false,
      });
      yearPickerRef.current?.scrollTo({
        y: yearOptions.indexOf(selectedYear) * BIRTH_PICKER_ITEM_HEIGHT,
        animated: false,
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [availableMonthValues, dayOptions, isBirthDateModalVisible, selectedDay, selectedMonth, selectedYear, yearOptions]);

  const scrollBirthPickerToIndex = (ref: React.RefObject<ScrollView | null>, index: number) => {
    ref.current?.scrollTo({
      y: index * BIRTH_PICKER_ITEM_HEIGHT,
      animated: true,
    });
  };

  const dateOfBirthIso = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(
    Math.min(selectedDay, dayOptions.length)
  ).padStart(2, "0")}`;
  const formattedBirthDate = formatDate(dateOfBirthIso);

  const handleSave = async () => {
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

    setIsSavingSettings(true);

    try {
      const authenticatedUserId = await getAuthenticatedUserId();

      if (!authenticatedUserId) {
        const localProfileResult = updateMockUserProfile(CURRENT_USER_ID, {
          name: trimmedName,
          username: trimmedUsername,
          dateOfBirth: dateOfBirthIso,
        });

        if (!localProfileResult.success) {
          Alert.alert("Could not save profile", localProfileResult.error ?? "Please try again.");
          return;
        }

        setMockDisplayUnitPreference(CURRENT_USER_ID, selectedUnit);
        setProfileLoadError("Saved locally while account sync is unavailable.");
        Alert.alert("Settings updated", "Your changes were saved locally.");
        return;
      }

      const updatedProfileResult = await updateSupabaseUserProfile(authenticatedUserId, {
        name: trimmedName,
        username: trimmedUsername,
        dateOfBirth: dateOfBirthIso,
      });

      if (!updatedProfileResult.success) {
        Alert.alert("Could not save profile", updatedProfileResult.error ?? "Please try again.");
        return;
      }

      await setSupabaseDisplayUnitPreference(authenticatedUserId, selectedUnit);

      updateMockUserProfile(CURRENT_USER_ID, {
        name: trimmedName,
        username: trimmedUsername,
        dateOfBirth: dateOfBirthIso,
      });
      setMockDisplayUnitPreference(CURRENT_USER_ID, selectedUnit);
      setProfileLoadError(null);

      Alert.alert("Settings updated", "Your changes have been saved.");
    } catch (error) {
      const localProfileResult = updateMockUserProfile(CURRENT_USER_ID, {
        name: trimmedName,
        username: trimmedUsername,
        dateOfBirth: dateOfBirthIso,
      });

      if (!localProfileResult.success) {
        Alert.alert("Could not save profile", localProfileResult.error ?? "Please try again.");
        return;
      }

      setMockDisplayUnitPreference(CURRENT_USER_ID, selectedUnit);
      setProfileLoadError("Saved locally while account sync is unavailable.");

      const message = error instanceof Error ? error.message : "Please try again.";
      Alert.alert("Saved locally only", message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleContact = async () => {
    const emailUrl = `mailto:${CONTACT_EMAIL}?subject=Gym%20Tracker%20Support`;

    try {
      await Linking.openURL(emailUrl);
    } catch {
      Alert.alert("Contact unavailable", `Email us at ${CONTACT_EMAIL}.`);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncingLocalChanges(true);
    setSyncStatusMessage(null);

    try {
      const result = await syncPendingLocalChanges({ force: true });

      setSyncDiagnostics(result.diagnostics);
      setFailedSyncEntries(getFailedSyncOutboxEntries());

      if (result.skipped) {
        setSyncStatusMessage("Sign in to sync local changes to your account.");
        return;
      }

      if (result.statusMessage) {
        setSyncStatusMessage(result.statusMessage);
        return;
      }

      if (result.syncedCount > 0 && result.pulledCount > 0) {
        setSyncStatusMessage(
          `Synced ${result.syncedCount} local change${result.syncedCount === 1 ? "" : "s"} and pulled ${result.pulledCount} cloud update${result.pulledCount === 1 ? "" : "s"}.`
        );
      } else if (result.syncedCount > 0) {
        setSyncStatusMessage(
          `Synced ${result.syncedCount} local change${result.syncedCount === 1 ? "" : "s"}.`
        );
      } else if (result.pulledCount > 0) {
        setSyncStatusMessage(
          `Pulled ${result.pulledCount} cloud update${result.pulledCount === 1 ? "" : "s"}.`
        );
      } else {
        setSyncStatusMessage("No sync work was waiting right now.");
      }
    } catch (error) {
      setSyncDiagnostics(getSyncDiagnostics());
      setFailedSyncEntries(getFailedSyncOutboxEntries());
      setSyncStatusMessage(
        error instanceof Error ? error.message : "Could not sync local changes right now."
      );
    } finally {
      setIsSyncingLocalChanges(false);
    }
  };

  const handleOpenV2Preview = () => {
    router.push(V2_ROUTES.dashboard);
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.auth.signOut();

          if (error) {
            Alert.alert("Logout failed", error.message);
            return;
          }

          router.replace("/login");
        },
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
                <View style={styles.birthPickerScrollContainer}>
                  <View style={styles.birthPickerCenterHighlight} pointerEvents="none" />
                  <ScrollView
                    ref={monthPickerRef}
                    style={styles.birthPickerScroll}
                    contentContainerStyle={styles.birthPickerScrollContent}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={BIRTH_PICKER_ITEM_HEIGHT}
                    decelerationRate="normal"
                    scrollEventThrottle={16}
                    onScroll={(event) => {
                      const index = getClosestPickerIndex(event.nativeEvent.contentOffset.y, availableMonthValues.length);
                      const monthValue = availableMonthValues[index];

                      if (monthValue && monthValue !== selectedMonth) {
                        setSelectedMonth(monthValue);
                      }
                    }}>
                  {availableMonthValues.map((monthValue) => {
                    const month = monthOptions[monthValue - 1];
                    const isSelected = selectedMonth === monthValue;

                    return (
                      <Pressable
                        key={month}
                        style={[
                          styles.birthPickerOption,
                          isSelected && styles.birthPickerOptionSelected,
                        ]}
                        onPress={() => scrollBirthPickerToIndex(monthPickerRef, availableMonthValues.indexOf(monthValue))}>
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
                  <BirthPickerFadeMask />
                </View>
              </View>

              <View style={styles.birthPickerColumnDay}>
                <Text style={styles.birthPickerLabel}>Day</Text>
                <View style={styles.birthPickerScrollContainer}>
                  <View style={styles.birthPickerCenterHighlight} pointerEvents="none" />
                  <ScrollView
                    ref={dayPickerRef}
                    style={styles.birthPickerScroll}
                    contentContainerStyle={styles.birthPickerScrollContent}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={BIRTH_PICKER_ITEM_HEIGHT}
                    decelerationRate="normal"
                    scrollEventThrottle={16}
                    onScroll={(event) => {
                      const index = getClosestPickerIndex(event.nativeEvent.contentOffset.y, dayOptions.length);
                      const day = dayOptions[index];

                      if (day && day !== selectedDay) {
                        setSelectedDay(day);
                      }
                    }}>
                  {dayOptions.map((day) => {
                    const isSelected = selectedDay === day;

                    return (
                      <Pressable
                        key={day}
                        style={[
                          styles.birthPickerOption,
                          isSelected && styles.birthPickerOptionSelected,
                        ]}
                        onPress={() => scrollBirthPickerToIndex(dayPickerRef, dayOptions.indexOf(day))}>
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
                  <BirthPickerFadeMask />
                </View>
              </View>

              <View style={styles.birthPickerColumnDay}>
                <Text style={styles.birthPickerLabel}>Year</Text>
                <View style={styles.birthPickerScrollContainer}>
                  <View style={styles.birthPickerCenterHighlight} pointerEvents="none" />
                  <ScrollView
                    ref={yearPickerRef}
                    style={styles.birthPickerScroll}
                    contentContainerStyle={styles.birthPickerScrollContent}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={BIRTH_PICKER_ITEM_HEIGHT}
                    decelerationRate="normal"
                    scrollEventThrottle={16}
                    onScroll={(event) => {
                      const index = getClosestPickerIndex(event.nativeEvent.contentOffset.y, yearOptions.length);
                      const year = yearOptions[index];

                      if (year && year !== selectedYear) {
                        setSelectedYear(year);
                      }
                    }}>
                  {yearOptions.map((year) => {
                    const isSelected = selectedYear === year;

                    return (
                      <Pressable
                        key={year}
                        style={[
                          styles.birthPickerOption,
                          isSelected && styles.birthPickerOptionSelected,
                        ]}
                        onPress={() => scrollBirthPickerToIndex(yearPickerRef, yearOptions.indexOf(year))}>
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
                  <BirthPickerFadeMask />
                </View>
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

        {isSyncingProfile ? (
          <View style={styles.statusBanner}>
            <ActivityIndicator size="small" color="#BFBFBF" />
            <Text style={styles.statusBannerText}>Syncing settings</Text>
          </View>
        ) : null}
        {profileLoadError ? (
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>{profileLoadError}</Text>
          </View>
        ) : null}


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
          <Text style={styles.sectionTitle}>Sync</Text>
          <Text style={styles.sectionSubtitle}>Local-first changes queue here before uploading to Supabase.</Text>

          <View style={styles.syncStatRow}>
            <Text style={styles.syncStatLabel}>Pending changes</Text>
            <Text style={styles.syncStatValue}>{syncDiagnostics.pendingCount}</Text>
          </View>

          <View style={styles.syncStatRow}>
            <Text style={styles.syncStatLabel}>Failed changes</Text>
            <Text style={styles.syncStatValue}>{syncDiagnostics.failedCount}</Text>
          </View>

          <View style={styles.syncStatRow}>
            <Text style={styles.syncStatLabel}>Last successful sync</Text>
            <Text style={styles.syncStatValue}>
              {syncDiagnostics.lastSuccessAt ? formatDate(syncDiagnostics.lastSuccessAt) : "Never"}
            </Text>
          </View>

          {syncStatusMessage ? (
            <View style={styles.statusBanner}>
              <Text style={styles.statusBannerText}>{syncStatusMessage}</Text>
            </View>
          ) : null}

          {failedSyncEntries.length > 0 ? (
            <View style={styles.failedSyncList}>
              {failedSyncEntries.map((entry) => (
                <View key={`${entry.entity_type}-${entry.entity_id}`} style={styles.failedSyncCard}>
                  <Text style={styles.failedSyncTitle}>
                    {entry.entity_type} · {entry.entity_id}
                  </Text>
                  <Text style={styles.failedSyncText}>
                    {entry.last_error ?? "Unknown sync error."}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            style={styles.secondaryActionButton}
            onPress={() => void handleSyncNow()}
            disabled={isSyncingLocalChanges}>
            {isSyncingLocalChanges ? (
              <ActivityIndicator color="#F4F4F4" size="small" />
            ) : (
              <Ionicons name="sync-outline" size={18} color="#F4F4F4" />
            )}
            <Text style={styles.secondaryActionButtonText}>Sync now</Text>
          </Pressable>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.sectionSubtitle}>Need help or want to report an issue?</Text>

          <Pressable
            style={styles.secondaryActionButton}
            onLongPress={handleOpenV2Preview}
            delayLongPress={600}
            onPress={handleContact}>
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

        <Pressable
          style={[styles.confirmChangesButton, isSavingSettings && styles.confirmChangesButtonDisabled]}
          onPress={() => void handleSave()}
          disabled={isSavingSettings}>
          {isSavingSettings ? (
            <ActivityIndicator color="#151515" />
          ) : (
            <Text style={styles.confirmChangesButtonText}>Confirm changes</Text>
          )}
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
  syncStatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2A",
  },
  syncStatLabel: {
    color: "#A8A8A8",
    fontSize: 14,
  },
  syncStatValue: {
    color: "#F4F4F4",
    fontSize: 14,
    fontWeight: "600",
  },
  failedSyncList: {
    marginTop: 12,
    gap: 10,
  },
  failedSyncCard: {
    borderRadius: 16,
    backgroundColor: "#241818",
    padding: 12,
  },
  failedSyncTitle: {
    color: "#F6D38A",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  failedSyncText: {
    color: "#E3B6B6",
    fontSize: 13,
    lineHeight: 18,
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
    height: BIRTH_PICKER_VISIBLE_HEIGHT,
    maxHeight: BIRTH_PICKER_VISIBLE_HEIGHT,
  },
  birthPickerScrollContent: {
    paddingVertical: BIRTH_PICKER_VERTICAL_INSET,
  },
  birthPickerScrollContainer: {
    position: "relative",
    height: BIRTH_PICKER_VISIBLE_HEIGHT,
    justifyContent: "center",
  },
  birthPickerCenterHighlight: {
    position: "absolute",
    top: BIRTH_PICKER_VERTICAL_INSET,
    left: 0,
    right: 0,
    height: BIRTH_PICKER_ITEM_HEIGHT,
    borderRadius: 14,
    backgroundColor: "#20273A",
    borderWidth: 1,
    borderColor: "rgba(94, 139, 255, 0.45)",
  },
  birthPickerOption: {
    height: BIRTH_PICKER_ITEM_HEIGHT,
    borderRadius: 14,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  birthPickerOptionSelected: {
    transform: [{ scale: 1.08 }],
  },
  birthPickerOptionText: {
    color: "#C7C7C7",
    fontSize: 15,
    fontWeight: "500",
  },
  birthPickerOptionTextSelected: {
    color: "#F4F4F4",
    fontWeight: "700",
    fontSize: 17,
  },
  birthPickerFadeOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
  confirmChangesButtonDisabled: {
    opacity: 0.7,
  },
  confirmChangesButtonText: {
    color: "#151515",
    fontSize: 16,
    fontWeight: "700",
  },
});