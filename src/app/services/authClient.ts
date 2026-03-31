import { isRestApi } from '../config/restApi';
import * as backendApi from './backendApi';
import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/authStore';

type SignUpResult = { success: boolean; needsVerification?: boolean; message?: string };
type SignInResult = { success: boolean; message?: string };

export async function signUp(email: string, password: string, username?: string): Promise<SignUpResult> {
  if (isRestApi()) {
    try {
      const { token, user } = await backendApi.authRegister({ email, password, username: username || '' });
      useAuthStore.getState().setAuth(token, user.id);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || String(err) };
    }
  }

  // Supabase flow
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { success: false, message: error.message };
    }

    // Try to sign in immediately — if verification is required this may fail
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      // Most likely requires email confirmation
      return { success: true, needsVerification: true, message: signInError.message };
    }

    if (!signInData?.user) return { success: false, message: 'No user returned from Supabase' };
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e?.message || String(e) };
  }
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  if (isRestApi()) {
    try {
      const { token, user } = await backendApi.authLogin({ email, password });
      useAuthStore.getState().setAuth(token, user.id);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || String(err) };
    }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };
    if (!data?.user) return { success: false, message: 'No user returned from Supabase' };
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e?.message || String(e) };
  }
}

export async function signOut(): Promise<void> {
  try {
    useAuthStore.getState().logout();
    if (!isRestApi()) await supabase.auth.signOut();
  } catch (e) {
    // swallow
  }
}

export function currentRestToken(): string | null {
  return useAuthStore.getState().token;
}

export default {
  signUp,
  signIn,
  signOut,
  currentRestToken,
};
