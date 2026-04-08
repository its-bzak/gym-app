import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SurfaceCard } from "@/design/components/primitives";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { NutritionPlanSummary } from "@/design/components/dashboard/types";

export default function NutritionPlanCard({
  title,
  phase,
  items,
  actionLabel,
  onPressAction,
}: NutritionPlanSummary) {
  const { theme } = useAppTheme();
  const styles = createThemedStyles(theme, (currentTheme) => ({
    container: {
      gap: currentTheme.spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: currentTheme.spacing.sm,
    },
    title: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.section.fontSize,
      lineHeight: currentTheme.typography.section.lineHeight,
      fontWeight: currentTheme.typography.section.fontWeight,
    },
    subtitle: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize + 1,
      lineHeight: currentTheme.typography.caption.lineHeight + 1,
      fontWeight: currentTheme.typography.caption.fontWeight,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    phase: {
      color: currentTheme.colors.accent,
      fontSize: currentTheme.typography.title.fontSize,
      lineHeight: currentTheme.typography.title.lineHeight,
      fontWeight: currentTheme.typography.title.fontWeight,
    },
    items: {
      gap: currentTheme.spacing.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: currentTheme.spacing.md,
    },
    label: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.body.fontWeight,
      flex: 1,
    },
    value: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: "700",
    },
    action: {
      minHeight: currentTheme.components.button.height,
      borderRadius: currentTheme.components.button.radius,
      borderWidth: 1,
      borderColor: currentTheme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    actionText: {
      color: currentTheme.colors.accent,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
  }));

  return (
    <SurfaceCard padding="lg">
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="restaurant-outline" size={22} color={theme.colors.accent} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View>
          <Text style={styles.subtitle}>Current Phase</Text>
          <Text style={styles.phase}>{phase}</Text>
        </View>
        <View style={styles.items}>
          {items.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.value}</Text>
            </View>
          ))}
        </View>
        {actionLabel ? (
          <Pressable style={styles.action} onPress={onPressAction}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </SurfaceCard>
  );
}