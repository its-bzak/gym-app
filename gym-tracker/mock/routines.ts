import { Exercise } from "@/types/exercise";
import { Routine } from "@/types/routine";

export const mockRoutines: Routine[] = [
    {
        id: "1",
        name: "Chest Day",
        exercises: [
            {
                exercise: {
                    id: "1",
                    name: "Dumbbell Chest Press",
                    muscleGroup: "Chest",
                    primaryMuscles: ["Chest"],
                    secondaryMuscles: ["Front Delts", "Triceps"],
                } as Exercise,
                sets: [
                    { reps: null, weight: null },
                ],
            },
            {
                exercise: {
                    id: "2",
                    name: "Pec Deck",
                    muscleGroup: "Chest",
                    primaryMuscles: ["Chest"],
                    secondaryMuscles: ["Front Delts"],
                } as Exercise,
                sets: [
                    { reps: null, weight: null },
                ],
            },
        ],
    },
    {
        id: "2",
        name: "Leg Day",
        exercises: [
            {
                exercise: {
                    id: "6",
                    name: "Barbell Squat",
                    muscleGroup: "Legs",
                    primaryMuscles: ["Quadriceps", "Glutes"],
                    secondaryMuscles: ["Hamstrings", "Lower Back"],
                } as Exercise,
                sets: [
                    { reps: null, weight: null },
                ],
            },
            {
                exercise: {
                    id: "7",
                    name: "Leg Press",
                    muscleGroup: "Legs",
                    primaryMuscles: ["Quadriceps", "Glutes"],
                    secondaryMuscles: ["Hamstrings"],
                } as Exercise,
                sets: [
                    { reps: null, weight: null },
                ],
            },
        ],
    },
];