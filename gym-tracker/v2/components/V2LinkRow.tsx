import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";

type V2LinkRowProps = {
  label: string;
  description: string;
  onPress: () => void;
};

export default function V2LinkRow({ label, description, onPress }: V2LinkRowProps) {
  const { theme } = useAppTheme();
  const styles = createThemedStyles(theme, (currentTheme) => ({
    row: {
      borderRadius: currentTheme.radii.md,
      backgroundColor: currentTheme.colors.backgroundSubtle,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      paddingHorizontal: currentTheme.spacing.md,
      paddingVertical: currentTheme.spacing.sm,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      gap: currentTheme.spacing.sm,
    },
    textGroup: {
      flex: 1,
      gap: currentTheme.spacing.xxs,
    },
    label: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.label.fontWeight,
    },
    description: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: currentTheme.typography.body.fontWeight,
    },
  }));

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.textGroup}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Ionicons color={theme.colors.iconSecondary} name="chevron-forward" size={20} />
    </Pressable>
  );
}