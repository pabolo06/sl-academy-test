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
        if (lessonId) {
            loadLessonData();
            loadDoubts();
        }
    }, [lessonId]);

    const loadLessonData = async () => {
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
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar aula');
        } finally {
            setLoading(false);
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

    const improvement = preTestScore !== null && postTestScore !== null ? postTestScore - preTestScore : null;

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {error && (
                    <div className="alert-error">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <p>{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-4">
                        <div className="skeleton h-7 w-1/2 rounded-lg" />
                        <div className="skeleton h-4 w-3/4 rounded" />
                        <div className="skeleton h-64 w-full rounded-xl" />
                    </div>
                ) : lesson ? (
                    <>
                        {/* Lesson header */}
                        <div>
                            <h1 className="page-title">{lesson.title}</h1>
                            {lesson.description && (
                                <p className="page-subtitle mt-1">{lesson.description}</p>
                            )}
                        </div>

                        {/* Track navigation pills */}
                        {trackLessons.length > 1 && (
                            <div className="card p-4">
                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                    {trackLessons.map((tl, index) => {
                                        const isCurrent = tl.id === lessonId;
                                        const isPast = tl.position < (lesson?.position ?? 0);
                                        return (
                                            <div key={tl.id} className="flex items-center flex-shrink-0">
                                                <button
                                                    onClick={() => { if (!isCurrent) router.push(`./${tl.id}`); }}
                                                    className={`px-3.5 h-9 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                                                        isCurrent
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                            : isPast
                                                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                                                            : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                                                    }`}
                                                >
                                                    Aula {index + 1}
                                                </button>
                                                {index < trackLessons.length - 1 && (
                                                    <div className={`w-6 h-0.5 mx-1 ${isPast ? 'bg-emerald-600/40' : 'bg-white/10'}`} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Pre-test */}
                        {currentStep === 'pre-test' && (
                            <div className="card p-6 space-y-4">
                                <div>
                                    <h2 className="section-title">Pré-teste</h2>
                                    <p className="text-sm text-slate-400 mt-1">Complete o pré-teste antes de assistir ao vídeo</p>
                                </div>
                                <TestForm questions={preTestQuestions} onSubmit={handlePreTestSubmit} testType="pre" />
                            </div>
                        )}

                        {/* Video */}
                        {currentStep === 'video' && (
                            <div className="card p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="section-title">Video Aula</h2>
                                    {preTestScore !== null && (
                                        <span className="badge-blue">Pré-teste: {preTestScore.toFixed(1)}%</span>
                                    )}
                                </div>
                                <VideoPlayer
                                    lessonId={lessonId}
                                    videoUrl={lesson.video_url}
                                    onComplete={handleVideoComplete}
                                />
                            </div>
                        )}

                        {/* Post-test */}
                        {currentStep === 'post-test' && (
                            <div className="card p-6 space-y-4">
                                <div>
                                    <h2 className="section-title">Pós-teste</h2>
                                    <p className="text-sm text-slate-400 mt-1">Complete o pós-teste para avaliar seu aprendizado</p>
                                </div>
                                <TestForm questions={postTestQuestions} onSubmit={handlePostTestSubmit} testType="post" />
                            </div>
                        )}

                        {/* Completed */}
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
                                    <div className="card p-4 text-center">
                                        <p className="text-2xl font-bold text-slate-100 tabular-nums">
                                            {preTestScore !== null ? `${preTestScore.toFixed(0)}%` : '—'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">Pré-teste</p>
                                    </div>
                                    <div className="card p-4 text-center">
                                        <p className="text-2xl font-bold text-slate-100 tabular-nums">
                                            {postTestScore !== null ? `${postTestScore.toFixed(0)}%` : '—'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">Pós-teste</p>
                                    </div>
                                    <div className="card p-4 text-center">
                                        <p className={`text-2xl font-bold tabular-nums ${
                                            improvement !== null
                                                ? improvement >= 0 ? 'text-emerald-400' : 'text-red-400'
                                                : 'text-slate-500'
                                        }`}>
                                            {improvement !== null ? `${improvement >= 0 ? '+' : ''}${improvement.toFixed(0)}%` : '—'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">Melhoria</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push('/tracks')}
                                    className="btn-primary w-full justify-center"
                                >
                                    Voltar para Trilhas
                                </button>
                            </div>
                        )}

                        {/* Focal point materials */}
                        {user?.is_focal_point && (
                            <div className="card p-6 border-purple-500/20 space-y-4">
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <h2 className="section-title">Materiais de Apoio</h2>
                                    <span className="px-2 py-0.5 bg-purple-500/15 text-purple-400 border border-purple-500/20 text-xs font-medium rounded-full">Ponto Focal</span>
                                </div>
                                <p className="text-xs text-slate-500">Materiais exclusivos para médicos pontos focais desta trilha. A funcionalidade completa estará disponível em breve.</p>
                            </div>
                        )}

                        {/* Doubts */}
                        <div className="card p-6 space-y-4">
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
                                <div className="empty-state py-10">
                                    <svg className="w-10 h-10 text-slate-600 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                    </svg>
                                    <p className="empty-state-title">Nenhuma dúvida ainda</p>
                                    <button onClick={() => setShowDoubtForm(true)} className="btn-primary mt-3">
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
