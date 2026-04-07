import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { SettingsRowProps } from "@/design/components/primitives/types";

export default function SettingsRow({
  iconName,
  label,
  value,
  tone = "default",
  onPress,
  showChevron = true,
}: SettingsRowProps) {
  const { theme } = useAppTheme();
  const isDanger = tone === "danger";

  const styles = createThemedStyles(theme, (currentTheme) => ({
    button: {
      minHeight: currentTheme.components.listRow.minHeight,
      borderRadius: currentTheme.components.listRow.radius,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      backgroundColor: currentTheme.colors.surface,
      paddingHorizontal: currentTheme.spacing.md,
      paddingVertical: currentTheme.spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: currentTheme.spacing.md,
    },
    label: {
      color: isDanger ? currentTheme.colors.danger : currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.body.fontWeight,
      flex: 1,
    },
    value: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.label.fontSize,
      lineHeight: currentTheme.typography.label.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
  }));

  const leadingIconColor = isDanger ? theme.colors.danger : theme.colors.accent;
  const trailingIconColor = isDanger ? theme.colors.danger : theme.colors.iconSecondary;

  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Ionicons name={iconName as never} size={22} color={leadingIconColor} />
      <Text style={styles.label}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {showChevron ? <Ionicons name="chevron-forward" size={20} color={trailingIconColor} /> : null}
    </Pressable>
  );
}