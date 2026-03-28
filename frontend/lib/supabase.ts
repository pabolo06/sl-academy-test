import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Limpa automaticamente sessões com token inválido/expirado,
// evitando loops de requisições 400 no console.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'TOKEN_REFRESHED') return;
  if (event === 'SIGNED_OUT') {
    // Garante que não haja dados de sessão residuais
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
      keys.forEach(k => localStorage.removeItem(k));
    }
  }
});

/**
 * Helper to check if Supabase is properly configured
 */
export const isSupabaseConfigured = () =>
  supabaseUrl !== '' && supabaseAnonKey !== '';
