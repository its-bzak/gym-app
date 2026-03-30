import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLibrary } from "@/context/LibraryContext";

export default function NewExerciseScreen() {
  const { addCustomExercise, hasExerciseNamed, exercises } = useLibrary();
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<"primary" | "secondary" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasMissingNameError = errorMessage === "Name is required.";

  const muscleOptions = useMemo(() => {
    return Array.from(
      new Set(
        exercises.flatMap((exercise) => [
          exercise.muscleGroup,
          ...(exercise.primaryMuscles ?? []),
          ...(exercise.secondaryMuscles ?? []),
        ])
      )
    ).sort((first, second) => first.localeCompare(second));
  }, [exercises]);

  const toggleMuscleSelection = (
    muscle: string,
    target: "primary" | "secondary"
  ) => {
    const setter = target === "primary" ? setPrimaryMuscles : setSecondaryMuscles;

    setter((prev) => {
      if (prev.includes(muscle)) {
        return prev.filter((item) => item !== muscle);
      }

      return [...prev, muscle];
    });
  };

  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrorMessage("Name is required.");
      return;
    }

    if (hasExerciseNamed(trimmedName)) {
      setErrorMessage("That exercise already exists in your library.");
      return;
    }

    addCustomExercise({
      name: trimmedName,
      muscleGroup: primaryMuscles.length > 0 ? primaryMuscles[0] : "",
      primaryMuscles: primaryMuscles.length > 0 ? primaryMuscles : [primaryMuscles[0]],
      secondaryMuscles,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
            <Text style={styles.title}>New Exercise</Text>
        </View>

        <View style={styles.fieldGroup}>
          <TextInput
            style={[styles.input, hasMissingNameError && styles.inputError]}
            value={name}
            onChangeText={(value) => {
              setName(value);
              setErrorMessage(null);
            }}
            placeholder="Ex: Cable Upright Row"
            placeholderTextColor="#6F6F6F"
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.fieldGroup, styles.dropdownFieldGroup, styles.leftDropdownGroup]}>
            <Text style={styles.label}>Primary Muscles</Text>
            <Pressable
              style={styles.dropdownButton}
              onPress={() =>
                setOpenDropdown((currentValue) =>
                  currentValue === "primary" ? null : "primary"
                )
              }>
              <Text style={styles.dropdownButtonText} numberOfLines={2}>
                {primaryMuscles.length > 0
                  ? primaryMuscles.join(", ")
                  : "Select muscles"}
              </Text>
            </Pressable>

            {openDropdown === "primary" && (
              <View style={styles.dropdownMenu}>
                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.dropdownMenuContent}>
                  {muscleOptions.map((muscle) => {
                    const isSelected = primaryMuscles.includes(muscle);

                    return (
                      <Pressable
                        key={`primary-${muscle}`}
                        style={styles.dropdownOption}
                        onPress={() => toggleMuscleSelection(muscle, "primary")}>
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            isSelected && styles.dropdownOptionTextSelected,
                          ]}>
                          {muscle}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={[styles.fieldGroup, styles.dropdownFieldGroup, styles.rightDropdownGroup]}>
            <Text style={styles.label}>Secondary Muscles</Text>
            <Pressable
              style={styles.dropdownButton}
              onPress={() =>
                setOpenDropdown((currentValue) =>
                  currentValue === "secondary" ? null : "secondary"
                )
              }>
              <Text style={styles.dropdownButtonText} numberOfLines={2}>
                {secondaryMuscles.length > 0
                  ? secondaryMuscles.join(", ")
                  : "Select muscles"}
              </Text>
            </Pressable>

            {openDropdown === "secondary" && (
              <View style={styles.dropdownMenu}>
                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.dropdownMenuContent}>
                  {muscleOptions.map((muscle) => {
                    const isSelected = secondaryMuscles.includes(muscle);

                    return (
                      <Pressable
                        key={`secondary-${muscle}`}
                        style={styles.dropdownOption}
                        onPress={() => toggleMuscleSelection(muscle, "secondary")}>
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            isSelected && styles.dropdownOptionTextSelected,
                          ]}>
                          {muscle}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save Exercise</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#151515",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  content: {
    padding: 18,
    paddingBottom: 32,
  },
  title: {
    color: "#F4F4F4",
    fontSize: 28,
    fontWeight: "600",
  },
  subtitle: {
    color: "#A0A0A0",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    zIndex: 20,
  },
  dropdownFieldGroup: {
    flex: 1,
    position: "relative",
  },
  leftDropdownGroup: {
    zIndex: 30,
    elevation: 30,
  },
  rightDropdownGroup: {
    zIndex: 25,
    elevation: 25,
  },
  label: {
    color: "#D0D0D0",
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    color: "#F4F4F4",
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#F28B82",
  },
  dropdownButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  dropdownButtonText: {
    color: "#F4F4F4",
    fontSize: 14,
  },
  dropdownMenu: {
    position: "absolute",
    top: 76,
    left: 0,
    right: 0,
    maxHeight: 220,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    overflow: "hidden",
    zIndex: 40,
    elevation: 40,
  },
  dropdownMenuContent: {
    paddingVertical: 8,
  },
  dropdownOption: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  dropdownOptionText: {
    color: "#A0A0A0",
    fontSize: 14,
    fontWeight: "500",
  },
  dropdownOptionTextSelected: {
    color: "#00aa36",
  },
  errorText: {
    color: "#F28B82",
    fontSize: 14,
    marginBottom: 12,
  },
  primaryButton: {
    height: 50,
    borderRadius: 18,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#F4F4F4",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    height: 50,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  secondaryButtonText: {
    color: "#A0A0A0",
    fontSize: 16,
  },
});