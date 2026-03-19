'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { trackApi, lessonApi } from '@/lib/api';
import { Track, Lesson } from '@/types';

export default function TrackDetailClient() {
    const params = useParams();
    const router = useRouter();
    const trackId = params.trackId as string;

    const [track, setTrack] = useState<Track | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (trackId) {
            loadTrackAndLessons();
        }
    }, [trackId]);

    const loadTrackAndLessons = async () => {
        try {
            setLoading(true);
            setError('');

            const [trackData, lessonsData] = await Promise.all([
                trackApi.getById(trackId),
                lessonApi.getByTrack(trackId),
            ]);

            setTrack(trackData);
            setLessons(lessonsData);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar trilha');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}min`;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <button
                    onClick={() => router.back()}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                    ← Voltar
                </button>

                {error && (
                    <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                        <p className="text-red-200">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-700 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-24 bg-gray-800 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                ) : track ? (
                    <>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{track.title}</h1>
                            {track.description && (
                                <p className="text-gray-400">{track.description}</p>
                            )}
                            <p className="text-sm text-gray-500 mt-2">
                                {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'}
                            </p>
                        </div>

                        {lessons.length === 0 ? (
                            <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
                                <p className="text-gray-400 text-lg">
                                    Nenhuma aula disponível nesta trilha
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {lessons.map((lesson, index) => (
                                    <Link
                                        key={lesson.id}
                                        href={`/lessons/${lesson.id}`}
                                        className="block bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 px-3 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                Aula {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                                                    {lesson.title}
                                                </h3>
                                                {lesson.description && (
                                                    <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                                                        {lesson.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span>⏱️ {formatDuration(lesson.duration_seconds)}</span>
                                                    <span>📹 Vídeo</span>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 text-blue-400 group-hover:text-blue-300">
                                                →
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                ) : null}
            </div>
        </DashboardLayout>
    );
}
