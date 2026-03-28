export type WorkoutSet = {
  id: string;
  weight: string;
  reps: string;
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
  selectedExerciseId: string | null;
};