import type { MetricTone, ThemeTokens, Tone } from "@/design/tokens";

export function getToneColor(theme: ThemeTokens, tone: Tone = "default") {
  switch (tone) {
    case "accent":
      return theme.colors.accent;
    case "success":
      return theme.colors.success;
    case "warning":
      return theme.colors.warning;
    case "danger":
      return theme.colors.danger;
    case "info":
      return theme.colors.info;
    default:
      return theme.colors.textPrimary;
  }
}

export function getToneSoftColor(theme: ThemeTokens, tone: Tone = "default") {
  switch (tone) {
    case "accent":
      return theme.colors.accentSoft;
    case "success":
      return theme.colors.successSoft;
    case "warning":
      return theme.colors.warningSoft;
    case "danger":
      return theme.colors.dangerSoft;
    case "info":
      return theme.colors.infoSoft;
    default:
      return theme.colors.surfaceMuted;
  }
}

export function getMetricToneColor(theme: ThemeTokens, tone: MetricTone = "accent") {
  switch (tone) {
    case "protein":
      return theme.colors.macroProtein;
    case "fat":
      return theme.colors.macroFat;
    case "carbs":
      return theme.colors.macroCarbs;
    default:
      return getToneColor(theme, tone);
  }
}