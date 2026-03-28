import React, { createContext, useContext, useState } from "react";
import { Exercise } from "@/types/exercise";
import { ActiveWorkout, ActiveWorkoutExercise } from "@/types/workout";

type ActiveWorkoutContextType = {
  workout: ActiveWorkout;
  startWorkout: () => void;
  addExercise: (exercise: Exercise) => void;
  clearWorkout: () => void;
};

const ActiveWorkoutContext = createContext<ActiveWorkoutContextType | undefined>(undefined);

function createActiveWorkoutExercise(exercise: Exercise): ActiveWorkoutExercise {
  return {
    id: `${exercise.id}-${Date.now()}`,
    exerciseId: exercise.id,
    name: exercise.name,
    sets: [],
  };
}

export function ActiveWorkoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [workout, setWorkout] = useState<ActiveWorkout>({
    startedAt: null,
    exercises: [],
  });

  const startWorkout = () => {
    setWorkout({
      startedAt: new Date().toISOString(),
      exercises: [],
    });
  };

  const addExercise = (exercise: Exercise) => {
    setWorkout((prev) => ({
      ...prev,
      exercises: [...prev.exercises, createActiveWorkoutExercise(exercise)],
    }));
  };

  const clearWorkout = () => {
    setWorkout({
      startedAt: null,
      exercises: [],
    });
  };

  return (
    <ActiveWorkoutContext.Provider
      value={{ workout, startWorkout, addExercise, clearWorkout }}
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