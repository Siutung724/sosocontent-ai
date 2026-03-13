-- ============================================================
-- Migration 003: Extend voice_profiles for MiniMax TTS
-- ============================================================

-- Add MiniMax-specific columns (safe: IF NOT EXISTS)
ALTER TABLE voice_profiles
  ADD COLUMN IF NOT EXISTS provider            TEXT NOT NULL DEFAULT 'minimax',
  ADD COLUMN IF NOT EXISTS provider_voice_id   TEXT,
  ADD COLUMN IF NOT EXISTS display_name        TEXT,
  ADD COLUMN IF NOT EXISTS description         TEXT,
  ADD COLUMN IF NOT EXISTS default_emotion     TEXT NOT NULL DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS default_speed       REAL NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS default_vol         REAL NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS default_pitch       REAL NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS is_default          BOOLEAN NOT NULL DEFAULT false;

-- Back-fill: set provider from old tts_provider column where present
UPDATE voice_profiles
  SET provider = tts_provider
  WHERE tts_provider IS NOT NULL AND provider = 'minimax';

-- Back-fill: set display_name from old name column where display_name is NULL
UPDATE voice_profiles
  SET display_name = name
  WHERE display_name IS NULL;

-- Back-fill: set provider_voice_id from old voice_id column where present
UPDATE voice_profiles
  SET provider_voice_id = voice_id
  WHERE voice_id IS NOT NULL AND provider_voice_id IS NULL;

-- Index for default-profile lookups
CREATE INDEX IF NOT EXISTS idx_voice_profiles_workspace_default
  ON voice_profiles(workspace_id, is_default);

-- RLS is already enabled from migration 002; existing policy covers new columns.
