import { Exercise } from "./exercise";

export type Routine = {
  id: string;
  name: string;
  gymId?: string;
    exercises: {
        exercise: Exercise;
        sets: {
            reps: number | null;
            weight: number | null;
        }[];
    }[];
};