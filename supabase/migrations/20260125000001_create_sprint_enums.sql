-- Migration: Create Sprint Enums and Helper Functions
-- Date: 2026-01-25
-- Purpose: Foundation types and utilities for Sprint Focus System

-- ============================================================
-- ENUMS
-- ============================================================

-- Sprint status enum
CREATE TYPE sprint_status AS ENUM ('active', 'completed');

-- Metric type enum
CREATE TYPE metric_type AS ENUM ('sleep', 'boolean', 'duration');


-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Updated_at trigger function (reusable)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Helper function to check if running as service role
-- Hardened to never throw on malformed JSON or missing settings
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Try the direct claim first (more reliable)
  BEGIN
    v_role := current_setting('request.jwt.claim.role', true);
    IF v_role = 'service_role' THEN
      RETURN TRUE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors from missing/invalid settings
  END;

  -- Try parsing the claims JSON
  BEGIN
    v_role := current_setting('request.jwt.claims', true)::json->>'role';
    IF v_role = 'service_role' THEN
      RETURN TRUE;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors from malformed JSON
  END;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================
-- VERIFICATION
-- ============================================================

-- Verify enums created
SELECT typname FROM pg_type WHERE typname IN ('sprint_status', 'metric_type');

-- Verify functions created
SELECT proname FROM pg_proc WHERE proname IN ('update_updated_at', 'is_service_role');
