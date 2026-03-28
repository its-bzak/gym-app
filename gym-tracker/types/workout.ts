export type WorkoutSet = {
  id: string;
  reps: number;
  weight: number;
};

export type ActiveWorkoutExercise = {
  id: string;
  exerciseId: string;
  name: string;
  sets: WorkoutSet[];
};

export type ActiveWorkout = {
  startedAt: string | null;
  exercises: ActiveWorkoutExercise[];
};