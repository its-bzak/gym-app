import { Exercise } from "@/types/exercise";
import { ActiveWorkoutExercise } from "@/types/workout";
import { PRAchievement } from "@/types/workoutSummary";

type ExercisePRBaseline = {
  maxWeight: number;
  maxVolume: number;
};

export function getWorkoutDurationSeconds(
  startedAt: string | null,
  endedAt: string | null
): number {
  if (!startedAt || !endedAt) return 0;

  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) return 0;

  return Math.max(0, Math.floor((end - start) / 1000));
}

export function formatWorkoutDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function getTotalSets(exercises: ActiveWorkoutExercise[]): number {
  return exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
}

export function getExerciseVolume(exercise: ActiveWorkoutExercise): number {
  return exercise.sets.reduce((total, set) => {
    const weight = Number(set.weight) || 0;
    const reps = Number(set.reps) || 0;
    return total + weight * reps;
  }, 0);
}

export function getTotalVolume(exercises: ActiveWorkoutExercise[]): number {
  return exercises.reduce((total, exercise) => total + getExerciseVolume(exercise), 0);
}

export function getExerciseMaxWeight(exercise: ActiveWorkoutExercise): number {
  if (exercise.sets.length === 0) return 0;

  return Math.max(
    0,
    ...exercise.sets.map((set) => Number(set.weight) || 0)
  );
}

export function getWorkoutPRs(
  exercises: ActiveWorkoutExercise[],
  previousPRs: Record<string, ExercisePRBaseline>
): PRAchievement[] {
  const achievements: PRAchievement[] = [];

  for (const exercise of exercises) {
    const currentMaxWeight = getExerciseMaxWeight(exercise);
    const currentVolume = getExerciseVolume(exercise);
    const baseline = previousPRs[exercise.exerciseId] ?? {
      maxWeight: 0,
      maxVolume: 0,
    };

    if (currentMaxWeight > baseline.maxWeight) {
      achievements.push({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
        type: "weight",
        value: currentMaxWeight,
      });
    }

    if (currentVolume > baseline.maxVolume) {
      achievements.push({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
        type: "volume",
        value: currentVolume,
      });
    }
  }

  return achievements;
}

export function getWorkedMuscles(
  workoutExercises: ActiveWorkoutExercise[],
  exerciseLibrary: Exercise[]
): string[] {
  const workedMuscles = new Set<string>();

  for (const workoutExercise of workoutExercises) {
    const libraryExercise = exerciseLibrary.find(
      (exercise) => exercise.id === workoutExercise.exerciseId
    );

    if (!libraryExercise) continue;

    if ("primaryMuscles" in libraryExercise && Array.isArray(libraryExercise.primaryMuscles)) {
      libraryExercise.primaryMuscles.forEach((muscle) => workedMuscles.add(muscle));
    }

    if ("secondaryMuscles" in libraryExercise && Array.isArray(libraryExercise.secondaryMuscles)) {
      libraryExercise.secondaryMuscles.forEach((muscle) => workedMuscles.add(muscle));
    }

    if ("muscleGroup" in libraryExercise && libraryExercise.muscleGroup) {
      workedMuscles.add(libraryExercise.muscleGroup);
    }
  }

  return Array.from(workedMuscles);
}