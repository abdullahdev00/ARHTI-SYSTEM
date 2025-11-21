-- Migration 10: Remove role CHECK constraint to allow custom roles
-- This allows users to create any custom role (farmer, buyer, customer, supplier, broker, etc.)

-- Drop the existing CHECK constraint on partners.role
ALTER TABLE public.partners DROP CONSTRAINT IF EXISTS partners_role_check;

-- Verify the constraint is removed
-- The role column is now TEXT NOT NULL without any CHECK constraint
