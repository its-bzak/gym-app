import {
  replaceReferenceExerciseMuscles,
  setAppState,
  upsertReferenceExercises,
} from "@/db/sqlite";
import { supabase } from "@/lib/supabase";

type ExerciseReferenceRow = {
  id: string;
  name: string;
  category: string | null;
  muscle_group: string;
  is_unilateral: boolean | null;
  is_time_based: boolean | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type ExerciseMuscleReferenceRow = {
  id: string;
  exercise_id: string;
  muscle_name: string;
  role: "primary" | "secondary";
  created_at: string;
  updated_at: string;
};

export async function syncSeededExerciseReferenceData() {
  const [{ data: exercises, error: exercisesError }, { data: muscles, error: musclesError }] =
    await Promise.all([
      supabase
        .from("exercises")
        .select(
          "id, name, category, muscle_group, is_unilateral, is_time_based, created_at, updated_at, archived_at"
        )
        .returns<ExerciseReferenceRow[]>(),
      supabase
        .from("exercise_muscles")
        .select("id, exercise_id, muscle_name, role, created_at, updated_at")
        .returns<ExerciseMuscleReferenceRow[]>(),
    ]);

  if (exercisesError) {
    throw new Error(`Could not sync seeded exercises. ${exercisesError.message}`);
  }

  if (musclesError) {
    throw new Error(`Could not sync exercise muscles. ${musclesError.message}`);
  }

  upsertReferenceExercises(
    (exercises ?? []).map((exercise) => ({
      ...exercise,
      is_unilateral: exercise.is_unilateral ? 1 : 0,
      is_time_based: exercise.is_time_based ? 1 : 0,
    }))
  );

  replaceReferenceExerciseMuscles(muscles ?? []);
  setAppState("reference_exercises_last_synced_at", new Date().toISOString());
  setAppState("reference_exercises_count", String(exercises?.length ?? 0));
}