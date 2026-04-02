import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import WizardStepScreen from "@/components/performance/WizardStepScreen";
import { useGoalPlanWizard } from "@/context/GoalPlanWizardContext";

const PROGRAM_MODE_OPTIONS = [
  { label: "Make My Own Program", value: "manual", description: "Set calories and macros yourself" },
  { label: "Generate Program", value: "guided", description: "Answer a few questions and start from a suggestion" },
] as const;

export default function ProgramModeRoute() {
  const { nutritionDraft, updateNutritionDraft } = useGoalPlanWizard();

  const handleNext = () => {
    if (nutritionDraft.programMode === "manual") {
      router.push("/performance/program-manual");
      return;
    }

    router.push("/performance/program-generated/rate");
  };

  return (
    <WizardStepScreen
      title="How do you want to create the program?"
      subtitle="Manual setup stops at targets. Generated setup asks a few planning questions first."
      step={1}
      totalSteps={nutritionDraft.programMode === "manual" ? 2 : 9}
      onBack={() => router.back()}
      onNext={handleNext}
      backLabel="Back"
      nextLabel="Next">
      <View style={styles.column}>
        {PROGRAM_MODE_OPTIONS.map((option) => {
          const isActive = option.value === nutritionDraft.programMode;

          return (
            <Pressable
              key={option.value}
              style={[styles.optionCard, isActive ? styles.optionCardActive : null]}
              onPress={() => updateNutritionDraft({ programMode: option.value })}>
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
