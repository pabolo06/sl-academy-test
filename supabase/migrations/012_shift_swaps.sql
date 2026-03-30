-- Fase 3: Motor de Escalas Inteligente (AI Rostering)
-- Tabela de pedidos de troca de plantão com fluxo de aprovação humana

-- ============================================================================
-- SHIFT SWAP REQUESTS
-- Stores AI-initiated or doctor-initiated shift swap requests.
-- Approval is always a human-in-the-loop step (manager must approve).
-- The AI can CREATE requests but never APPROVE them.
-- ============================================================================

CREATE TYPE swap_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE shift_swap_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id     UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    requester_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    slot_id         UUID NOT NULL REFERENCES schedule_slots(id) ON DELETE CASCADE,
    reason          TEXT,
    status          swap_status NOT NULL DEFAULT 'pending',
    reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT no_self_swap CHECK (requester_id <> target_id)
);

CREATE INDEX idx_swap_requests_hospital  ON shift_swap_requests(hospital_id, status);
CREATE INDEX idx_swap_requests_requester ON shift_swap_requests(requester_id);
CREATE INDEX idx_swap_requests_target    ON shift_swap_requests(target_id);
CREATE INDEX idx_swap_requests_slot      ON shift_swap_requests(slot_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;

-- Doctors see their own requests (as requester or target)
CREATE POLICY "Doctors see their own swap requests"
  ON shift_swap_requests FOR SELECT
  USING (
    requester_id = auth.uid()
    OR target_id = auth.uid()
    OR public.is_manager()
  );

-- Doctors can only create requests for themselves
CREATE POLICY "Doctors can create swap requests"
  ON shift_swap_requests FOR INSERT
  WITH CHECK (
    requester_id = auth.uid()
    AND hospital_id = public.user_hospital_id()
  );

-- Only managers can approve / reject (UPDATE status)
CREATE POLICY "Managers can review swap requests"
  ON shift_swap_requests FOR UPDATE
  USING (
    hospital_id = public.user_hospital_id()
    AND public.is_manager()
  );

-- Doctors can delete their own pending requests (withdraw)
CREATE POLICY "Requester can withdraw pending requests"
  ON shift_swap_requests FOR DELETE
  USING (
    requester_id = auth.uid()
    AND status = 'pending'
  );

-- ── Comments ──────────────────────────────────────────────────────────────────

COMMENT ON TABLE shift_swap_requests IS
  'AI Rostering Phase 3: shift swap requests created via chat.
   The AI can draft requests; only managers can approve them (human-in-the-loop).';

COMMENT ON COLUMN shift_swap_requests.requester_id IS 'Doctor requesting the swap (gives away their slot).';
COMMENT ON COLUMN shift_swap_requests.target_id    IS 'Doctor being asked to take the slot.';
COMMENT ON COLUMN shift_swap_requests.slot_id      IS 'The specific schedule_slot being swapped.';
COMMENT ON COLUMN shift_swap_requests.reason       IS 'Natural-language reason provided by doctor or AI.';
