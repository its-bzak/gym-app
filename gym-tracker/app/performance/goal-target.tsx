import { router } from "expo-router";
import { StyleSheet, Text, TextInput, View } from "react-native";

import WizardStepScreen from "@/components/performance/WizardStepScreen";
import { useGoalPlanWizard } from "@/context/GoalPlanWizardContext";

export default function GoalTargetRoute() {
  const { latestWeightKg, weightDraft, updateWeightDraft, saveCurrentDrafts, isSaving } =
    useGoalPlanWizard();

  const handleSave = async () => {
    const targetWeightKg = Number(weightDraft.targetWeightKg);
    const targetRateKgPerWeek = Number(weightDraft.targetRateKgPerWeek);

    if (!Number.isFinite(targetWeightKg) || targetWeightKg <= 0) {
      return;
    }

    if (!Number.isFinite(targetRateKgPerWeek) || targetRateKgPerWeek <= 0) {
      return;
    }

    const result = await saveCurrentDrafts();

    if (result.success) {
      router.replace("/(tabs)/performance");
    }
  };

  return (
    <WizardStepScreen
      title="Choose the target"
      subtitle="Set the bodyweight target and rate of change for this goal."
      step={2}
      totalSteps={2}
      onBack={() => router.back()}
      onNext={handleSave}
      backLabel="Back"
      nextLabel="Save Goal"
      isSaving={isSaving}>
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Current reference weight</Text>
        <Text style={styles.infoValue}>{(latestWeightKg ?? 0).toFixed(1)} kg</Text>
      </View>

      <View style={styles.stack}>
        <TextInput
          style={styles.input}
          value={weightDraft.targetWeightKg}
          onChangeText={(value) => updateWeightDraft({ targetWeightKg: value })}
          placeholder="Goal weight (kg)"
          placeholderTextColor="#6F6F6F"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={weightDraft.targetRateKgPerWeek}
          onChangeText={(value) => updateWeightDraft({ targetRateKgPerWeek: value })}
          placeholder={`Rate of ${weightDraft.goalType === "lose" ? "loss" : "gain"} (kg / week)`}
          placeholderTextColor="#6F6F6F"
          keyboardType="numeric"
        />
      </View>
    </WizardStepScreen>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    borderRadius: 18,
    backgroundColor: "#202020",
    padding: 16,
    marginBottom: 16,
  },
  infoLabel: {
    color: "#8E8E8E",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoValue: {
    color: "#F4F4F4",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  stack: {
    gap: 10,
  },
  input: {
    width: "100%",
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#202020",
    color: "#F4F4F4",
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
