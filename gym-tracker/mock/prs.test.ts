import { getWorkoutPRs } from "@/utils/statsHelper";
import { ActiveWorkoutExercise } from "@/types/workout";

function createWorkoutExercise(
  exerciseId: string,
  name: string,
  sets: Array<{ weight: string; reps: string }>
): ActiveWorkoutExercise {
  return {
    id: `active-${exerciseId}`,
    exerciseId,
    name,
    sets: sets.map((set, index) => ({
      id: `${exerciseId}-set-${index}`,
      weight: set.weight,
      reps: set.reps,
    })),
  };
}

describe("getWorkoutPRs", () => {
  test("returns PRs when an exercise beats existing weight and volume baselines", () => {
    const achievements = getWorkoutPRs(
      [
        createWorkoutExercise("ex_barbell_bench_press", "Barbell Bench Press", [
          { weight: "230", reps: "5" },
          { weight: "225", reps: "7" },
        ]),
      ],
      {
        ex_barbell_bench_press: { maxWeight: 225, maxVolume: 2500 },
      }
    );

    expect(achievements).toEqual([
      {
        exerciseId: "ex_barbell_bench_press",
        exerciseName: "Barbell Bench Press",
        type: "weight",
        value: 230,
      },
      {
        exerciseId: "ex_barbell_bench_press",
        exerciseName: "Barbell Bench Press",
        type: "volume",
        value: 2725,
      },
    ]);
  });

  test("treats the first logged workout for an exercise as both a weight and volume PR", () => {
    const achievements = getWorkoutPRs(
      [
        createWorkoutExercise("ex_pull_up", "Pull-Up", [
          { weight: "45", reps: "8" },
        ]),
      ],
      {}
    );

    expect(achievements).toEqual([
      {
        exerciseId: "ex_pull_up",
        exerciseName: "Pull-Up",
        type: "weight",
        value: 45,
      },
      {
        exerciseId: "ex_pull_up",
        exerciseName: "Pull-Up",
        type: "volume",
        value: 360,
      },
    ]);
  });

  test("does not create PRs when no logged set beats the prior baselines", () => {
    const achievements = getWorkoutPRs(
      [
        createWorkoutExercise("ex_dumbbell_curl", "Dumbbell Curl", [
          { weight: "55", reps: "10" },
        ]),
      ],
      {
        ex_dumbbell_curl: { maxWeight: 60, maxVolume: 900 },
      }
    );

    expect(achievements).toEqual([]);
  });
});