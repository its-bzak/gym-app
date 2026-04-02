import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import WizardStepScreen from "@/components/performance/WizardStepScreen";
import { useGoalPlanWizard } from "@/context/GoalPlanWizardContext";

const GOAL_TYPE_OPTIONS = [
  { label: "Lose Weight", value: "lose", description: "Drop bodyweight at a planned pace" },
  { label: "Maintain", value: "maintain", description: "Hold steady and maintain performance" },
  { label: "Gain Weight", value: "gain", description: "Push bodyweight upward with intent" },
] as const;

export default function GoalTypeRoute() {
  const { weightDraft, updateWeightDraft, saveCurrentDrafts, isSaving } = useGoalPlanWizard();

  const handleNext = async () => {
    if (weightDraft.goalType === "maintain") {
      const result = await saveCurrentDrafts();

      if (result.success) {
        router.replace("/(tabs)/performance");
      }

      return;
    }

    router.push("/performance/goal-target");
  };

  return (
    <WizardStepScreen
      title="What is the goal?"
      subtitle="Start by choosing the phase you want to run right now."
      step={1}
      totalSteps={weightDraft.goalType === "maintain" ? 1 : 2}
      onBack={() => router.back()}
      onNext={handleNext}
      backLabel="Back"
      nextLabel={weightDraft.goalType === "maintain" ? "Save Goal" : "Next"}
      isSaving={isSaving}>
      <View style={styles.column}>
        {GOAL_TYPE_OPTIONS.map((option) => {
          const isActive = option.value === weightDraft.goalType;

          return (
            <Pressable
              key={option.value}
              style={[styles.optionCard, isActive ? styles.optionCardActive : null]}
              onPress={() => updateWeightDraft({ goalType: option.value })}>
              <Text style={[styles.optionTitle, isActive ? styles.optionTitleActive : null]}>
                {option.label}
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  isActive ? styles.optionDescriptionActive : null,
                ]}>
                {option.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </WizardStepScreen>
  );
}

const styles = StyleSheet.create({
  column: {
    gap: 10,
  },
  optionCard: {
    borderRadius: 18,
    backgroundColor: "#202020",
    padding: 16,
  },
  optionCardActive: {
    backgroundColor: "#F4F4F4",
  },
  optionTitle: {
    color: "#F4F4F4",
    fontSize: 15,
    fontWeight: "700",
  },
  optionTitleActive: {
    color: "#111111",
  },
  optionDescription: {
    color: "#9C9C9C",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  optionDescriptionActive: {
    color: "#3F3F3F",
  },
});
