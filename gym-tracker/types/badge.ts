export type Badge = {
    id: string;
    name: string;
    description: string;
    isAchieved: boolean; // defaults to false
    isDisplayed: boolean; // whether to show the badge on the profile (up to three badges)
    icon?: string; // local path to badge icon
    tier?: "I" | "II" | "III" | "IV" | "V"; // for visual distinction of badge levels
};

export type BadgeCategory = {
    id: string;
    name: string;
    badges: Badge[];
};

export type UserBadgeProgress = {
    badgeId: string;
    progress: number; // 0 to 100 representing percentage of completion
    achievedAt?: string; // ISO date string when badge was achieved
};

export type UserBadges = {
    userId: string;
    badges: UserBadgeProgress[];
};

export type BadgeCriteria = {
    badgeId: string;
    type: "workout_count" | "exercise_mastery" | "streak" | "custom";
    target: number; // e.g. 10 workouts, 5 exercises mastered, 7-day streak
    customLogic?: (userData: any) => boolean; // for complex criteria, if type is "custom"
};