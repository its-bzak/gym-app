import {
  getDateKey,
  getFoodLogDay,
  getLifetimeTrainingMetrics,
  getSavedFoodLibrary,
  getSavedRecipeLibrary,
  getWorkoutDashboardSnapshot,
} from "@/services/dashboardService";
import { getAuthenticatedUserId, getUserProfile } from "@/services/profileService";
import type { UnitPreference } from "@/utils/unitSystem";
import { convertWeightKgToUnit, formatWeight, getWeightUnitLabel } from "@/utils/unitSystem";
import { getLatestWeight, getWeightTrend } from "@/utils/weightProgress";
import { V2_ROUTES } from "@/v2/navigation/routes";
import type {
  V2DashboardPreview,
  V2ExerciseLogPreview,
  V2FoodLogPreview,
  V2ProfilePreview,
} from "@/v2/types";

const EMPTY_TODAYS_NUTRITION = {
  protein: 0,
  proteinGoal: 0,
  fat: 0,
  fatGoal: 0,
  carbs: 0,
  carbsGoal: 0,
  calorieGoal: 0,
};

function formatCompactNumber(value: number) {
  if (value < 1000) {
    return Math.round(value).toString();
  }

  const shortValue = Math.round(value / 100) / 10;
  return `${shortValue.toFixed(shortValue >= 10 ? 0 : 1)}k`;
}

function formatShortDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDisplayName(name: string | null | undefined, username: string | null | undefined) {
  const trimmedName = name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  const normalizedUsername = username?.replace(/^@+/, "").trim() ?? "";

  if (!normalizedUsername) {
    return "Preview User";
  }

  return normalizedUsername
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function getV2AuthenticatedUserId() {
  return getAuthenticatedUserId();
}

export async function loadV2DashboardPreview(
  unitPreference: UnitPreference
): Promise<V2DashboardPreview | null> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const dateKey = getDateKey(new Date());
  const [snapshot, lifetimeMetrics, profile] = await Promise.all([
    getWorkoutDashboardSnapshot(userId, dateKey),
    getLifetimeTrainingMetrics(userId),
    getUserProfile(userId),
  ]);

  const latestWeightKg = getLatestWeight(snapshot.weightEntries);
  const weightTrend = getWeightTrend(snapshot.weightEntries);
  const weightUnit = getWeightUnitLabel(unitPreference);
  const trendValue = convertWeightKgToUnit(weightTrend.changeKg, unitPreference);

  return {
    displayName: formatDisplayName(profile?.name, profile?.username),
    dateLabel: formatShortDate(dateKey),
    headline:
      snapshot.weightGoal
        ? `${snapshot.weightGoal.goalType.toUpperCase()} goal active.`
        : "No active goal.",
    todaysNutrition: snapshot.macroMetrics ?? EMPTY_TODAYS_NUTRITION,
    stats: [
      {
        id: "calories",
        label: "Calories",
        value: snapshot.macroMetrics
          ? `${snapshot.macroMetrics.consumedCalories} / ${snapshot.macroMetrics.calorieGoal}`
          : "0 / 0",
        helper: "today",
        tone: "accent",
      },
      {
        id: "workouts",
        label: "Workouts",
        value: formatCompactNumber(lifetimeMetrics.totalWorkouts),
        helper: "lifetime",
      },
      {
        id: "weight",
        label: "Latest Weight",
        value: latestWeightKg === null ? "No entries" : formatWeight(latestWeightKg, unitPreference),
        helper: `${trendValue > 0 ? "+" : ""}${trendValue.toFixed(1)} ${weightUnit} this week`,
        tone: trendValue <= 0 ? "success" : "warning",
      },
    ],
    quickLinks: [
      {
        id: "food-log",
        label: "Food Log tab",
        description: "Open the V2 food log route.",
        href: V2_ROUTES.foodLog,
      },
      {
        id: "exercise-log",
        label: "Exercise Log tab",
        description: "Open the V2 exercise log route.",
        href: V2_ROUTES.exerciseLog,
      },
      {
        id: "profile",
        label: "Profile tab",
        description: "Open the V2 profile route.",
        href: V2_ROUTES.profile,
      },
    ],
  };
}

export async function loadV2FoodLogPreview(): Promise<V2FoodLogPreview | null> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const dateKey = getDateKey(new Date());
  const [daySnapshot, savedFoods, savedRecipes] = await Promise.all([
    getFoodLogDay(userId, dateKey),
    getSavedFoodLibrary(userId),
    getSavedRecipeLibrary(userId),
  ]);

  return {
    dateLabel: formatShortDate(dateKey),
    headline:
      daySnapshot.entries.length > 0
        ? `${daySnapshot.entries.length} entries for today.`
        : "No food entries for today.",
    stats: [
      {
        id: "calories",
        label: "Consumed",
        value: `${daySnapshot.summary.consumedCalories} kcal`,
        helper: `goal ${daySnapshot.summary.calorieGoal}`,
        tone: "accent",
      },
      {
        id: "macros",
        label: "Macros",
        value: `${daySnapshot.summary.protein}P / ${daySnapshot.summary.carbs}C / ${daySnapshot.summary.fat}F`,
        helper: "today",
      },
      {
        id: "library",
        label: "Saved Items",
        value: `${savedFoods.length + savedRecipes.length}`,
        helper: `${savedFoods.length} foods, ${savedRecipes.length} recipes`,
        tone: "info",
      },
    ],
    quickLinks: [
      {
        id: "food-library",
        label: "Food Library bridge",
        description: "Open the connected food library route.",
        href: V2_ROUTES.foodLibrary,
      },
      {
        id: "dashboard",
        label: "Dashboard tab",
        description: "Return to the V2 dashboard route.",
        href: V2_ROUTES.dashboard,
      },
    ],
  };
}

export async function loadV2ExerciseLogPreview(
  unitPreference: UnitPreference
): Promise<V2ExerciseLogPreview | null> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const dateKey = getDateKey(new Date());
  const [snapshot, lifetimeMetrics] = await Promise.all([
    getWorkoutDashboardSnapshot(userId, dateKey),
    getLifetimeTrainingMetrics(userId),
  ]);

  return {
    dateLabel: formatShortDate(dateKey),
    headline: snapshot.exerciseMetrics
      ? `${snapshot.exerciseMetrics.workoutType || "Workout"} metrics available.`
      : "No training logged today.",
    stats: [
      {
        id: "volume",
        label: "Volume",
        value: snapshot.exerciseMetrics
          ? `${formatCompactNumber(convertWeightKgToUnit(snapshot.exerciseMetrics.volume, unitPreference))} ${getWeightUnitLabel(unitPreference)}`
          : `0 ${getWeightUnitLabel(unitPreference)}`,
        helper: "today",
        tone: "accent",
      },
      {
        id: "duration",
        label: "Duration",
        value: snapshot.exerciseMetrics ? `${snapshot.exerciseMetrics.durationMins} min` : "0 min",
        helper: "today",
      },
      {
        id: "lifetime",
        label: "Lifetime",
        value: formatCompactNumber(lifetimeMetrics.totalWorkouts),
        helper: "workouts completed",
        tone: "info",
      },
    ],
    quickLinks: [
      {
        id: "start-workout",
        label: "Active workout route",
        description: "Open the connected active workout route.",
        href: V2_ROUTES.legacyWorkoutActive,
      },
      {
        id: "routines",
        label: "Routine library route",
        description: "Open the connected routine route.",
        href: V2_ROUTES.legacyWorkoutRoutines,
      },
    ],
  };
}

export async function loadV2ProfilePreview(
  unitPreference: UnitPreference
): Promise<V2ProfilePreview | null> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return null;
  }

  const [profile, lifetimeMetrics] = await Promise.all([
    getUserProfile(userId),
    getLifetimeTrainingMetrics(userId),
  ]);

  const displayName = formatDisplayName(profile?.name, profile?.username);
  const username = profile?.username?.trim() ? `@${profile.username.replace(/^@+/, "")}` : "@preview-user";

  return {
    displayName,
    username,
    headline: "Connected profile data.",
    stats: [
      {
        id: "workouts",
        label: "Workouts",
        value: formatCompactNumber(lifetimeMetrics.totalWorkouts),
        helper: "lifetime",
      },
      {
        id: "volume",
        label: "Volume",
        value: `${formatCompactNumber(convertWeightKgToUnit(lifetimeMetrics.totalVolume, unitPreference))} ${getWeightUnitLabel(unitPreference)}`,
        helper: "lifetime",
      },
      {
        id: "hours",
        label: "Hours",
        value: `${Math.round(lifetimeMetrics.totalDurationMins / 60)}`,
        helper: "logged training",
        tone: "info",
      },
    ],
    quickLinks: [
      {
        id: "settings",
        label: "Settings preview",
        description: "Open the V2 settings bridge route.",
        href: V2_ROUTES.settings,
      },
      {
        id: "gyms",
        label: "Gyms preview",
        description: "Open the V2 gyms bridge route.",
        href: V2_ROUTES.gyms,
      },
      {
        id: "history",
        label: "History preview",
        description: "Open the V2 history bridge route.",
        href: V2_ROUTES.history,
      },
      {
        id: "badges",
        label: "Badges preview",
        description: "Open the V2 badges bridge route.",
        href: V2_ROUTES.badges,
      },
    ],
  };
}