import { Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import type { AvatarHeroProps } from "@/design/components/profile/types";

export default function AvatarHero({
  displayName,
  username,
  verified = false,
  stats,
}: AvatarHeroProps) {
  const { theme } = useAppTheme();
  const styles = createThemedStyles(theme, (currentTheme) => ({
    card: {
      borderRadius: currentTheme.radii.xl,
      borderWidth: 1,
      borderColor: currentTheme.colors.borderMuted,
      backgroundColor: currentTheme.colors.surface,
      overflow: "hidden",
    },
    hero: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: currentTheme.spacing.xl,
      paddingVertical: currentTheme.spacing["2xl"],
      gap: currentTheme.spacing.md,
    },
    avatarWrap: {
      width: 144,
      height: 144,
      borderRadius: currentTheme.radii.xl,
      borderWidth: 2,
      borderColor: currentTheme.colors.accent,
      backgroundColor: currentTheme.colors.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    verifiedBadge: {
      position: "absolute",
      right: -8,
      bottom: -8,
      width: 46,
      height: 46,
      borderRadius: currentTheme.radii.round,
      borderWidth: 2,
      borderColor: currentTheme.colors.surface,
      backgroundColor: currentTheme.colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    name: {
      color: currentTheme.colors.textPrimary,
      fontSize: currentTheme.typography.title.fontSize + 6,
      lineHeight: currentTheme.typography.title.lineHeight + 6,
      fontWeight: currentTheme.typography.title.fontWeight,
      textAlign: "center",
    },
    username: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.body.fontSize + 2,
      lineHeight: currentTheme.typography.body.lineHeight + 2,
      fontWeight: currentTheme.typography.body.fontWeight,
      textAlign: "center",
    },
    statsRow: {
      borderTopWidth: 1,
      borderTopColor: currentTheme.colors.divider,
      flexDirection: "row",
      alignItems: "stretch",
    },
    stat: {
      flex: 1,
      paddingVertical: currentTheme.spacing.lg,
      paddingHorizontal: currentTheme.spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      gap: currentTheme.spacing.xs,
    },
    statDivider: {
      width: 1,
      backgroundColor: currentTheme.colors.divider,
      marginVertical: currentTheme.spacing.lg,
    },
    statValue: {
      color: currentTheme.colors.accent,
      fontSize: currentTheme.typography.metric.fontSize + 8,
      lineHeight: currentTheme.typography.metric.lineHeight + 8,
      fontWeight: currentTheme.typography.metric.fontWeight,
    },
    statLabel: {
      color: currentTheme.colors.textSecondary,
      fontSize: currentTheme.typography.caption.fontSize + 1,
      lineHeight: currentTheme.typography.caption.lineHeight + 1,
      fontWeight: currentTheme.typography.caption.fontWeight,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person" size={56} color={theme.colors.iconMuted} />
          {verified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.accent} />
            </View>
          ) : null}
        </View>

        <View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.username}>@{username}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat, index) => (
          <>
            {index > 0 ? <View style={styles.statDivider} /> : null}
            <View key={`${stat.label}-${index}`} style={styles.stat}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          </>
        ))}
      </View>
    </View>
  );
}