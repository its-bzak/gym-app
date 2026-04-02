import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import {
  mockGoal,
  mockNutritionGoal,
  upsertNutritionGoal as upsertMockNutritionGoal,
  upsertWeightGoal as upsertMockWeightGoal,
} from "@/mock/MainScreen/DailyMetricsSection";
import { getAuthenticatedUserId } from "@/services/profileService";
import {
  type GoalPlanInput,
  type NutritionGoalInput,
  type WeightGoalInput,
  upsertActiveGoalPlan,
} from "@/services/dashboardService";
import type {
  CarbPreference,
  GoalType,
  NutritionGoal,
  ProgramMode,
  ProteinPreference,
  WeightGoal,
} from "@/types/dashboard";
import { getCurrentDate } from "@/utils/dateFormat";

export type GeneratedRate = "conservative" | "moderate" | "aggressive";
export type PriorityFocus = "high_protein" | "lower_carb" | "lower_fat" | "no_preference";
export type ProgramApproach = "balanced" | "keto_ish" | "high_carb" | "high_protein";
export type ProteinLevel = "moderate" | "high" | "super_high";
export type TrainingFrequency = "0-2" | "3-4" | "5-6" | "7+";
export type TrainingType = "strength" | "hypertrophy" | "mixed" | "endurance";

export type WeightWizardDraft = {
  goalType: GoalType;
  targetWeightKg: string;
  targetRateKgPerWeek: string;
};

export type NutritionWizardDraft = {
  programMode: ProgramMode;
  calorieGoal: string;
  proteinGoal: string;
  fatGoal: string;
  carbsGoal: string;
  generationRate: GeneratedRate;
  priorityFocus: PriorityFocus;
  programApproach: ProgramApproach;
  proteinLevel: ProteinLevel;
  trainingFrequency: TrainingFrequency;
  trainingType: TrainingType;
  adaptiveEnabled: boolean;
};

type SaveResult = {
  success: boolean;
  error?: string;
};

type GoalPlanWizardContextValue = {
  weightDraft: WeightWizardDraft;
  nutritionDraft: NutritionWizardDraft;
  currentWeightGoal: WeightGoal | null;
  currentNutritionGoal: NutritionGoal;
  latestWeightKg: number | null;
  isSaving: boolean;
  startGoalFlow: (goal: WeightGoal | null, nutritionGoal: NutritionGoal, latestWeightKg: number | null) => void;
  startProgramFlow: (goal: WeightGoal | null, nutritionGoal: NutritionGoal, latestWeightKg: number | null) => void;
  updateWeightDraft: (patch: Partial<WeightWizardDraft>) => void;
  updateNutritionDraft: (patch: Partial<NutritionWizardDraft>) => void;
  buildWeightGoalInput: () => WeightGoalInput;
  buildNutritionGoalInput: () => NutritionGoalInput;
  buildGeneratedTargets: () => { calorieGoal: number; proteinGoal: number; fatGoal: number; carbsGoal: number; plannedDailyEnergyDelta: number; };
  saveCurrentDrafts: () => Promise<SaveResult>;
};

const GoalPlanWizardContext = createContext<GoalPlanWizardContextValue | null>(null);

function createWeightDraft(goal: WeightGoal | null, latestWeightKg: number | null): WeightWizardDraft {
  const fallbackWeight = latestWeightKg ?? goal?.startWeightKg ?? mockGoal.startWeightKg;

  return {
    goalType: goal?.goalType ?? "maintain",
    targetWeightKg: String(goal?.targetWeightKg ?? fallbackWeight),
    targetRateKgPerWeek: String(goal?.targetRateKgPerWeek ?? 0.35),
  };
}

function createNutritionDraft(goal: NutritionGoal): NutritionWizardDraft {
  return {
    programMode: goal.programMode,
    calorieGoal: String(goal.calorieGoal),
    proteinGoal: String(goal.proteinGoal),
    fatGoal: String(goal.fatGoal),
    carbsGoal: String(goal.carbsGoal),
    generationRate: "moderate",
    priorityFocus: goal.proteinPreference === "high" ? "high_protein" : "no_preference",
    programApproach:
      goal.carbPreference === "lower"
        ? "keto_ish"
        : goal.carbPreference === "higher"
          ? "high_carb"
          : goal.proteinPreference === "high"
            ? "high_protein"
            : "balanced",
    proteinLevel: goal.proteinPreference === "high" ? "high" : "moderate",
    trainingFrequency: "3-4",
    trainingType: "mixed",
    adaptiveEnabled: goal.adaptiveEnabled,
  };
}

function deriveProteinPreference(draft: NutritionWizardDraft): ProteinPreference {
  if (draft.proteinLevel !== "moderate" || draft.priorityFocus === "high_protein") {
    return "high";
  }

  return "standard";
}

function deriveCarbPreference(draft: NutritionWizardDraft): CarbPreference {
  if (draft.priorityFocus === "lower_carb" || draft.programApproach === "keto_ish") {
    return "lower";
  }

  if (draft.programApproach === "high_carb") {
    return "higher";
  }

  return "balanced";
}

function deriveFatPreference(draft: NutritionWizardDraft): NutritionGoal["fatPreference"] {
  if (draft.priorityFocus === "lower_fat" || draft.programApproach === "high_carb") {
    return "lower";
  }

  if (draft.programApproach === "keto_ish") {
    return "higher";
  }

  return "balanced";
}

function buildFallbackWeightGoal(
  input: WeightGoalInput,
  currentGoal: WeightGoal | null,
  latestWeightKg: number | null
): WeightGoal {
  return {
    id: currentGoal?.id,
    goalType: input.goalType,
    status: "active",
    startWeightKg: currentGoal?.startWeightKg ?? latestWeightKg ?? mockGoal.startWeightKg,
    targetWeightKg: input.targetWeightKg,
    targetRateKgPerWeek: input.goalType === "maintain" ? 0 : Math.abs(input.targetRateKgPerWeek),
    startedOn: currentGoal?.startedOn ?? getCurrentDate(),
  };
}

function buildFallbackNutritionGoal(input: NutritionGoalInput): NutritionGoal {
  return {
    programMode: input.programMode,
    proteinGoal: input.proteinGoal,
    fatGoal: input.fatGoal,
    carbsGoal: input.carbsGoal,
    calorieGoal: input.calorieGoal,
    maintenanceCalories: input.maintenanceCalories ?? null,
    plannedDailyEnergyDelta: input.plannedDailyEnergyDelta ?? null,
    proteinPreference: input.proteinPreference,
    carbPreference: input.carbPreference,
    fatPreference: input.fatPreference,
    adaptiveEnabled: input.adaptiveEnabled,
  };
}

export function GoalPlanWizardProvider({ children }: { children: ReactNode }) {
  const [currentWeightGoal, setCurrentWeightGoal] = useState<WeightGoal | null>(mockGoal);
  const [currentNutritionGoal, setCurrentNutritionGoal] = useState<NutritionGoal>(mockNutritionGoal);
  const [latestWeightKg, setLatestWeightKg] = useState<number | null>(mockGoal.startWeightKg);
  const [weightDraft, setWeightDraft] = useState<WeightWizardDraft>(() => createWeightDraft(mockGoal, mockGoal.startWeightKg));
  const [nutritionDraft, setNutritionDraft] = useState<NutritionWizardDraft>(() => createNutritionDraft(mockNutritionGoal));
  const [isSaving, setIsSaving] = useState(false);

  const updateWeightDraft = (patch: Partial<WeightWizardDraft>) => {
    setWeightDraft((current) => ({ ...current, ...patch }));
  };

  const updateNutritionDraft = (patch: Partial<NutritionWizardDraft>) => {
    setNutritionDraft((current) => ({ ...current, ...patch }));
  };

  const startGoalFlow = (goal: WeightGoal | null, nutritionGoal: NutritionGoal, nextLatestWeightKg: number | null) => {
    setCurrentWeightGoal(goal);
    setCurrentNutritionGoal(nutritionGoal);
    setLatestWeightKg(nextLatestWeightKg);
    setWeightDraft(createWeightDraft(goal, nextLatestWeightKg));
    setNutritionDraft(createNutritionDraft(nutritionGoal));
  };

  const startProgramFlow = (goal: WeightGoal | null, nutritionGoal: NutritionGoal, nextLatestWeightKg: number | null) => {
    setCurrentWeightGoal(goal);
    setCurrentNutritionGoal(nutritionGoal);
    setLatestWeightKg(nextLatestWeightKg);
    setNutritionDraft(createNutritionDraft(nutritionGoal));
    setWeightDraft(createWeightDraft(goal, nextLatestWeightKg));
  };

  const maintenanceCalories = currentNutritionGoal.maintenanceCalories ?? mockNutritionGoal.maintenanceCalories ?? 2800;
  const referenceWeightKg = latestWeightKg ?? currentWeightGoal?.startWeightKg ?? mockGoal.startWeightKg;

  const buildGeneratedTargets = () => {
    const rateAdjustment =
      nutritionDraft.generationRate === "conservative"
        ? 250
        : nutritionDraft.generationRate === "aggressive"
          ? 550
          : 400;

    const signedAdjustment =
      weightDraft.goalType === "lose" ? -rateAdjustment : weightDraft.goalType === "gain" ? rateAdjustment : 0;

    const calorieGoal = Math.max(1400, maintenanceCalories + signedAdjustment);
    const proteinMultiplier =
      nutritionDraft.proteinLevel === "super_high"
        ? 2.7
        : nutritionDraft.proteinLevel === "high"
          ? 2.2
          : 1.7;
    const proteinBoost = nutritionDraft.priorityFocus === "high_protein" ? 0.2 : 0;
    const proteinGoal = Math.round(referenceWeightKg * (proteinMultiplier + proteinBoost));

    let fatMultiplier = 0.8;

    if (nutritionDraft.programApproach === "keto_ish") {
      fatMultiplier = 1.2;
    } else if (nutritionDraft.programApproach === "high_carb") {
      fatMultiplier = 0.55;
    } else if (nutritionDraft.programApproach === "high_protein") {
      fatMultiplier = 0.65;
    }

    if (nutritionDraft.priorityFocus === "lower_fat") {
      fatMultiplier -= 0.1;
    }

    if (nutritionDraft.priorityFocus === "lower_carb") {
      fatMultiplier += 0.1;
    }

    const fatGoal = Math.max(40, Math.round(referenceWeightKg * fatMultiplier));
    const carbCalories = Math.max(0, calorieGoal - proteinGoal * 4 - fatGoal * 9);
    const carbsGoal = Math.round(carbCalories / 4);

    return {
      calorieGoal,
      proteinGoal,
      fatGoal,
      carbsGoal,
      plannedDailyEnergyDelta: signedAdjustment,
    };
  };

  const buildWeightGoalInput = (): WeightGoalInput => ({
    goalType: weightDraft.goalType,
    startWeightKg: currentWeightGoal?.startWeightKg ?? latestWeightKg ?? mockGoal.startWeightKg,
    targetWeightKg:
      weightDraft.goalType === "maintain"
        ? currentWeightGoal?.targetWeightKg ?? latestWeightKg ?? mockGoal.startWeightKg
        : Number(weightDraft.targetWeightKg),
    targetRateKgPerWeek:
      weightDraft.goalType === "maintain" ? 0 : Number(weightDraft.targetRateKgPerWeek),
  });

  const buildNutritionGoalInput = (): NutritionGoalInput => ({
    programMode: nutritionDraft.programMode,
    calorieGoal: Number(nutritionDraft.calorieGoal),
    proteinGoal: Number(nutritionDraft.proteinGoal),
    fatGoal: Number(nutritionDraft.fatGoal),
    carbsGoal: Number(nutritionDraft.carbsGoal),
    maintenanceCalories,
    plannedDailyEnergyDelta: Number(nutritionDraft.calorieGoal) - maintenanceCalories,
    proteinPreference: deriveProteinPreference(nutritionDraft),
    carbPreference: deriveCarbPreference(nutritionDraft),
    fatPreference: deriveFatPreference(nutritionDraft),
    adaptiveEnabled: nutritionDraft.adaptiveEnabled,
  });

  const saveCurrentDrafts = async (): Promise<SaveResult> => {
    const nextGoalPlan: GoalPlanInput = {
      weightGoal: buildWeightGoalInput(),
      nutritionGoal: buildNutritionGoalInput(),
    };

    setIsSaving(true);

    try {
      const authenticatedUserId = await getAuthenticatedUserId();

      if (authenticatedUserId) {
        const result = await upsertActiveGoalPlan(authenticatedUserId, nextGoalPlan);

        if (result.success && result.data) {
          setCurrentWeightGoal(result.data.bodyGoal);
          setCurrentNutritionGoal(result.data.nutritionGoal);
          setWeightDraft(createWeightDraft(result.data.bodyGoal, latestWeightKg));
          setNutritionDraft(createNutritionDraft(result.data.nutritionGoal));
          return { success: true };
        }

        if (!result.shouldFallback) {
          return {
            success: false,
            error: result.error ?? "Could not save goal plan.",
          };
        }
      }

      const fallbackWeightGoal = buildFallbackWeightGoal(nextGoalPlan.weightGoal, currentWeightGoal, latestWeightKg);
      const fallbackNutritionGoal = buildFallbackNutritionGoal(nextGoalPlan.nutritionGoal);

      upsertMockWeightGoal(fallbackWeightGoal);
      upsertMockNutritionGoal(fallbackNutritionGoal);

      setCurrentWeightGoal(fallbackWeightGoal);
      setCurrentNutritionGoal(fallbackNutritionGoal);
      setWeightDraft(createWeightDraft(fallbackWeightGoal, latestWeightKg));
      setNutritionDraft(createNutritionDraft(fallbackNutritionGoal));

      return { success: true };
    } finally {
      setIsSaving(false);
    }
  };

  const value = useMemo<GoalPlanWizardContextValue>(
    () => ({
      weightDraft,
      nutritionDraft,
      currentWeightGoal,
      currentNutritionGoal,
      latestWeightKg,
      isSaving,
      startGoalFlow,
      startProgramFlow,
      updateWeightDraft,
      updateNutritionDraft,
      buildWeightGoalInput,
      buildNutritionGoalInput,
      buildGeneratedTargets,
      saveCurrentDrafts,
    }),
    [weightDraft, nutritionDraft, currentWeightGoal, currentNutritionGoal, latestWeightKg, isSaving]
  );

  return <GoalPlanWizardContext.Provider value={value}>{children}</GoalPlanWizardContext.Provider>;
}

export function useGoalPlanWizard() {
  const context = useContext(GoalPlanWizardContext);

  if (!context) {
    throw new Error("useGoalPlanWizard must be used inside GoalPlanWizardProvider.");
  }

  return context;
}