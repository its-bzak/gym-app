import { BadgeCategory } from "../types/badge"; // Adjust the path based on your project structure

export const mockBadgeCategories: BadgeCategory[] = [
    {
        id: "1",
        name: "Workout Milestones",
        badges: [
            {
                id: "workout_10",
                name: "10 Workouts",
                description: "Complete 10 workouts to earn this badge.",
                isAchieved: true,
                isDisplayed: true,
                tier: "I",
            },
            {
                id: "workout_50",
                name: "50 Workouts",
                description: "Complete 50 workouts to earn this badge.",
                isAchieved: true,
                isDisplayed: false,
                tier: "II",
            },
            {
                id: "workout_100",
                name: "100 Workouts",
                description: "Complete 100 workouts to earn this badge.",
                isAchieved: true,
                isDisplayed: false,
                tier: "III",
            },
        ],
    },
    {
        id: "2",
        name: "Exercise Mastery",
        badges: [
            {
                id: "exercise_master_5",
                name: "Master 5 Exercises",
                description: "Master 5 different exercises to earn this badge.",
                isAchieved: true,
                isDisplayed: true,
                tier: "I",
            },
            {
                id: "exercise_master_20",
                name: "Master 20 Exercises",
                description: "Master 20 different exercises to earn this badge.",
                isAchieved: true,
                isDisplayed: false,
                tier: "II",
            },
        ],
    },
    {
        id: "3",
        name: "Streaks",
        badges: [
            {
                id: "streak_7",
                name: "7-Day Streak",
                description: "Work out for 7 consecutive days to earn this badge.",
                isAchieved: true,
                isDisplayed: false,
                tier: "I",
            },
            {
                id: "streak_30",
                name: "30-Day Streak",
                description: "Work out for 30 consecutive days to earn this badge.",
                isAchieved: true,
                isDisplayed: true,
                tier: "II",
            },
        ],
    },
];