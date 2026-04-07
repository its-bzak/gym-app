import { ScrollView, View } from "react-native";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import ProfileBadgeCard from "@/design/components/profile/ProfileBadgeCard";
import type { ProfileBadgeRailProps } from "@/design/components/profile/types";

export default function ProfileBadgeRail({ badges, onPressBadge }: ProfileBadgeRailProps) {
  const { theme } = useAppTheme();
  const styles = createThemedStyles(theme, (currentTheme) => ({
    content: {
      paddingRight: currentTheme.spacing.xl,
      gap: currentTheme.spacing.md,
    },
    spacer: {
      width: currentTheme.spacing.md,
    },
  }));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.spacer} />
      {badges.map((badge) => (
        <ProfileBadgeCard
          key={badge.id}
          {...badge}
          onPress={onPressBadge ? () => onPressBadge(badge.id) : undefined}
        />
      ))}
    </ScrollView>
  );
}