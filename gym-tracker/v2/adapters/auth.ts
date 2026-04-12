import { supabase } from "@/lib/supabase";

export type V2SessionState = {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
};

export type V2SignInInput = {
  email: string;
  password: string;
};

export type V2SignUpInput = {
  name: string;
  username: string;
  email: string;
  password: string;
};

export type V2AuthResult = {
  success: boolean;
  error?: string;
  requiresEmailConfirmation?: boolean;
};

export async function getV2SessionState(): Promise<V2SessionState> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return {
    isAuthenticated: Boolean(data.session),
    userId: data.session?.user.id ?? null,
    email: data.session?.user.email ?? null,
  };
}

export async function signInToV2(input: V2SignInInput): Promise<V2AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email.trim().toLowerCase(),
    password: input.password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}

export async function signUpToV2(input: V2SignUpInput): Promise<V2AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        name: input.name.trim(),
        username: input.username.trim(),
      },
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    requiresEmailConfirmation: !data.session,
  };
}

export async function signOutFromV2() {
  await supabase.auth.signOut();
}