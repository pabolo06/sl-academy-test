/**
 * SL Academy Platform - useAuth Hook
 * React hook for authentication state management
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/types';
import { getCurrentUser, logout as logoutUser } from '@/lib/auth';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      setError('Failed to load user');
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      router.push('/login');
    } catch (err) {
      setError('Failed to logout');
      console.error('Error logging out:', err);
    }
  };

  const isManager = user?.role === 'manager';
  const isDoctor = user?.role === 'doctor';

  return {
    user,
    loading,
    error,
    logout,
    isManager,
    isDoctor,
    isAuthenticated: user !== null,
    refresh: loadUser,
  };
}
