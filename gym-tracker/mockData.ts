// mockData.ts

// ---- USERS ----
export const users = [
  {
    id: "u1",
    email: "john@test.com",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ---- GYMS ----
export const gyms = [
  {
    id: "g1",
    name: "Gym ABC",
    location: "Madrid",
    owner_id: "u1",
  },
  {
    id: "g2",
    name: "Gym XYZ",
    location: "Seville",
    owner_id: "u1",
  },
];

// ---- EXERCISES ----
export const exercises = [
  {
    id: "e1",
    name: "Chest Press",
    muscle_group: "chest",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "e2",
    name: "Leg Press",
    muscle_group: "legs",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ---- EQUIPMENT ----
export const equipment = [
  {
    id: "eq1",
    gym_id: "g1",
    exercise_id: "e1",
    name: "Plate Loaded Chest Press",
    brand: "Hammer Strength",
    created_at: new Date().toISOString(),
  },
  {
    id: "eq2",
    gym_id: "g2",
    exercise_id: "e1",
    name: "Chest Press Machine",
    brand: "Technogym",
    created_at: new Date().toISOString(),
  },
];

// ---- WORKOUT PLANS ----
export const workoutPlans = [
  {
    id: "wp1",
    user_id: "u1",
    name: "Push Day",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ---- WORKOUT EXERCISES ----
export const workoutExercises = [
  {
    id: "we1",
    workout_plan_id: "wp1",
    exercise_id: "e1",
    order_index: 0,
  },
];

// ---- WORKOUT SESSIONS ----
export const workoutSessions = [
  {
    id: "ws1",
    user_id: "u1",
    gym_id: "g1",
    workout_plan_id: "wp1",
    started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h ago
    ended_at: new Date().toISOString(),
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    synced_at: null,
    is_deleted: false,
  },
];

// ---- EXERCISE LOGS ----
export const exerciseLogs = [
  {
    id: "el1",
    workout_session_id: "ws1",
    exercise_id: "e1",
    equipment_id: "eq1",
    order_index: 0,
  },
];

// ---- SET LOGS ----
export const setLogs = [
  {
    id: "s1",
    exercise_log_id: "el1",
    reps: 10,
    weight: 80,
    duration: null,
    rest_time: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "s2",
    exercise_log_id: "el1",
    reps: 8,
    weight: 90,
    duration: null,
    rest_time: null,
    created_at: new Date().toISOString(),
  },
];

// ---- PRS ----
export const exercisePRs = [
  {
    id: "pr1",
    user_id: "u1",
    exercise_id: "e1",
    equipment_id: "eq1",
    max_weight: 90,
    max_reps: 10,
    max_volume: 900,
    updated_at: new Date().toISOString(),
  },
  {
    id: "pr2",
    user_id: "u1",
    exercise_id: "e1",
    equipment_id: null,
    max_weight: 100,
    max_reps: 10,
    max_volume: 1000,
    updated_at: new Date().toISOString(),
  },
];

// ---- SYNC QUEUE ----
export const syncQueue = [
  {
    id: "sq1",
    table_name: "workout_sessions",
    record_id: "ws1",
    operation: "insert",
    payload: {},
    created_at: new Date().toISOString(),
    synced_at: null,
  },
];

// ---- USER SETTINGS ----
export const userSettings = [
  {
    user_id: "u1",
    unit: "kg",
  },
];