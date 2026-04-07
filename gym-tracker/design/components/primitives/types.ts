import type { ReactNode } from "react";
import type { MetricTone, Tone } from "@/design/tokens";

export type SurfaceCardVariant = "default" | "muted" | "elevated";
export type SurfaceCardPadding = "sm" | "md" | "lg";

export type SurfaceCardProps = {
  children: ReactNode;
  variant?: SurfaceCardVariant;
  padding?: SurfaceCardPadding;
};

export type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onPressAction?: () => void;
};

export type MetricCardProps = {
  label: string;
  value: string;
  supportingText?: string;
  accent?: Tone;
  iconName?: string;
};

export type ProgressBarProps = {
  value: number;
  max: number;
  tone?: MetricTone;
  showTrack?: boolean;
};

export type StatusBannerProps = {
  tone: Exclude<Tone, "default" | "accent"> | "info";
  message: string;
  loading?: boolean;
};

export type DateHeaderProps = {
  title: string;
  onPrevious: () => void;
  onNext: () => void;
  belowContent?: ReactNode;
};

export type SettingsRowTone = "default" | "danger";

export type SettingsRowProps = {
  iconName: string;
  label: string;
  value?: string;
  tone?: SettingsRowTone;
  onPress: () => void;
  showChevron?: boolean;
};