import { Muscles } from "./muscles";

export type Equipment = {
    id: string;
    name: string;
    brand?: string;
    model?: string;
    category?: 'Machine' | 'Free Weight' | 'Cable' | 'Calisthenics' | 'Other';
    primaryMuscles?: Muscles[];
    secondaryMuscles?: Muscles[];
    resistanceType?: string; // e.g., "weight stack", "plates", "bodyweight", etc.
    loadUnits?: string; // e.g., "lbs", "kg", "N/A" for bodyweight exercises, etc.
    startingResistance?: number; // e.g., 0 for bodyweight exercises, or the weight of the equipment itself for machines, etc.
    supportsUnilateral?: boolean; // indicates if the equipment can be used for unilateral exercises (e.g., dumbbells, cable machines, etc.)
    isAssisted?: boolean; // indicates if the equipment provides assistance (e.g., assisted pull-up machine, etc.)
    createdAt: string;
    updatedAt: string;
};