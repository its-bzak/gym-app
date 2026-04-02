import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import WizardStepScreen from "@/components/performance/WizardStepScreen";
import { useGoalPlanWizard } from "@/context/GoalPlanWizardContext";

const RATE_OPTIONS = [
  { label: "Conservative", value: "conservative", description: "Small weekly change" },
  { label: "Moderate", value: "moderate", description: "Balanced pace for most phases" },
  { label: "Aggressive", value: "aggressive", description: "Faster change with tighter execution" },
] as const;

const PRIORITY_OPTIONS = [
  { label: "High Protein", value: "high_protein" },
  { label: "Lower Carb", value: "lower_carb" },
  { label: "Lower Fat", value: "lower_fat" },
  { label: "No Preference", value: "no_preference" },
] as const;

const APPROACH_OPTIONS = [
  { label: "Balanced", value: "balanced" },
  { label: "Keto-ish", value: "keto_ish" },
  { label: "High Carb", value: "high_carb" },
  { label: "High Protein", value: "high_protein" },
] as const;

const PROTEIN_OPTIONS = [
  { label: "Moderate", value: "moderate" },
  { label: "High", value: "high" },
  { label: "Super High", value: "super_high" },
] as const;

const FREQUENCY_OPTIONS = [
  { label: "0-2 days", value: "0-2" },
  { label: "3-4 days", value: "3-4" },
  { label: "5-6 days", value: "5-6" },
  { label: "7+ days", value: "7+" },
] as const;

const TRAINING_OPTIONS = [
  { label: "Strength", value: "strength" },
  { label: "Hypertrophy", value: "hypertrophy" },
  { label: "Mixed", value: "mixed" },
  { label: "Endurance", value: "endurance" },
] as const;

const ADAPTIVE_OPTIONS = [
  { label: "No", value: false, description: "Keep the program static" },
  { label: "Yes", value: true, description: "Get recommendation prompts when progress drifts" },
] as const;

const STEP_ORDER = [
  "rate",
  "priority",
  "approach",
  "protein",
  "frequency",
  "training-type",
  "adaptive",
  "review",
] as const;

function OptionList<T extends string | boolean>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: ReadonlyArray<{ label: string; value: T; description?: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.column}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <Pressable
            key={String(option.value)}
            style={[styles.optionCard, isActive ? styles.optionCardActive : null]}
            onPress={() => onChange(option.value)}>
            <Text style={[styles.optionTitle, isActive ? styles.optionTitleActive : null]}>
              {option.label}
            </Text>
            {option.description ? (
              <Text
                style={[
                  styles.optionDescription,
                  isActive ? styles.optionDescriptionActive : null,
                ]}>
                {option.description}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function GeneratedProgramStepRoute() {
  const { step } = useLocalSearchParams<{ step: string }>();
  const {
    nutritionDraft,
    updateNutritionDraft,
    buildGeneratedTargets,
    saveCurrentDrafts,
    isSaving,
  } = useGoalPlanWizard();

  const currentStep = typeof step === "string" ? step : "rate";
  const stepIndex = STEP_ORDER.indexOf(currentStep as (typeof STEP_ORDER)[number]);
  const currentStepNumber = stepIndex >= 0 ? stepIndex + 2 : 2;

  const navigateNext = () => {
    const nextStep = STEP_ORDER[stepIndex + 1];

    if (nextStep) {
      router.push(`/performance/program-generated/${nextStep}`);
    }
  };

  const navigateBack = () => {
    if (currentStep === "rate") {
      router.replace("/performance/program-mode");
      return;
    }

    router.back();
  };

  const handleNext = async () => {
    if (currentStep === "adaptive") {
      const generatedTargets = buildGeneratedTargets();

      updateNutritionDraft({
        calorieGoal: String(generatedTargets.calorieGoal),
        proteinGoal: String(generatedTargets.proteinGoal),
        fatGoal: String(generatedTargets.fatGoal),
        carbsGoal: String(generatedTargets.carbsGoal),
      });
      navigateNext();
      return;
    }

    if (currentStep === "review") {
      const result = await saveCurrentDrafts();

      if (result.success) {
        router.replace("/(tabs)/performance");
      }

      return;
    }

    navigateNext();
  };

  return (
    <WizardStepScreen
      title={
        currentStep === "rate"
          ? "How fast should it move?"
          : currentStep === "priority"
            ? "What matters most?"
            : currentStep === "approach"
              ? "Do you want a specific approach?"
              : currentStep === "protein"
                ? "How high should protein go?"
                : currentStep === "frequency"
                  ? "How often do you train?"
                  : currentStep === "training-type"
                    ? "What type of training is this for?"
                    : currentStep === "adaptive"
                      ? "Do you want adaptive suggestions?"
                      : "Review the generated targets"
      }
      subtitle={
        currentStep === "rate"
          ? "Choose the pace you want the generated program to support."
          : currentStep === "priority"
            ? "This helps bias the generated split toward the thing you care about most."
            : currentStep === "approach"
              ? "Choose the overall style of the generated program."
              : currentStep === "protein"
                ? "Pick how aggressive you want protein to be in the generated setup."
                : currentStep === "frequency"
                  ? "Training frequency helps shape the initial calorie and macro suggestion."
                  : currentStep === "training-type"
                    ? "Choose the primary style of training you want the program to support."
                    : currentStep === "adaptive"
                      ? "You will still approve or reject changes. This only controls whether the app suggests adjustments."
                      : "This is the starting suggestion based on the answers you gave. You can edit the numbers before saving."
      }
      step={currentStepNumber}
      totalSteps={9}
      onBack={navigateBack}
      onNext={handleNext}
      backLabel="Back"
      nextLabel={currentStep === "review" ? "Save Program" : "Next"}
      isSaving={isSaving}>
      {currentStep === "rate" ? (
        <OptionList
          value={nutritionDraft.generationRate}
          options={RATE_OPTIONS}
          onChange={(value) => updateNutritionDraft({ generationRate: value })}
        />
      ) : null}

      {currentStep === "priority" ? (
        <OptionList
          value={nutritionDraft.priorityFocus}
          options={PRIORITY_OPTIONS}
          onChange={(value) => updateNutritionDraft({ priorityFocus: value })}
        />
      ) : null}

      {currentStep === "approach" ? (
        <OptionList
          value={nutritionDraft.programApproach}
          options={APPROACH_OPTIONS}
          onChange={(value) => updateNutritionDraft({ programApproach: value })}
        />
      ) : null}

      {currentStep === "protein" ? (
        <OptionList
          value={nutritionDraft.proteinLevel}
          options={PROTEIN_OPTIONS}
          onChange={(value) => updateNutritionDraft({ proteinLevel: value })}
        />
      ) : null}

      {currentStep === "frequency" ? (
        <OptionList
          value={nutritionDraft.trainingFrequency}
          options={FREQUENCY_OPTIONS}
          onChange={(value) => updateNutritionDraft({ trainingFrequency: value })}
        />
      ) : null}

      {currentStep === "training-type" ? (
        <OptionList
          value={nutritionDraft.trainingType}
          options={TRAINING_OPTIONS}
          onChange={(value) => updateNutritionDraft({ trainingType: value })}
        />
      ) : null}

      {currentStep === "adaptive" ? (
        <OptionList
          value={nutritionDraft.adaptiveEnabled}
          options={ADAPTIVE_OPTIONS}
          onChange={(value) => updateNutritionDraft({ adaptiveEnabled: value })}
        />
      ) : null}

      {currentStep === "review" ? (
        <View style={styles.stack}>
          <View style={styles.previewGrid}>
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Training</Text>
              <Text style={styles.previewValue}>{nutritionDraft.trainingFrequency} days</Text>
            </View>
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Approach</Text>
              <Text style={styles.previewValue}>{nutritionDraft.programApproach.replace("_", "-")}</Text>
            </View>
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Priority</Text>
              <Text style={styles.previewValue}>{nutritionDraft.priorityFocus.replace("_", "-")}</Text>
            </View>
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Protein</Text>
              <Text style={styles.previewValue}>{nutritionDraft.proteinLevel.replace("_", "-")}</Text>
            </View>
          </View>

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
      ) : null}
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
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 6,
  },
  previewCard: {
    width: "48%",
    borderRadius: 18,
    backgroundColor: "#202020",
    padding: 14,
  },
  previewLabel: {
    color: "#8E8E8E",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  previewValue: {
    color: "#F4F4F4",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
  },
});
