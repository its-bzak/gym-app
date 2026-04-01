import { supabase } from "@/lib/supabase";
import type { Equipment } from "@/types/equipment";
import type { Exercise } from "@/types/exercise";
import type { Gym } from "@/types/gym";

export type GymMembershipRecord = {
  id: string;
  userId: string;
  gymId: string;
  joinedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type JoinGymResult = {
  success: boolean;
  error?: string;
  shouldFallback?: boolean;
  gym?: Gym;
  membership?: GymMembershipRecord;
};

type GymRow = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type UserGymMembershipRow = {
  id: string;
  user_id: string;
  gym_id: string;
  joined_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type EquipmentRow = {
  id: string;
  name: string;
  brand: string | null;
  category: Equipment["category"] | null;
  created_at: string;
  updated_at: string;
};

type GymEquipmentRow = {
  id: string;
  gym_id: string;
  equipment_id: string;
  quantity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

type ExerciseRow = {
  id: string;
  name: string;
  primary_muscles: string[] | null;
  secondary_muscles: string[] | null;
  muscle_group: string;
  category: string | null;
  created_at: string;
  updated_at: string;
};

type ExerciseEquipmentRequirementRow = {
  id: string;
  exercise_id: string;
  equipment_id: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
};

export type GymOption = {
  gymId: string;
  gymName: string;
};

function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

function mapGymRow(row: GymRow): Gym {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEquipmentRow(row: EquipmentRow): Equipment {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    category: row.category ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExerciseRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    primaryMuscles: row.primary_muscles ?? undefined,
    secondaryMuscles: row.secondary_muscles ?? undefined,
    muscleGroup: row.muscle_group,
    category: row.category ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUserGymMembershipRow(row: UserGymMembershipRow): GymMembershipRecord {
  return {
    id: row.id,
    userId: row.user_id,
    gymId: row.gym_id,
    joinedAt: row.joined_at,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildUnexpectedErrorMessage(prefix: string, error: unknown): string {
  if (error instanceof Error && error.message) {
    return `${prefix} ${error.message}`;
  }

  return prefix;
}

function orderByIdList<T extends { id: string }>(items: T[], orderedIds: string[]): T[] {
  const orderLookup = new Map(orderedIds.map((id, index) => [id, index]));

  return [...items].sort((left, right) => {
    const leftIndex = orderLookup.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderLookup.get(right.id) ?? Number.MAX_SAFE_INTEGER;

    return leftIndex - rightIndex;
  });
}

async function getActiveMembershipsForUser(userId: string): Promise<UserGymMembershipRow[]> {
  const { data, error } = await supabase
    .from("user_gym_memberships")
    .select("id, user_id, gym_id, joined_at, is_active, created_at, updated_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .returns<UserGymMembershipRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getRequiredEquipmentRows(): Promise<ExerciseEquipmentRequirementRow[]> {
  const { data, error } = await supabase
    .from("exercise_equipment_requirements")
    .select("id, exercise_id, equipment_id, is_required, created_at, updated_at")
    .eq("is_required", true)
    .returns<ExerciseEquipmentRequirementRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getGymsForUser(userId: string): Promise<Gym[]> {
  const memberships = await getActiveMembershipsForUser(userId);
  const gymIds = memberships.map((membership) => membership.gym_id);

  if (gymIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("gyms")
    .select("id, name, code, is_active, created_at, updated_at")
    .in("id", gymIds)
    .eq("is_active", true)
    .returns<GymRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return orderByIdList(data.map(mapGymRow), gymIds);
}

export async function getGymByCode(code: string): Promise<Gym | undefined> {
  const normalizedCode = normalizeCode(code);

  const { data, error } = await supabase
    .from("gyms")
    .select("id, name, code, is_active, created_at, updated_at")
    .ilike("code", normalizedCode)
    .maybeSingle<GymRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapGymRow(data) : undefined;
}

export async function joinGymByCode(userId: string, code: string): Promise<JoinGymResult> {
  const normalizedCode = normalizeCode(code);

  if (!normalizedCode) {
    return {
      success: false,
      error: "Join code is required.",
    };
  }

  try {
    const gym = await getGymByCode(normalizedCode);

    if (!gym) {
      return {
        success: false,
        error: "No gym matches that join code.",
      };
    }

    if (!gym.isActive) {
      return {
        success: false,
        error: "That gym is not currently accepting members.",
      };
    }

    const existingMemberships = await getActiveMembershipsForUser(userId);
    const existingMembership = existingMemberships.find(
      (membership) => membership.gym_id === gym.id
    );

    if (existingMembership) {
      return {
        success: false,
        error: "User is already an active member of that gym.",
        membership: mapUserGymMembershipRow(existingMembership),
        gym,
      };
    }

    const joinedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("user_gym_memberships")
      .insert({
        user_id: userId,
        gym_id: gym.id,
        joined_at: joinedAt,
        is_active: true,
      })
      .select("id, user_id, gym_id, joined_at, is_active, created_at, updated_at")
      .single<UserGymMembershipRow>();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "User is already an active member of that gym.",
        };
      }

      return {
        success: false,
        error: error.message,
        shouldFallback: true,
      };
    }

    return {
      success: true,
      gym,
      membership: mapUserGymMembershipRow(data),
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not join gym.", error),
      shouldFallback: true,
    };
  }
}

export async function getAvailableEquipmentIdsForGym(gymId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("gym_equipment")
    .select("id, gym_id, equipment_id, quantity, is_available, created_at, updated_at")
    .eq("gym_id", gymId)
    .eq("is_available", true)
    .returns<GymEquipmentRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return Array.from(new Set(data.map((entry) => entry.equipment_id)));
}

export async function getEquipmentForGym(gymId: string): Promise<Equipment[]> {
  const equipmentIds = await getAvailableEquipmentIdsForGym(gymId);

  if (equipmentIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("equipment")
    .select("id, name, brand, category, created_at, updated_at")
    .in("id", equipmentIds)
    .returns<EquipmentRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return orderByIdList(data.map(mapEquipmentRow), equipmentIds);
}

export async function isExerciseAvailableAtGym(exerciseId: string, gymId: string): Promise<boolean> {
  const [availableEquipmentIds, requirementRows] = await Promise.all([
    getAvailableEquipmentIdsForGym(gymId),
    getRequiredEquipmentRows(),
  ]);

  const requiredEquipmentIds = requirementRows
    .filter((requirement) => requirement.exercise_id === exerciseId)
    .map((requirement) => requirement.equipment_id);

  if (requiredEquipmentIds.length === 0) {
    return false;
  }

  const availableEquipmentSet = new Set(availableEquipmentIds);

  return requiredEquipmentIds.every((equipmentId) => availableEquipmentSet.has(equipmentId));
}

export async function getExercisesForGym(gymId: string): Promise<Exercise[]> {
  const [availableEquipmentIds, requirementRows] = await Promise.all([
    getAvailableEquipmentIdsForGym(gymId),
    getRequiredEquipmentRows(),
  ]);

  const availableEquipmentSet = new Set(availableEquipmentIds);
  const requirementMap = new Map<string, string[]>();

  requirementRows.forEach((requirement) => {
    const existingRequirements = requirementMap.get(requirement.exercise_id) ?? [];

    existingRequirements.push(requirement.equipment_id);
    requirementMap.set(requirement.exercise_id, existingRequirements);
  });

  const availableExerciseIds = Array.from(requirementMap.entries())
    .filter(([, requiredEquipmentIds]) => {
      return (
        requiredEquipmentIds.length > 0 &&
        requiredEquipmentIds.every((equipmentId) => availableEquipmentSet.has(equipmentId))
      );
    })
    .map(([exerciseId]) => exerciseId);

  if (availableExerciseIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("exercises")
    .select(
      "id, name, primary_muscles, secondary_muscles, muscle_group, category, created_at, updated_at"
    )
    .in("id", availableExerciseIds)
    .returns<ExerciseRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return orderByIdList(data.map(mapExerciseRow), availableExerciseIds);
}

export async function getUserJoinDateForGym(
  userId: string,
  gymId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_gym_memberships")
    .select("id, user_id, gym_id, joined_at, is_active, created_at, updated_at")
    .eq("user_id", userId)
    .eq("gym_id", gymId)
    .eq("is_active", true)
    .maybeSingle<UserGymMembershipRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data?.joined_at ?? null;
}

export async function getUserGymOptions(userId: string): Promise<GymOption[]> {
  const gyms = await getGymsForUser(userId);

  return gyms.map((gym) => ({
    gymId: gym.id,
    gymName: gym.name,
  }));
}