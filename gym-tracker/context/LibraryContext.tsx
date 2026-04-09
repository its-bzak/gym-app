import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getCachedReferenceExercises,
  getCachedRoutines,
  getCachedUserExercises,
  getReferenceExerciseSyncStatus,
  insertRoutine,
  insertUserExercise,
} from "@/db/sqlite";
import { syncSeededExerciseReferenceData } from "@/services/referenceDataBootstrap";
import { syncPendingLocalChanges } from "@/services/localSyncService";
import { getAuthenticatedUserId } from "@/services/profileService";
import { Exercise } from "@/types/exercise";
import { Routine } from "@/types/routine";

type CreateExerciseInput = Omit<Exercise, "id">;

type LibraryContextType = {
  exercises: Exercise[];
  routines: Routine[];
  isHydratingExercises: boolean;
  cachedExerciseCount: number;
  lastReferenceExerciseSyncAt: string | null;
  addCustomExercise: (exercise: CreateExerciseInput) => Exercise;
  addCustomRoutine: (name: string, exercises: Exercise[]) => Routine;
  hasExerciseNamed: (name: string) => boolean;
  hasRoutineNamed: (name: string) => boolean;
};

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const LOCAL_ANONYMOUS_USER_ID = "local-anonymous";

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [seededExercises, setSeededExercises] = useState<Exercise[]>([]);
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [isHydratingExercises, setIsHydratingExercises] = useState(true);
  const [cachedExerciseCount, setCachedExerciseCount] = useState(0);
  const [lastReferenceExerciseSyncAt, setLastReferenceExerciseSyncAt] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLibraryData = async () => {
      setIsHydratingExercises(true);
      let nextOwnerId = LOCAL_ANONYMOUS_USER_ID;

      try {
        const authenticatedUserId = await getAuthenticatedUserId();
        nextOwnerId = authenticatedUserId ?? LOCAL_ANONYMOUS_USER_ID;

        if (!isMounted) {
          return;
        }

        setOwnerId(nextOwnerId);
        const cachedSeededExercises = getCachedReferenceExercises();
        const cachedCustomExercises = getCachedUserExercises(nextOwnerId);

        setSeededExercises(cachedSeededExercises);
        setCustomExercises(cachedCustomExercises);
        setRoutines(getCachedRoutines(nextOwnerId, [...cachedSeededExercises, ...cachedCustomExercises]));

        const syncStatus = getReferenceExerciseSyncStatus();

        setCachedExerciseCount(syncStatus.cachedExerciseCount);
        setLastReferenceExerciseSyncAt(syncStatus.lastSyncedAt);

        await syncSeededExerciseReferenceData();
        await syncPendingLocalChanges();

        if (!isMounted) {
          return;
        }

        const refreshedSeededExercises = getCachedReferenceExercises();
        const refreshedCustomExercises = getCachedUserExercises(nextOwnerId);

        setSeededExercises(refreshedSeededExercises);
        setCustomExercises(refreshedCustomExercises);
        setRoutines(
          getCachedRoutines(nextOwnerId, [...refreshedSeededExercises, ...refreshedCustomExercises])
        );

        const refreshedSyncStatus = getReferenceExerciseSyncStatus();

        setCachedExerciseCount(refreshedSyncStatus.cachedExerciseCount);
        setLastReferenceExerciseSyncAt(refreshedSyncStatus.lastSyncedAt);
      } catch {
        if (!isMounted) {
          return;
        }

        setSeededExercises(getCachedReferenceExercises());
        setCustomExercises(getCachedUserExercises(nextOwnerId));
        setRoutines(
          getCachedRoutines(nextOwnerId, [
            ...getCachedReferenceExercises(),
            ...getCachedUserExercises(nextOwnerId),
          ])
        );

        const syncStatus = getReferenceExerciseSyncStatus();

        setCachedExerciseCount(syncStatus.cachedExerciseCount);
        setLastReferenceExerciseSyncAt(syncStatus.lastSyncedAt);
      } finally {
        if (isMounted) {
          setIsHydratingExercises(false);
        }
      }
    };

    void loadLibraryData();

    return () => {
      isMounted = false;
    };
  }, []);

  const exercises = useMemo(() => [...seededExercises, ...customExercises], [customExercises, seededExercises]);

  const hasExerciseNamed = (name: string) => {
    const normalizedName = normalizeName(name);

    return exercises.some((exercise) => normalizeName(exercise.name) === normalizedName);
  };

  const hasRoutineNamed = (name: string) => {
    const normalizedName = normalizeName(name);

    return routines.some((routine) => normalizeName(routine.name) === normalizedName);
  };

  const addCustomExercise = (exercise: CreateExerciseInput) => {
    const nextOwnerId = ownerId ?? LOCAL_ANONYMOUS_USER_ID;
    const newExercise: Exercise = {
      ...exercise,
      id: generateId("exercise"),
    };

    insertUserExercise(nextOwnerId, newExercise);
    setCustomExercises((prev) => [...prev, newExercise]);
    setRoutines((prev) => getCachedRoutines(nextOwnerId, [...seededExercises, ...customExercises, newExercise]));
    void syncPendingLocalChanges();

    return newExercise;
  };

  const addCustomRoutine = (name: string, selectedExercises: Exercise[]) => {
    const nextOwnerId = ownerId ?? LOCAL_ANONYMOUS_USER_ID;
    const newRoutine: Routine = {
      id: generateId("routine"),
      name: name.trim(),
      exercises: selectedExercises.map((exercise) => ({
        exercise,
        sets: [{ reps: null, weight: null }],
      })),
    };

    insertRoutine(
      nextOwnerId,
      newRoutine,
      selectedExercises.map((exercise) => ({
        exercise,
        exerciseSource: customExercises.some((item) => item.id === exercise.id) ? "custom" : "seeded",
      }))
    );

    setRoutines((prev) => [...prev, newRoutine]);
    void syncPendingLocalChanges();

    return newRoutine;
  };

  return (
    <LibraryContext.Provider
      value={{
        exercises,
        routines,
        isHydratingExercises,
        cachedExerciseCount,
        lastReferenceExerciseSyncAt,
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