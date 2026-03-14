/**
 * SL Academy Platform - Video Player Component
 * Video player with progress tracking and localStorage persistence
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { VideoProgress } from '@/types';

interface VideoPlayerProps {
  lessonId: string;
  videoUrl: string;
  onComplete?: () => void;
}

export function VideoPlayer({ lessonId, videoUrl, onComplete }: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string>('');
  const [hasCompleted, setHasCompleted] = useState(false);

  // Load saved progress on mount
  useEffect(() => {
    loadProgress();
  }, [lessonId]);

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem(`video_progress_${lessonId}`);
      if (saved) {
        const data: VideoProgress = JSON.parse(saved);
        if (data.last_position > 0 && !data.completed) {
          setProgress(data.last_position);
          // Seek to saved position when player is ready
          if (playerRef.current) {
            playerRef.current.seekTo(data.last_position, 'seconds');
          }
        }
      }
    } catch (err) {
      console.error('Error loading video progress:', err);
    }
  };

  const saveProgress = (currentProgress: number, isCompleted: boolean = false) => {
    try {
      const data: VideoProgress = {
        lesson_id: lessonId,
        progress: currentProgress,
        completed: isCompleted,
        last_position: currentProgress,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(`video_progress_${lessonId}`, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving video progress:', err);
    }
  };

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setProgress(state.playedSeconds);
    
    // Save progress every 5 seconds
    if (Math.floor(state.playedSeconds) % 5 === 0) {
      saveProgress(state.playedSeconds);
    }

    // Check if video is near completion (95%)
    if (state.played >= 0.95 && !hasCompleted) {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setHasCompleted(true);
    saveProgress(duration, true);
    
    if (onComplete) {
      onComplete();
    }
  };

  const handleDuration = (dur: number) => {
    setDuration(dur);
  };

  const handleError = (err: any) => {
    console.error('Video player error:', err);
    setError('Erro ao carregar vídeo. Tente novamente.');
  };

  const handleRetry = () => {
    setError('');
    setPlaying(true);
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
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          width="100%"
          height="100%"
          playing={playing}
          controls
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={handleComplete}
          onError={handleError}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload',
              },
            },
          }}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          {formatTime(progress)} / {formatTime(duration)}
        </span>
        {hasCompleted && (
          <span className="text-green-400 flex items-center gap-2">
            ✓ Vídeo concluído
          </span>
        )}
      </div>

      {!playing && progress === 0 && (
        <button
          onClick={() => setPlaying(true)}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          ▶ Iniciar Vídeo
        </button>
      )}
    </div>
  );
}
