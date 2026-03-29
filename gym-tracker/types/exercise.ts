export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
};