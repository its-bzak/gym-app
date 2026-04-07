import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/design/components/navigation";
import {
  SectionHeader,
  StatusBanner,
} from "@/design/components/primitives";
import { useAppTheme } from "@/design/hooks/use-app-theme";
import { createThemedStyles } from "@/design/utils/create-themed-styles";
import AccountSettingsPanel from "@/design/components/profile/AccountSettingsPanel";
import AvatarHero from "@/design/components/profile/AvatarHero";
import ProfileBadgeRail from "@/design/components/profile/ProfileBadgeRail";
import type { RedesignProfileScreenProps } from "@/design/components/profile/types";

export default function RedesignProfileScreen({
  appTitle = "Fitness Tracker",
  displayName,
  username,
  avatarUri,
  verified,
  stats,
  badges,
  settingsItems,
  statusMessage,
  isLoading = false,
  onPressMenu,
  onPressAvatar,
  onPressViewAllBadges,
  onPressBadge,
}: RedesignProfileScreenProps) {
  const { theme } = useAppTheme();
  const styles = createThemedStyles(theme, (currentTheme) => ({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    screen: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    content: {
      paddingHorizontal: currentTheme.spacing.md,
      paddingTop: currentTheme.spacing.md,
      paddingBottom: currentTheme.spacing["3xl"],
      gap: currentTheme.spacing.xl,
    },
    sectionWrap: {
      gap: currentTheme.spacing.md,
    },
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader
          title={appTitle}
          leftAction={onPressMenu ? { icon: "menu", onPress: onPressMenu, accessibilityLabel: "Open menu" } : undefined}
          rightAction={onPressAvatar ? { type: "avatar", avatarUri, onPress: onPressAvatar, accessibilityLabel: "Open profile menu" } : undefined}
        />

        {statusMessage ? (
          <StatusBanner tone="info" message={statusMessage} loading={isLoading} />
        ) : null}

        <AvatarHero
          displayName={displayName}
          username={username}
          avatarUri={avatarUri}
          verified={verified}
          stats={stats}
        />

        <View style={styles.sectionWrap}>
          <SectionHeader
            title="Badges Earned"
            actionLabel={onPressViewAllBadges ? "View All" : undefined}
            onPressAction={onPressViewAllBadges}
          />
          <ProfileBadgeRail badges={badges} onPressBadge={onPressBadge} />
        </View>

        <View style={styles.sectionWrap}>
          <SectionHeader title="Account Settings" />
          <AccountSettingsPanel items={settingsItems} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}