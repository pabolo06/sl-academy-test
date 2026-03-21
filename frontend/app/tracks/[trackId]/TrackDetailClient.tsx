'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { trackApi, lessonApi } from '@/lib/api';
import { Track, Lesson } from '@/types';

function SkeletonLesson() {
    return (
        <div className="card p-5 flex items-start gap-4">
            <div className="skeleton w-14 h-14 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-3 w-3/4" />
                <div className="skeleton h-3 w-1/4" />
            </div>
            <div className="skeleton w-6 h-6 rounded" />
        </div>
    );
}

export default function TrackDetailClient() {
    const params = useParams();
    const router = useRouter();
    const trackId = params.trackId as string;

    const [track, setTrack] = useState<Track | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (trackId) loadTrackAndLessons();
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
            setLessons(lessonsData.filter(l => !l.deleted_at).sort((a, b) => a.position - b.position));
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar trilha');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        if (m < 60) return `${m} min`;
        const h = Math.floor(m / 60);
        const rem = m % 60;
        return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Back */}
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar
                </button>

                {error && (
                    <div className="alert-error">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <p>{error}</p>
                    </div>
                )}

                {loading ? (
                    <>
                        <div className="space-y-2">
                            <div className="skeleton h-7 w-1/2 rounded-lg" />
                            <div className="skeleton h-4 w-3/4 rounded" />
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <SkeletonLesson key={i} />)}
                        </div>
                    </>
                ) : track ? (
                    <>
                        {/* Track Header */}
                        <div className="card p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-600/15 border border-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-xl font-bold text-slate-100">{track.title}</h1>
                                    {track.description && (
                                        <p className="text-sm text-slate-400 mt-1">{track.description}</p>
                                    )}
                                    <p className="text-xs text-slate-500 mt-2">
                                        {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {lessons.length === 0 ? (
                            <div className="card">
                                <div className="empty-state">
                                    <svg className="empty-state-icon" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                    </svg>
                                    <p className="empty-state-title">Nenhuma aula disponível</p>
                                    <p className="empty-state-text">Esta trilha ainda não possui aulas publicadas</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {lessons.map((lesson, index) => (
                                    <Link
                                        key={lesson.id}
                                        href={`/lessons/${lesson.id}`}
                                        className="card p-5 flex items-start gap-4 hover:border-blue-500/30 hover:bg-blue-600/[0.03] transition-all group block"
                                    >
                                        <div className="flex-shrink-0 w-11 h-11 bg-blue-600/15 border border-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-600/25 transition-colors">
                                            <span className="text-sm font-bold text-blue-400">{index + 1}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-slate-100 group-hover:text-blue-300 transition-colors leading-snug">
                                                {lesson.title}
                                            </h3>
                                            {lesson.description && (
                                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{lesson.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {formatDuration(lesson.duration_seconds)}
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                                    </svg>
                                                    Vídeo
                                                </span>
                                            </div>
                                        </div>
                                        <svg className="w-4 h-4 text-slate-600 group-hover:text-blue-400 flex-shrink-0 mt-1 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
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
