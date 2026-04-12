export const V2_ROUTES = {
  root: "/v2",
  splash: "/v2/splash",
  login: "/v2/login",
  register: "/v2/register",
  dashboard: "/v2/(tabs)/dashboard",
  foodLog: "/v2/(tabs)/food-log",
  exerciseLog: "/v2/(tabs)/exercise-log",
  profile: "/v2/(tabs)/profile",
  settings: "/v2/settings",
  gyms: "/v2/gyms",
  badges: "/v2/badges",
  history: "/v2/history",
  foodLibrary: "/v2/food-library",
  legacySettings: "/settings",
  legacyGyms: "/gyms",
  legacyBadges: "/badges",
  legacyHistory: "/history",
  legacyFoodLibrary: "/food-library",
  legacyWorkoutActive: "/workout/active",
  legacyWorkoutRoutines: "/workout/routines",
} as const;

export type V2Route = (typeof V2_ROUTES)[keyof typeof V2_ROUTES];