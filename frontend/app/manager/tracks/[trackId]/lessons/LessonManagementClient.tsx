'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { trackApi, lessonApi } from '@/lib/api';
import { Track, Lesson } from '@/types';

export default function LessonManagementClient() {
    const params = useParams();
    const trackId = params.trackId as string;

    const [track, setTrack] = useState<Track | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        video_url: '',
        duration_seconds: 0,
        position: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [isFetchingDuration, setIsFetchingDuration] = useState(false);

    useEffect(() => {
        if (trackId) {
            fetchTrackAndLessons();
        }
    }, [trackId]);

    const fetchTrackAndLessons = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [trackData, lessonsData] = await Promise.all([
                trackApi.getById(trackId),
                lessonApi.getByTrack(trackId),
            ]);

            setTrack(trackData);
            setLessons(lessonsData.filter(l => !l.deleted_at).sort((a, b) => a.position - b.position));
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingLesson(null);
        const nextPosition = lessons.length > 0 ? Math.max(...lessons.map(l => l.position)) + 1 : 0;
        setFormData({
            title: '',
            description: '',
            video_url: '',
            duration_seconds: 0,
            position: nextPosition,
        });
        setShowForm(true);
    };

    const handleEdit = (lesson: Lesson) => {
        setEditingLesson(lesson);
        setFormData({
            title: lesson.title,
            description: lesson.description || '',
            video_url: lesson.video_url,
            duration_seconds: lesson.duration_seconds,
            position: lesson.position,
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            setError('Título é obrigatório');
            return;
        }
        if (!formData.video_url.trim()) {
            setError('URL do vídeo é obrigatória');
            return;
        }
        if (formData.duration_seconds <= 0) {
            setError('Duração deve ser maior que zero. Por favor, insira manualmente se não foi detectada automaticamente.');
            return;
        }
        if (formData.position < 0) {
            setError('Posição deve ser maior ou igual a zero');
            return;
        }

        // Check for duplicate position
        const duplicateOrder = lessons.find(
            l => l.position === formData.position && l.id !== editingLesson?.id
        );
        if (duplicateOrder) {
            setError(`Já existe uma aula na posição ${formData.position}`);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Ensure track_id is a valid UUID string
            const lessonData = {
                track_id: String(trackId),
                title: formData.title.trim(),
                description: formData.description?.trim() || '',
                video_url: formData.video_url.trim(),
                duration_seconds: Number(formData.duration_seconds),
                position: Number(formData.position),
            };

            if (editingLesson) {
                await lessonApi.update(editingLesson.id, lessonData);
            } else {
                await lessonApi.create(lessonData);
            }

            setShowForm(false);
            setFormData({ title: '', description: '', video_url: '', duration_seconds: 0, position: 0 });
            setEditingLesson(null);
            fetchTrackAndLessons();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar aula');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (lessonId: string) => {
        if (deleteConfirm !== lessonId) {
            setDeleteConfirm(lessonId);
            return;
        }

        try {
            await lessonApi.delete(lessonId);
            setDeleteConfirm(null);
            fetchTrackAndLessons();
        } catch (err: any) {
            setError(err.message || 'Erro ao excluir aula');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setFormData({ title: '', description: '', video_url: '', duration_seconds: 0, position: 0 });
        setEditingLesson(null);
        setError(null);
    };

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVideoUrlChange = (url: string) => {
        setFormData({ ...formData, video_url: url });
    };

    return (
        <DashboardLayout requiredRole="manager">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.location.href = '../../tracks'}
                        className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-white">{track?.title || 'Carregando...'}</h1>
                        <p className="text-gray-400 mt-1">Gerencie as aulas desta trilha</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Nova Aula
                    </button>
                </div>

                {showForm && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            {editingLesson ? 'Editar Aula' : 'Nova Aula'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                                        Título *
                                    </label>
                                    <input
                                        id="title"
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nome da aula"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                                        Descrição
                                    </label>
                                    <textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Descrição da aula"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label htmlFor="video_url" className="block text-sm font-medium text-gray-300 mb-2">
                                        URL do Vídeo *
                                    </label>
                                    <input
                                        id="video_url"
                                        type="url"
                                        value={formData.video_url}
                                        onChange={(e) => handleVideoUrlChange(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">
                                        Duração *
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label htmlFor="duration_minutes" className="block text-xs text-gray-400 mb-1">
                                                Minutos
                                            </label>
                                            <input
                                                id="duration_minutes"
                                                type="number"
                                                min="0"
                                                value={Math.floor((formData.duration_seconds || 0) / 60)}
                                                onChange={(e) => {
                                                    const minutes = Math.max(0, parseInt(e.target.value) || 0);
                                                    const seconds = (formData.duration_seconds || 0) % 60;
                                                    const total = minutes * 60 + seconds;
                                                    setFormData({ ...formData, duration_seconds: total });
                                                }}
                                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                disabled={isSubmitting}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="duration_seconds" className="block text-xs text-gray-400 mb-1">
                                                Segundos
                                            </label>
                                            <input
                                                id="duration_seconds"
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={(formData.duration_seconds || 0) % 60}
                                                onChange={(e) => {
                                                    const minutes = Math.floor((formData.duration_seconds || 0) / 60);
                                                    const seconds = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                                                    const total = minutes * 60 + seconds;
                                                    setFormData({ ...formData, duration_seconds: total });
                                                }}
                                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                disabled={isSubmitting}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="position" className="block text-sm font-medium text-gray-300 mb-2">
                                        Posição *
                                    </label>
                                    <input
                                        id="position"
                                        type="number"
                                        min="0"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : lessons.length === 0 ? (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                        <p className="text-gray-400 mb-4">Nenhuma aula criada ainda</p>
                        <button
                            onClick={handleCreate}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                            Criar Primeira Aula
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {lessons.map((lesson) => (
                            <div key={lesson.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                                        <span className="text-lg font-bold text-white">{lesson.position}</span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-white">{lesson.title}</h3>
                                        {lesson.description && (
                                            <p className="text-sm text-gray-400 mt-1">{lesson.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                            <span>⏱️ {formatDuration(lesson.duration_seconds)}</span>
                                            <span className="truncate">🎥 {lesson.video_url}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(lesson)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(lesson.id)}
                                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${deleteConfirm === lesson.id
                                                ? 'bg-red-600 text-white hover:bg-red-700'
                                                : 'bg-gray-700 text-white hover:bg-gray-600'
                                                }`}
                                        >
                                            {deleteConfirm === lesson.id ? 'Confirmar?' : 'Excluir'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
