/**
 * SL Academy Platform - Data Fetching Hook
 * SWR-based data fetching with caching
 */

'use client';

import useSWR from 'swr';
import { trackApi, lessonApi, doubtApi, indicatorApi, testAttemptApi } from '@/lib/api';

// SWR configuration
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
};

// Tracks
export function useTracks() {
  const { data, error, isLoading, mutate } = useSWR(
    'tracks',
    () => trackApi.getAll(),
    swrConfig
  );

  return {
    tracks: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useTrack(trackId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    trackId ? `track-${trackId}` : null,
    () => trackId ? trackApi.getById(trackId) : null,
    swrConfig
  );

  return {
    track: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Lessons
export function useLessons(trackId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    trackId ? `lessons-${trackId}` : null,
    () => trackId ? lessonApi.getByTrack(trackId) : null,
    swrConfig
  );

  return {
    lessons: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

export function useLesson(lessonId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    lessonId ? `lesson-${lessonId}` : null,
    () => lessonId ? lessonApi.getById(lessonId) : null,
    swrConfig
  );

  return {
    lesson: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Doubts
export function useDoubts(status?: string, lessonId?: string) {
  const key = `doubts-${status || 'all'}-${lessonId || 'all'}`;
  
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => doubtApi.getAll(status, lessonId),
    swrConfig
  );

  return {
    doubts: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Indicators
export function useIndicators(category?: string, startDate?: string, endDate?: string) {
  const key = `indicators-${category || 'all'}-${startDate || ''}-${endDate || ''}`;
  
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => indicatorApi.getAll(category, startDate, endDate),
    {
      ...swrConfig,
      revalidateOnFocus: true, // Indicators should refresh more often
    }
  );

  return {
    indicators: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

// Test Attempts
export function useTestAttempts(lessonId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    lessonId ? `test-attempts-${lessonId}` : null,
    () => lessonId ? testAttemptApi.getByLesson(lessonId) : null,
    swrConfig
  );

  return {
    testAttempts: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
