import { exercises as baseExercises } from "@/mock/gymImplementation";
import { Routine } from "@/types/routine";

function getExerciseById(exerciseId: string) {
    const exercise = baseExercises.find((item) => item.id === exerciseId);

    if (!exercise) {
        throw new Error(`Missing base exercise for routine seed: ${exerciseId}`);
    }

    return exercise;
}

export const mockRoutines: Routine[] = [
    {
        id: "1",
        name: "Chest Day",
        exercises: [
            {
                exercise: getExerciseById("ex_barbell_bench_press"),
                sets: [{ reps: null, weight: null }],
            },
            {
                exercise: getExerciseById("ex_machine_chest_fly"),
                sets: [{ reps: null, weight: null }],
            },
        ],
    },
    {
        id: "2",
        name: "Leg Day",
        exercises: [
            {
                exercise: getExerciseById("ex_back_squat"),
                sets: [{ reps: null, weight: null }],
            },
            {
                exercise: getExerciseById("ex_leg_press"),
                sets: [{ reps: null, weight: null }],
            },
        ],
    },
];