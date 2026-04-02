import { router } from "expo-router";
import { StyleSheet, TextInput, View } from "react-native";

import WizardStepScreen from "@/components/performance/WizardStepScreen";
import { useGoalPlanWizard } from "@/context/GoalPlanWizardContext";

export default function ProgramManualRoute() {
  const { nutritionDraft, updateNutritionDraft, saveCurrentDrafts, isSaving } = useGoalPlanWizard();

  const handleSave = async () => {
    const values = [
      Number(nutritionDraft.calorieGoal),
      Number(nutritionDraft.proteinGoal),
      Number(nutritionDraft.fatGoal),
      Number(nutritionDraft.carbsGoal),
    ];

    if (values.some((value) => !Number.isFinite(value) || value < 0) || values[0] <= 0) {
      return;
    }

    const result = await saveCurrentDrafts();

    if (result.success) {
      router.replace("/(tabs)/performance");
    }
  };

  return (
    <WizardStepScreen
      title="Set your macro targets"
      subtitle="This is the full manual flow. Enter the calorie and macro targets you want to run."
      step={2}
      totalSteps={2}
      onBack={() => router.back()}
      onNext={handleSave}
      backLabel="Back"
      nextLabel="Save Program"
      isSaving={isSaving}>
      <View style={styles.stack}>
        <TextInput
          style={styles.input}
          value={nutritionDraft.calorieGoal}
          onChangeText={(value) => updateNutritionDraft({ calorieGoal: value })}
          placeholder="Calories"
          placeholderTextColor="#6F6F6F"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={nutritionDraft.proteinGoal}
          onChangeText={(value) => updateNutritionDraft({ proteinGoal: value })}
          placeholder="Protein (g)"
          placeholderTextColor="#6F6F6F"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={nutritionDraft.fatGoal}
          onChangeText={(value) => updateNutritionDraft({ fatGoal: value })}
          placeholder="Fat (g)"
          placeholderTextColor="#6F6F6F"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={nutritionDraft.carbsGoal}
          onChangeText={(value) => updateNutritionDraft({ carbsGoal: value })}
          placeholder="Carbs (g)"
          placeholderTextColor="#6F6F6F"
          keyboardType="numeric"
        />
      </View>
    </WizardStepScreen>
  );
}

const styles = StyleSheet.create({
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
