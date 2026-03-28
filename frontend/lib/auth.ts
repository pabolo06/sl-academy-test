/**
 * SL Academy Platform - Authentication Utilities
 * Client and server-side authentication helpers
 */

import { UserProfile } from '@/types';
import { API_URL } from './config';
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Get current user session (client-side)
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Buscar perfil estendido (hospital_id, role)
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, hospitals(name)')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email || '',
        role: profile?.role || 'doctor',
        hospital_id: profile?.hospital_id,
        hospital_name: profile?.hospitals?.name,
        is_focal_point: profile?.is_focal_point,
        created_at: profile?.created_at,
        updated_at: profile?.updated_at
      } as UserProfile;
    }

    return null;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching current user:', error);
    }
    return null;
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
      return;
    }
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error logging out:', error);
    }
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Check if user has specific role
 */
export function hasRole(user: UserProfile | null, role: string): boolean {
  return user?.role === role;
}

/**
 * Check if user is manager
 */
export function isManager(user: UserProfile | null): boolean {
  return hasRole(user, 'manager');
}

/**
 * Check if user is doctor
 */
export function isDoctor(user: UserProfile | null): boolean {
  return hasRole(user, 'doctor');
}
