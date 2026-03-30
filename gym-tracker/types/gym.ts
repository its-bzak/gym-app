import { Equipment } from "./equipment";
export type Gym = {
    id: string;
    name: string;
    code: string; // unique handle for users to join the gym on the app (ex: "@SouthShoreIronLI")
    isActive: boolean;
    ownerId?: string;
    //equipment: Equipment[];
    createdAt: string;
    updatedAt: string;
};