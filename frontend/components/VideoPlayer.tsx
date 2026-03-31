/**
 * SL Academy Platform - Video Player Component
 * Native HTML5 video player with Supabase Storage support.
 *
 * Features:
 * - Plays .mp4 files directly from Supabase Storage signed URLs
 * - Progress tracking with localStorage persistence
 * - Telemetry: calls onComplete when watched > 95%
 * - SSR Guard: uses dynamic import (this component is 'use client')
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface VideoPlayerProps {
  lessonId: string;
  videoUrl: string;
  onComplete?: () => void;
}

interface VideoProgress {
  lesson_id: string;
  progress: number;
  completed: boolean;
  last_position: number;
  updated_at: string;
}

export function VideoPlayer({ lessonId, videoUrl, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string>('');
  const [hasCompleted, setHasCompleted] = useState(false);
  const completionFired = useRef(false);

  // Load saved progress on mount
  useEffect(() => {
    loadProgress();
    completionFired.current = false;
    setHasCompleted(false);
  }, [lessonId]);

  const loadProgress = () => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(`video_progress_${lessonId}`);
      if (saved) {
        const data: VideoProgress = JSON.parse(saved);
        if (data.last_position > 0 && !data.completed) {
          setCurrentTime(data.last_position);
          // Seek when video is ready
          if (videoRef.current) {
            videoRef.current.currentTime = data.last_position;
          }
        }
        if (data.completed) {
          setHasCompleted(true);
          completionFired.current = true;
        }
      }
    } catch (err) {
      console.error('Error loading video progress:', err);
    }
  };

  const saveProgress = useCallback((position: number, isCompleted: boolean = false) => {
    if (typeof window === 'undefined') return;
    try {
      const data: VideoProgress = {
        lesson_id: lessonId,
        progress: position,
        completed: isCompleted,
        last_position: position,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(`video_progress_${lessonId}`, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving video progress:', err);
    }
  }, [lessonId]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    setCurrentTime(video.currentTime);

    // Save progress every 5 seconds
    if (Math.floor(video.currentTime) % 5 === 0) {
      saveProgress(video.currentTime);
    }

    // Telemetry: fire completion at 95%
    const percentWatched = video.currentTime / video.duration;
    if (percentWatched >= 0.95 && !completionFired.current) {
      completionFired.current = true;
      setHasCompleted(true);
      saveProgress(video.currentTime, true);

      if (onComplete) {
        onComplete();
      }
    }
  }, [saveProgress, onComplete]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    setDuration(video.duration);

    // Restore saved position
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`video_progress_${lessonId}`);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.last_position > 0 && !data.completed) {
          video.currentTime = data.last_position;
        }
      }
    }
  };

  const handleEnded = () => {
    if (!completionFired.current) {
      completionFired.current = true;
      setHasCompleted(true);
      saveProgress(duration, true);
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleError = () => {
    console.error('Video player error');
    setError('Erro ao carregar vídeo. Verifique se o ficheiro existe no storage.');
  };

  const handleRetry = () => {
    setError('');
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center p-8 border border-gray-700">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          controls
          controlsList="nodownload"
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={handleError}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        {hasCompleted && (
          <span className="text-green-400 flex items-center gap-2">
            ✓ Vídeo concluído
          </span>
        )}
      </div>

      {!playing && currentTime === 0 && (
        <button
          onClick={handlePlay}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          ▶ Iniciar Vídeo
        </button>
      )}
    </div>
  );
}
