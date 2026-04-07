import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { DateHeaderProps } from "@/design/components/primitives/types";

export default function DateHeader({ title, onPrevious, onNext, belowContent }: DateHeaderProps) {
  const { theme } = useAppTheme();
  const styles = createThemedStyles(theme, (currentTheme) => ({
    container: {
      gap: currentTheme.spacing.md,
    },
    header: {
      minHeight: 70,
      borderRadius: currentTheme.radii.xl,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      backgroundColor: currentTheme.colors.surface,
      paddingHorizontal: currentTheme.spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.title.fontSize,
      lineHeight: currentTheme.typography.title.lineHeight,
      fontWeight: currentTheme.typography.title.fontWeight,
      textAlign: "center",
      flex: 1,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={onPrevious}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.iconSecondary} />
        </Pressable>

        <Text style={styles.title}>{title}</Text>

        <Pressable style={styles.iconButton} onPress={onNext}>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.iconSecondary} />
        </Pressable>
      </View>

      {belowContent}
    </View>
  );
}