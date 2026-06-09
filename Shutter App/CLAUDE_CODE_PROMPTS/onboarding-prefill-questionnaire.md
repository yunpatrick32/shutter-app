# Claude Code Prompt — Onboarding Prefill Questionnaire

## Context
Shutter is a map-first freelance marketplace for outdoor sports / creative talent, launching around Lake Tahoe. Vanilla JS/HTML/CSS + Mapbox GL JS + Supabase.

- **Live site:** https://shutterfind.app
- **Local path:** ~/My App/
- **Key files:** `src/data.js` (TAG_META tag definitions), `src/app.js` (all logic), `index.html` (markup + script tags), `supabase/` (migrations + Edge Functions)

Full design rationale: `~/My App/Shutter App/ONBOARDING_QUESTIONNAIRE_SPEC.md`. Read it first.

## Goal
Build a **5-question, slide-by-slide onboarding questionnaire** that runs from an Instagram-ad link **before** the user creates an account, and **prefills their Shutter profile** so signup is "confirm what you already typed," not "fill out a form." One question per screen, no peeking ahead, progress shown as `1 of 5` … `4 of 5 · Almost done!` … `5 of 5`. Everything editable later in My Profile.

This is NOT the Bookable Score quiz (separate Lovable build). This feeds the existing `shutterfind.app` join flow.

---

## CRITICAL CODE RULES (do not break)
1. **Cache bust:** increment the `?v=N` on the `app.js` `<script>` tag in `index.html` to the next integer (whatever N is currently live → N+1). Do this once for this whole change.
2. **Window exposure:** any function referenced in an inline `onclick=` (or other inline handler) MUST be assigned on `window`.
3. **No `//` comments inside single-line functions.**
4. **`toCreator(r)` mapper:** every new DB column must be added to `toCreator(r)`. This change adds `rate_band` → `rateBand`, `show_rates` → `showRates`, and `portfolio_url` → `portfolioUrl`.
5. If any map/location picker is used, keep `pointer-events: none` on the picker overlay.
6. Do not use a Supabase OR filter for the chat queries (unrelated, just don't touch the two-query chat pattern).

---

## 1. Database migration
Create `supabase/migrations/<date>_onboarding_responses.sql`:

```sql
create table if not exists public.onboarding_responses (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null,
  primary_role text,
  city         text,
  rate_band    text,
  show_rates   boolean default true,
  specialties  text[] default '{}',
  contact      text,
  source       text,
  step_reached int default 1,
  completed    boolean default false,
  claimed_by   uuid references auth.users(id),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists onboarding_session_idx on public.onboarding_responses (session_id);
alter table public.onboarding_responses enable row level security;
create policy "anon insert" on public.onboarding_responses for insert to anon with check (true);
create policy "anon update" on public.onboarding_responses for update to anon using (true) with check (true);

-- profile columns to receive prefilled data
alter table public.profiles add column if not exists rate_band text;
alter table public.profiles add column if not exists show_rates boolean default true;
alter table public.profiles add column if not exists portfolio_url text;
```

(`profiles` already has `specialty`, `specialties text[]`, `city`, `handle`, `signup_source`.)

---

## 2. The questionnaire screen (`app.js` + `index.html`)
New route/state reachable at `/start` (and `#start`), mobile-first, dark/cinematic to match the brand. One screen at a time, progress bar + `X of 5` header, Back arrow (no forward skip). Single-selects auto-advance on tap; Q4 multi-select and Q5 text use a Next button. Smooth slide transition.

- **Q1 — `1 of 5` — "What's your main craft?"** Single-select searchable dropdown built from `TAG_META` keys (Photographer, Videographer, Drone Op, Film Photographer, B-Roll Cam, DP, 1st AC, 2nd AC, Director, AD, 2nd AD, Producer, PA, Editor, Colorist, Motion Graphics, Sound, Gaffer, Stylist, Model, Snowboard, Ski, Off-Road). Stores `primary_role`; also seeds `specialties[]`.
- **Q2 — `2 of 5` — "Where are you based?"** Tap-list: Truckee, Tahoe City, South Lake Tahoe, Incline Village, Kings Beach, Reno, "Somewhere else" (reveals a text field). Stores `city`.
- **Q3 — `3 of 5` — "What's your typical day rate?"** Tap-list: Under $300, $300–600, $600–1,000, $1,000+, "Depends on the job" (stores `null` band). Stores `rate_band`. Below the bands, a **"Show my rate on my profile" toggle** (`show_rates`, default ON). When OFF, the band is still saved but the public profile/map card renders "Rate on request" instead of the number. Selecting "Depends on the job" uses the same client-facing copy. Because this screen now has a toggle, it does NOT auto-advance — show a Next button.
- **Q4 — `4 of 5 · Almost done!` — "What else do you bring to a shoot?"** Multi-select chips: Drone, Editing, Color, Sound, Lighting/Gaffer, Photo, Video, Styling, FAA Part 107, Owns own gear, Will travel → Next. Merge into `specialties[]` with Q1.
- **Q5 — `5 of 5` — "Where can clients see your work?"** Text input accepting an Instagram handle or a portfolio URL → Next. Stores `contact` (and on claim, routes to `handle` if it looks like an @handle, else `portfolio_url`).

Then the **claim screen** (not numbered): headline "You're on the map. Create your account to claim your profile," with the existing Google OAuth + email magic-link buttons.

---

## 3. State & data writes
- On load: generate a `session_id` uuid → `localStorage['shutter.onboarding']` as a JSON blob of answers; read `?src=` / `utm_source` into `source` (reuse the existing signup-source capture).
- After **each** answer: upsert the `onboarding_responses` row by `session_id` (set the answered field, bump `step_reached`, `updated_at`). This powers the drop-off funnel.
- On claim screen: set `completed = true`.
- On successful account creation: read the localStorage answers and **include them in the `profiles` INSERT** (`specialty` = primary_role, `specialties`, `city`, `rate_band`, `show_rates`, `handle`/`portfolio_url`, `signup_source` = source or `'onboarding'`); then `update onboarding_responses set claimed_by = auth.uid() where session_id = ...`. Land the user in My Profile with fields prefilled and editable. Note: OAuth redirects away and back — the `localStorage` answers + `session_id` MUST survive the round-trip and be applied on the post-auth return.
- All questionnaire handlers used in inline `onclick=` must be on `window` (see rule 2).

---

## 4. My Profile
No redesign needed — just confirm the prefilled values (specialty, specialties, city, rate_band, show_rates, handle/portfolio_url) render in the existing My Profile editor and are editable/saveable. Add the rate-band, show-rates toggle, and portfolio fields to the editor if they aren't already shown. The public profile and map card must honor `showRates`: render the rate band when true, "Rate on request" when false.

---

## 5. Acceptance checks
- `/start?src=ig_ad` loads the questionnaire with no login; `?src` is captured.
- Five screens, one question each, correct `X of 5` headers incl. "Almost done!" on 4; can't skip ahead; Back works.
- Each answer writes/updates one `onboarding_responses` row keyed by `session_id`; `step_reached` advances; `completed` flips on the claim screen.
- Completing signup creates a `profiles` row prefilled from the answers, sets `claimed_by`, and lands in an editable My Profile.
- `toCreator(r)` returns `rateBand`, `showRates`, + `portfolioUrl`.
- Q3 "Show my rate" toggle persists to `show_rates`; public profile shows "Rate on request" when off.
- `?v=N` incremented by exactly 1 on the `app.js` script tag.

## Deploy
```
cd ~/My\ App && git add . && git commit -m "feat: onboarding prefill questionnaire (/start)" && git push
npx supabase db push   # or run the migration in the Supabase SQL editor
```
