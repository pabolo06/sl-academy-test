'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { VideoPlayer } from '@/components/VideoPlayer';
import { TestForm } from '@/components/TestForm';
import { DoubtForm } from '@/components/DoubtForm';
import { DoubtCard } from '@/components/DoubtCard';
import { lessonApi, questionApi, testAttemptApi, doubtApi } from '@/lib/api';
import { LessonDetail, Question, TestAttemptAnswer, TestAttempt, Doubt, Lesson } from '@/types';
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

            // Load all lessons from the track for navigation
            if (lessonData.track_id) {
                const lessons = await lessonApi.getByTrack(lessonData.track_id);
                // Sort by position
                setTrackLessons(lessons.sort((a, b) => a.position - b.position));
            }

            // Auto-skip pre-test if empty
            if (preQuestions.length === 0) {
                setCurrentStep('video');
            }
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
        } catch (err: any) {
            console.error('Erro ao carregar dúvidas:', err);
        }
    };

    const handleDoubtSubmitted = () => {
        setShowDoubtForm(false);
        loadDoubts();
    };

    const handlePreTestSubmit = async (answers: TestAttemptAnswer[]) => {
        const result = await testAttemptApi.submit({
            lesson_id: lessonId,
            type: 'pre',
            answers,
        });

        setPreTestScore(result.score);
        setCurrentStep('video');
    };

    const handleVideoComplete = () => {
        if (postTestQuestions.length === 0) {
            setCurrentStep('completed');
        } else {
            setCurrentStep('post-test');
        }
    };

    const handlePostTestSubmit = async (answers: TestAttemptAnswer[]) => {
        const result = await testAttemptApi.submit({
            lesson_id: lessonId,
            type: 'post',
            answers,
        });

        setPostTestScore(result.score);
        setCurrentStep('completed');
    };

    const calculateImprovement = (): number => {
        if (preTestScore === null || postTestScore === null) return 0;
        return postTestScore - preTestScore;
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {error && (
                    <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                        <p className="text-red-200">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-700 rounded w-1/2"></div>
                        <div className="h-96 bg-gray-800 rounded-lg"></div>
                    </div>
                ) : lesson ? (
                    <>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                {lesson.title}
                            </h1>
                            {lesson.description && (
                                <p className="text-gray-400">{lesson.description}</p>
                            )}
                        </div>

                        {/* Track Lessons Navigation */}
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <div className="flex items-center justify-start gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {trackLessons.map((trackLesson, index) => (
                                    <div key={trackLesson.id} className="flex items-center flex-shrink-0">
                                        <button
                                            onClick={() => {
                                                if (trackLesson.id !== lessonId) {
                                                    router.push(`./${trackLesson.id}`);
                                                }
                                            }}
                                            className={`px-4 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all focus:outline-none whitespace-nowrap ${trackLesson.id === lessonId
                                                ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-lg scale-105'
                                                : trackLesson.position < (lesson?.position || 0)
                                                    ? 'bg-green-600 text-white hover:bg-green-500'
                                                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                                }`}
                                        >
                                            Aula {index + 1}
                                        </button>
                                        {index < trackLessons.length - 1 && (
                                            <div className={`w-8 md:w-12 h-1 mx-1 flex-shrink-0 ${trackLesson.position < (lesson?.position || 0)
                                                ? 'bg-green-600'
                                                : 'bg-gray-700'
                                                }`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pre-test */}
                        {currentStep === 'pre-test' && (
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h2 className="text-2xl font-semibold text-white mb-4">
                                    Pré-teste
                                </h2>
                                <p className="text-gray-400 mb-6">
                                    Complete o pré-teste antes de assistir ao vídeo
                                </p>
                                <TestForm
                                    questions={preTestQuestions}
                                    onSubmit={handlePreTestSubmit}
                                    testType="pre"
                                />
                            </div>
                        )}

                        {/* Video */}
                        {currentStep === 'video' && (
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h2 className="text-2xl font-semibold text-white mb-4">
                                    Video Aula
                                </h2>
                                {preTestScore !== null && (
                                    <div className="mb-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                                        <p className="text-blue-200">
                                            Pré-teste concluído: {preTestScore.toFixed(1)}%
                                        </p>
                                    </div>
                                )}
                                <VideoPlayer
                                    lessonId={lessonId}
                                    videoUrl={lesson.video_url}
                                    onComplete={handleVideoComplete}
                                />
                            </div>
                        )}

                        {/* Post-test */}
                        {currentStep === 'post-test' && (
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h2 className="text-2xl font-semibold text-white mb-4">
                                    Pós-teste
                                </h2>
                                <p className="text-gray-400 mb-6">
                                    Complete o pós-teste para avaliar seu aprendizado
                                </p>
                                <TestForm
                                    questions={postTestQuestions}
                                    onSubmit={handlePostTestSubmit}
                                    testType="post"
                                />
                            </div>
                        )}

                        {/* Completed */}
                        {currentStep === 'completed' && (
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                <h2 className="text-2xl font-semibold text-white mb-4">
                                    ✅ Aula Concluída!
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-gray-900 rounded-lg p-4">
                                        <p className="text-gray-400 text-sm mb-1">Pré-teste</p>
                                        <p className="text-2xl font-bold text-white">
                                            {preTestScore?.toFixed(1)}%
                                        </p>
                                    </div>

                                    <div className="bg-gray-900 rounded-lg p-4">
                                        <p className="text-gray-400 text-sm mb-1">Pós-teste</p>
                                        <p className="text-2xl font-bold text-white">
                                            {postTestScore?.toFixed(1)}%
                                        </p>
                                    </div>

                                    <div className="bg-gray-900 rounded-lg p-4">
                                        <p className="text-gray-400 text-sm mb-1">Melhoria</p>
                                        <p className={`text-2xl font-bold ${calculateImprovement() >= 0 ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {calculateImprovement() >= 0 ? '+' : ''}
                                            {calculateImprovement().toFixed(1)}%
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push('../../tracks')}
                                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                                >
                                    Voltar para Trilhas
                                </button>
                            </div>
                        )}

                        {/* Support Materials (Focal Point Doctors Only) */}
                        {user?.is_focal_point && (
                            <div className="bg-gray-800 rounded-lg p-6 border border-purple-700/50">
                                <div className="flex items-center gap-2 mb-4">
                                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <h2 className="text-2xl font-semibold text-white">
                                        Materiais de Apoio
                                    </h2>
                                    <span className="ml-2 px-2 py-1 bg-purple-900/50 text-purple-300 text-xs font-medium rounded">
                                        Ponto Focal
                                    </span>
                                </div>
                                <p className="text-gray-400 mb-4">
                                    Materiais exclusivos para médicos pontos focais desta trilha
                                </p>
                                <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
                                    <p className="text-sm text-purple-300 mb-3">
                                        Como ponto focal, você tem acesso a materiais adicionais para apoiar outros médicos:
                                    </p>
                                    <ul className="space-y-2 text-sm text-gray-300">
                                        <li className="flex items-start gap-2">
                                            <svg className="w-5 h-5 text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span>Guias de facilitação e roteiros de discussão</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <svg className="w-5 h-5 text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                            </svg>
                                            <span>Recursos complementares e referências bibliográficas</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <svg className="w-5 h-5 text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                            <span>Perguntas frequentes e respostas sugeridas</span>
                                        </li>
                                    </ul>
                                    <div className="mt-4 pt-4 border-t border-purple-700/50">
                                        <p className="text-xs text-gray-400">
                                            Nota: A funcionalidade completa de materiais de apoio estará disponível em breve.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Doubts Section */}
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-semibold text-white">
                                    Dúvidas sobre esta aula
                                </h2>
                                <button
                                    onClick={() => setShowDoubtForm(!showDoubtForm)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    {showDoubtForm ? 'Cancelar' : 'Nova Dúvida'}
                                </button>
                            </div>

                            {showDoubtForm && (
                                <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
                                    <DoubtForm lessonId={lessonId} onSuccess={handleDoubtSubmitted} />
                                </div>
                            )}

                            <div className="space-y-4">
                                {doubts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-400">Nenhuma dúvida ainda</p>
                                        <button
                                            onClick={() => setShowDoubtForm(true)}
                                            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                        >
                                            Fazer Primeira Pergunta
                                        </button>
                                    </div>
                                ) : (
                                    doubts.map((doubt) => (
                                        <DoubtCard key={doubt.id} doubt={doubt} onUpdate={loadDoubts} />
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </DashboardLayout>
    );
}
