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
import {
  getFoodLogEntrySyncPayload as getNutritionFoodLogEntrySyncPayload,
  getGoalPlanSyncPayload as getNutritionGoalPlanSyncPayload,
  getWeightEntrySyncPayload as getNutritionWeightEntrySyncPayload,
  upsertPulledFoodLogEntries as upsertPulledNutritionFoodLogEntries,
  upsertPulledGoalPlan as upsertPulledNutritionGoalPlan,
  upsertPulledWeightEntries as upsertPulledNutritionWeightEntries,
} from "@/db/nutrition";
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

type RemoteFoodLogEntryRow = {
  id: string;
  user_id: string;
  entry_date: string;
  logged_at: string;
  meal_slot: string | null;
  name: string | null;
  energy_kcal: number | null;
  protein_grams: number;
  fat_grams: number;
  carbs_grams: number;
  alcohol_grams: number;
  created_at: string;
  updated_at: string;
};

type RemoteBodyWeightEntryRow = {
  id: string;
  user_id: string;
  entry_date: string;
  weight_kg: number;
  created_at: string;
  updated_at: string;
};

type RemoteBodyGoalRow = {
  id: string;
  user_id: string;
  goal_type: "lose" | "gain" | "maintain";
  status: "draft" | "active" | "completed" | "paused" | "cancelled";
  start_weight_kg: number;
  target_weight_kg: number;
  target_rate_kg_per_week: number;
  started_on: string;
  completed_on: string | null;
  paused_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type RemoteNutritionProgramRow = {
  id: string;
  user_id: string;
  goal_id: string;
  program_mode: "manual" | "guided";
  is_active: boolean;
  calorie_target: number;
  protein_target_grams: number;
  fat_target_grams: number;
  carb_target_grams: number;
  maintenance_calorie_estimate: number | null;
  planned_daily_energy_delta: number | null;
  created_at: string;
  updated_at: string;
};

type RemoteNutritionProgramPreferencesRow = {
  protein_preference: "standard" | "high";
  carb_preference: "lower" | "balanced" | "higher";
  fat_preference: "lower" | "balanced" | "higher";
};

type RemoteAdaptiveProgramSettingsRow = {
  is_enabled: boolean;
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

async function syncFoodLogEntry(entityId: string, userId: string) {
  const payload = getNutritionFoodLogEntrySyncPayload(entityId);

  if (!payload) {
    return;
  }

  if (payload.deleted_at) {
    const { error } = await supabase
      .from("food_log_entries")
      .delete()
      .eq("id", payload.id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("food_log_entries").upsert({
    id: payload.id,
    user_id: userId,
    entry_date: payload.entry_date,
    logged_at: payload.logged_at,
    meal_slot: payload.meal_slot,
    name: payload.name,
    energy_kcal: payload.energy_kcal,
    protein_grams: payload.protein_grams,
    fat_grams: payload.fat_grams,
    carbs_grams: payload.carbs_grams,
    alcohol_grams: payload.alcohol_grams,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function syncWeightEntry(entityId: string, userId: string) {
  const payload = getNutritionWeightEntrySyncPayload(entityId);

  if (!payload) {
    return;
  }

  if (payload.deleted_at) {
    const { error } = await supabase
      .from("body_weight_entries")
      .delete()
      .eq("user_id", userId)
      .eq("entry_date", payload.entry_date);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { data: existingRow, error: existingRowError } = await supabase
    .from("body_weight_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("entry_date", payload.entry_date)
    .maybeSingle<{ id: string }>();

  if (existingRowError) {
    throw new Error(existingRowError.message);
  }

  if (existingRow) {
    const { error } = await supabase
      .from("body_weight_entries")
      .update({
        weight_kg: payload.weight_kg,
        updated_at: payload.updated_at,
      })
      .eq("id", existingRow.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("body_weight_entries").insert({
    id: payload.id,
    user_id: userId,
    entry_date: payload.entry_date,
    weight_kg: payload.weight_kg,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function syncGoalPlan(userId: string) {
  const payload = getNutritionGoalPlanSyncPayload(userId);

  if (!payload) {
    return;
  }

  const { data: existingBodyGoal, error: existingBodyGoalError } = await supabase
    .from("body_goals")
    .select(
      "id, user_id, goal_type, status, start_weight_kg, target_weight_kg, target_rate_kg_per_week, started_on, completed_on, paused_on, notes, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle<RemoteBodyGoalRow>();

  if (existingBodyGoalError) {
    throw new Error(existingBodyGoalError.message);
  }

  const bodyGoalId = existingBodyGoal?.id ?? payload.bodyGoal.id;
  const bodyGoalRecord = {
    user_id: userId,
    goal_type: payload.bodyGoal.goal_type,
    status: "active",
    start_weight_kg: payload.bodyGoal.start_weight_kg,
    target_weight_kg: payload.bodyGoal.target_weight_kg,
    target_rate_unit: "kg_per_week",
    target_rate_value: Math.abs(payload.bodyGoal.target_rate_kg_per_week),
    target_rate_kg_per_week: payload.bodyGoal.target_rate_kg_per_week,
    started_on: existingBodyGoal?.started_on ?? payload.bodyGoal.started_on,
    completed_on: null,
    paused_on: null,
    notes: payload.bodyGoal.notes,
  };

  if (existingBodyGoal) {
    const { error } = await supabase
      .from("body_goals")
      .update(bodyGoalRecord)
      .eq("id", existingBodyGoal.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("body_goals").insert({
      id: bodyGoalId,
      ...bodyGoalRecord,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  const { data: existingNutritionProgram, error: existingNutritionProgramError } = await supabase
    .from("nutrition_programs")
    .select(
      "id, user_id, goal_id, program_mode, is_active, calorie_target, protein_target_grams, fat_target_grams, carb_target_grams, maintenance_calorie_estimate, planned_daily_energy_delta, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle<RemoteNutritionProgramRow>();

  if (existingNutritionProgramError) {
    throw new Error(existingNutritionProgramError.message);
  }

  const nutritionProgramId = existingNutritionProgram?.id ?? payload.nutritionGoal.id;
  const nutritionProgramRecord = {
    user_id: userId,
    goal_id: bodyGoalId,
    program_mode: payload.nutritionGoal.program_mode,
    is_active: true,
    calorie_target: payload.nutritionGoal.calorie_goal,
    protein_target_grams: payload.nutritionGoal.protein_goal,
    fat_target_grams: payload.nutritionGoal.fat_goal,
    carb_target_grams: payload.nutritionGoal.carbs_goal,
    maintenance_calorie_estimate: payload.nutritionGoal.maintenance_calories,
    planned_daily_energy_delta: payload.nutritionGoal.planned_daily_energy_delta,
    generated_summary: null,
  };

  if (existingNutritionProgram) {
    const { error } = await supabase
      .from("nutrition_programs")
      .update(nutritionProgramRecord)
      .eq("id", existingNutritionProgram.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("nutrition_programs").insert({
      id: nutritionProgramId,
      ...nutritionProgramRecord,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  const { error: preferencesError } = await supabase
    .from("nutrition_program_preferences")
    .upsert(
      {
        program_id: nutritionProgramId,
        protein_preference: payload.nutritionGoal.protein_preference,
        carb_preference: payload.nutritionGoal.carb_preference,
        fat_preference: payload.nutritionGoal.fat_preference,
      },
      { onConflict: "program_id" }
    );

  if (preferencesError) {
    throw new Error(preferencesError.message);
  }

  const { error: adaptiveError } = await supabase
    .from("adaptive_program_settings")
    .upsert(
      {
        program_id: nutritionProgramId,
        is_enabled: Boolean(payload.nutritionGoal.adaptive_enabled),
      },
      { onConflict: "program_id" }
    );

  if (adaptiveError) {
    throw new Error(adaptiveError.message);
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
        "id, workout_session_id, exercise_source, exercise_id, display_name_snapshot, sort_order, created_at"
      )
      .in("workout_session_id", sessionIds)
      .returns<Array<Omit<RemoteWorkoutSessionExerciseRow, "updated_at">>>();

    if (workoutExercisesError) {
      throw new Error(workoutExercisesError.message);
    }

    workoutExercises = (exerciseRows ?? []).map((exercise) => ({
      ...exercise,
      updated_at: exercise.created_at,
    }));

    const workoutExerciseIds = workoutExercises.map((exercise) => exercise.id);

    if (workoutExerciseIds.length > 0) {
      const { data: setRows, error: workoutSetsError } = await supabase
        .from("workout_session_sets")
        .select("id, workout_session_exercise_id, sort_order, reps, weight, created_at")
        .in("workout_session_exercise_id", workoutExerciseIds)
        .returns<Array<Omit<RemoteWorkoutSessionSetRow, "updated_at">>>();

      if (workoutSetsError) {
        throw new Error(workoutSetsError.message);
      }

      workoutSets = (setRows ?? []).map((set) => ({
        ...set,
        updated_at: set.created_at,
      }));
    }
  }

  upsertPulledWorkoutSessions(userId, sessions ?? [], workoutExercises, workoutSets);
  markSyncPullCompleted("workout_session");

  return sessions?.length ?? 0;
}

async function pullFoodLogEntries(userId: string) {
  const { data, error } = await supabase
    .from("food_log_entries")
    .select(
      "id, user_id, entry_date, logged_at, meal_slot, name, energy_kcal, protein_grams, fat_grams, carbs_grams, alcohol_grams, created_at, updated_at"
    )
    .eq("user_id", userId)
    .returns<RemoteFoodLogEntryRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  upsertPulledNutritionFoodLogEntries(userId, data ?? []);
  markSyncPullCompleted("food_log_entry");

  return data?.length ?? 0;
}

async function pullWeightEntries(userId: string) {
  const { data, error } = await supabase
    .from("body_weight_entries")
    .select("id, user_id, entry_date, weight_kg, created_at, updated_at")
    .eq("user_id", userId)
    .returns<RemoteBodyWeightEntryRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  upsertPulledNutritionWeightEntries(userId, data ?? []);
  markSyncPullCompleted("weight_entry");

  return data?.length ?? 0;
}

async function pullGoalPlan(userId: string) {
  const { data: bodyGoal, error: bodyGoalError } = await supabase
    .from("body_goals")
    .select(
      "id, user_id, goal_type, status, start_weight_kg, target_weight_kg, target_rate_kg_per_week, started_on, completed_on, paused_on, notes, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle<RemoteBodyGoalRow>();

  if (bodyGoalError) {
    throw new Error(bodyGoalError.message);
  }

  const { data: nutritionProgram, error: nutritionProgramError } = await supabase
    .from("nutrition_programs")
    .select(
      "id, user_id, goal_id, program_mode, is_active, calorie_target, protein_target_grams, fat_target_grams, carb_target_grams, maintenance_calorie_estimate, planned_daily_energy_delta, created_at, updated_at"
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle<RemoteNutritionProgramRow>();

  if (nutritionProgramError) {
    throw new Error(nutritionProgramError.message);
  }

  let preferences: RemoteNutritionProgramPreferencesRow | null = null;
  let adaptiveSettings: RemoteAdaptiveProgramSettingsRow | null = null;

  if (nutritionProgram) {
    const { data: preferenceData, error: preferencesError } = await supabase
      .from("nutrition_program_preferences")
      .select("protein_preference, carb_preference, fat_preference")
      .eq("program_id", nutritionProgram.id)
      .maybeSingle<RemoteNutritionProgramPreferencesRow>();

    if (preferencesError) {
      throw new Error(preferencesError.message);
    }

    preferences = preferenceData;

    const { data: adaptiveData, error: adaptiveError } = await supabase
      .from("adaptive_program_settings")
      .select("is_enabled")
      .eq("program_id", nutritionProgram.id)
      .maybeSingle<RemoteAdaptiveProgramSettingsRow>();

    if (adaptiveError) {
      throw new Error(adaptiveError.message);
    }

    adaptiveSettings = adaptiveData;
  }

  upsertPulledNutritionGoalPlan(userId, bodyGoal, nutritionProgram, preferences, adaptiveSettings);
  markSyncPullCompleted("goal_plan");

  return bodyGoal || nutritionProgram ? 1 : 0;
}

async function pullRemoteChanges(userId: string) {
  const [pulledUserExercises, pulledRoutines, pulledWorkouts, pulledFoodLogs, pulledWeightEntries, pulledGoalPlan] = await Promise.all([
    pullUserExercises(userId),
    pullRoutines(userId),
    pullCompletedWorkoutSessions(userId),
    pullFoodLogEntries(userId),
    pullWeightEntries(userId),
    pullGoalPlan(userId),
  ]);

  return (
    pulledUserExercises +
    pulledRoutines +
    pulledWorkouts +
    pulledFoodLogs +
    pulledWeightEntries +
    pulledGoalPlan
  );
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
      } else if (entry.entity_type === "food_log_entry") {
        await retryTransientNetworkError(() => syncFoodLogEntry(entry.entity_id, authenticatedUserId));
      } else if (entry.entity_type === "weight_entry") {
        await retryTransientNetworkError(() => syncWeightEntry(entry.entity_id, authenticatedUserId));
      } else if (entry.entity_type === "goal_plan") {
        await retryTransientNetworkError(() => syncGoalPlan(entry.entity_id));
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
