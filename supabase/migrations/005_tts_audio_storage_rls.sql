-- ── 005_tts_audio_storage_rls.sql ─────────────────────────────────────────────
-- tts-audio bucket policies
-- Bucket should be set to PUBLIC in Supabase Dashboard so that
-- getPublicUrl() works for audio playback in the browser.
--
-- These RLS policies control WHO can upload/delete (service role only via
-- SUPABASE_SERVICE_ROLE_KEY bypasses RLS, so these are extra guard rails).

-- Allow public read (needed if bucket is public; harmless if private)
create policy "public can read tts audio"
  on storage.objects for select
  using (bucket_id = 'tts-audio');

-- Only service role (server-side) can insert — enforced at app level,
-- but this policy blocks accidental client-side uploads.
-- (service role bypasses RLS, so uploads via SUPABASE_SERVICE_ROLE_KEY still work)
create policy "service role only can upload tts audio"
  on storage.objects for insert
  to authenticated
  with check (false);  -- block all client-side uploads; server uses service role key

-- Only service role can delete
create policy "service role only can delete tts audio"
  on storage.objects for delete
  to authenticated
  using (false);
