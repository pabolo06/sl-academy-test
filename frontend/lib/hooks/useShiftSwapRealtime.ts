'use client';

/**
 * useShiftSwapRealtime — Supabase Realtime hook for shift swap requests.
 *
 * Listens for INSERT events on `shift_swap_requests` filtered by hospital_id.
 * Fires a non-obtrusive toast notification when a new swap request arrives.
 *
 * Properly cleans up the subscription in the useEffect return to prevent
 * memory leaks on unmount.
 */

import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

interface UseShiftSwapRealtimeOptions {
    hospitalId: string | undefined;
    enabled?: boolean;
}

export function useShiftSwapRealtime({
    hospitalId,
    enabled = true,
}: UseShiftSwapRealtimeOptions) {
    const { showToast } = useToast();
    // Ref to avoid stale closure over showToast
    const showToastRef = useRef(showToast);
    showToastRef.current = showToast;

    useEffect(() => {
        if (!enabled || !hospitalId || !isSupabaseConfigured()) return;

        const channel = supabase
            .channel(`swap-requests-${hospitalId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'shift_swap_requests',
                    filter: `hospital_id=eq.${hospitalId}`,
                },
                (payload) => {
                    const record = payload.new as Record<string, any>;
                    showToastRef.current(
                        'info',
                        'Nova solicitação de troca de plantão',
                        `Um médico solicitou uma troca para o dia ${record.slot_date ?? '—'}.`,
                    );
                },
            )
            .subscribe();

        // Cleanup: unsubscribe to prevent memory leaks
        return () => {
            supabase.removeChannel(channel);
        };
    }, [hospitalId, enabled]);
}
