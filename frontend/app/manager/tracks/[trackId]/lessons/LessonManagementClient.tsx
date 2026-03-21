'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { trackApi, lessonApi } from '@/lib/api';
import { Track, Lesson } from '@/types';

function SkeletonLesson() {
    return (
        <div className="card p-4 flex items-start gap-4">
            <div className="skeleton w-12 h-12 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-3 w-3/4" />
                <div className="skeleton h-3 w-1/3" />
            </div>
            <div className="flex gap-2">
                <div className="skeleton h-9 w-16 rounded-lg" />
                <div className="skeleton h-9 w-16 rounded-lg" />
            </div>
        </div>
    );
}

export default function LessonManagementClient() {
    const params = useParams();
    const router = useRouter();
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
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        if (trackId) fetchTrackAndLessons();
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
        setFormData({ title: '', description: '', video_url: '', duration_seconds: 0, position: nextPosition });
        setShowForm(true);
        setError(null);
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
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) { setError('Título é obrigatório'); return; }
        if (!formData.video_url.trim()) { setError('URL do vídeo é obrigatória'); return; }
        if (formData.duration_seconds <= 0) { setError('Duração deve ser maior que zero'); return; }

        const duplicate = lessons.find(l => l.position === formData.position && l.id !== editingLesson?.id);
        if (duplicate) { setError(`Já existe uma aula na posição ${formData.position}`); return; }

        setIsSubmitting(true);
        setError(null);
        try {
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
                setSuccessMsg('Aula atualizada com sucesso');
            } else {
                await lessonApi.create(lessonData);
                setSuccessMsg('Aula criada com sucesso');
            }
            setShowForm(false);
            setFormData({ title: '', description: '', video_url: '', duration_seconds: 0, position: 0 });
            setEditingLesson(null);
            fetchTrackAndLessons();
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar aula');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (lessonId: string) => {
        if (deleteConfirm !== lessonId) { setDeleteConfirm(lessonId); return; }
        try {
            await lessonApi.delete(lessonId);
            setDeleteConfirm(null);
            setSuccessMsg('Aula excluída');
            fetchTrackAndLessons();
            setTimeout(() => setSuccessMsg(null), 3000);
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

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <DashboardLayout requiredRole="manager">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="page-header">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/manager/tracks')}
                            className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                            aria-label="Voltar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="page-title">{track?.title || 'Gerenciar Aulas'}</h1>
                            <p className="page-subtitle">Aulas desta trilha</p>
                        </div>
                    </div>
                    <button onClick={handleCreate} className="btn-primary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Nova Aula
                    </button>
                </div>

                {/* Success toast */}
                {successMsg && (
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {successMsg}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="alert-error">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        <div>
                            <p>{error}</p>
                            <button onClick={() => setError(null)} className="mt-1 text-red-300 hover:text-red-200 underline text-xs">Fechar</button>
                        </div>
                    </div>
                )}

                {/* Form */}
                {showForm && (
                    <div className="card p-6 space-y-4">
                        <h2 className="section-title">{editingLesson ? 'Editar Aula' : 'Nova Aula'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="form-label">Título *</label>
                                <input
                                    id="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="form-input"
                                    placeholder="Nome da aula"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="form-label">Descrição</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="form-input resize-none"
                                    placeholder="Descrição da aula (opcional)"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label htmlFor="video_url" className="form-label">URL do Vídeo *</label>
                                <input
                                    id="video_url"
                                    type="url"
                                    value={formData.video_url}
                                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                                    className="form-input"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Duração *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label htmlFor="duration_minutes" className="block text-xs text-slate-500 mb-1">Minutos</label>
                                            <input
                                                id="duration_minutes"
                                                type="number"
                                                min="0"
                                                value={Math.floor((formData.duration_seconds || 0) / 60)}
                                                onChange={(e) => {
                                                    const m = Math.max(0, parseInt(e.target.value) || 0);
                                                    const s = (formData.duration_seconds || 0) % 60;
                                                    setFormData({ ...formData, duration_seconds: m * 60 + s });
                                                }}
                                                className="form-input"
                                                disabled={isSubmitting}
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="duration_seconds" className="block text-xs text-slate-500 mb-1">Segundos</label>
                                            <input
                                                id="duration_seconds"
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={(formData.duration_seconds || 0) % 60}
                                                onChange={(e) => {
                                                    const m = Math.floor((formData.duration_seconds || 0) / 60);
                                                    const s = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                                                    setFormData({ ...formData, duration_seconds: m * 60 + s });
                                                }}
                                                className="form-input"
                                                disabled={isSubmitting}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="position" className="form-label">Posição *</label>
                                    <input
                                        id="position"
                                        type="number"
                                        min="0"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                                        className="form-input"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-primary flex-1 justify-center"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        editingLesson ? 'Salvar Alterações' : 'Criar Aula'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={isSubmitting}
                                    className="btn-secondary"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Lesson List */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <SkeletonLesson key={i} />)}
                    </div>
                ) : lessons.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <svg className="empty-state-icon" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                            </svg>
                            <p className="empty-state-title">Nenhuma aula ainda</p>
                            <p className="empty-state-text">Crie a primeira aula desta trilha</p>
                            <button onClick={handleCreate} className="btn-primary">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Criar Primeira Aula
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {lessons.map((lesson) => (
                            <div key={lesson.id} className="card p-4">
                                <div className="flex items-start gap-4">
                                    {/* Position badge */}
                                    <div className="flex-shrink-0 w-11 h-11 bg-blue-600/15 border border-blue-500/20 rounded-lg flex items-center justify-center">
                                        <span className="text-sm font-bold text-blue-400">{lesson.position}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-slate-100 leading-snug">{lesson.title}</h3>
                                        {lesson.description && (
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{lesson.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-1.5">
                                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {formatDuration(lesson.duration_seconds)}
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 truncate max-w-[240px]">
                                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                                </svg>
                                                <span className="truncate">{lesson.video_url}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleEdit(lesson)}
                                            className="px-3 py-1.5 text-xs font-medium bg-blue-600/15 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600/25 transition-colors"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(lesson.id)}
                                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${deleteConfirm === lesson.id
                                                ? 'bg-red-600 text-white border-red-500 hover:bg-red-700'
                                                : 'bg-white/5 text-slate-400 border-white/10 hover:text-red-400 hover:border-red-500/30'
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

                {/* Lesson count summary */}
                {!isLoading && lessons.length > 0 && (
                    <p className="text-xs text-slate-500 text-center pb-4">
                        {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'} nesta trilha
                    </p>
                )}
            </div>
        </DashboardLayout>
    );
}
