export type V2Tone = "default" | "accent" | "success" | "warning" | "danger" | "info";

export type V2KeyStat = {
  id: string;
  label: string;
  value: string;
  helper?: string;
  tone?: V2Tone;
};

export type V2LinkItem = {
  id: string;
  label: string;
  description: string;
  href: string;
};

export type V2DashboardPreview = {
  displayName: string;
  dateLabel: string;
  headline: string;
  stats: V2KeyStat[];
  quickLinks: V2LinkItem[];
};

export type V2FoodLogPreview = {
  dateLabel: string;
  headline: string;
  stats: V2KeyStat[];
  quickLinks: V2LinkItem[];
};

export type V2ExerciseLogPreview = {
  dateLabel: string;
  headline: string;
  stats: V2KeyStat[];
  quickLinks: V2LinkItem[];
};

export type V2ProfilePreview = {
  displayName: string;
  username: string;
  headline: string;
  stats: V2KeyStat[];
  quickLinks: V2LinkItem[];
};