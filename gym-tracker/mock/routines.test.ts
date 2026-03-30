import { exercises as baseExercises } from "./gymImplementation";
import { isExerciseAvailableAtGym } from "./mockDataService";
import { mockRoutines } from "./routines";

function isRoutineAvailableAtGym(routineId: string, gymId: string): boolean {
  const routine = mockRoutines.find((item) => item.id === routineId);

  if (!routine) {
    return false;
  }

  return routine.exercises.every((entry) =>
    isExerciseAvailableAtGym(entry.exercise.id, gymId)
  );
}

describe("mockRoutines", () => {
  test("all preset routine exercises come from the canonical gymImplementation dataset", () => {
    const baseExerciseIds = new Set(baseExercises.map((exercise) => exercise.id));

    expect(mockRoutines).toHaveLength(2);

    mockRoutines.forEach((routine) => {
      routine.exercises.forEach((entry) => {
        expect(baseExerciseIds.has(entry.exercise.id)).toBe(true);
      });
    });
  });

  test("Chest Day is available at South Shore Iron but not Ryan Home Gym", () => {
    expect(isRoutineAvailableAtGym("1", "gym_south_shore_iron")).toBe(true);
    expect(isRoutineAvailableAtGym("1", "gym_home_setup")).toBe(false);
  });

  test("Leg Day is available at South Shore Iron but not College Rec Center", () => {
    expect(isRoutineAvailableAtGym("2", "gym_south_shore_iron")).toBe(true);
    expect(isRoutineAvailableAtGym("2", "gym_college_rec")).toBe(false);
  });
});