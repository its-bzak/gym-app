export type PRAchievement = {
  exerciseId: string;
  exerciseName: string;
  type: "weight" | "volume";
  value: number;
};

export type WorkoutSummaryStats = {
  durationSeconds: number;
  totalVolume: number;
  totalSets: number;
};