import type { Tone } from "@/design/tokens";

export type PerformanceAction = {
  label: string;
  onPress?: () => void;
};

export type PerformanceKpi = {
  id: string;
  label: string;
  value: string;
  progress?: number;
};

export type NutritionPlanItem = {
  label: string;
  value: string;
};

export type NutritionPlanSummary = {
  title: string;
  phase: string;
  items: NutritionPlanItem[];
  actionLabel?: string;
  onPressAction?: () => void;
};

export type RedesignPerformanceScreenProps = {
  pageTitle?: string;
  statusMessage?: string;
  isLoading?: boolean;
  targetCompletionLabel: string;
  targetCompletionDate: string;
  targetStatusLabel: string;
  targetStatusTone?: Tone;
  primaryAction?: PerformanceAction;
  secondaryAction?: PerformanceAction;
  trendTitle: string;
  trendValue: string;
  trendSupportingText: string;
  currentWeight: string;
  currentWeightSupportingText: string;
  kpis: PerformanceKpi[];
  nutritionPlan: NutritionPlanSummary;
};