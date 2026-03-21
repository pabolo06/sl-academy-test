'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { trackApi } from '@/lib/api';
import { Track } from '@/types';

function SkeletonTrack() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="skeleton h-5 w-1/2" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <div className="skeleton h-9 flex-1" />
        <div className="skeleton h-9 w-20" />
        <div className="skeleton h-9 w-20" />
      </div>
    </div>
  );
}

export default function TrackManagementPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { fetchTracks(); }, []);

  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await trackApi.getAll();
      setTracks(data.filter((t) => !t.deleted_at));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar trilhas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTrack(null);
    setFormData({ title: '', description: '' });
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (track: Track) => {
    setEditingTrack(track);
    setFormData({ title: track.title, description: track.description || '' });
    setShowForm(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { setError('Título é obrigatório'); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingTrack) {
        await trackApi.update(editingTrack.id, formData);
        setSuccessMsg('Trilha atualizada com sucesso');
      } else {
        await trackApi.create(formData);
        setSuccessMsg('Trilha criada com sucesso');
      }
      setShowForm(false);
      setFormData({ title: '', description: '' });
      setEditingTrack(null);
      fetchTracks();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar trilha');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (trackId: string) => {
    if (deleteConfirm !== trackId) { setDeleteConfirm(trackId); return; }
    try {
      await trackApi.delete(trackId);
      setDeleteConfirm(null);
      setSuccessMsg('Trilha excluída');
      fetchTracks();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir trilha');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ title: '', description: '' });
    setEditingTrack(null);
    setError(null);
  };

  return (
    <DashboardLayout requiredRole="manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Gerenciar Trilhas</h1>
            <p className="page-subtitle">Crie e organize trilhas de aprendizado</p>
          </div>
          <button onClick={handleCreate} className="btn-primary flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nova Trilha
          </button>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="alert-success">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{successMsg}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert-error">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">
                {editingTrack ? 'Editar Trilha' : 'Nova Trilha'}
              </h2>
              <button onClick={handleCancel} className="text-slate-500 hover:text-slate-300 transition-colors" aria-label="Fechar">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="form-label">
                  Título <span className="text-red-400">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                  placeholder="Nome da trilha"
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
                  placeholder="Descrição da trilha (opcional)"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Salvando...
                    </>
                  ) : editingTrack ? 'Salvar Alterações' : 'Criar Trilha'}
                </button>
                <button type="button" onClick={handleCancel} disabled={isSubmitting} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tracks list */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <SkeletonTrack key={i} />)}
          </div>
        ) : tracks.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <svg className="empty-state-icon" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="empty-state-title">Nenhuma trilha criada</p>
              <p className="empty-state-text">Crie a primeira trilha de aprendizado do hospital</p>
              <button onClick={handleCreate} className="btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Criar Primeira Trilha
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracks.map((track) => (
              <div key={track.id} className="card p-5">
                {/* Track info */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4.5 h-4.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white leading-snug">{track.title}</h3>
                    {track.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{track.description}</p>
                    )}
                  </div>
                </div>

                {/* Lesson count */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 pb-4 border-b border-white/[0.05]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                  {track.lesson_count || 0} {track.lesson_count === 1 ? 'aula' : 'aulas'}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/manager/tracks/${track.id}/lessons`}
                    className="btn-secondary flex-1 text-xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                    Aulas
                  </Link>
                  <button
                    onClick={() => handleEdit(track)}
                    className="btn-primary text-xs px-3"
                    aria-label={`Editar ${track.title}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(track.id)}
                    aria-label={deleteConfirm === track.id ? `Confirmar exclusão de ${track.title}` : `Excluir ${track.title}`}
                    className={`text-xs px-3 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                      deleteConfirm === track.id
                        ? 'bg-red-600 hover:bg-red-500 text-white border-transparent'
                        : 'bg-transparent hover:bg-red-500/10 text-slate-500 hover:text-red-400 border-white/10 hover:border-red-500/30'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    {deleteConfirm === track.id ? 'Confirmar' : 'Excluir'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
