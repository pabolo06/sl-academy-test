-- Hospital FHIR/EHR Integration Configuration
-- Stores webhook endpoints and auth tokens for outbound FHIR notifications
CREATE TABLE IF NOT EXISTS hospital_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'FHIR Webhook',
    webhook_url TEXT NOT NULL,
    auth_token TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(hospital_id, webhook_url)
);
-- RLS: only hospital managers can view/edit their own integrations
ALTER TABLE hospital_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hospital_integrations_select" ON hospital_integrations FOR
SELECT USING (
        hospital_id IN (
            SELECT hospital_id
            FROM profiles
            WHERE id = auth.uid()
        )
    );
CREATE POLICY "hospital_integrations_insert" ON hospital_integrations FOR
INSERT WITH CHECK (
        hospital_id IN (
            SELECT hospital_id
            FROM profiles
            WHERE id = auth.uid()
                AND role = 'manager'
        )
    );
CREATE POLICY "hospital_integrations_update" ON hospital_integrations FOR
UPDATE USING (
        hospital_id IN (
            SELECT hospital_id
            FROM profiles
            WHERE id = auth.uid()
                AND role = 'manager'
        )
    );
-- Index for fast lookup by hospital
CREATE INDEX IF NOT EXISTS idx_hospital_integrations_hospital ON hospital_integrations(hospital_id)
WHERE is_active = true;
-- Enable realtime for shift_swap_requests (used by frontend Realtime hook)
ALTER PUBLICATION supabase_realtime
ADD TABLE shift_swap_requests;