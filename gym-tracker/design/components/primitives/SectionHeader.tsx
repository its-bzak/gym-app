import { Pressable, Text, View } from "react-native";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { SectionHeaderProps } from "@/design/components/primitives/types";

export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onPressAction,
}: SectionHeaderProps) {
  const { theme } = useAppTheme();
  const styles = createThemedStyles(theme, (currentTheme) => ({
    container: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: currentTheme.spacing.md,
    },
    textWrap: {
      flex: 1,
      gap: currentTheme.spacing.xs,
    },
    title: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.section.fontSize,
      lineHeight: currentTheme.typography.section.lineHeight,
      fontWeight: currentTheme.typography.section.fontWeight,
    },
    subtitle: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.body.fontWeight,
    },
    action: {
      paddingVertical: currentTheme.spacing.xs,
    },
    actionText: {
      color: currentTheme.colors.accent,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {actionLabel && onPressAction ? (
        <Pressable style={styles.action} onPress={onPressAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}