import { Exercise } from "@/types/exercise";

export const mockExercises: Exercise[] = [
  {
    id: "1",
    name: "Dumbbell Chest Press",
    muscleGroup: "Chest",
    primaryMuscles: ["Chest"],
    secondaryMuscles: ["Front Delts", "Triceps"],
  },
  {
    id: "2",
    name: "Pec Deck",
    muscleGroup: "Chest",
    primaryMuscles: ["Chest"],
    secondaryMuscles: ["Front Delts"],
  },
  {
    id: "3",
    name: "Supine Press",
    muscleGroup: "Chest",
    primaryMuscles: ["Chest"],
    secondaryMuscles: ["Triceps", "Front Delts"],
  },
  {
    id: "4",
    name: "Incline Dumbbell Press",
    muscleGroup: "Chest",
    primaryMuscles: ["Upper Chest"],
    secondaryMuscles: ["Front Delts", "Triceps"],
  },
  {
    id: "5",
    name: "Cable Crossover",
    muscleGroup: "Chest",
    primaryMuscles: ["Chest"],
    secondaryMuscles: ["Front Delts"],
  },
];