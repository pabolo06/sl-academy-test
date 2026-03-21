/**
 * SL Academy Platform - API Client
 * Centralized API calls with error handling
 */

import { Track, Lesson, LessonDetail, Question, TestAttemptCreate, TestAttempt, Doubt, DoubtCreate, Indicator, RecommendationRequest, RecommendationResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:8000');

class ApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const url = `${API_URL}${endpoint}`;
    const authHeaders = await getAuthHeaders();
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new ApiError(
        response.status,
        error.error?.message || error.message || 'Request failed'
      );
    }

    return response.json();
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error.message || 'Request failed');
  }
}

import { supabase, isSupabaseConfigured } from './supabase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    if (isSupabaseConfigured()) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return { 'Authorization': `Bearer ${session.access_token}` };
      }
    }
  } catch {}
  return {};
}

// Track API
export const trackApi = {
  getAll: async () => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('tracks').select('*').is('deleted_at', null);
      if (error) throw new ApiError(500, error.message);
      return data as Track[];
    }
    return fetchApi<Track[]>('/api/tracks');
  },
  getById: async (id: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('tracks').select('*').eq('id', id).single();
      if (error) throw new ApiError(500, error.message);
      return data as Track;
    }
    return fetchApi<Track>(`/api/tracks/${id}`);
  },
  create: async (data: Partial<Track>) => {
    if (isSupabaseConfigured()) {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase.from('profiles').select('hospital_id').eq('id', session?.user?.id || '').single();
      const { data: result, error } = await supabase.from('tracks').insert({ ...data, hospital_id: profile?.hospital_id }).select().single();
      if (error) throw new ApiError(500, error.message);
      return result as Track;
    }
    return fetchApi<Track>('/api/tracks', { method: 'POST', body: JSON.stringify(data) });
  },
  update: async (id: string, data: Partial<Track>) => {
    if (isSupabaseConfigured()) {
      const { data: result, error } = await supabase.from('tracks').update(data).eq('id', id).select().single();
      if (error) throw new ApiError(500, error.message);
      return result as Track;
    }
    return fetchApi<Track>(`/api/tracks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  delete: async (id: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('tracks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new ApiError(500, error.message);
      return;
    }
    return fetchApi<void>(`/api/tracks/${id}`, { method: 'DELETE' });
  },
};

// Lesson API
export const lessonApi = {
  getAll: async () => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('lessons').select('*').is('deleted_at', null).order('position');
      if (error) throw new ApiError(500, error.message);
      return data as Lesson[];
    }
    return fetchApi<Lesson[]>('/api/lessons');
  },
  getByTrack: async (trackId: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('lessons').select('*').eq('track_id', trackId).is('deleted_at', null).order('position');
      if (error) throw new ApiError(500, error.message);
      return data as Lesson[];
    }
    return fetchApi<Lesson[]>(`/api/lessons/tracks/${trackId}/lessons`);
  },
  getById: async (id: string) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('lessons').select('*, track:tracks(*)').eq('id', id).single();
      if (error) throw new ApiError(500, error.message);
      return data as unknown as LessonDetail;
    }
    return fetchApi<LessonDetail>(`/api/lessons/${id}`);
  },
  create: async (data: Partial<Lesson>) => {
    if (isSupabaseConfigured()) {
      const { data: result, error } = await supabase.from('lessons').insert(data).select().single();
      if (error) throw new ApiError(500, error.message);
      return result as Lesson;
    }
    return fetchApi<Lesson>('/api/lessons', { method: 'POST', body: JSON.stringify(data) });
  },
  update: async (id: string, data: Partial<Lesson>) => {
    if (isSupabaseConfigured()) {
      const { data: result, error } = await supabase.from('lessons').update(data).eq('id', id).select().single();
      if (error) throw new ApiError(500, error.message);
      return result as Lesson;
    }
    return fetchApi<Lesson>(`/api/lessons/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  delete: async (id: string) => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('lessons').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new ApiError(500, error.message);
      return;
    }
    return fetchApi<void>(`/api/lessons/${id}`, { method: 'DELETE' });
  },
};

// Question API
export const questionApi = {
  getByLesson: async (lessonId: string, type?: 'pre' | 'post') => {
    if (isSupabaseConfigured()) {
      let query = supabase.from('questions').select('*').eq('lesson_id', lessonId).is('deleted_at', null);
      if (type) query = query.eq('type', type);
      const { data, error } = await query;
      if (error) throw new ApiError(500, error.message);
      return (data || []) as Question[];
    }
    const params = type ? `?type=${type}` : '';
    return fetchApi<Question[]>(`/api/lessons/${lessonId}/questions${params}`);
  },
};

// Test Attempt API
export const testAttemptApi = {
  submit: (data: TestAttemptCreate) => fetchApi<TestAttempt>('/api/test-attempts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getByLesson: async (lessonId: string) => {
    if (isSupabaseConfigured()) {
      const { data: { session } } = await supabase.auth.getSession();
      let query = supabase.from('test_attempts').select('*').eq('lesson_id', lessonId).order('completed_at', { ascending: false });
      if (session?.user?.id) query = query.eq('user_id', session.user.id);
      const { data, error } = await query;
      if (error) throw new ApiError(500, error.message);
      return (data || []) as TestAttempt[];
    }
    return fetchApi<TestAttempt[]>(`/api/test-attempts/lessons/${lessonId}/attempts`);
  },
};

// Doubt API
export const doubtApi = {
  getAll: async (status?: string, lessonId?: string) => {
    if (isSupabaseConfigured()) {
      let query = supabase.from('doubts').select('*, lessons(title)');
      if (status) query = query.eq('status', status);
      if (lessonId) query = query.eq('lesson_id', lessonId);
      const { data, error } = await query.is('deleted_at', null);
      if (error) throw new ApiError(500, error.message);
      return data as unknown as Doubt[];
    }
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (lessonId) params.append('lesson_id', lessonId);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<Doubt[]>(`/api/doubts${queryStr}`);
  },
  create: (data: DoubtCreate) => fetchApi<Doubt>('/api/doubts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  answer: (id: string, answer: string) => fetchApi<Doubt>(`/api/doubts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ answer }),
  }),
};

// Indicator API
export const indicatorApi = {
  getAll: async (category?: string, startDate?: string, endDate?: string) => {
    if (isSupabaseConfigured()) {
      let query = supabase.from('indicators').select('*');
      if (category) query = query.eq('category', category);
      if (startDate) query = query.gte('reference_date', startDate);
      if (endDate) query = query.lte('reference_date', endDate);
      const { data, error } = await query.is('deleted_at', null);
      if (error) throw new ApiError(500, error.message);
      return data as Indicator[];
    }
    const params = new URLSearchParams();
    if (status) params.append('category', category || '');
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<Indicator[]>(`/api/indicators${queryStr}`);
  },
  import: (data: any) => fetchApi<any>('/api/indicators/import', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// AI API
export const aiApi = {
  getRecommendations: (data: RecommendationRequest) =>
    fetchApi<RecommendationResponse>('/api/generate-recommendations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Upload API
export const uploadApi = {
  image: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/upload/image`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new ApiError(response.status, error.error?.message || 'Upload failed');
    }

    return response.json();
  },

  spreadsheet: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/upload/spreadsheet`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new ApiError(response.status, error.error?.message || 'Upload failed');
    }

    return response.json();
  },
};

export { ApiError };
