-- Rename hospital from "Hospital Teste" to "Hospital Santa Lucia"
UPDATE public.hospitals
SET name = 'Hospital Santa Lucia'
WHERE name = 'Hospital Teste';
