import { useEffect, useState } from "react";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { RedesignProfileScreen } from "@/design/components/profile";
import { getUsernameById as getMockUsernameById } from "@/mock/mockDataService";
import { mockBadgeCategories } from "@/mock/badges";
import {
  getAuthenticatedUserId,
  getUsernameById as getSupabaseUsernameById,
} from "@/services/profileService";

const CURRENT_USER_ID = "user_ryan";

function formatDisplayName(username: string) {
  const normalizedUsername = username.replace(/^@+/, "").trim();

  if (!normalizedUsername) {
    return "Guest User";
  }

  return normalizedUsername
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ProfileScreen() {
  const fallbackUsername = getMockUsernameById(CURRENT_USER_ID) ?? "guest";
  const [username, setUsername] = useState(fallbackUsername);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const authenticatedUserId = await getAuthenticatedUserId();

        if (!isMounted || !authenticatedUserId) {
          return;
        }

        const supabaseUsername = await getSupabaseUsernameById(authenticatedUserId);

        if (!isMounted || !supabaseUsername) {
          return;
        }

        setUsername(supabaseUsername);
        setProfileLoadError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setProfileLoadError("Using local profile data right now.");
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [fallbackUsername]);

  const displayedBadges = mockBadgeCategories
    .flatMap((category) => category.badges)
    .filter((badge) => badge.isDisplayed)
    .slice(0, 4)
    .map((badge) => ({
      id: badge.id,
      name: badge.name,
      tier: badge.tier,
      isAchieved: badge.isAchieved,
    }));

  return (
    <RedesignProfileScreen
      appTitle="Fitness Tracker"
      displayName={formatDisplayName(username)}
      username={username}
      verified
      stats={[
        { label: "Workouts", value: "124" },
        { label: "Volume", value: "8.2k" },
        { label: "Streak", value: "12" },
      ]}
      badges={displayedBadges}
      settingsItems={[
        {
          id: "gyms",
          iconName: "barbell-outline",
          label: "Gyms",
          value: "2 nearby",
          onPress: () => router.push("/gyms"),
        },
        {
          id: "general",
          iconName: "settings-outline",
          label: "General",
          onPress: () => router.push("/settings"),
        },
        {
          id: "notifications",
          iconName: "notifications-outline",
          label: "Notifications",
          onPress: () => router.push("/settings"),
        },
        {
          id: "logout",
          iconName: "log-out-outline",
          label: "Logout",
          tone: "danger",
          showChevron: false,
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]}
      statusMessage={isLoadingProfile ? "Syncing profile" : profileLoadError ?? undefined}
      isLoading={isLoadingProfile}
      onPressMenu={() => router.push("/gyms")}
      onPressAvatar={() => router.push("/settings")}
      onPressViewAllBadges={() => router.push("/badges")}
      onPressBadge={() => router.push("/badges")}
    />
  );
}
