/**
 * SL Academy Platform - Lazy Loaded Components
 * Dynamic imports for code splitting
 */

'use client';

import dynamic from 'next/dynamic';
import { Spinner } from './Loading';

// Loading fallback
const LoadingFallback = () => (
  <div className="flex justify-center py-8">
    <Spinner size="lg" />
  </div>
);

// Lazy load heavy components
export const VideoPlayer = dynamic(() => import('./VideoPlayer').then(mod => ({ default: mod.VideoPlayer })), {
  loading: LoadingFallback,
  ssr: false,
});

export const IndicatorLineChart = dynamic(() => import('./IndicatorLineChart').then(mod => ({ default: mod.IndicatorLineChart })), {
  loading: LoadingFallback,
  ssr: false,
});

export const IndicatorBarChart = dynamic(() => import('./IndicatorBarChart').then(mod => ({ default: mod.IndicatorBarChart })), {
  loading: LoadingFallback,
  ssr: false,
});

export const ImageUpload = dynamic(() => import('./ImageUpload').then(mod => ({ default: mod.ImageUpload })), {
  loading: LoadingFallback,
  ssr: false,
});

export const SpreadsheetUpload = dynamic(() => import('./SpreadsheetUpload').then(mod => ({ default: mod.SpreadsheetUpload })), {
  loading: LoadingFallback,
  ssr: false,
});

export const DoubtForm = dynamic(() => import('./DoubtForm').then(mod => ({ default: mod.DoubtForm })), {
  loading: LoadingFallback,
});

export const TestForm = dynamic(() => import('./TestForm').then(mod => ({ default: mod.TestForm })), {
  loading: LoadingFallback,
});
