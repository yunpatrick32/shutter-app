-- Onboarding prefill questionnaire: new table + profile columns.
-- Run in Supabase SQL Editor.

-- New profile columns (idempotent) — half_day_rate, full_day_rate, show_rates, portfolio_url
-- already exist from earlier migrations; this is a safety net.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS half_day_rate int;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_day_rate int;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_rates boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_url text;

-- Onboarding responses table (captures funnel even for non-signups)
CREATE TABLE IF NOT EXISTS public.onboarding_responses (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   text        NOT NULL UNIQUE,
  primary_role text,
  city         text,
  half_day_rate int,
  full_day_rate int,
  show_rates   boolean     DEFAULT true,
  specialties  text[]      DEFAULT '{}',
  contact      text,
  source       text,
  step_reached int         DEFAULT 1,
  completed    boolean     DEFAULT false,
  claimed_by   uuid        REFERENCES auth.users(id),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS onboarding_session_idx ON public.onboarding_responses (session_id);

ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ob anon insert"  ON public.onboarding_responses;
DROP POLICY IF EXISTS "ob anon update"  ON public.onboarding_responses;
DROP POLICY IF EXISTS "ob auth insert"  ON public.onboarding_responses;
DROP POLICY IF EXISTS "ob auth update"  ON public.onboarding_responses;

-- Anyone (anon + authed) can insert a row for their session
CREATE POLICY "ob anon insert" ON public.onboarding_responses
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "ob auth insert" ON public.onboarding_responses
  FOR INSERT TO authenticated WITH CHECK (true);

-- Anyone can update their own session row (no public read)
CREATE POLICY "ob anon update" ON public.onboarding_responses
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "ob auth update" ON public.onboarding_responses
  FOR UPDATE TO authenticated
  USING (claimed_by = auth.uid() OR claimed_by IS NULL)
  WITH CHECK (true);
