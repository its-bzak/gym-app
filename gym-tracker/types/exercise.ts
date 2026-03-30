export type Exercise = {
  id: string;
  name: string;
  category?: string; // calisthenics, free weight, machine, or cable
  isUnilateral?: boolean; // indicates if the exercise is performed one side at a time (e.g., lunges, single-arm rows)
  isTimeBased?: boolean; // default to false
  equipment?: string; 
  muscleGroup: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  createdAt: string;
  updatedAt: string;
};