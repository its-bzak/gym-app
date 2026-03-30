//import { User } from "../types/user";
//import { Gym } from "../types/gym";
//import { UserGymMembership } from "../types/userGymMembership";
//import { Equipment } from "../types/equipment";
//import { GymEquipment } from "../types/gymEquipment";
//import { Exercise } from "../types/exercise";
//import { ExerciseEquipmentRequirement } from "../types/exerciseEquipmentRequirement";

export type User = {
  id: string
  name: string
  email?: string
  createdAt: string
  updatedAt: string
}

export type Gym = {
  id: string
  name: string
  code: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type UserGymMembership = {
  id: string
  userId: string
  gymId: string
  joinedAt: string
  isActive: boolean
  role: 'member' | 'admin' | 'owner'
  createdAt: string
  updatedAt: string
}

export type EquipmentCategory =
  | 'machine'
  | 'free_weight'
  | 'cable'
  | 'bodyweight'
  | 'calisthenics'
  | 'other'

export type Equipment = {
  id: string
  name: string
  brand?: string
  category: EquipmentCategory
  createdAt: string
  updatedAt: string
}

export type GymEquipment = {
  id: string
  gymId: string
  equipmentId: string
  quantity: number
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

export type Exercise = {
  id: string
  name: string
  primaryMuscles: string[]
  secondaryMuscles: string[]
  muscleGroup: string
  createdAt: string
  updatedAt: string
}

export type ExerciseEquipmentRequirement = {
  id: string
  exerciseId: string
  equipmentId: string
  isRequired: boolean
  createdAt: string
  updatedAt: string
}

const now = new Date().toISOString();

export const users: User[] = [
  {
    id: 'user_ryan',
    name: 'Ryan',
    email: 'ryan@example.com',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'user_alex',
    name: 'Alex',
    email: 'alex@example.com',
    createdAt: now,
    updatedAt: now,
  },
]

export const gyms: Gym[] = [
  {
    id: 'gym_south_shore_iron',
    name: 'South Shore Iron',
    code: 'SSH123',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gym_maximus',
    name: 'Maximus',
    code: 'MAX999',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gym_college_rec',
    name: 'College Rec Center',
    code: 'CRC456',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'gym_home_setup',
    name: 'Ryan Home Gym',
    code: 'HOME01',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
]

export const userGymMemberships: UserGymMembership[] = [
  {
    id: 'ugm_1',
    userId: 'user_ryan',
    gymId: 'gym_south_shore_iron',
    joinedAt: now,
    isActive: true,
    role: 'member',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ugm_2',
    userId: 'user_ryan',
    gymId: 'gym_maximus',
    joinedAt: now,
    isActive: true,
    role: 'member',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ugm_3',
    userId: 'user_ryan',
    gymId: 'gym_college_rec',
    joinedAt: now,
    isActive: true,
    role: 'member',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ugm_4',
    userId: 'user_alex',
    gymId: 'gym_maximus',
    joinedAt: now,
    isActive: true,
    role: 'member',
    createdAt: now,
    updatedAt: now,
  },
]

export const equipment: Equipment[] = [
  {
    id: 'eq_pec_deck',
    name: 'Pec Deck',
    brand: 'Life Fitness',
    category: 'machine',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eq_barbell',
    name: 'Barbell',
    category: 'free_weight',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eq_bench',
    name: 'Bench',
    category: 'other',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eq_dumbbells',
    name: 'Dumbbells',
    category: 'free_weight',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eq_cable_stack',
    name: 'Cable Stack',
    brand: 'Cybex',
    category: 'cable',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eq_lat_pulldown',
    name: 'Lat Pulldown Machine',
    category: 'machine',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eq_leg_press',
    name: 'Leg Press',
    category: 'machine',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eq_squat_rack',
    name: 'Squat Rack',
    category: 'other',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eq_pullup_bar',
    name: 'Pull-Up Bar',
    category: 'calisthenics',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eq_treadmill',
    name: 'Treadmill',
    brand: 'Precor',
    category: 'other',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eq_leg_extension',
    name: 'Leg Extension Machine',
    category: 'machine',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eq_hack_squat',
    name: 'Hack Squat',
    category: 'machine',
    createdAt: now,
    updatedAt: now,
  },
]

export const gymEquipment: GymEquipment[] = [
  // South Shore Iron
  {
    id: 'ge_1',
    gymId: 'gym_south_shore_iron',
    equipmentId: 'eq_pec_deck',
    quantity: 1,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_2',
    gymId: 'gym_south_shore_iron',
    equipmentId: 'eq_barbell',
    quantity: 6,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_3',
    gymId: 'gym_south_shore_iron',
    equipmentId: 'eq_bench',
    quantity: 5,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_4',
    gymId: 'gym_south_shore_iron',
    equipmentId: 'eq_dumbbells',
    quantity: 1,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_5',
    gymId: 'gym_south_shore_iron',
    equipmentId: 'eq_cable_stack',
    quantity: 2,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_6',
    gymId: 'gym_south_shore_iron',
    equipmentId: 'eq_lat_pulldown',
    quantity: 1,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_7',
    gymId: 'gym_south_shore_iron',
    equipmentId: 'eq_leg_press',
    quantity: 2,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_8',
    gymId: 'gym_south_shore_iron',
    equipmentId: 'eq_squat_rack',
    quantity: 3,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_9',
    gymId: 'gym_south_shore_iron',
    equipmentId: 'eq_pullup_bar',
    quantity: 1,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },

  // Maximus
  {
    id: 'ge_10',
    gymId: 'gym_maximus',
    equipmentId: 'eq_barbell',
    quantity: 4,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_11',
    gymId: 'gym_maximus',
    equipmentId: 'eq_bench',
    quantity: 4,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_12',
    gymId: 'gym_maximus',
    equipmentId: 'eq_dumbbells',
    quantity: 1,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_13',
    gymId: 'gym_maximus',
    equipmentId: 'eq_hack_squat',
    quantity: 1,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_14',
    gymId: 'gym_maximus',
    equipmentId: 'eq_cable_stack',
    quantity: 1,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_15',
    gymId: 'gym_maximus',
    equipmentId: 'eq_treadmill',
    quantity: 6,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },

  // College Rec Center
  {
    id: 'ge_16',
    gymId: 'gym_college_rec',
    equipmentId: 'eq_dumbbells',
    quantity: 1,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_17',
    gymId: 'gym_college_rec',
    equipmentId: 'eq_bench',
    quantity: 3,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_18',
    gymId: 'gym_college_rec',
    equipmentId: 'eq_barbell',
    quantity: 2,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_19',
    gymId: 'gym_college_rec',
    equipmentId: 'eq_pullup_bar',
    quantity: 1,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_20',
    gymId: 'gym_college_rec',
    equipmentId: 'eq_lat_pulldown',
    quantity: 1,
    isAvailable: false,
    createdAt: now,
    updatedAt: now,
  },

  // Ryan Home Gym
  {
    id: 'ge_21',
    gymId: 'gym_home_setup',
    equipmentId: 'eq_dumbbells',
    quantity: 1,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ge_22',
    gymId: 'gym_home_setup',
    equipmentId: 'eq_bench',
    quantity: 1,
    isAvailable: true,
    createdAt: now,
    updatedAt: now,
  },
]

export const exercises: Exercise[] = [
  {
    id: 'ex_machine_chest_fly',
    name: 'Machine Chest Fly',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['front_delts'],
    muscleGroup: 'chest',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ex_barbell_bench_press',
    name: 'Barbell Bench Press',
    primaryMuscles: ['chest'],
    secondaryMuscles: ['triceps', 'front_delts'],
    muscleGroup: 'chest',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ex_dumbbell_curl',
    name: 'Dumbbell Curl',
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['forearms'],
    muscleGroup: 'arms',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ex_cable_tricep_pushdown',
    name: 'Cable Tricep Pushdown',
    primaryMuscles: ['triceps'],
    secondaryMuscles: [],
    muscleGroup: 'arms',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ex_lat_pulldown',
    name: 'Lat Pulldown',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'upper_back'],
    muscleGroup: 'back',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ex_leg_press',
    name: 'Leg Press',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'hamstrings'],
    muscleGroup: 'legs',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ex_pull_up',
    name: 'Pull-Up',
    primaryMuscles: ['lats'],
    secondaryMuscles: ['biceps', 'upper_back'],
    muscleGroup: 'back',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ex_back_squat',
    name: 'Back Squat',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes', 'hamstrings', 'core'],
    muscleGroup: 'legs',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ex_hack_squat',
    name: 'Hack Squat',
    primaryMuscles: ['quads'],
    secondaryMuscles: ['glutes'],
    muscleGroup: 'legs',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'ex_leg_extension',
    name: 'Leg Extension',
    primaryMuscles: ['quads'],
    secondaryMuscles: [],
    muscleGroup: 'legs',
    createdAt: now,
    updatedAt: now,
  },
]

export const exerciseEquipmentRequirements: ExerciseEquipmentRequirement[] = [
  {
    id: 'eer_1',
    exerciseId: 'ex_machine_chest_fly',
    equipmentId: 'eq_pec_deck',
    isRequired: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eer_2',
    exerciseId: 'ex_barbell_bench_press',
    equipmentId: 'eq_barbell',
    isRequired: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eer_3',
    exerciseId: 'ex_barbell_bench_press',
    equipmentId: 'eq_bench',
    isRequired: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eer_4',
    exerciseId: 'ex_dumbbell_curl',
    equipmentId: 'eq_dumbbells',
    isRequired: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eer_5',
    exerciseId: 'ex_cable_tricep_pushdown',
    equipmentId: 'eq_cable_stack',
    isRequired: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eer_6',
    exerciseId: 'ex_lat_pulldown',
    equipmentId: 'eq_lat_pulldown',
    isRequired: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eer_7',
    exerciseId: 'ex_leg_press',
    equipmentId: 'eq_leg_press',
    isRequired: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eer_8',
    exerciseId: 'ex_pull_up',
    equipmentId: 'eq_pullup_bar',
    isRequired: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eer_9',
    exerciseId: 'ex_back_squat',
    equipmentId: 'eq_barbell',
    isRequired: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eer_10',
    exerciseId: 'ex_back_squat',
    equipmentId: 'eq_squat_rack',
    isRequired: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eer_11',
    exerciseId: 'ex_hack_squat',
    equipmentId: 'eq_hack_squat',
    isRequired: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'eer_12',
    exerciseId: 'ex_leg_extension',
    equipmentId: 'eq_leg_extension',
    isRequired: true,
    createdAt: now,
    updatedAt: now,
  },
]

export const mockData = {
  users,
  gyms,
  userGymMemberships,
  equipment,
  gymEquipment,
  exercises,
  exerciseEquipmentRequirements,
}