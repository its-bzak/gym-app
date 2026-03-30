export type Muscles = {
    id: string;
    name: string;
};

export type MuscleGroup = {
    id: string;
    name: string;
    muscles: Muscles[];
};

export const Muscles: Muscles[] = [
    { id: "abductors", name: "Abductors" },
    { id: "abdominals", name: "Abdominals" },
    { id: "adductors", name: "Adductors" },
    { id: "biceps", name: "Biceps" },
    { id: "calves", name: "Calves" },
    { id: "chest", name: "Chest" },
    { id: "forearm_flex", name: "Forearm Flexors" },
    { id: "forearm_ext", name: "Forearm Extensors" },
    { id: "front_delts", name: "Front Delts" },
    { id: "glutes", name: "Glutes" },
    { id: "hamstrings", name: "Hamstrings" },
    { id: "lateral_delts", name: "Lateral Delts" },
    { id: "lats", name: "Lats" },
    { id: "lower_back", name: "Lower Back" },
    { id: "neck", name: "Neck" },
    { id: "obliques", name: "Obliques" },
    { id: "quads", name: "Quadriceps" },
    { id: "rear_delts", name: "Rear Delts" },
    { id: "rotator_cuff", name: "Rotator Cuff" },
    { id: "traps", name: "Traps" },
    { id: "triceps", name: "Triceps" },
    { id: "upper_chest", name: "Upper Chest" },
];

export const MuscleGroups: MuscleGroup[] = [
    {
        id: "arms",
        name: "Arms",
        muscles: [
            Muscles.find((m) => m.id === "biceps")!,
            Muscles.find((m) => m.id === "triceps")!,
            Muscles.find((m) => m.id === "forearm_flex")!,
            Muscles.find((m) => m.id === "forearm_ext")!,
        ],
    },
    {
        id: "legs",
        name: "Legs",
        muscles: [
            Muscles.find((m) => m.id === "quads")!,
            Muscles.find((m) => m.id === "hamstrings")!,
            Muscles.find((m) => m.id === "calves")!,
            Muscles.find((m) => m.id === "glutes")!,
        ],
    },
    {
        id: "back",
        name: "Back",
        muscles: [
            Muscles.find((m) => m.id === "lats")!,
            Muscles.find((m) => m.id === "traps")!,
            Muscles.find((m) => m.id === "lower_back")!,
            Muscles.find((m) => m.id === "neck")!,
        ],
    },
    {
        id: "chest",
        name: "Chest",
        muscles: [
            Muscles.find((m) => m.id === "chest")!,
            Muscles.find((m) => m.id === "upper_chest")!,
        ],
    },
    {
        id: "shoulders",
        name: "Shoulders",
        muscles: [
            Muscles.find((m) => m.id === "front_delts")!,
            Muscles.find((m) => m.id === "lateral_delts")!,
            Muscles.find((m) => m.id === "rear_delts")!,
        ],
    },
    {
        id: "core",
        name: "Core",
        muscles: [
            Muscles.find((m) => m.id === "abdominals")!,
            Muscles.find((m) => m.id === "obliques")!,
        ],
    },
];