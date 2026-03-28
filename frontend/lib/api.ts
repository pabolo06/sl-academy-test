/**
 * SL Academy Platform - API Client
 * Centralized API calls with error handling
 */

import { Track, Lesson, LessonDetail, Question, TestAttemptCreate, TestAttempt, Doubt, DoubtCreate, Indicator, RecommendationRequest, RecommendationResponse, AssistantRequest, AssistantResponse, Schedule, ScheduleSlotCreate, ScheduleSlot } from '@/types';
import { API_URL } from './config';

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
  const url = `${API_URL}${endpoint}`;
  try {
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
    const message = error.message || 'Request failed';
    if (process.env.NODE_ENV !== 'production') {
      console.error(`API Error at ${url}:`, message);
    }
    throw new ApiError(500, message);
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
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Falha ao obter headers de autenticação:', e);
    }
  }
  return {};
}

/**
 * Executa `supabaseOp` se o Supabase estiver configurado, senão executa `httpOp`.
 * Centraliza a lógica de dual-mode em um único lugar.
 */
async function supabaseOr<T>(
  supabaseOp: () => Promise<T>,
  httpOp: () => Promise<T>
): Promise<T> {
  return isSupabaseConfigured() ? supabaseOp() : httpOp();
}

// Track API
export const trackApi = {
  getAll: () => supabaseOr(
    async () => {
      const { data, error } = await supabase.from('tracks').select('*').is('deleted_at', null);
      if (error) throw new ApiError(500, error.message);
      return data as Track[];
    },
    () => fetchApi<Track[]>('/api/tracks')
  ),
  getById: (id: string) => supabaseOr(
    async () => {
      const { data, error } = await supabase.from('tracks').select('*').eq('id', id).single();
      if (error) throw new ApiError(500, error.message);
      return data as Track;
    },
    () => fetchApi<Track>(`/api/tracks/${id}`)
  ),
  create: (data: Partial<Track>) => supabaseOr(
    async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new ApiError(401, 'Not authenticated');
      const { data: profile } = await supabase.from('profiles').select('hospital_id').eq('id', userId).single();
      const { data: result, error } = await supabase.from('tracks').insert({ ...data, hospital_id: profile?.hospital_id }).select().single();
      if (error) throw new ApiError(500, error.message);
      return result as Track;
    },
    () => fetchApi<Track>('/api/tracks', { method: 'POST', body: JSON.stringify(data) })
  ),
  update: (id: string, data: Partial<Track>) => supabaseOr(
    async () => {
      const { data: result, error } = await supabase.from('tracks').update(data).eq('id', id).select().single();
      if (error) throw new ApiError(500, error.message);
      return result as Track;
    },
    () => fetchApi<Track>(`/api/tracks/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  ),
  delete: (id: string) => supabaseOr(
    async () => {
      const { error } = await supabase.from('tracks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new ApiError(500, error.message);
    },
    () => fetchApi<void>(`/api/tracks/${id}`, { method: 'DELETE' })
  ),
};

// Lesson API
export const lessonApi = {
  getAll: () => supabaseOr(
    async () => {
      const { data, error } = await supabase.from('lessons').select('*').is('deleted_at', null).order('position');
      if (error) throw new ApiError(500, error.message);
      return data as Lesson[];
    },
    () => fetchApi<Lesson[]>('/api/lessons')
  ),
  getByTrack: (trackId: string) => supabaseOr(
    async () => {
      const { data, error } = await supabase.from('lessons').select('*').eq('track_id', trackId).is('deleted_at', null).order('position');
      if (error) throw new ApiError(500, error.message);
      return data as Lesson[];
    },
    () => fetchApi<Lesson[]>(`/api/lessons/tracks/${trackId}/lessons`)
  ),
  getById: (id: string) => supabaseOr(
    async () => {
      const { data, error } = await supabase.from('lessons').select('*, track:tracks(*)').eq('id', id).single();
      if (error) throw new ApiError(500, error.message);
      return data as LessonDetail;
    },
    () => fetchApi<LessonDetail>(`/api/lessons/${id}`)
  ),
  create: (data: Partial<Lesson>) => supabaseOr(
    async () => {
      const { data: result, error } = await supabase.from('lessons').insert(data).select().single();
      if (error) throw new ApiError(500, error.message);
      return result as Lesson;
    },
    () => fetchApi<Lesson>('/api/lessons', { method: 'POST', body: JSON.stringify(data) })
  ),
  update: (id: string, data: Partial<Lesson>) => supabaseOr(
    async () => {
      const { data: result, error } = await supabase.from('lessons').update(data).eq('id', id).select().single();
      if (error) throw new ApiError(500, error.message);
      return result as Lesson;
    },
    () => fetchApi<Lesson>(`/api/lessons/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  ),
  delete: (id: string) => supabaseOr(
    async () => {
      const { error } = await supabase.from('lessons').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw new ApiError(500, error.message);
    },
    () => fetchApi<void>(`/api/lessons/${id}`, { method: 'DELETE' })
  ),
};

// Question API
export const questionApi = {
  getByLesson: (lessonId: string, type?: 'pre' | 'post') => supabaseOr(
    async () => {
      let query = supabase.from('questions').select('*').eq('lesson_id', lessonId).is('deleted_at', null);
      if (type) query = query.eq('type', type);
      const { data, error } = await query;
      if (error) throw new ApiError(500, error.message);
      return (data || []) as Question[];
    },
    () => {
      const params = type ? `?type=${type}` : '';
      return fetchApi<Question[]>(`/api/lessons/${lessonId}/questions${params}`);
    }
  ),
};

// Test Attempt API
export const testAttemptApi = {
  submit: (data: TestAttemptCreate) => fetchApi<TestAttempt>('/api/test-attempts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getByLesson: (lessonId: string) =>
    fetchApi<TestAttempt[]>(`/api/test-attempts/lessons/${lessonId}/attempts`),
};

// Doubt API
export const doubtApi = {
  getAll: (status?: string, lessonId?: string) => supabaseOr(
    async () => {
      let query = supabase.from('doubts').select('*, lessons(title)');
      if (status) query = query.eq('status', status);
      if (lessonId) query = query.eq('lesson_id', lessonId);
      const { data, error } = await query.is('deleted_at', null);
      if (error) throw new ApiError(500, error.message);
      return data as Doubt[];
    },
    () => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (lessonId) params.append('lesson_id', lessonId);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return fetchApi<Doubt[]>(`/api/doubts${queryStr}`);
    }
  ),
  create: (data: DoubtCreate) => fetchApi<Doubt>('/api/doubts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  answer: (id: string, answer: string) => fetchApi<Doubt>(`/api/doubts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ answer }),
  }),
};

// Schedule API
export const scheduleApi = {
  getSchedule: (weekStart: string) =>
    fetchApi<Schedule>(`/api/schedule?week_start=${weekStart}`),

  addSlot: (scheduleId: string, slot: ScheduleSlotCreate) =>
    fetchApi<ScheduleSlot>(`/api/schedule/${scheduleId}/slots`, {
      method: 'POST',
      body: JSON.stringify(slot),
    }),

  removeSlot: (slotId: string) =>
    fetchApi<void>(`/api/schedule/slots/${slotId}`, {
      method: 'DELETE',
    }),

  publishSchedule: (scheduleId: string) =>
    fetchApi<Schedule>(`/api/schedule/${scheduleId}/publish`, {
      method: 'PATCH',
    }),

  getMyShifts: () =>
    fetchApi<ScheduleSlot[]>('/api/schedule/my-shifts'),
};

// Indicator API
export const indicatorApi = {
  getAll: (category?: string, startDate?: string, endDate?: string) => supabaseOr(
    async () => {
      let query = supabase.from('indicators').select('*');
      if (category) query = query.eq('category', category);
      if (startDate) query = query.gte('reference_date', startDate);
      if (endDate) query = query.lte('reference_date', endDate);
      const { data, error } = await query.is('deleted_at', null);
      if (error) throw new ApiError(500, error.message);
      return data as Indicator[];
    },
    () => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);  // fix: era `if (status)` (bug)
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      return fetchApi<Indicator[]>(`/api/indicators${queryStr}`);
    }
  ),
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
  sendMessage: (data: AssistantRequest) =>
    fetchApi<AssistantResponse>('/api/assistant', {
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
