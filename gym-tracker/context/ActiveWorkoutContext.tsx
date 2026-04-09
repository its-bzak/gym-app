import React, { createContext, useContext, useEffect, useState } from "react";
import {
  clearPersistedCurrentWorkout,
  finalizePersistedWorkout,
  getPersistedCurrentWorkout,
  saveCurrentWorkout,
} from "@/db/sqlite";
import { getAuthenticatedUserId } from "@/services/profileService";
import { Exercise } from "@/types/exercise";
import { Routine } from "@/types/routine";
import { ActiveWorkout, ActiveWorkoutExercise, WorkoutSet } from "@/types/workout";

type ActiveWorkoutContextType = {
  workout: ActiveWorkout;
  startWorkout: () => void;
  addExercise: (exercise: Exercise) => void;
  addRoutine: (routine: Routine) => void;
  selectExercise: (exerciseId: string) => void;
  addSetToSelectedExercise: () => void;
  updateSet: (
    exerciseId: string,
    setId: string,
    field: "weight" | "reps",
    value: string
  ) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  removeExercise: (exerciseId: string) => void;
  clearWorkout: () => void;
  saveWorkout: () => void;
  finishWorkout: () => void;
  resumeWorkout: () => void;
};

const ActiveWorkoutContext = createContext<ActiveWorkoutContextType | undefined>(undefined);

const LOCAL_ANONYMOUS_USER_ID = "local-anonymous";
const EMPTY_WORKOUT: ActiveWorkout = {
  startedAt: null,
  endedAt: null,
  exercises: [],
  selectedExerciseId: null,
};

function createWorkoutSet(): WorkoutSet {
  return {
    id: `set-${Date.now()}-${Math.random()}`,
    weight: "",
    reps: "",
  };
}

function createWorkoutSetFromValues(weight: number | null, reps: number | null): WorkoutSet {
  return {
    id: `set-${Date.now()}-${Math.random()}`,
    weight: weight?.toString() ?? "",
    reps: reps?.toString() ?? "",
  };
}

function createActiveWorkoutExercise(exercise: Exercise): ActiveWorkoutExercise {
  return {
    id: `active-ex-${exercise.id}-${Date.now()}-${Math.random()}`,
    exerciseId: exercise.id,
    name: exercise.name,
    sets: [],
  };
}

function createActiveWorkoutExerciseFromRoutine(
  exercise: Routine["exercises"][number]
): ActiveWorkoutExercise {
  return {
    id: `active-ex-${exercise.exercise.id}-${Date.now()}-${Math.random()}`,
    exerciseId: exercise.exercise.id,
    name: exercise.exercise.name,
    sets: exercise.sets.map((set) => createWorkoutSetFromValues(set.weight, set.reps)),
  };
}

export function ActiveWorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workout, setWorkout] = useState<ActiveWorkout>(EMPTY_WORKOUT);
  const [ownerId, setOwnerId] = useState(LOCAL_ANONYMOUS_USER_ID);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const hydrateWorkout = async () => {
      try {
        const authenticatedUserId = await getAuthenticatedUserId();
        const nextOwnerId = authenticatedUserId ?? LOCAL_ANONYMOUS_USER_ID;

        if (!isMounted) {
          return;
        }

        const persistedWorkout = getPersistedCurrentWorkout(nextOwnerId);

        setOwnerId(nextOwnerId);
        setSessionId(persistedWorkout.sessionId);
        setWorkout(persistedWorkout.workout);
      } catch {
        if (!isMounted) {
          return;
        }

        const persistedWorkout = getPersistedCurrentWorkout(LOCAL_ANONYMOUS_USER_ID);

        setOwnerId(LOCAL_ANONYMOUS_USER_ID);
        setSessionId(persistedWorkout.sessionId);
        setWorkout(persistedWorkout.workout);
      }
    };

    void hydrateWorkout();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistWorkout = (nextWorkout: ActiveWorkout, nextSessionId: string | null) => {
    if (!nextSessionId) {
      setWorkout(nextWorkout);
      return;
    }

    saveCurrentWorkout(ownerId, nextSessionId, nextWorkout);
    setSessionId(nextSessionId);
    setWorkout(nextWorkout);
  };

  const startWorkout = () => {
    const nextSessionId = `workout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextWorkout = {
      startedAt: new Date().toISOString(),
      endedAt: null,
      exercises: [],
      selectedExerciseId: null,
    };

    persistWorkout(nextWorkout, nextSessionId);
  };

  const addExercise = (exercise: Exercise) => {
    const newExercise = createActiveWorkoutExercise(exercise);
    const nextSessionId = sessionId ?? `workout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextWorkout = {
      startedAt: workout.startedAt ?? new Date().toISOString(),
      endedAt: workout.endedAt,
      exercises: [...workout.exercises, newExercise],
      selectedExerciseId: newExercise.id,
    };

    persistWorkout(nextWorkout, nextSessionId);
  };

  const addRoutine = (routine: Routine) => {
    const routineExercises = routine.exercises.map((exercise) =>
      createActiveWorkoutExerciseFromRoutine(exercise)
    );

    if (routineExercises.length === 0) {
      return;
    }

    const nextSessionId = sessionId ?? `workout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextWorkout = {
      startedAt: workout.startedAt ?? new Date().toISOString(),
      endedAt: workout.endedAt,
      exercises: [...workout.exercises, ...routineExercises],
      selectedExerciseId: routineExercises[0].id,
    };

    persistWorkout(nextWorkout, nextSessionId);
  };

  const selectExercise = (exerciseId: string) => {
    persistWorkout(
      {
        ...workout,
        selectedExerciseId: exerciseId,
      },
      sessionId
    );
  };

  const addSetToSelectedExercise = () => {
    if (!workout.selectedExerciseId) {
      return;
    }

    persistWorkout(
      {
        ...workout,
        exercises: workout.exercises.map((exercise) =>
          exercise.id === workout.selectedExerciseId
            ? {
                ...exercise,
                sets: [...exercise.sets, createWorkoutSet()],
              }
            : exercise
        ),
      },
      sessionId
    );
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: "weight" | "reps",
    value: string
  ) => {
    persistWorkout(
      {
        ...workout,
        exercises: workout.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: exercise.sets.map((set) =>
                  set.id === setId ? { ...set, [field]: value } : set
                ),
              }
            : exercise
        ),
      },
      sessionId
    );
  };

  const removeSet = (exerciseId: string, setId: string) => {
    persistWorkout(
      {
        ...workout,
        exercises: workout.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: exercise.sets.filter((set) => set.id !== setId),
              }
            : exercise
        ),
      },
      sessionId
    );
  };

  const removeExercise = (exerciseId: string) => {
    const nextExercises = workout.exercises.filter((exercise) => exercise.id !== exerciseId);
    const nextSelectedExerciseId =
      workout.selectedExerciseId === exerciseId
        ? nextExercises.length > 0
          ? nextExercises[0].id
          : null
        : workout.selectedExerciseId;

    persistWorkout(
      {
        ...workout,
        exercises: nextExercises,
        selectedExerciseId: nextSelectedExerciseId,
      },
      sessionId
    );
  };

  const finishWorkout = () => {
    persistWorkout(
      {
        ...workout,
        endedAt: new Date().toISOString(),
      },
      sessionId
    );
  };

  const resumeWorkout = () => {
    persistWorkout(
      {
        ...workout,
        endedAt: null,
      },
      sessionId
    );
  };

  const clearWorkout = () => {
    clearPersistedCurrentWorkout(ownerId, sessionId);
    setSessionId(null);
    setWorkout(EMPTY_WORKOUT);
  };

  const saveWorkout = () => {
    finalizePersistedWorkout(ownerId, sessionId);
    setSessionId(null);
    setWorkout(EMPTY_WORKOUT);
  };

  return (
    <ActiveWorkoutContext.Provider
      value={{
        workout,
        startWorkout,
        addExercise,
        addRoutine,
        selectExercise,
        addSetToSelectedExercise,
        updateSet,
        removeSet,
        removeExercise,
        saveWorkout,
        finishWorkout,
        resumeWorkout,
        clearWorkout,
      }}
    >
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export function useActiveWorkout() {
  const context = useContext(ActiveWorkoutContext);

  if (!context) {
    throw new Error("useActiveWorkout must be used within ActiveWorkoutProvider");
  }

  return context;
}