'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { VideoPlayer } from '@/components/VideoPlayer';
import { TestForm } from '@/components/TestForm';
import { DoubtForm } from '@/components/DoubtForm';
import { DoubtCard } from '@/components/DoubtCard';
import { lessonApi, questionApi, testAttemptApi, doubtApi } from '@/lib/api';
import { LessonDetail, Question, TestAttemptAnswer, Doubt, Lesson } from '@/types';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type WorkflowStep = 'pre-test' | 'video' | 'post-test' | 'completed';

export default function LessonDetailClient() {
    const params = useParams();
    const router = useRouter();
    const lessonId = params.lessonId as string;
    const { user } = useAuth();

    const [lesson, setLesson] = useState<LessonDetail | null>(null);
    const [trackLessons, setTrackLessons] = useState<Lesson[]>([]);
    const [preTestQuestions, setPreTestQuestions] = useState<Question[]>([]);
    const [postTestQuestions, setPostTestQuestions] = useState<Question[]>([]);
    const [currentStep, setCurrentStep] = useState<WorkflowStep>('pre-test');
    const [preTestScore, setPreTestScore] = useState<number | null>(null);
    const [postTestScore, setPostTestScore] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [showDoubtForm, setShowDoubtForm] = useState(false);

    useEffect(() => {
        if (!lessonId) return;
        const load = async () => {
            // Wait for Supabase session before fetching
            if (isSupabaseConfigured()) {
                await supabase.auth.getSession();
            }
            await loadLessonData();
            await loadDoubts();
        };
        load();
    }, [lessonId]);

    const loadLessonData = async (retryCount = 0) => {
        try {
            setLoading(true);
            setError('');
            const [lessonData, preQuestions, postQuestions] = await Promise.all([
                lessonApi.getById(lessonId),
                questionApi.getByLesson(lessonId, 'pre'),
                questionApi.getByLesson(lessonId, 'post'),
            ]);
            setLesson(lessonData);
            setPreTestQuestions(preQuestions);
            setPostTestQuestions(postQuestions);
            if (lessonData.track_id) {
                const lessons = await lessonApi.getByTrack(lessonData.track_id);
                setTrackLessons(lessons.filter(l => !l.deleted_at).sort((a, b) => a.position - b.position));
            }
            if (preQuestions.length === 0) setCurrentStep('video');
            setLoading(false);
        } catch (err: any) {
            if (retryCount === 0 && err.message === 'Failed to fetch') {
                setTimeout(() => loadLessonData(1), 2000);
            } else {
                setError(err.message || 'Erro ao carregar aula');
                setLoading(false);
            }
        }
    };

    const loadDoubts = async () => {
        try {
            const data = await doubtApi.getAll(undefined, lessonId);
            setDoubts(data);
        } catch {}
    };

    const handlePreTestSubmit = async (answers: TestAttemptAnswer[]) => {
        const result = await testAttemptApi.submit({ lesson_id: lessonId, type: 'pre', answers });
        setPreTestScore(result.score);
        setCurrentStep('video');
    };

    const handleVideoComplete = () => {
        setCurrentStep(postTestQuestions.length === 0 ? 'completed' : 'post-test');
    };

    const handlePostTestSubmit = async (answers: TestAttemptAnswer[]) => {
        const result = await testAttemptApi.submit({ lesson_id: lessonId, type: 'post', answers });
        setPostTestScore(result.score);
        setCurrentStep('completed');
    };

    const currentLessonIndex = trackLessons.findIndex(l => l.id === lessonId);
    const prevLesson = currentLessonIndex > 0 ? trackLessons[currentLessonIndex - 1] : null;
    const nextLesson = currentLessonIndex < trackLessons.length - 1 ? trackLessons[currentLessonIndex + 1] : null;
    const improvement = preTestScore !== null && postTestScore !== null ? postTestScore - preTestScore : null;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-0">
                {error && (
                    <div className="alert-error mb-4">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <div>
                            <p>{error}</p>
                            <button onClick={() => loadLessonData()} className="mt-1 text-red-300 hover:text-red-200 underline text-xs">Tentar novamente</button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-4">
                        <div className="skeleton h-7 w-2/3 rounded-lg" />
                        <div className="skeleton h-4 w-1/2 rounded" />
                        <div className="skeleton rounded-xl w-full" style={{ aspectRatio: '16/9' }} />
                    </div>
                ) : lesson ? (
                    <>
                        {/* Lesson title + track navigation */}
                        <div className="mb-4">
                            {/* Back to track */}
                            <button
                                onClick={() => router.back()}
                                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-3"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                                Voltar para a trilha
                            </button>
                            <h1 className="text-xl font-bold text-slate-100">{lesson.title}</h1>
                            {lesson.description && (
                                <p className="text-sm text-slate-400 mt-1">{lesson.description}</p>
                            )}
                        </div>

                        {/* Step indicator */}
                        <div className="flex items-center gap-1 mb-5">
                            {[
                                { key: 'pre-test', label: 'Pré-teste', show: preTestQuestions.length > 0 },
                                { key: 'video', label: 'Vídeo', show: true },
                                { key: 'post-test', label: 'Pós-teste', show: postTestQuestions.length > 0 },
                                { key: 'completed', label: 'Concluído', show: true },
                            ].filter(s => s.show).map((step, idx, arr) => {
                                const steps = arr.map(s => s.key);
                                const stepIdx = steps.indexOf(step.key);
                                const currentIdx = steps.indexOf(currentStep);
                                const isDone = stepIdx < currentIdx;
                                const isCurrent = step.key === currentStep;
                                return (
                                    <div key={step.key} className="flex items-center">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                            isCurrent ? 'bg-blue-600 text-white' :
                                            isDone ? 'bg-emerald-600/20 text-emerald-400' :
                                            'bg-white/5 text-slate-500'
                                        }`}>
                                            {isDone && (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                            )}
                                            {step.label}
                                        </div>
                                        {idx < arr.length - 1 && (
                                            <div className={`w-5 h-px mx-1 ${isDone ? 'bg-emerald-600/40' : 'bg-white/10'}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* PRE-TEST */}
                        {currentStep === 'pre-test' && (
                            <div className="card p-6 space-y-4">
                                <div>
                                    <h2 className="section-title">Pré-teste</h2>
                                    <p className="text-sm text-slate-400 mt-1">Responda antes de assistir ao vídeo</p>
                                </div>
                                <TestForm questions={preTestQuestions} onSubmit={handlePreTestSubmit} testType="pre" />
                            </div>
                        )}

                        {/* VIDEO — full-width cinema feel */}
                        {currentStep === 'video' && (
                            <div className="space-y-3">
                                {/* Video container */}
                                <div className="rounded-xl overflow-hidden bg-black border border-white/[0.06] shadow-2xl shadow-black/40">
                                    <VideoPlayer
                                        lessonId={lessonId}
                                        videoUrl={lesson.video_url}
                                        onComplete={handleVideoComplete}
                                    />
                                </div>

                                {/* Navigation between lessons */}
                                {trackLessons.length > 1 && (
                                    <div className="flex items-center justify-between gap-3">
                                        <button
                                            onClick={() => prevLesson && router.push(`./${prevLesson.id}`)}
                                            disabled={!prevLesson}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                            </svg>
                                            Aula anterior
                                        </button>

                                        {/* Lesson pills */}
                                        <div className="flex items-center gap-1.5 overflow-x-auto">
                                            {trackLessons.map((tl, idx) => (
                                                <button
                                                    key={tl.id}
                                                    onClick={() => { if (tl.id !== lessonId) router.push(`./${tl.id}`); }}
                                                    className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                                                        tl.id === lessonId
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                            : 'bg-white/5 text-slate-500 border border-white/10 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {idx + 1}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => nextLesson && router.push(`./${nextLesson.id}`)}
                                            disabled={!nextLesson}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                                        >
                                            Próxima aula
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {preTestScore !== null && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                                        <span className="badge-blue">Pré-teste: {preTestScore.toFixed(0)}%</span>
                                        <span>Assista ao vídeo completo para continuar</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* POST-TEST */}
                        {currentStep === 'post-test' && (
                            <div className="card p-6 space-y-4">
                                <div>
                                    <h2 className="section-title">Pós-teste</h2>
                                    <p className="text-sm text-slate-400 mt-1">Avalie o seu aprendizado após o vídeo</p>
                                </div>
                                <TestForm questions={postTestQuestions} onSubmit={handlePostTestSubmit} testType="post" />
                            </div>
                        )}

                        {/* COMPLETED */}
                        {currentStep === 'completed' && (
                            <div className="card p-6 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="section-title">Aula Concluída!</h2>
                                        <p className="text-xs text-slate-500">Parabéns pelo seu progresso</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Pré-teste', value: preTestScore },
                                        { label: 'Pós-teste', value: postTestScore },
                                        { label: 'Melhoria', value: improvement, prefix: improvement !== null && improvement >= 0 ? '+' : '' },
                                    ].map(({ label, value, prefix = '' }) => (
                                        <div key={label} className="card p-4 text-center">
                                            <p className={`text-2xl font-bold tabular-nums ${
                                                label === 'Melhoria' && improvement !== null
                                                    ? improvement >= 0 ? 'text-emerald-400' : 'text-red-400'
                                                    : 'text-slate-100'
                                            }`}>
                                                {value !== null && value !== undefined ? `${prefix}${value.toFixed(0)}%` : '—'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3">
                                    {nextLesson && (
                                        <button
                                            onClick={() => router.push(`./${nextLesson.id}`)}
                                            className="btn-primary flex-1 justify-center"
                                        >
                                            Próxima Aula
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => router.push('/tracks')}
                                        className={nextLesson ? 'btn-secondary' : 'btn-primary flex-1 justify-center'}
                                    >
                                        Voltar para Trilhas
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* DOUBTS */}
                        <div className="card p-6 space-y-4 mt-5">
                            <div className="flex items-center justify-between">
                                <h2 className="section-title">Dúvidas desta aula</h2>
                                <button
                                    onClick={() => setShowDoubtForm(!showDoubtForm)}
                                    className={showDoubtForm ? 'btn-secondary' : 'btn-primary'}
                                >
                                    {showDoubtForm ? 'Cancelar' : 'Nova Dúvida'}
                                </button>
                            </div>

                            {showDoubtForm && (
                                <div className="p-4 bg-[#0d1117] rounded-lg border border-white/8">
                                    <DoubtForm lessonId={lessonId} onSuccess={() => { setShowDoubtForm(false); loadDoubts(); }} />
                                </div>
                            )}

                            {doubts.length === 0 ? (
                                <div className="empty-state py-8">
                                    <svg className="w-8 h-8 text-slate-600 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                    </svg>
                                    <p className="empty-state-title text-sm">Nenhuma dúvida ainda</p>
                                    <button onClick={() => setShowDoubtForm(true)} className="btn-primary mt-2">
                                        Fazer Primeira Pergunta
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {doubts.map((doubt) => (
                                        <DoubtCard key={doubt.id} doubt={doubt} onUpdate={loadDoubts} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : null}
            </div>
        </DashboardLayout>
    );
}
