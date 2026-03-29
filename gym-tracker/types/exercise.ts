export type Exercise = {
  id: string;
  name: string;
  type?: string;
  equipment?: string;
  muscleGroup: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
};