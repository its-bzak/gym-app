import { ActivityIndicator, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import { getToneColor, getToneSoftColor } from "@/design/utils/theme-resolvers";
import type { StatusBannerProps } from "@/design/components/primitives/types";

function getStatusIconName(tone: StatusBannerProps["tone"]) {
  switch (tone) {
    case "error":
      return "alert-circle";
    case "warning":
      return "warning";
    case "success":
      return "checkmark-circle";
    default:
      return "information-circle";
  }
}

export default function StatusBanner({ tone, message, loading = false }: StatusBannerProps) {
  const { theme } = useAppTheme();
  const resolvedTone = tone === "error" ? "danger" : tone;
  const iconColor = getToneColor(theme, resolvedTone);
  const backgroundColor = getToneSoftColor(theme, resolvedTone);
  const styles = createThemedStyles(theme, (currentTheme) => ({
    container: {
      minHeight: 44,
      borderRadius: currentTheme.radii.lg,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      backgroundColor,
      paddingHorizontal: currentTheme.spacing.md,
      paddingVertical: currentTheme.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: currentTheme.spacing.sm,
    },
    message: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.caption.fontWeight,
      flex: 1,
    },
  }));

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <Ionicons name={getStatusIconName(tone)} size={18} color={iconColor} />
      )}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}