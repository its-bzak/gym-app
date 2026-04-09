import {
  getCompletedWorkoutSyncPayload,
  getPendingSyncOutboxEntries,
  getRoutineSyncPayload,
  getSyncDiagnostics,
  getUserExerciseSyncPayload,
  markSyncOutboxEntryCompleted,
  markSyncOutboxEntryFailed,
  markSyncOutboxEntryProcessing,
} from "@/db/sqlite";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/services/profileService";

async function syncUserExercise(entityId: string, userId: string) {
  const payload = getUserExerciseSyncPayload(entityId);

  if (!payload) {
    return;
  }

  const { error: exerciseError } = await supabase.from("user_exercises").upsert({
    id: payload.exercise.id,
    user_id: userId,
    name: payload.exercise.name,
    normalized_name: payload.exercise.normalized_name,
    category: payload.exercise.category,
    muscle_group: payload.exercise.muscle_group,
    is_unilateral: Boolean(payload.exercise.is_unilateral),
    is_time_based: Boolean(payload.exercise.is_time_based),
    created_at: payload.exercise.created_at,
    updated_at: payload.exercise.updated_at,
    deleted_at: payload.exercise.deleted_at,
  });

  if (exerciseError) {
    throw new Error(exerciseError.message);
  }

  const { error: deleteMusclesError } = await supabase
    .from("user_exercise_muscles")
    .delete()
    .eq("user_exercise_id", payload.exercise.id);

  if (deleteMusclesError) {
    throw new Error(deleteMusclesError.message);
  }

  if (payload.muscles.length > 0) {
    const { error: insertMusclesError } = await supabase.from("user_exercise_muscles").insert(
      payload.muscles.map((muscle, index) => ({
        id: `${payload.exercise.id}-${muscle.role}-${index + 1}`,
        user_exercise_id: payload.exercise.id,
        muscle_name: muscle.muscle_name,
        role: muscle.role,
        created_at: payload.exercise.created_at,
        updated_at: payload.exercise.updated_at,
      }))
    );

    if (insertMusclesError) {
      throw new Error(insertMusclesError.message);
    }
  }
}

async function syncRoutine(entityId: string, userId: string) {
  const payload = getRoutineSyncPayload(entityId);

  if (!payload) {
    return;
  }

  const { error: routineError } = await supabase.from("routines").upsert({
    id: payload.routine.id,
    user_id: userId,
    name: payload.routine.name,
    normalized_name: payload.routine.normalized_name,
    gym_id: payload.routine.gym_id,
    created_at: payload.routine.created_at,
    updated_at: payload.routine.updated_at,
    deleted_at: payload.routine.deleted_at,
  });

  if (routineError) {
    throw new Error(routineError.message);
  }

  const { error: deleteRoutineExercisesError } = await supabase
    .from("routine_exercises")
    .delete()
    .eq("routine_id", payload.routine.id);

  if (deleteRoutineExercisesError) {
    throw new Error(deleteRoutineExercisesError.message);
  }

  if (payload.routineExercises.length > 0) {
    const { error: insertRoutineExercisesError } = await supabase
      .from("routine_exercises")
      .insert(payload.routineExercises);

    if (insertRoutineExercisesError) {
      throw new Error(insertRoutineExercisesError.message);
    }
  }

  if (payload.routineExerciseSets.length > 0) {
    const { error: insertRoutineExerciseSetsError } = await supabase
      .from("routine_exercise_sets")
      .insert(payload.routineExerciseSets);

    if (insertRoutineExerciseSetsError) {
      throw new Error(insertRoutineExerciseSetsError.message);
    }
  }
}

async function syncWorkoutSession(entityId: string, userId: string) {
  const payload = getCompletedWorkoutSyncPayload(entityId);

  if (!payload) {
    return;
  }

  const { error: sessionError } = await supabase.from("workout_sessions").upsert({
    id: payload.session.id,
    user_id: userId,
    status: payload.session.status,
    started_at: payload.session.started_at,
    ended_at: payload.session.ended_at,
    completed_at: payload.session.completed_at,
    selected_exercise_id: payload.session.selected_exercise_id,
    created_at: payload.session.created_at,
    updated_at: payload.session.updated_at,
  });

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const { error: deleteExercisesError } = await supabase
    .from("workout_session_exercises")
    .delete()
    .eq("workout_session_id", payload.session.id);

  if (deleteExercisesError) {
    throw new Error(deleteExercisesError.message);
  }

  if (payload.exercises.length > 0) {
    const { error: insertExercisesError } = await supabase
      .from("workout_session_exercises")
      .insert(payload.exercises);

    if (insertExercisesError) {
      throw new Error(insertExercisesError.message);
    }
  }

  if (payload.sets.length > 0) {
    const { error: insertSetsError } = await supabase
      .from("workout_session_sets")
      .insert(payload.sets);

    if (insertSetsError) {
      throw new Error(insertSetsError.message);
    }
  }
}

export async function syncPendingLocalChanges() {
  const authenticatedUserId = await getAuthenticatedUserId();

  if (!authenticatedUserId) {
    return {
      syncedCount: 0,
      skipped: true,
      diagnostics: getSyncDiagnostics(),
    };
  }

  const entries = getPendingSyncOutboxEntries();
  let syncedCount = 0;

  for (const entry of entries) {
    try {
      markSyncOutboxEntryProcessing(entry.id);

      if (entry.entity_type === "user_exercise") {
        await syncUserExercise(entry.entity_id, authenticatedUserId);
      } else if (entry.entity_type === "routine") {
        await syncRoutine(entry.entity_id, authenticatedUserId);
      } else if (entry.entity_type === "workout_session") {
        await syncWorkoutSession(entry.entity_id, authenticatedUserId);
      }

      markSyncOutboxEntryCompleted(entry.id, entry.entity_type);
      syncedCount += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync error.";
      markSyncOutboxEntryFailed(entry.id, message);
    }
  }

  return {
    syncedCount,
    skipped: false,
    diagnostics: getSyncDiagnostics(),
  };
}