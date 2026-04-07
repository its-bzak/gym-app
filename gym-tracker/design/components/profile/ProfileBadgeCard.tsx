import { Pressable, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { ProfileBadgeCardProps } from "@/design/components/profile/types";

function getTierColor(tier: ProfileBadgeCardProps["tier"], isAchieved: boolean, colors: ReturnType<typeof useAppTheme>["theme"]["colors"]) {
  if (!isAchieved) {
    return colors.badgeLocked;
  }

  switch (tier) {
    case "I":
      return colors.success;
    case "II":
    case "III":
    case "IV":
    case "V":
      return colors.badgeEarned;
    default:
      return colors.badgeEarned;
  }
}

type Props = ProfileBadgeCardProps & {
  onPress?: () => void;
};

export default function ProfileBadgeCard({ id: _id, name, tier, isAchieved, onPress }: Props) {
  const { theme } = useAppTheme();
  const accentColor = getTierColor(tier, isAchieved, theme.colors);

  const styles = createThemedStyles(theme, (currentTheme) => ({
    card: {
      width: 152,
      minHeight: 180,
      borderRadius: currentTheme.radii.lg,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      backgroundColor: currentTheme.colors.surface,
      paddingHorizontal: currentTheme.spacing.md,
      paddingVertical: currentTheme.spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      gap: currentTheme.spacing.md,
      overflow: "hidden",
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: currentTheme.radii.round,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: currentTheme.colors.surfaceMuted,
    },
    name: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.body.fontSize,
      lineHeight: currentTheme.typography.body.lineHeight,
      fontWeight: "700",
      textAlign: "center",
    },
    tier: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize,
      lineHeight: currentTheme.typography.caption.lineHeight,
      fontWeight: currentTheme.typography.caption.fontWeight,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    accent: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 3,
      backgroundColor: accentColor,
    },
  }));

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name="ribbon" size={26} color={accentColor} />
      </View>
      <Text style={styles.name}>{name}</Text>
      {tier ? <Text style={styles.tier}>Tier {tier}</Text> : null}
      <View style={styles.accent} />
    </Pressable>
  );
}