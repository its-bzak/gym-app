import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  name: string | null;
  username: string | null;
  date_of_birth: string | null;
};

type UserPreferencesRow = {
  user_id: string;
  unit_preference: string | null;
};

export type DisplayUnitPreference = "imperial" | "metric";

export type UserProfile = {
  id: string;
  name: string;
  username: string;
  dateOfBirth: string | null;
};

export type UpdateUserProfileInput = {
  name: string;
  username: string;
  dateOfBirth: string | null;
};

export type UpdateUserProfileResult = {
  success: boolean;
  error?: string;
  profile?: UserProfile;
};

export type UserPreferences = {
  userId: string;
  unitPreference: DisplayUnitPreference;
};

function mapProfileRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name ?? "",
    username: row.username ?? "",
    dateOfBirth: row.date_of_birth,
  };
}

function mapUserPreferencesRow(row: UserPreferencesRow): UserPreferences {
  return {
    userId: row.user_id,
    unitPreference: normalizeUnitPreference(row.unit_preference),
  };
}

function normalizeUnitPreference(value: string | null | undefined): DisplayUnitPreference {
  return value === "metric" ? "metric" : "imperial";
}

function buildUnexpectedErrorMessage(prefix: string, error: unknown) {
  if (error instanceof Error) {
    return `${prefix} ${error.message}`;
  }

  return prefix;
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return data.user?.id ?? null;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, username, date_of_birth")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapProfileRow(data) : null;
}

export async function getUserProfileById(userId: string): Promise<UserProfile | null> {
  return getUserProfile(userId);
}

export async function getUsernameById(userId: string): Promise<string | null> {
  const profile = await getUserProfile(userId);

  return profile?.username ?? null;
}

export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput
): Promise<UpdateUserProfileResult> {
  const name = input.name.trim();
  const username = input.username.trim();

  if (!name) {
    return {
      success: false,
      error: "Name is required.",
    };
  }

  if (!username) {
    return {
      success: false,
      error: "Username is required.",
    };
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          name,
          username,
          date_of_birth: input.dateOfBirth,
        },
        {
          onConflict: "id",
        }
      )
      .select("id, name, username, date_of_birth")
      .single<ProfileRow>();

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          error: "That username is already in use.",
        };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      profile: mapProfileRow(data),
    };
  } catch (error) {
    return {
      success: false,
      error: buildUnexpectedErrorMessage("Could not update profile.", error),
    };
  }
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("user_id, unit_preference")
    .eq("user_id", userId)
    .maybeSingle<UserPreferencesRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapUserPreferencesRow(data) : null;
}

export async function getDisplayUnitPreference(
  userId: string
): Promise<DisplayUnitPreference> {
  const preferences = await getUserPreferences(userId);

  return preferences?.unitPreference ?? "imperial";
}

export async function upsertUserPreferences(
  userId: string,
  input: { unitPreference: DisplayUnitPreference }
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        unit_preference: input.unitPreference,
      },
      {
        onConflict: "user_id",
      }
    )
    .select("user_id, unit_preference")
    .single<UserPreferencesRow>();

  if (error) {
    throw new Error(error.message);
  }

  return mapUserPreferencesRow(data);
}

export async function setDisplayUnitPreference(
  userId: string,
  unit: DisplayUnitPreference
): Promise<DisplayUnitPreference> {
  const preferences = await upsertUserPreferences(userId, {
    unitPreference: unit,
  });

  return preferences.unitPreference;
}