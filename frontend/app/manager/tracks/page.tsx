/**
 * SL Academy Platform - Track Management Page
 * Create, edit, and delete tracks (manager only)
 */

'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { trackApi } from '@/lib/api';
import { Track } from '@/types';

export default function TrackManagementPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await trackApi.getAll();
      setTracks(data.filter(t => !t.deleted_at));
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
  };

  const handleEdit = (track: Track) => {
    setEditingTrack(track);
    setFormData({ title: track.title, description: track.description || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Título é obrigatório');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingTrack) {
        await trackApi.update(editingTrack.id, formData);
      } else {
        await trackApi.create(formData);
      }

      setShowForm(false);
      setFormData({ title: '', description: '' });
      setEditingTrack(null);
      fetchTracks();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar trilha');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (trackId: string) => {
    if (deleteConfirm !== trackId) {
      setDeleteConfirm(trackId);
      return;
    }

    try {
      await trackApi.delete(trackId);
      setDeleteConfirm(null);
      fetchTracks();
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Gerenciar Trilhas</h1>
            <p className="text-gray-400 mt-1">Crie e organize trilhas de aprendizado</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Nova Trilha
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingTrack ? 'Editar Trilha' : 'Nova Trilha'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome da trilha"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição da trilha"
                  disabled={isSubmitting}
                />
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
        ) : tracks.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">Nenhuma trilha criada ainda</p>
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Criar Primeira Trilha
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracks.map((track) => (
              <div key={track.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{track.title}</h3>
                    {track.description && (
                      <p className="text-sm text-gray-400 mt-1">{track.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{track.lesson_count || 0} aulas</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.href = `./tracks/${track.id}/lessons`}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                  >
                    Gerenciar Aulas
                  </button>
                  <button
                    onClick={() => handleEdit(track)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(track.id)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${deleteConfirm === track.id
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                  >
                    {deleteConfirm === track.id ? 'Confirmar?' : 'Excluir'}
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
