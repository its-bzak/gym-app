import { useEffect, useState } from "react";
import { router } from "expo-router";
import { getLifetimeTrainingMetrics as getMockLifetimeTrainingMetrics } from "@/mock/MainScreen/DailyMetricsSection";
import { supabase } from "@/lib/supabase";
import { RedesignProfileScreen } from "@/design/components/profile";
import { getUsernameById as getMockUsernameById } from "@/mock/mockDataService";
import { mockBadgeCategories } from "@/mock/badges";
import {
  getAuthenticatedUserId,
  getUserProfile,
} from "@/services/profileService";
import { getLifetimeTrainingMetrics as getSupabaseLifetimeTrainingMetrics } from "@/services/dashboardService";
import { useDisplayUnitPreference } from "@/hooks/use-display-unit-preference";
import type { LifetimeTrainingMetrics } from "@/types/dashboard";
import { convertWeightKgToUnit } from "@/utils/unitSystem";

const CURRENT_USER_ID = "user_ryan";

const EMPTY_LIFETIME_TRAINING_METRICS: LifetimeTrainingMetrics = {
  totalSets: null,
  totalVolume: 0,
  totalDurationMins: 0,
  totalWorkouts: 0,
  totalReps: null,
};

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
  const { unitPreference } = useDisplayUnitPreference();
  const [displayName, setDisplayName] = useState(formatDisplayName(fallbackUsername));
  const [username, setUsername] = useState(fallbackUsername);
  const [lifetimeTrainingMetrics, setLifetimeTrainingMetrics] = useState<LifetimeTrainingMetrics>(
    EMPTY_LIFETIME_TRAINING_METRICS
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const authenticatedUserId = await getAuthenticatedUserId();

        if (!isMounted || !authenticatedUserId) {
          setDisplayName(formatDisplayName(fallbackUsername));
          setLifetimeTrainingMetrics(getMockLifetimeTrainingMetrics());
          return;
        }

        const [profile, nextLifetimeTrainingMetrics] = await Promise.all([
          getUserProfile(authenticatedUserId),
          getSupabaseLifetimeTrainingMetrics(authenticatedUserId),
        ]);

        if (!isMounted) {
          return;
        }

        const resolvedUsername = profile?.username?.trim() || fallbackUsername;
        const resolvedDisplayName = profile?.name?.trim() || formatDisplayName(resolvedUsername);

        setUsername(resolvedUsername);
        setDisplayName(resolvedDisplayName);
        setLifetimeTrainingMetrics(nextLifetimeTrainingMetrics);
        setProfileLoadError(null);
      } catch {
        if (!isMounted) {
          return;
        }

        setDisplayName(formatDisplayName(fallbackUsername));
        setLifetimeTrainingMetrics(getMockLifetimeTrainingMetrics());
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

  const formatCompactNumber = (value: number) => {
    if (value < 1000) {
      return Math.floor(value).toString();
    }

    const compactValue = Math.floor(value / 100) / 10;

    return `${Number.isInteger(compactValue) ? compactValue.toFixed(0) : compactValue.toFixed(1)}k`;
  };

  const formatHours = (minutes: number) => {
    const hours = minutes / 60;

    if (hours < 10) {
      return `${hours.toFixed(1)}h`;
    }

    return `${Math.round(hours)}h`;
  };

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
      appTitle="Profile"
      displayName={displayName}
      username={username}
      verified
      stats={[
        { label: "Workouts", value: formatCompactNumber(lifetimeTrainingMetrics.totalWorkouts) },
        {
          label: "Volume",
          value: formatCompactNumber(
            Math.round(convertWeightKgToUnit(lifetimeTrainingMetrics.totalVolume, unitPreference))
          ),
        },
        { label: "Hours", value: formatHours(lifetimeTrainingMetrics.totalDurationMins) },
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
          id: "history",
          iconName: "time-outline",
          label: "History",
          value: "Local workouts",
          onPress: () => router.push("/history"),
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
      onPressViewAllBadges={() => router.push("/badges")}
      onPressBadge={() => router.push("/badges")}
    />
  );
}
