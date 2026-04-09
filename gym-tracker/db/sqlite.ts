import * as SQLite from "expo-sqlite";
import { Exercise } from "@/types/exercise";
import { Routine } from "@/types/routine";
import { ActiveWorkout, WorkoutSet } from "@/types/workout";

type ReferenceExerciseRow = {
  id: string;
  name: string;
  category: string | null;
  muscle_group: string;
  is_unilateral: number;
  is_time_based: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

type ReferenceExerciseMuscleRow = {
  id: string;
  exercise_id: string;
  muscle_name: string;
  role: "primary" | "secondary";
  created_at: string;
  updated_at: string;
};

type AppStateRow = {
  value: string;
};

type UserExerciseRow = {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  muscle_group: string;
  is_unilateral: number;
  is_time_based: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type RoutineRow = {
  id: string;
  user_id: string;
  name: string;
  gym_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type RoutineExerciseRow = {
  id: string;
  routine_id: string;
  exercise_source: "seeded" | "custom";
  exercise_id: string;
  sort_order: number;
};

type RoutineExerciseSetRow = {
  routine_exercise_id: string;
  sort_order: number;
  target_reps: number | null;
  target_weight: number | null;
};

type WorkoutSessionRow = {
  id: string;
  user_id: string;
  status: "active" | "completed";
  started_at: string;
  ended_at: string | null;
  completed_at: string | null;
  selected_exercise_id: string | null;
};

type WorkoutSessionExerciseRow = {
  id: string;
  workout_session_id: string;
  exercise_source: "seeded" | "custom";
  exercise_id: string;
  display_name_snapshot: string;
  sort_order: number;
};

type WorkoutSessionSetRow = {
  id: string;
  workout_session_exercise_id: string;
  sort_order: number;
  reps: number | null;
  weight: number | null;
};

type SyncOutboxRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  operation: "create" | "update" | "delete";
  payload_json: string;
  status: "pending" | "processing" | "failed";
  attempt_count: number;
  next_retry_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

type UserExerciseMuscleRow = {
  user_exercise_id: string;
  muscle_name: string;
  role: "primary" | "secondary";
};

const EMPTY_ACTIVE_WORKOUT: ActiveWorkout = {
  startedAt: null,
  endedAt: null,
  exercises: [],
  selectedExerciseId: null,
};

export const db = SQLite.openDatabaseSync("gym.db");

export function initDB() {
  db.execSync("PRAGMA foreign_keys = ON;");
  db.execSync(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      entity_type TEXT PRIMARY KEY NOT NULL,
      last_pulled_at TEXT,
      last_cursor TEXT,
      last_success_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_outbox (
      id TEXT PRIMARY KEY NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete')),
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'failed')),
      attempt_count INTEGER NOT NULL DEFAULT 0,
      next_retry_at TEXT,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      muscle_group TEXT NOT NULL,
      is_unilateral INTEGER NOT NULL DEFAULT 0,
      is_time_based INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived_at TEXT
    );

    CREATE TABLE IF NOT EXISTS exercise_muscles (
      id TEXT PRIMARY KEY NOT NULL,
      exercise_id TEXT NOT NULL,
      muscle_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('primary', 'secondary')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
      UNIQUE (exercise_id, muscle_name, role)
    );

    CREATE TABLE IF NOT EXISTS user_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      category TEXT,
      muscle_group TEXT NOT NULL,
      is_unilateral INTEGER NOT NULL DEFAULT 0,
      is_time_based INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      UNIQUE (user_id, normalized_name)
    );

    CREATE TABLE IF NOT EXISTS user_exercise_muscles (
      id TEXT PRIMARY KEY NOT NULL,
      user_exercise_id TEXT NOT NULL,
      muscle_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('primary', 'secondary')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_exercise_id) REFERENCES user_exercises(id) ON DELETE CASCADE,
      UNIQUE (user_exercise_id, muscle_name, role)
    );

    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      gym_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      UNIQUE (user_id, normalized_name)
    );

    CREATE TABLE IF NOT EXISTS routine_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      routine_id TEXT NOT NULL,
      exercise_source TEXT NOT NULL CHECK(exercise_source IN ('seeded', 'custom')),
      exercise_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
      UNIQUE (routine_id, sort_order)
    );

    CREATE TABLE IF NOT EXISTS routine_exercise_sets (
      id TEXT PRIMARY KEY NOT NULL,
      routine_exercise_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      target_reps REAL,
      target_weight REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (routine_exercise_id) REFERENCES routine_exercises(id) ON DELETE CASCADE,
      UNIQUE (routine_exercise_id, sort_order)
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active', 'completed')),
      started_at TEXT NOT NULL,
      ended_at TEXT,
      completed_at TEXT,
      selected_exercise_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_session_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      workout_session_id TEXT NOT NULL,
      exercise_source TEXT NOT NULL CHECK(exercise_source IN ('seeded', 'custom')),
      exercise_id TEXT NOT NULL,
      display_name_snapshot TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (workout_session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
      UNIQUE (workout_session_id, sort_order)
    );

    CREATE TABLE IF NOT EXISTS workout_session_sets (
      id TEXT PRIMARY KEY NOT NULL,
      workout_session_exercise_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      reps REAL,
      weight REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (workout_session_exercise_id) REFERENCES workout_session_exercises(id) ON DELETE CASCADE,
      UNIQUE (workout_session_exercise_id, sort_order)
    );

    CREATE INDEX IF NOT EXISTS idx_exercises_updated_at ON exercises(updated_at);
    CREATE INDEX IF NOT EXISTS idx_exercise_muscles_exercise_id ON exercise_muscles(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_exercise_muscles_role ON exercise_muscles(role);
    CREATE INDEX IF NOT EXISTS idx_user_exercises_user_id ON user_exercises(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_exercises_updated_at ON user_exercises(updated_at);
    CREATE INDEX IF NOT EXISTS idx_user_exercise_muscles_user_exercise_id ON user_exercise_muscles(user_exercise_id);
    CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
    CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id ON routine_exercises(routine_id);
    CREATE INDEX IF NOT EXISTS idx_routine_exercise_sets_routine_exercise_id ON routine_exercise_sets(routine_exercise_id);
    CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON workout_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_workout_session_exercises_workout_session_id ON workout_session_exercises(workout_session_id);
    CREATE INDEX IF NOT EXISTS idx_workout_session_sets_workout_session_exercise_id ON workout_session_sets(workout_session_exercise_id);
    CREATE INDEX IF NOT EXISTS idx_sync_outbox_status ON sync_outbox(status);
    CREATE INDEX IF NOT EXISTS idx_sync_outbox_entity ON sync_outbox(entity_type, entity_id);
  `);
}

function getCurrentWorkoutSessionStateKey(userId: string) {
  return `current_workout_session_id:${userId}`;
}

function deleteAppState(key: string) {
  db.runSync("DELETE FROM app_state WHERE key = ?", [key]);
}

function setSyncStateSuccess(entityType: string) {
  const now = new Date().toISOString();

  db.runSync(
    `
      INSERT INTO sync_state (entity_type, last_pulled_at, last_cursor, last_success_at)
      VALUES (?, NULL, NULL, ?)
      ON CONFLICT(entity_type) DO UPDATE SET last_success_at = excluded.last_success_at
    `,
    [entityType, now]
  );
}

function enqueueSyncOperation(
  entityType: string,
  entityId: string,
  operation: "create" | "update" | "delete",
  payload: Record<string, unknown>
) {
  const existing = db.getFirstSync<SyncOutboxRow>(
    `
      SELECT status
      FROM sync_outbox
      WHERE entity_type = ?
        AND entity_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [entityType, entityId]
  );

  const now = new Date().toISOString();

  db.runSync(
    `
      INSERT INTO sync_outbox (
        id,
        entity_type,
        entity_id,
        operation,
        payload_json,
        status,
        attempt_count,
        next_retry_at,
        last_error,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?)
    `,
    [
      `outbox-${entityType}-${entityId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      entityType,
      entityId,
      operation,
      JSON.stringify(payload),
      existing?.status === "failed" ? "failed" : "pending",
      now,
      now,
    ]
  );
}

function parseWorkoutNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function isUserExercise(userId: string, exerciseId: string) {
  const row = db.getFirstSync<{ id: string }>(
    `
      SELECT id
      FROM user_exercises
      WHERE user_id = ?
        AND id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [userId, exerciseId]
  );

  return Boolean(row);
}

export function getPersistedCurrentWorkout(userId: string): {
  sessionId: string | null;
  workout: ActiveWorkout;
} {
  const sessionId = getAppState(getCurrentWorkoutSessionStateKey(userId));

  if (!sessionId) {
    return {
      sessionId: null,
      workout: EMPTY_ACTIVE_WORKOUT,
    };
  }

  const session = db.getFirstSync<WorkoutSessionRow>(
    `
      SELECT id, user_id, status, started_at, ended_at, completed_at, selected_exercise_id
      FROM workout_sessions
      WHERE id = ?
      LIMIT 1
    `,
    [sessionId]
  );

  if (!session) {
    deleteAppState(getCurrentWorkoutSessionStateKey(userId));

    return {
      sessionId: null,
      workout: EMPTY_ACTIVE_WORKOUT,
    };
  }

  const workoutExercises = db.getAllSync<WorkoutSessionExerciseRow>(
    `
      SELECT id, workout_session_id, exercise_source, exercise_id, display_name_snapshot, sort_order
      FROM workout_session_exercises
      WHERE workout_session_id = ?
      ORDER BY sort_order ASC
    `,
    [sessionId]
  );

  const workoutSets = db.getAllSync<WorkoutSessionSetRow>(
    `
      SELECT id, workout_session_exercise_id, sort_order, reps, weight
      FROM workout_session_sets
      WHERE workout_session_exercise_id IN (
        SELECT id FROM workout_session_exercises WHERE workout_session_id = ?
      )
      ORDER BY workout_session_exercise_id ASC, sort_order ASC
    `,
    [sessionId]
  );

  const setsByExerciseId = new Map<string, WorkoutSet[]>();

  for (const set of workoutSets) {
    const existingSets = setsByExerciseId.get(set.workout_session_exercise_id) ?? [];

    existingSets.push({
      id: set.id,
      reps: set.reps?.toString() ?? "",
      weight: set.weight?.toString() ?? "",
    });
    setsByExerciseId.set(set.workout_session_exercise_id, existingSets);
  }

  return {
    sessionId,
    workout: {
      startedAt: session.started_at,
      endedAt: session.ended_at,
      selectedExerciseId: session.selected_exercise_id,
      exercises: workoutExercises.map((exercise) => ({
        id: exercise.id,
        exerciseId: exercise.exercise_id,
        name: exercise.display_name_snapshot,
        sets: setsByExerciseId.get(exercise.id) ?? [],
      })),
    },
  };
}

export function saveCurrentWorkout(userId: string, sessionId: string, workout: ActiveWorkout) {
  const now = new Date().toISOString();

  db.execSync("BEGIN TRANSACTION;");

  try {
    db.runSync(
      `
        INSERT INTO workout_sessions (
          id,
          user_id,
          status,
          started_at,
          ended_at,
          completed_at,
          selected_exercise_id,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status = excluded.status,
          started_at = excluded.started_at,
          ended_at = excluded.ended_at,
          completed_at = excluded.completed_at,
          selected_exercise_id = excluded.selected_exercise_id,
          updated_at = excluded.updated_at
      `,
      [
        sessionId,
        userId,
        workout.endedAt ? "completed" : "active",
        workout.startedAt ?? now,
        workout.endedAt,
        workout.endedAt,
        workout.selectedExerciseId,
        now,
        now,
      ]
    );

    db.runSync("DELETE FROM workout_session_exercises WHERE workout_session_id = ?", [sessionId]);

    workout.exercises.forEach((exercise, exerciseIndex) => {
      db.runSync(
        `
          INSERT INTO workout_session_exercises (
            id,
            workout_session_id,
            exercise_source,
            exercise_id,
            display_name_snapshot,
            sort_order,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          exercise.id,
          sessionId,
          isUserExercise(userId, exercise.exerciseId) ? "custom" : "seeded",
          exercise.exerciseId,
          exercise.name,
          exerciseIndex,
          now,
          now,
        ]
      );

      exercise.sets.forEach((set, setIndex) => {
        db.runSync(
          `
            INSERT INTO workout_session_sets (
              id,
              workout_session_exercise_id,
              sort_order,
              reps,
              weight,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            set.id,
            exercise.id,
            setIndex,
            parseWorkoutNumber(set.reps),
            parseWorkoutNumber(set.weight),
            now,
            now,
          ]
        );
      });
    });

    setAppState(getCurrentWorkoutSessionStateKey(userId), sessionId);
    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }
}

export function clearPersistedCurrentWorkout(userId: string, sessionId: string | null) {
  db.execSync("BEGIN TRANSACTION;");

  try {
    if (sessionId) {
      db.runSync("DELETE FROM workout_sessions WHERE id = ?", [sessionId]);
    }

    deleteAppState(getCurrentWorkoutSessionStateKey(userId));
    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }
}

export function finalizePersistedWorkout(userId: string, sessionId: string | null) {
  if (!sessionId) {
    return;
  }

  db.execSync("BEGIN TRANSACTION;");

  try {
    deleteAppState(getCurrentWorkoutSessionStateKey(userId));
    enqueueSyncOperation("workout_session", sessionId, "create", {
      userId,
      sessionId,
    });
    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }
}

export function getPendingSyncOutboxEntries(limit = 25) {
  return db.getAllSync<SyncOutboxRow>(
    `
      SELECT
        id,
        entity_type,
        entity_id,
        operation,
        payload_json,
        status,
        attempt_count,
        next_retry_at,
        last_error,
        created_at,
        updated_at
      FROM sync_outbox
      WHERE status IN ('pending', 'failed')
      ORDER BY created_at ASC
      LIMIT ?
    `,
    [limit]
  );
}

export function markSyncOutboxEntryProcessing(id: string) {
  db.runSync(
    `
      UPDATE sync_outbox
      SET status = 'processing', updated_at = ?
      WHERE id = ?
    `,
    [new Date().toISOString(), id]
  );
}

export function markSyncOutboxEntryFailed(id: string, errorMessage: string) {
  const now = new Date().toISOString();

  db.runSync(
    `
      UPDATE sync_outbox
      SET
        status = 'failed',
        attempt_count = attempt_count + 1,
        last_error = ?,
        next_retry_at = ?,
        updated_at = ?
      WHERE id = ?
    `,
    [errorMessage, now, now, id]
  );
}

export function markSyncOutboxEntryCompleted(id: string, entityType: string) {
  db.execSync("BEGIN TRANSACTION;");

  try {
    db.runSync("DELETE FROM sync_outbox WHERE id = ?", [id]);
    setSyncStateSuccess(entityType);
    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }
}

export function getUserExerciseSyncPayload(exerciseId: string) {
  const exercise = db.getFirstSync<
    UserExerciseRow & { normalized_name: string }
  >(
    `
      SELECT
        id,
        user_id,
        name,
        normalized_name,
        category,
        muscle_group,
        is_unilateral,
        is_time_based,
        created_at,
        updated_at,
        deleted_at
      FROM user_exercises
      WHERE id = ?
      LIMIT 1
    `,
    [exerciseId]
  );

  if (!exercise) {
    return null;
  }

  const muscles = db.getAllSync<UserExerciseMuscleRow>(
    `
      SELECT user_exercise_id, muscle_name, role
      FROM user_exercise_muscles
      WHERE user_exercise_id = ?
      ORDER BY role ASC, muscle_name ASC
    `,
    [exerciseId]
  );

  return {
    exercise,
    muscles,
  };
}

export function getRoutineSyncPayload(routineId: string) {
  const routine = db.getFirstSync<RoutineRow & { normalized_name: string }>(
    `
      SELECT id, user_id, name, normalized_name, gym_id, created_at, updated_at, deleted_at
      FROM routines
      WHERE id = ?
      LIMIT 1
    `,
    [routineId]
  );

  if (!routine) {
    return null;
  }

  const routineExercises = db.getAllSync<RoutineExerciseRow & { created_at: string; updated_at: string }>(
    `
      SELECT id, routine_id, exercise_source, exercise_id, sort_order, created_at, updated_at
      FROM routine_exercises
      WHERE routine_id = ?
      ORDER BY sort_order ASC
    `,
    [routineId]
  );

  const routineExerciseSets = db.getAllSync<RoutineExerciseSetRow & { id: string; created_at: string; updated_at: string }>(
    `
      SELECT id, routine_exercise_id, sort_order, target_reps, target_weight, created_at, updated_at
      FROM routine_exercise_sets
      WHERE routine_exercise_id IN (
        SELECT id FROM routine_exercises WHERE routine_id = ?
      )
      ORDER BY routine_exercise_id ASC, sort_order ASC
    `,
    [routineId]
  );

  return {
    routine,
    routineExercises,
    routineExerciseSets,
  };
}

export function getCompletedWorkoutSyncPayload(sessionId: string) {
  const session = db.getFirstSync<WorkoutSessionRow & { created_at: string; updated_at: string }>(
    `
      SELECT id, user_id, status, started_at, ended_at, completed_at, selected_exercise_id, created_at, updated_at
      FROM workout_sessions
      WHERE id = ?
        AND status = 'completed'
      LIMIT 1
    `,
    [sessionId]
  );

  if (!session) {
    return null;
  }

  const exercises = db.getAllSync<WorkoutSessionExerciseRow & { created_at: string; updated_at: string }>(
    `
      SELECT id, workout_session_id, exercise_source, exercise_id, display_name_snapshot, sort_order, created_at, updated_at
      FROM workout_session_exercises
      WHERE workout_session_id = ?
      ORDER BY sort_order ASC
    `,
    [sessionId]
  );

  const sets = db.getAllSync<WorkoutSessionSetRow & { created_at: string; updated_at: string }>(
    `
      SELECT id, workout_session_exercise_id, sort_order, reps, weight, created_at, updated_at
      FROM workout_session_sets
      WHERE workout_session_exercise_id IN (
        SELECT id FROM workout_session_exercises WHERE workout_session_id = ?
      )
      ORDER BY workout_session_exercise_id ASC, sort_order ASC
    `,
    [sessionId]
  );

  return {
    session,
    exercises,
    sets,
  };
}

export function getCompletedWorkoutHistory(userId: string) {
  return db.getAllSync<
    WorkoutSessionRow & {
      exercise_count: number;
      set_count: number;
      pending_sync: number;
    }
  >(
    `
      SELECT
        ws.id,
        ws.user_id,
        ws.status,
        ws.started_at,
        ws.ended_at,
        ws.completed_at,
        ws.selected_exercise_id,
        COUNT(DISTINCT wse.id) as exercise_count,
        COUNT(wss.id) as set_count,
        EXISTS(
          SELECT 1
          FROM sync_outbox so
          WHERE so.entity_type = 'workout_session'
            AND so.entity_id = ws.id
        ) as pending_sync
      FROM workout_sessions ws
      LEFT JOIN workout_session_exercises wse ON wse.workout_session_id = ws.id
      LEFT JOIN workout_session_sets wss ON wss.workout_session_exercise_id = wse.id
      WHERE ws.user_id = ?
        AND ws.status = 'completed'
      GROUP BY ws.id
      ORDER BY ws.completed_at DESC, ws.started_at DESC
    `,
    [userId]
  );
}

export function upsertReferenceExercises(exercises: ReferenceExerciseRow[]) {
  db.execSync("BEGIN TRANSACTION;");

  try {
    for (const exercise of exercises) {
      db.runSync(
        `
          INSERT INTO exercises (
            id,
            name,
            category,
            muscle_group,
            is_unilateral,
            is_time_based,
            created_at,
            updated_at,
            archived_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            category = excluded.category,
            muscle_group = excluded.muscle_group,
            is_unilateral = excluded.is_unilateral,
            is_time_based = excluded.is_time_based,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            archived_at = excluded.archived_at
        `,
        [
          exercise.id,
          exercise.name,
          exercise.category,
          exercise.muscle_group,
          exercise.is_unilateral,
          exercise.is_time_based,
          exercise.created_at,
          exercise.updated_at,
          exercise.archived_at,
        ]
      );
    }

    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }
}

export function replaceReferenceExerciseMuscles(muscles: ReferenceExerciseMuscleRow[]) {
  db.execSync("BEGIN TRANSACTION;");

  try {
    db.execSync("DELETE FROM exercise_muscles;");

    for (const muscle of muscles) {
      db.runSync(
        `
          INSERT INTO exercise_muscles (
            id,
            exercise_id,
            muscle_name,
            role,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          muscle.id,
          muscle.exercise_id,
          muscle.muscle_name,
          muscle.role,
          muscle.created_at,
          muscle.updated_at,
        ]
      );
    }

    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }
}

export function setAppState(key: string, value: string) {
  db.runSync(
    `
      INSERT INTO app_state (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    [key, value]
  );
}

export function getAppState(key: string): string | null {
  const row = db.getFirstSync<AppStateRow>("SELECT value FROM app_state WHERE key = ?", [key]);

  return row?.value ?? null;
}

export function getReferenceExerciseSyncStatus() {
  return {
    cachedExerciseCount: Number(getAppState("reference_exercises_count") ?? "0"),
    lastSyncedAt: getAppState("reference_exercises_last_synced_at"),
  };
}

export function getSyncDiagnostics() {
  const pendingCountRow = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sync_outbox WHERE status = 'pending'"
  );
  const failedCountRow = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sync_outbox WHERE status = 'failed'"
  );

  return {
    pendingCount: pendingCountRow?.count ?? 0,
    failedCount: failedCountRow?.count ?? 0,
    lastSuccessAt: db.getFirstSync<{ value: string }>(
      "SELECT MAX(last_success_at) as value FROM sync_state"
    )?.value ?? null,
  };
}

export function getCachedUserExercises(userId: string): Exercise[] {
  const rows = db.getAllSync<UserExerciseRow>(
    `
      SELECT
        id,
        user_id,
        name,
        category,
        muscle_group,
        is_unilateral,
        is_time_based,
        created_at,
        updated_at,
        deleted_at
      FROM user_exercises
      WHERE user_id = ?
        AND deleted_at IS NULL
      ORDER BY name COLLATE NOCASE ASC
    `,
    [userId]
  );

  const muscles = db.getAllSync<UserExerciseMuscleRow>(
    `
      SELECT user_exercise_id, muscle_name, role
      FROM user_exercise_muscles
      WHERE user_exercise_id IN (
        SELECT id FROM user_exercises WHERE user_id = ? AND deleted_at IS NULL
      )
    `,
    [userId]
  );

  const musclesByExerciseId = new Map<
    string,
    { primaryMuscles: string[]; secondaryMuscles: string[] }
  >();

  for (const muscle of muscles) {
    const existing = musclesByExerciseId.get(muscle.user_exercise_id) ?? {
      primaryMuscles: [],
      secondaryMuscles: [],
    };

    if (muscle.role === "primary") {
      existing.primaryMuscles.push(muscle.muscle_name);
    } else {
      existing.secondaryMuscles.push(muscle.muscle_name);
    }

    musclesByExerciseId.set(muscle.user_exercise_id, existing);
  }

  return rows.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    category: exercise.category ?? undefined,
    muscleGroup: exercise.muscle_group,
    isUnilateral: Boolean(exercise.is_unilateral),
    isTimeBased: Boolean(exercise.is_time_based),
    primaryMuscles: musclesByExerciseId.get(exercise.id)?.primaryMuscles,
    secondaryMuscles: musclesByExerciseId.get(exercise.id)?.secondaryMuscles,
    createdAt: exercise.created_at,
    updatedAt: exercise.updated_at,
  }));
}

export function insertUserExercise(userId: string, exercise: Exercise) {
  db.execSync("BEGIN TRANSACTION;");

  try {
    db.runSync(
      `
        INSERT INTO user_exercises (
          id,
          user_id,
          name,
          normalized_name,
          category,
          muscle_group,
          is_unilateral,
          is_time_based,
          created_at,
          updated_at,
          deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      `,
      [
        exercise.id,
        userId,
        exercise.name,
        exercise.name.trim().toLowerCase(),
        exercise.category ?? null,
        exercise.muscleGroup,
        exercise.isUnilateral ? 1 : 0,
        exercise.isTimeBased ? 1 : 0,
        exercise.createdAt,
        exercise.updatedAt,
      ]
    );

    (exercise.primaryMuscles ?? []).forEach((muscle, index) => {
      db.runSync(
        `
          INSERT INTO user_exercise_muscles (
            id,
            user_exercise_id,
            muscle_name,
            role,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, 'primary', ?, ?)
        `,
        [
          `${exercise.id}-primary-${index + 1}`,
          exercise.id,
          muscle,
          exercise.createdAt,
          exercise.updatedAt,
        ]
      );
    });

    (exercise.secondaryMuscles ?? []).forEach((muscle, index) => {
      db.runSync(
        `
          INSERT INTO user_exercise_muscles (
            id,
            user_exercise_id,
            muscle_name,
            role,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, 'secondary', ?, ?)
        `,
        [
          `${exercise.id}-secondary-${index + 1}`,
          exercise.id,
          muscle,
          exercise.createdAt,
          exercise.updatedAt,
        ]
      );
    });

    enqueueSyncOperation("user_exercise", exercise.id, "create", {
      userId,
      name: exercise.name,
    });

    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }
}

export function getCachedRoutines(userId: string, exercises: Exercise[]): Routine[] {
  const routines = db.getAllSync<RoutineRow>(
    `
      SELECT id, user_id, name, gym_id, created_at, updated_at, deleted_at
      FROM routines
      WHERE user_id = ?
        AND deleted_at IS NULL
      ORDER BY name COLLATE NOCASE ASC
    `,
    [userId]
  );

  const routineExercises = db.getAllSync<RoutineExerciseRow>(
    `
      SELECT id, routine_id, exercise_source, exercise_id, sort_order
      FROM routine_exercises
      ORDER BY routine_id, sort_order ASC
    `
  );

  const routineExerciseSets = db.getAllSync<RoutineExerciseSetRow>(
    `
      SELECT routine_exercise_id, sort_order, target_reps, target_weight
      FROM routine_exercise_sets
      ORDER BY routine_exercise_id, sort_order ASC
    `
  );

  const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const setsByRoutineExerciseId = new Map<string, RoutineExerciseSetRow[]>();

  for (const routineExerciseSet of routineExerciseSets) {
    const existing = setsByRoutineExerciseId.get(routineExerciseSet.routine_exercise_id) ?? [];

    existing.push(routineExerciseSet);
    setsByRoutineExerciseId.set(routineExerciseSet.routine_exercise_id, existing);
  }

  const routineExercisesByRoutineId = new Map<Routine["id"], Routine["exercises"]>();

  for (const routineExercise of routineExercises) {
    const exercise = exercisesById.get(routineExercise.exercise_id);

    if (!exercise) {
      continue;
    }

    const existing = routineExercisesByRoutineId.get(routineExercise.routine_id) ?? [];
    const defaultSets = setsByRoutineExerciseId.get(routineExercise.id) ?? [];

    existing.push({
      exercise,
      sets:
        defaultSets.length > 0
          ? defaultSets.map((set) => ({
              reps: set.target_reps,
              weight: set.target_weight,
            }))
          : [{ reps: null, weight: null }],
    });

    routineExercisesByRoutineId.set(routineExercise.routine_id, existing);
  }

  return routines.map((routine) => ({
    id: routine.id,
    name: routine.name,
    gymId: routine.gym_id ?? undefined,
    exercises: routineExercisesByRoutineId.get(routine.id) ?? [],
  }));
}

export function insertRoutine(
  userId: string,
  routine: Routine,
  selectedExercises: Array<{ exercise: Exercise; exerciseSource: "seeded" | "custom" }>
) {
  db.execSync("BEGIN TRANSACTION;");

  try {
    db.runSync(
      `
        INSERT INTO routines (
          id,
          user_id,
          name,
          normalized_name,
          gym_id,
          created_at,
          updated_at,
          deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
      `,
      [
        routine.id,
        userId,
        routine.name,
        routine.name.trim().toLowerCase(),
        routine.gymId ?? null,
        new Date().toISOString(),
        new Date().toISOString(),
      ]
    );

    selectedExercises.forEach(({ exercise, exerciseSource }, exerciseIndex) => {
      const routineExerciseId = `${routine.id}-exercise-${exerciseIndex + 1}`;
      const timestamp = new Date().toISOString();

      db.runSync(
        `
          INSERT INTO routine_exercises (
            id,
            routine_id,
            exercise_source,
            exercise_id,
            sort_order,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          routineExerciseId,
          routine.id,
          exerciseSource,
          exercise.id,
          exerciseIndex,
          timestamp,
          timestamp,
        ]
      );

      db.runSync(
        `
          INSERT INTO routine_exercise_sets (
            id,
            routine_exercise_id,
            sort_order,
            target_reps,
            target_weight,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          `${routineExerciseId}-set-1`,
          routineExerciseId,
          0,
          null,
          null,
          timestamp,
          timestamp,
        ]
      );
    });

    enqueueSyncOperation("routine", routine.id, "create", {
      userId,
      name: routine.name,
    });

    db.execSync("COMMIT;");
  } catch (error) {
    db.execSync("ROLLBACK;");
    throw error;
  }
}

export function getCachedReferenceExercises(): Exercise[] {
  const exercises = db.getAllSync<ReferenceExerciseRow>(`
    SELECT
      id,
      name,
      category,
      muscle_group,
      is_unilateral,
      is_time_based,
      created_at,
      updated_at,
      archived_at
    FROM exercises
    WHERE archived_at IS NULL
    ORDER BY name COLLATE NOCASE ASC
  `);

  const muscles = db.getAllSync<ReferenceExerciseMuscleRow>(`
    SELECT id, exercise_id, muscle_name, role, created_at, updated_at
    FROM exercise_muscles
  `);

  const musclesByExerciseId = new Map<
    string,
    { primaryMuscles: string[]; secondaryMuscles: string[] }
  >();

  for (const muscle of muscles) {
    const existing = musclesByExerciseId.get(muscle.exercise_id) ?? {
      primaryMuscles: [],
      secondaryMuscles: [],
    };

    if (muscle.role === "primary") {
      existing.primaryMuscles.push(muscle.muscle_name);
    } else {
      existing.secondaryMuscles.push(muscle.muscle_name);
    }

    musclesByExerciseId.set(muscle.exercise_id, existing);
  }

  return exercises.map((exercise) => {
    const muscleGroups = musclesByExerciseId.get(exercise.id);

    return {
      id: exercise.id,
      name: exercise.name,
      category: exercise.category ?? undefined,
      muscleGroup: exercise.muscle_group,
      isUnilateral: Boolean(exercise.is_unilateral),
      isTimeBased: Boolean(exercise.is_time_based),
      primaryMuscles: muscleGroups?.primaryMuscles,
      secondaryMuscles: muscleGroups?.secondaryMuscles,
      createdAt: exercise.created_at,
      updatedAt: exercise.updated_at,
    };
  });
}