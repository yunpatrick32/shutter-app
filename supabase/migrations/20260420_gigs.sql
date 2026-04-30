-- Corrected Apr 21: creator_id + applicant_id are integer to match profiles.id schema.
-- Run in Supabase SQL Editor.
-- Gig Feed data model — per Dev Agent Report (Apr 17, 2026) §3.
-- Creators post location-tagged shoot opportunities; other creators apply.

CREATE TABLE IF NOT EXISTS public.gigs (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id          integer      NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title               text         NOT NULL,
  description         text,
  gig_type            text         NOT NULL CHECK (gig_type IN ('collab','paid','looking_for')),
  specialties         text[]       NOT NULL DEFAULT '{}',
  lat                 double precision NOT NULL,
  lng                 double precision NOT NULL,
  location_name       text,
  shoot_date          date         NOT NULL,
  shoot_start_time    time,
  duration_hours      numeric,
  rate_type           text         CHECK (rate_type IN ('hourly','half_day','full_day','negotiable') OR rate_type IS NULL),
  rate_amount_cents   integer,
  spots_available     integer      NOT NULL DEFAULT 1,
  spots_filled        integer      NOT NULL DEFAULT 0,
  status              text         NOT NULL DEFAULT 'open' CHECK (status IN ('open','filled','expired','cancelled')),
  expires_at          timestamptz  NOT NULL,
  created_at          timestamptz  NOT NULL DEFAULT now(),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gigs_status_date_idx  ON public.gigs (status, shoot_date);
CREATE INDEX IF NOT EXISTS gigs_specialties_idx  ON public.gigs USING gin (specialties);
CREATE INDEX IF NOT EXISTS gigs_creator_idx      ON public.gigs (creator_id);

-- updated_at auto-bump
CREATE OR REPLACE FUNCTION public.gigs_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS gigs_touch_updated_at ON public.gigs;
CREATE TRIGGER gigs_touch_updated_at
  BEFORE UPDATE ON public.gigs
  FOR EACH ROW EXECUTE FUNCTION public.gigs_touch_updated_at();

-- RLS
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gigs_select_open_or_own ON public.gigs;
CREATE POLICY gigs_select_open_or_own ON public.gigs
  FOR SELECT USING (
    status = 'open'
    OR auth.uid() = (SELECT user_id FROM public.profiles WHERE id = creator_id)
  );

DROP POLICY IF EXISTS gigs_insert_own ON public.gigs;
CREATE POLICY gigs_insert_own ON public.gigs
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = creator_id)
  );

DROP POLICY IF EXISTS gigs_update_own ON public.gigs;
CREATE POLICY gigs_update_own ON public.gigs
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = creator_id)
  );

DROP POLICY IF EXISTS gigs_delete_own ON public.gigs;
CREATE POLICY gigs_delete_own ON public.gigs
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = creator_id)
  );

-- ─── gig_applications ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gig_applications (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id          uuid         NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  applicant_id    integer      NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message         text,
  status          text         NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','withdrawn')),
  created_at      timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (gig_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS gig_apps_gig_idx        ON public.gig_applications (gig_id);
CREATE INDEX IF NOT EXISTS gig_apps_applicant_idx  ON public.gig_applications (applicant_id);

ALTER TABLE public.gig_applications ENABLE ROW LEVEL SECURITY;

-- An applicant can see their own apps; the gig poster can see apps on their gigs.
DROP POLICY IF EXISTS gig_apps_select ON public.gig_applications;
CREATE POLICY gig_apps_select ON public.gig_applications
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = applicant_id)
    OR auth.uid() = (
      SELECT p.user_id FROM public.profiles p
      JOIN public.gigs g ON g.creator_id = p.id
      WHERE g.id = gig_applications.gig_id
    )
  );

DROP POLICY IF EXISTS gig_apps_insert_own ON public.gig_applications;
CREATE POLICY gig_apps_insert_own ON public.gig_applications
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = applicant_id)
  );

-- Applicant can withdraw; gig poster can accept/decline.
DROP POLICY IF EXISTS gig_apps_update ON public.gig_applications;
CREATE POLICY gig_apps_update ON public.gig_applications
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM public.profiles WHERE id = applicant_id)
    OR auth.uid() = (
      SELECT p.user_id FROM public.profiles p
      JOIN public.gigs g ON g.creator_id = p.id
      WHERE g.id = gig_applications.gig_id
    )
  );
