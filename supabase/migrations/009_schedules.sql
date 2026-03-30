-- Escala de plantonistas médicos
-- Tabelas para gerenciar escalas semanais com drag-and-drop Kanban

-- Semana de escala
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft' | 'published'
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(hospital_id, week_start)
);

-- Cada slot: um médico em um dia+turno específico
CREATE TABLE schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  shift TEXT NOT NULL, -- 'morning' | 'afternoon' | 'night'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, doctor_id, slot_date, shift)
);

-- Enable RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schedules
CREATE POLICY "Users can view schedules from their hospital"
  ON schedules FOR SELECT
  USING (hospital_id = public.user_hospital_id());

CREATE POLICY "Managers can create schedules"
  ON schedules FOR INSERT
  WITH CHECK (
    hospital_id = public.user_hospital_id() AND
    public.is_manager()
  );

CREATE POLICY "Managers can update schedules"
  ON schedules FOR UPDATE
  USING (
    hospital_id = public.user_hospital_id() AND
    public.is_manager()
  )
  WITH CHECK (
    hospital_id = public.user_hospital_id() AND
    public.is_manager()
  );

CREATE POLICY "Managers can delete schedules"
  ON schedules FOR DELETE
  USING (
    hospital_id = public.user_hospital_id() AND
    public.is_manager()
  );

-- RLS Policies for schedule_slots
CREATE POLICY "Users can view slots from their hospital's schedules"
  ON schedule_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_slots.schedule_id
      AND s.hospital_id = public.user_hospital_id()
    )
  );

CREATE POLICY "Managers can create slots"
  ON schedule_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_slots.schedule_id
      AND s.hospital_id = public.user_hospital_id()
      AND public.is_manager()
    )
  );

CREATE POLICY "Managers can delete slots"
  ON schedule_slots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_slots.schedule_id
      AND s.hospital_id = public.user_hospital_id()
      AND public.is_manager()
    )
  );

-- Indexes for performance
CREATE INDEX idx_schedules_hospital_week ON schedules(hospital_id, week_start);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedule_slots_schedule ON schedule_slots(schedule_id);
CREATE INDEX idx_schedule_slots_doctor ON schedule_slots(doctor_id);
CREATE INDEX idx_schedule_slots_date ON schedule_slots(slot_date);
CREATE INDEX idx_schedule_slots_shift ON schedule_slots(shift);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedules_update_timestamp
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_schedules_updated_at();
