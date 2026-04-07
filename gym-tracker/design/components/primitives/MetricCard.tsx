import { Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import { getToneColor, getToneSoftColor } from "@/design/utils/theme-resolvers";
import type { MetricCardProps } from "@/design/components/primitives/types";

export default function MetricCard({
  label,
  value,
  supportingText,
  accent = "default",
  iconName,
}: MetricCardProps) {
  const { theme } = useAppTheme();
  const toneColor = getToneColor(theme, accent);
  const softColor = getToneSoftColor(theme, accent);
  const styles = createThemedStyles(theme, (currentTheme) => ({
    card: {
      minHeight: 116,
      borderRadius: currentTheme.radii.lg,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      backgroundColor: currentTheme.colors.surface,
      padding: currentTheme.spacing.md,
      justifyContent: "space-between",
      gap: currentTheme.spacing.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: currentTheme.spacing.sm,
    },
    label: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
      flex: 1,
    },
    iconBadge: {
      width: 34,
      height: 34,
      borderRadius: currentTheme.radii.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: softColor,
    },
    value: {
      color: toneColor,
      fontSize: currentTheme.typography.metric.fontSize + 10,
      lineHeight: currentTheme.typography.metric.lineHeight + 10,
      fontWeight: currentTheme.typography.metric.fontWeight,
    },
    supportingText: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.caption.fontWeight,
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {iconName ? (
          <View style={styles.iconBadge}>
            <Ionicons name={iconName as never} size={18} color={toneColor} />
          </View>
        ) : null}
      </View>

      <Text style={styles.value}>{value}</Text>
      {supportingText ? <Text style={styles.supportingText}>{supportingText}</Text> : null}
    </View>
  );
}