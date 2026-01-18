import { createClient } from "./client";
import { toast } from "sonner";

/**
 * OAuth provider types supported by Supabase
 */
export type OAuthProvider = "google" | "github";

/**
 * Options for OAuth sign-in
 */
export interface OAuthOptions {
  redirectTo?: string;
  scopes?: string;
}

/**
 * Sign in with OAuth provider
 * @param provider - The OAuth provider to use (google, github)
 * @param options - Optional redirect URL and scopes
 */
export async function signInWithOAuth(
  provider: OAuthProvider,
  options?: OAuthOptions
) {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: options?.redirectTo || `${window.location.origin}/auth/callback`,
      scopes: options?.scopes,
    },
  });

  if (error) {
    toast.error(error.message);
    throw error;
  }
}

/**
 * Sign in with email and password
 * @param email - User email
 * @param password - User password
 */
export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    toast.error(error.message);
    throw error;
  }

  return data;
}

/**
 * Sign up with email and password
 * @param email - User email
 * @param password - User password
 * @param metadata - Optional user metadata (e.g., name)
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  metadata?: Record<string, any>
) {
  const supabase = createClient();

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    toast.error(error.message);
    throw error;
  }

  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    toast.error(error.message);
    throw error;
  }
}

/**
 * Request a password reset email
 * @param email - User email
 */
export async function resetPassword(email: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/update-password`,
  });

  if (error) {
    toast.error(error.message);
    throw error;
  }
}

/**
 * Update user password
 * @param newPassword - New password
 */
export async function updatePassword(newPassword: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    toast.error(error.message);
    throw error;
  }
}

/**
 * Get the current user session
 */
export async function getSession() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

/**
 * Get the current user
 */
export async function getUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}
