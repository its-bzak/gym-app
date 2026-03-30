import React, { createContext, useContext, useMemo, useState } from "react";
import { exercises as baseExercises } from "@/mock/gymImplementation";
import { mockRoutines } from "@/mock/routines";
import { Exercise } from "@/types/exercise";
import { Routine } from "@/types/routine";

type CreateExerciseInput = Omit<Exercise, "id">;

type LibraryContextType = {
  exercises: Exercise[];
  routines: Routine[];
  addCustomExercise: (exercise: CreateExerciseInput) => Exercise;
  addCustomRoutine: (name: string, exercises: Exercise[]) => Routine;
  hasExerciseNamed: (name: string) => boolean;
  hasRoutineNamed: (name: string) => boolean;
};

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [customRoutines, setCustomRoutines] = useState<Routine[]>([]);

  const exercises = useMemo(() => [...baseExercises, ...customExercises], [customExercises]);
  const routines = useMemo(() => [...mockRoutines, ...customRoutines], [customRoutines]);

  const hasExerciseNamed = (name: string) => {
    const normalizedName = normalizeName(name);

    return exercises.some((exercise) => normalizeName(exercise.name) === normalizedName);
  };

  const hasRoutineNamed = (name: string) => {
    const normalizedName = normalizeName(name);

    return routines.some((routine) => normalizeName(routine.name) === normalizedName);
  };

  const addCustomExercise = (exercise: CreateExerciseInput) => {
    const newExercise: Exercise = {
      ...exercise,
      id: generateId("exercise"),
    };

    setCustomExercises((prev) => [...prev, newExercise]);

    return newExercise;
  };

  const addCustomRoutine = (name: string, selectedExercises: Exercise[]) => {
    const newRoutine: Routine = {
      id: generateId("routine"),
      name: name.trim(),
      exercises: selectedExercises.map((exercise) => ({
        exercise,
        sets: [{ reps: null, weight: null }],
      })),
    };

    setCustomRoutines((prev) => [...prev, newRoutine]);

    return newRoutine;
  };

  return (
    <LibraryContext.Provider
      value={{
        exercises,
        routines,
        addCustomExercise,
        addCustomRoutine,
        hasExerciseNamed,
        hasRoutineNamed,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);

  if (!context) {
    throw new Error("useLibrary must be used within LibraryProvider");
  }

  return context;
}