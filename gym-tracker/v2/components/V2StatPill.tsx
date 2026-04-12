import { Text, View } from "react-native";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { V2Tone } from "@/v2/types";

type V2StatPillProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: V2Tone;
};

export default function V2StatPill({ label, value, helper, tone = "default" }: V2StatPillProps) {
  const { theme } = useAppTheme();
  const styles = createThemedStyles(theme, (currentTheme) => ({
    base: {
      flex: 1,
      minWidth: 92,
      borderRadius: currentTheme.radii.md,
      paddingHorizontal: currentTheme.spacing.md,
      paddingVertical: currentTheme.spacing.sm,
      gap: currentTheme.spacing.xxs,
      borderWidth: 1,
    },
    label: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.caption.fontWeight,
      textTransform: "uppercase" as const,
      letterSpacing: 0.8,
    },
    value: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
    helper: {
      color: currentTheme.colors.textMuted,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.caption.fontWeight,
    },
    default: {
      backgroundColor: currentTheme.colors.backgroundSubtle,
      borderColor: currentTheme.colors.borderMuted,
    },
    accent: {
      backgroundColor: currentTheme.colors.backgroundSubtle,
      borderColor: currentTheme.colors.borderMuted,
    },
    success: {
      backgroundColor: currentTheme.colors.backgroundSubtle,
      borderColor: currentTheme.colors.borderMuted,
    },
    warning: {
      backgroundColor: currentTheme.colors.backgroundSubtle,
      borderColor: currentTheme.colors.borderMuted,
    },
    danger: {
      backgroundColor: currentTheme.colors.backgroundSubtle,
      borderColor: currentTheme.colors.borderMuted,
    },
    info: {
      backgroundColor: currentTheme.colors.backgroundSubtle,
      borderColor: currentTheme.colors.borderMuted,
    },
  }));

  return (
    <View style={[styles.base, styles[tone]]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}