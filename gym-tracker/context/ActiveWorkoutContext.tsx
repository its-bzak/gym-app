import React, { createContext, useContext, useState } from "react";
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
  finishWorkout: () => void;
  resumeWorkout: () => void;
};

const ActiveWorkoutContext = createContext<ActiveWorkoutContextType | undefined>(undefined);

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
  const [workout, setWorkout] = useState<ActiveWorkout>({
    startedAt: null,
    endedAt: null,
    exercises: [],
    selectedExerciseId: null,
  });

  const startWorkout = () => {
    setWorkout({
      startedAt: new Date().toISOString(),
      endedAt: null,
      exercises: [],
      selectedExerciseId: null,
    });
  };

  const addExercise = (exercise: Exercise) => {
    const newExercise = createActiveWorkoutExercise(exercise);

    setWorkout((prev) => ({
      ...prev,
      exercises: [...prev.exercises, newExercise],
      selectedExerciseId: newExercise.id,
    }));
  };

  const addRoutine = (routine: Routine) => {
    const routineExercises = routine.exercises.map((exercise) =>
      createActiveWorkoutExerciseFromRoutine(exercise)
    );

    if (routineExercises.length === 0) {
      return;
    }

    setWorkout((prev) => ({
      ...prev,
      exercises: [...prev.exercises, ...routineExercises],
      selectedExerciseId: routineExercises[0].id,
    }));
  };

  const selectExercise = (exerciseId: string) => {
    setWorkout((prev) => ({
      ...prev,
      selectedExerciseId: exerciseId,
    }));
  };

  const addSetToSelectedExercise = () => {
    setWorkout((prev) => {
      if (!prev.selectedExerciseId) return prev;

      return {
        ...prev,
        exercises: prev.exercises.map((exercise) =>
          exercise.id === prev.selectedExerciseId
            ? {
                ...exercise,
                sets: [...exercise.sets, createWorkoutSet()],
              }
            : exercise
        ),
      };
    });
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: "weight" | "reps",
    value: string
  ) => {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, [field]: value } : set
              ),
            }
          : exercise
      ),
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.filter((set) => set.id !== setId),
            }
          : exercise
      ),
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setWorkout((prev) => {
      const nextExercises = prev.exercises.filter((exercise) => exercise.id !== exerciseId);

      let nextSelectedExerciseId = prev.selectedExerciseId;

      if (prev.selectedExerciseId === exerciseId) {
        nextSelectedExerciseId = nextExercises.length > 0 ? nextExercises[0].id : null;
      }

      return {
        ...prev,
        exercises: nextExercises,
        selectedExerciseId: nextSelectedExerciseId,
      };
    });
  };

  const finishWorkout = () => {
    setWorkout((prev) => ({
      ...prev,
      endedAt: new Date().toISOString(),
    }));
  };

  const resumeWorkout = () => {
    setWorkout((prev) => ({
      ...prev,
      endedAt: null,
    }));
  };

  const clearWorkout = () => {
    setWorkout({
      startedAt: null,
      endedAt: null,
      exercises: [],
      selectedExerciseId: null,
    });
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