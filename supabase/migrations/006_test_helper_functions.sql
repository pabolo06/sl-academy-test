-- Test Helper Functions for RLS Testing
-- These functions help with property-based testing of RLS policies

-- ============================================================================
-- HELPER FUNCTION: Get tracks for a specific hospital
-- ============================================================================

CREATE OR REPLACE FUNCTION get_tracks_for_hospital(p_hospital_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    hospital_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.hospital_id,
        t.created_at,
        t.deleted_at
    FROM tracks t
    WHERE t.hospital_id = p_hospital_id
    AND t.deleted_at IS NULL;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Get indicators for a specific hospital
-- ============================================================================

CREATE OR REPLACE FUNCTION get_indicators_for_hospital(p_hospital_id UUID)
RETURNS TABLE (
    id UUID,
    hospital_id UUID,
    name TEXT,
    value NUMERIC,
    category TEXT,
    reference_date DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.hospital_id,
        i.name,
        i.value,
        i.category,
        i.reference_date,
        i.created_at,
        i.deleted_at
    FROM indicators i
    WHERE i.hospital_id = p_hospital_id
    AND i.deleted_at IS NULL;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_tracks_for_hospital(UUID) IS 'Test helper function to retrieve tracks for a specific hospital';
COMMENT ON FUNCTION get_indicators_for_hospital(UUID) IS 'Test helper function to retrieve indicators for a specific hospital';
