import { View } from "react-native";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import { getMetricToneColor } from "@/design/utils/theme-resolvers";
import type { ProgressBarProps } from "@/design/components/primitives/types";

export default function ProgressBar({
  value,
  max,
  tone = "accent",
  showTrack = true,
}: ProgressBarProps) {
  const { theme } = useAppTheme();
  const fillColor = getMetricToneColor(theme, tone);
  const normalizedMax = max <= 0 ? 1 : max;
  const progress = Math.max(0, Math.min(value / normalizedMax, 1));

  const styles = createThemedStyles(theme, (currentTheme) => ({
    track: {
      width: "100%",
      height: 12,
      borderRadius: currentTheme.radii.pill,
      overflow: "hidden",
      backgroundColor: showTrack ? currentTheme.colors.macroCaloriesTrack : "transparent",
    },
    fill: {
      height: "100%",
      borderRadius: currentTheme.radii.pill,
      backgroundColor: fillColor,
    },
  }));

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${progress * 100}%` }]} />
    </View>
  );
}