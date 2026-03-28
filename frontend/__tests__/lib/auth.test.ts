// Mock supabase before importing auth to avoid network calls in tests
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
  isSupabaseConfigured: jest.fn(() => false),
}));

import { hasRole, isManager, isDoctor } from '@/lib/auth';
import type { UserProfile } from '@/types';

const mockDoctor: UserProfile = {
  id: 'user-123',
  email: 'medico@hospital.com',
  role: 'doctor',
  hospital_id: 'hospital-456',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const mockManager: UserProfile = {
  ...mockDoctor,
  role: 'manager',
  email: 'gestor@hospital.com',
};

describe('hasRole', () => {
  it('returns true when user has the specified role', () => {
    expect(hasRole(mockDoctor, 'doctor')).toBe(true);
  });

  it('returns false when user does not have the specified role', () => {
    expect(hasRole(mockDoctor, 'manager')).toBe(false);
  });

  it('returns false when user is null', () => {
    expect(hasRole(null, 'doctor')).toBe(false);
  });

  it('returns false when user is null and role is manager', () => {
    expect(hasRole(null, 'manager')).toBe(false);
  });
});

describe('isManager', () => {
  it('returns true for a manager user', () => {
    expect(isManager(mockManager)).toBe(true);
  });

  it('returns false for a doctor user', () => {
    expect(isManager(mockDoctor)).toBe(false);
  });

  it('returns false when user is null', () => {
    expect(isManager(null)).toBe(false);
  });
});

describe('isDoctor', () => {
  it('returns true for a doctor user', () => {
    expect(isDoctor(mockDoctor)).toBe(true);
  });

  it('returns false for a manager user', () => {
    expect(isDoctor(mockManager)).toBe(false);
  });

  it('returns false when user is null', () => {
    expect(isDoctor(null)).toBe(false);
  });
});
