import { useState } from "react";
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

function parseMuscleList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function NewExerciseScreen() {
  const { addCustomExercise, hasExerciseNamed } = useLibrary();
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [primaryMuscles, setPrimaryMuscles] = useState("");
  const [secondaryMuscles, setSecondaryMuscles] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedMuscleGroup = muscleGroup.trim();

    if (!trimmedName || !trimmedMuscleGroup) {
      setErrorMessage("Name and muscle group are required.");
      return;
    }

    if (hasExerciseNamed(trimmedName)) {
      setErrorMessage("That exercise already exists in your library.");
      return;
    }

    const parsedPrimaryMuscles = parseMuscleList(primaryMuscles);

    addCustomExercise({
      name: trimmedName,
      muscleGroup: trimmedMuscleGroup,
      primaryMuscles:
        parsedPrimaryMuscles.length > 0 ? parsedPrimaryMuscles : [trimmedMuscleGroup],
      secondaryMuscles: parseMuscleList(secondaryMuscles),
    });

    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>New Exercise</Text>
        <Text style={styles.subtitle}>
          Create a custom exercise that can be selected from your workout library.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Exercise Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(value) => {
              setName(value);
              setErrorMessage(null);
            }}
            placeholder="Ex: Cable Upright Row"
            placeholderTextColor="#6F6F6F"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Muscle Group</Text>
          <TextInput
            style={styles.input}
            value={muscleGroup}
            onChangeText={(value) => {
              setMuscleGroup(value);
              setErrorMessage(null);
            }}
            placeholder="Ex: Shoulders"
            placeholderTextColor="#6F6F6F"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Primary Muscles</Text>
          <TextInput
            style={styles.input}
            value={primaryMuscles}
            onChangeText={setPrimaryMuscles}
            placeholder="Comma separated"
            placeholderTextColor="#6F6F6F"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Secondary Muscles</Text>
          <TextInput
            style={styles.input}
            value={secondaryMuscles}
            onChangeText={setSecondaryMuscles}
            placeholder="Comma separated"
            placeholderTextColor="#6F6F6F"
          />
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