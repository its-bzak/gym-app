import {
  getAvailableEquipmentIdsForGym,
  getEquipmentForGym,
  getExercisesForGym,
  getGymByCode,
  getGymsForUser,
  getUserGymOptions,
  isExerciseAvailableAtGym,
  joinGymByCode,
} from "./mockDataService";
import { userGymMemberships } from "./gymImplementation";

const initialMemberships = userGymMemberships.map((membership) => ({ ...membership }));

function resetMemberships() {
  userGymMemberships.splice(0, userGymMemberships.length, ...initialMemberships.map((membership) => ({ ...membership })));
}

beforeEach(() => {
  resetMemberships();
});

describe("mockDataService", () => {
  test("getGymsForUser returns only gyms with active memberships", () => {
    const gyms = getGymsForUser("user_ryan");

    expect(gyms.map((gym) => gym.id)).toEqual([
      "gym_south_shore_iron",
      "gym_maximus",
      "gym_college_rec",
    ]);
  });

  test("getGymByCode normalizes whitespace and casing", () => {
    const gym = getGymByCode("  ssh123  ");

    expect(gym?.id).toBe("gym_south_shore_iron");
  });

  test("joinGymByCode creates a new active membership when the user is not already a member", () => {
    const result = joinGymByCode("user_alex", "crc456");

    expect(result.success).toBe(true);
    expect(result.membership).toMatchObject({
      userId: "user_alex",
      gymId: "gym_college_rec",
      role: "member",
      isActive: true,
    });
    expect(userGymMemberships).toHaveLength(initialMemberships.length + 1);
  });

  test("joinGymByCode returns an error when the code does not exist", () => {
    const result = joinGymByCode("user_alex", "bad-code");

    expect(result).toEqual({
      success: false,
      error: "No gym matches that join code.",
    });
  });

  test("joinGymByCode returns an error when the user is already an active member", () => {
    const result = joinGymByCode("user_ryan", "max999");

    expect(result).toEqual({
      success: false,
      error: "User is already an active member of that gym.",
    });
  });

  test("getEquipmentForGym returns only available equipment at that gym", () => {
    const equipment = getEquipmentForGym("gym_college_rec");

    expect(equipment.map((item) => item.id)).toHaveLength(4);
    expect(equipment.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "eq_dumbbells",
        "eq_bench",
        "eq_barbell",
        "eq_pullup_bar",
      ])
    );
  });

  test("getAvailableEquipmentIdsForGym returns unique available equipment ids", () => {
    const equipmentIds = getAvailableEquipmentIdsForGym("gym_south_shore_iron");

    expect(equipmentIds).toEqual([
      "eq_pec_deck",
      "eq_barbell",
      "eq_bench",
      "eq_dumbbells",
      "eq_cable_stack",
      "eq_lat_pulldown",
      "eq_leg_press",
      "eq_squat_rack",
      "eq_pullup_bar",
    ]);
  });

  test("isExerciseAvailableAtGym requires all required equipment to be available", () => {
    expect(isExerciseAvailableAtGym("ex_barbell_bench_press", "gym_south_shore_iron")).toBe(true);
    expect(isExerciseAvailableAtGym("ex_lat_pulldown", "gym_college_rec")).toBe(false);
  });

  test("getExercisesForGym returns only exercises supported by available equipment", () => {
    const exercises = getExercisesForGym("gym_home_setup");

    expect(exercises.map((exercise) => exercise.id)).toEqual(["ex_dumbbell_curl"]);
  });

  test("getUserGymOptions returns gym ids and names for the user", () => {
    expect(getUserGymOptions("user_ryan")).toEqual([
      { gymId: "gym_south_shore_iron", gymName: "South Shore Iron" },
      { gymId: "gym_maximus", gymName: "Maximus" },
      { gymId: "gym_college_rec", gymName: "College Rec Center" },
    ]);
  });
});