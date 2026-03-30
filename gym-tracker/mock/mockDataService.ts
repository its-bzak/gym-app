import { Equipment } from "../types/equipment";
import { Exercise } from "../types/exercise";
import { Gym } from "../types/gym";
import { UserGymMembership } from "../types/userGymMembership";
import {
  equipment,
  exerciseEquipmentRequirements,
  exercises,
  gymEquipment,
  gyms,
  userGymMemberships,
  users,
} from "./gymImplementation";

export type JoinGymResult = {
  success: boolean;
  error?: string;
  membership?: UserGymMembership;
};

function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

function isActiveMembership(membership: UserGymMembership): boolean {
  return membership.isActive;
}

function isActiveGym(gym: Gym): boolean {
  return gym.isActive;
}

function getActiveMembershipsForUser(userId: string): UserGymMembership[] {
  return userGymMemberships.filter(
    (membership) => membership.userId === userId && isActiveMembership(membership)
  );
}

function getUniqueValues<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function buildMembershipId(): string {
  const highestId = userGymMemberships.reduce((currentMax, membership) => {
    const match = membership.id.match(/^(?:ugm_)(\d+)$/);

    if (!match) {
      return currentMax;
    }

    return Math.max(currentMax, Number(match[1]));
  }, 0);

  return `ugm_${highestId + 1}`;
}

function getAvailableGymEquipmentEntries(gymId: string) {
  return gymEquipment.filter(
    (entry) => entry.gymId === gymId && entry.isAvailable === true
  );
}

function getRequiredEquipmentIdsForExercise(exerciseId: string): string[] {
  return exerciseEquipmentRequirements
    .filter((requirement) => requirement.exerciseId === exerciseId && requirement.isRequired)
    .map((requirement) => requirement.equipmentId);
}

function hasActiveMembershipForGym(userId: string, gymId: string): boolean {
  return getActiveMembershipsForUser(userId).some((membership) => membership.gymId === gymId);
}

export function getGymsForUser(userId: string): Gym[] {
  const activeGymIds = getActiveMembershipsForUser(userId).map((membership) => membership.gymId);

  return gyms.filter((gym) => isActiveGym(gym) && activeGymIds.includes(gym.id));
}

export function getGymByCode(code: string): Gym | undefined {
  const normalizedCode = normalizeCode(code);

  return gyms.find((gym) => normalizeCode(gym.code) === normalizedCode);
}

export function joinGymByCode(userId: string, code: string): JoinGymResult {
  const userExists = users.some((user) => user.id === userId);

  if (!userExists) {
    return {
      success: false,
      error: "User not found.",
    };
  }

  const gym = getGymByCode(code);

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

  if (hasActiveMembershipForGym(userId, gym.id)) {
    return {
      success: false,
      error: "User is already an active member of that gym.",
    };
  }

  const timestamp = new Date().toISOString();
  const membership: UserGymMembership = {
    id: buildMembershipId(),
    userId,
    gymId: gym.id,
    joinedAt: timestamp,
    role: "member",
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  userGymMemberships.push(membership);

  return {
    success: true,
    membership,
  };
}

export function getEquipmentForGym(gymId: string): Equipment[] {
  const availableEquipmentIds = getAvailableEquipmentIdsForGym(gymId);

  return equipment.filter((item) => availableEquipmentIds.includes(item.id));
}

export function getAvailableEquipmentIdsForGym(gymId: string): string[] {
  return getUniqueValues(
    getAvailableGymEquipmentEntries(gymId).map((entry) => entry.equipmentId)
  );
}

export function isExerciseAvailableAtGym(exerciseId: string, gymId: string): boolean {
  const requiredEquipmentIds = getRequiredEquipmentIdsForExercise(exerciseId);

  if (requiredEquipmentIds.length === 0) {
    return false;
  }

  const availableEquipmentIds = new Set(getAvailableEquipmentIdsForGym(gymId));

  return requiredEquipmentIds.every((equipmentId) => availableEquipmentIds.has(equipmentId));
}

export function getExercisesForGym(gymId: string): Exercise[] {
  return exercises.filter((exercise) => isExerciseAvailableAtGym(exercise.id, gymId));
}

export function getUserJoinDateForGym(userId: string, gymId: string): string | null {
  const membership = getActiveMembershipsForUser(userId).find((membership) => membership.gymId === gymId);

    return membership ? membership.joinedAt : null;
}

export function getUserGymOptions(
  userId: string
): Array<{ gymId: string; gymName: string }> {
  return getGymsForUser(userId).map((gym) => ({
    gymId: gym.id,
    gymName: gym.name,
  }));
}

// Usage example:
export function getMockDataServiceExamples() {
  return {
    ryansGyms: getGymsForUser("user_ryan"),
    joinGymByCodeExample: joinGymByCode("user_alex", " ssh123 "),
    southShoreIronExercises: getExercisesForGym("gym_south_shore_iron"),
  };
}