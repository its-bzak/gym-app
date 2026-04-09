import {
  getCompletedWorkoutSyncPayload,
  getPendingSyncOutboxEntries,
  getRoutineSyncPayload,
  getSyncDiagnostics,
  getUserExerciseSyncPayload,
  markSyncOutboxEntryCompleted,
  markSyncOutboxEntryFailed,
  markSyncOutboxEntryProcessing,
  markSyncPullCompleted,
  resetStaleProcessingOutboxEntries,
  upsertPulledRoutines,
  upsertPulledUserExercises,
  upsertPulledWorkoutSessions,
} from "@/db/sqlite";
import { supabase } from "@/lib/supabase";
import { getAuthenticatedUserId } from "@/services/profileService";

type SyncOptions = {
  force?: boolean;
};

type SyncResult = {
  syncedCount: number;
  pulledCount: number;
  skipped: boolean;
  diagnostics: ReturnType<typeof getSyncDiagnostics>;
  statusMessage?: string;
};

type RemoteUserExerciseRow = {
  id: string;
  user_id: string;
  name: string;
  normalized_name: string;
  category: string | null;
  muscle_group: string;
  is_unilateral: boolean;
  is_time_based: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type RemoteUserExerciseMuscleRow = {
  id: string;
  user_exercise_id: string;
  muscle_name: string;
  role: "primary" | "secondary";
  created_at: string;
  updated_at: string;
};

type RemoteRoutineRow = {
  id: string;
  user_id: string;
  name: string;
  normalized_name: string;
  gym_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type RemoteRoutineExerciseRow = {
  id: string;
  routine_id: string;
  exercise_source: "seeded" | "custom";
  exercise_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type RemoteRoutineExerciseSetRow = {
  id: string;
  routine_exercise_id: string;
  sort_order: number;
  target_reps: number | null;
  target_weight: number | null;
  created_at: string;
  updated_at: string;
};

type RemoteWorkoutSessionRow = {
  id: string;
  user_id: string;
  status: "active" | "completed";
  started_at: string;
  ended_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type RemoteWorkoutSessionExerciseRow = {
  id: string;
  workout_session_id: string;
  exercise_source: "seeded" | "custom";
  exercise_id: string;
  display_name_snapshot: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type RemoteWorkoutSessionSetRow = {
  id: string;
  workout_session_exercise_id: string;
  sort_order: number;
  reps: number | null;
  weight: number | null;
  created_at: string;
  updated_at: string;
};

let activeSyncPromise: Promise<SyncResult> | null = null;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown sync error.";
}

function isTransientNetworkError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes("network request failed") ||
    message.includes("failed to fetch") ||
    message.includes("network error") ||
    message.includes("fetch failed") ||
    message.includes("timeout")
  );
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function retryTransientNetworkError<T>(operation: () => Promise<T>, attempts = 3) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isTransientNetworkError(error) || attempt === attempts) {
        throw error;
      }

      await wait(attempt * 1000);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown sync error.");
}

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
      .insert(
        payload.exercises.map((exercise) => ({
          id: exercise.id,
          workout_session_id: exercise.workout_session_id,
          exercise_source: exercise.exercise_source,
          exercise_id: exercise.exercise_id,
          display_name_snapshot: exercise.display_name_snapshot,
          sort_order: exercise.sort_order,
          created_at: exercise.created_at,
        }))
      );

    if (insertExercisesError) {
      throw new Error(insertExercisesError.message);
    }
  }

  if (payload.sets.length > 0) {
    const { error: insertSetsError } = await supabase
      .from("workout_session_sets")
      .insert(
        payload.sets.map((set) => ({
          id: set.id,
          workout_session_exercise_id: set.workout_session_exercise_id,
          sort_order: set.sort_order,
          reps: set.reps,
          weight: set.weight,
          created_at: set.created_at,
        }))
      );

    if (insertSetsError) {
      throw new Error(insertSetsError.message);
    }
  }
}

async function pullUserExercises(userId: string) {
  const { data: exercises, error: exercisesError } = await supabase
    .from("user_exercises")
    .select(
      "id, user_id, name, normalized_name, category, muscle_group, is_unilateral, is_time_based, created_at, updated_at, deleted_at"
    )
    .eq("user_id", userId)
    .returns<RemoteUserExerciseRow[]>();

  if (exercisesError) {
    throw new Error(exercisesError.message);
  }

  const exerciseIds = (exercises ?? []).map((exercise) => exercise.id);
  let muscles: RemoteUserExerciseMuscleRow[] = [];

  if (exerciseIds.length > 0) {
    const { data: muscleRows, error: musclesError } = await supabase
      .from("user_exercise_muscles")
      .select("id, user_exercise_id, muscle_name, role, created_at, updated_at")
      .in("user_exercise_id", exerciseIds)
      .returns<RemoteUserExerciseMuscleRow[]>();

    if (musclesError) {
      throw new Error(musclesError.message);
    }

    muscles = muscleRows ?? [];
  }

  upsertPulledUserExercises(userId, exercises ?? [], muscles);
  markSyncPullCompleted("user_exercise");

  return exercises?.length ?? 0;
}

async function pullRoutines(userId: string) {
  const { data: routines, error: routinesError } = await supabase
    .from("routines")
    .select("id, user_id, name, normalized_name, gym_id, created_at, updated_at, deleted_at")
    .eq("user_id", userId)
    .returns<RemoteRoutineRow[]>();

  if (routinesError) {
    throw new Error(routinesError.message);
  }

  const routineIds = (routines ?? []).map((routine) => routine.id);
  let routineExercises: RemoteRoutineExerciseRow[] = [];
  let routineExerciseSets: RemoteRoutineExerciseSetRow[] = [];

  if (routineIds.length > 0) {
    const { data: exerciseRows, error: routineExercisesError } = await supabase
      .from("routine_exercises")
      .select("id, routine_id, exercise_source, exercise_id, sort_order, created_at, updated_at")
      .in("routine_id", routineIds)
      .returns<RemoteRoutineExerciseRow[]>();

    if (routineExercisesError) {
      throw new Error(routineExercisesError.message);
    }

    routineExercises = exerciseRows ?? [];

    const routineExerciseIds = routineExercises.map((exercise) => exercise.id);

    if (routineExerciseIds.length > 0) {
      const { data: setRows, error: routineExerciseSetsError } = await supabase
        .from("routine_exercise_sets")
        .select(
          "id, routine_exercise_id, sort_order, target_reps, target_weight, created_at, updated_at"
        )
        .in("routine_exercise_id", routineExerciseIds)
        .returns<RemoteRoutineExerciseSetRow[]>();

      if (routineExerciseSetsError) {
        throw new Error(routineExerciseSetsError.message);
      }

      routineExerciseSets = setRows ?? [];
    }
  }

  upsertPulledRoutines(userId, routines ?? [], routineExercises, routineExerciseSets);
  markSyncPullCompleted("routine");

  return routines?.length ?? 0;
}

async function pullCompletedWorkoutSessions(userId: string) {
  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("id, user_id, status, started_at, ended_at, completed_at, created_at, updated_at")
    .eq("user_id", userId)
    .eq("status", "completed")
    .returns<RemoteWorkoutSessionRow[]>();

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  const sessionIds = (sessions ?? []).map((session) => session.id);
  let workoutExercises: RemoteWorkoutSessionExerciseRow[] = [];
  let workoutSets: RemoteWorkoutSessionSetRow[] = [];

  if (sessionIds.length > 0) {
    const { data: exerciseRows, error: workoutExercisesError } = await supabase
      .from("workout_session_exercises")
      .select(
        "id, workout_session_id, exercise_source, exercise_id, display_name_snapshot, sort_order, created_at, updated_at"
      )
      .in("workout_session_id", sessionIds)
      .returns<RemoteWorkoutSessionExerciseRow[]>();

    if (workoutExercisesError) {
      throw new Error(workoutExercisesError.message);
    }

    workoutExercises = exerciseRows ?? [];

    const workoutExerciseIds = workoutExercises.map((exercise) => exercise.id);

    if (workoutExerciseIds.length > 0) {
      const { data: setRows, error: workoutSetsError } = await supabase
        .from("workout_session_sets")
        .select(
          "id, workout_session_exercise_id, sort_order, reps, weight, created_at, updated_at"
        )
        .in("workout_session_exercise_id", workoutExerciseIds)
        .returns<RemoteWorkoutSessionSetRow[]>();

      if (workoutSetsError) {
        throw new Error(workoutSetsError.message);
      }

      workoutSets = setRows ?? [];
    }
  }

  upsertPulledWorkoutSessions(userId, sessions ?? [], workoutExercises, workoutSets);
  markSyncPullCompleted("workout_session");

  return sessions?.length ?? 0;
}

async function pullRemoteChanges(userId: string) {
  const [pulledUserExercises, pulledRoutines, pulledWorkouts] = await Promise.all([
    pullUserExercises(userId),
    pullRoutines(userId),
    pullCompletedWorkoutSessions(userId),
  ]);

  return pulledUserExercises + pulledRoutines + pulledWorkouts;
}

async function runSyncPendingLocalChanges(options: SyncOptions): Promise<SyncResult> {
  let authenticatedUserId: string | null;

  try {
    authenticatedUserId = await retryTransientNetworkError(() => getAuthenticatedUserId());
  } catch (error) {
    if (isTransientNetworkError(error)) {
      return {
        syncedCount: 0,
        pulledCount: 0,
        skipped: false,
        diagnostics: getSyncDiagnostics(),
        statusMessage: "Connection is still recovering. Try sync again in a few seconds.",
      };
    }

    throw error;
  }

  if (!authenticatedUserId) {
    return {
      syncedCount: 0,
      pulledCount: 0,
      skipped: true,
      diagnostics: getSyncDiagnostics(),
    };
  }

  resetStaleProcessingOutboxEntries();

  const entries = getPendingSyncOutboxEntries(25, options.force ?? false);
  let syncedCount = 0;

  for (const entry of entries) {
    try {
      markSyncOutboxEntryProcessing(entry.id);

      if (entry.entity_type === "user_exercise") {
        await retryTransientNetworkError(() => syncUserExercise(entry.entity_id, authenticatedUserId));
      } else if (entry.entity_type === "routine") {
        await retryTransientNetworkError(() => syncRoutine(entry.entity_id, authenticatedUserId));
      } else if (entry.entity_type === "workout_session") {
        await retryTransientNetworkError(() => syncWorkoutSession(entry.entity_id, authenticatedUserId));
      }

      markSyncOutboxEntryCompleted(entry.id, entry.entity_type);
      syncedCount += 1;
    } catch (error) {
      const message = getErrorMessage(error);
      markSyncOutboxEntryFailed(entry.id, message);
    }
  }

  let pulledCount = 0;
  let statusMessage: string | undefined;

  try {
    pulledCount = await retryTransientNetworkError(() => pullRemoteChanges(authenticatedUserId));
  } catch (error) {
    if (isTransientNetworkError(error)) {
      statusMessage = "Cloud pull is waiting for the connection to settle. Local changes are still queued safely.";
    } else {
      throw error;
    }
  }

  return {
    syncedCount,
    pulledCount,
    skipped: false,
    diagnostics: getSyncDiagnostics(),
    statusMessage,
  };
}

export async function syncPendingLocalChanges(options: SyncOptions = {}) {
  if (activeSyncPromise) {
    return activeSyncPromise;
  }

  activeSyncPromise = runSyncPendingLocalChanges(options).finally(() => {
    activeSyncPromise = null;
  });

  return activeSyncPromise;
}
