'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { trackApi } from '@/lib/api';
import { Track } from '@/types';

function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-4 w-20" />
      </div>
    </div>
  );
}

export default function TracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await trackApi.getAll();
      setTracks(data.filter((t) => !t.deleted_at));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar trilhas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Trilhas de Aprendizado</h1>
            <p className="page-subtitle">Explore as trilhas disponíveis e comece sua jornada</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-error">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p>{error}</p>
              <button onClick={loadTracks} className="mt-1.5 text-red-300 hover:text-red-200 underline text-xs">Tentar novamente</button>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : tracks.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <svg className="empty-state-icon" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="empty-state-title">Nenhuma trilha disponível</p>
              <p className="empty-state-text">As trilhas de aprendizado aparecerão aqui quando forem criadas</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks.map((track) => (
              <Link
                key={track.id}
                href={`/tracks/${track.id}`}
                className="card-hover p-5 flex flex-col group"
              >
                {/* Icon + title */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors leading-snug">
                      {track.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                {track.description && (
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3 flex-1">
                    {track.description}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.05] mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                    {track.lesson_count || 0} {track.lesson_count === 1 ? 'aula' : 'aulas'}
                  </div>
                  <span className="text-xs text-blue-400 font-medium group-hover:text-blue-300 flex items-center gap-1">
                    Ver trilha
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
