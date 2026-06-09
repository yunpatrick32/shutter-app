# Onboarding Prefill Questionnaire — Design Spec

*Author: Dev Agent · Jun 9, 2026 · Status: spec for build (staged prompt: `CLAUDE_CODE_PROMPTS/onboarding-prefill-questionnaire.md`)*

---

## 1. What this is

A 5-question, slide-by-slide questionnaire that a creative lands on **from an Instagram (or other paid) ad** — *before* they create an account. Each answer prefills a field on their Shutter profile, so when they sign up the profile is already built and they only have to confirm/edit. The goal is to move the friction from "fill out a whole profile after login" to "tap five times, then claim what you already made."

This is **separate** from the Bookable Score quiz (`masterplan.md` / `lovable-build-prompt.md`). That one is a lead-magnet that scores bookability and captures an email. This one collects real profile data and feeds the existing `shutterfind.app` join flow.

### Design principles (from Patrick)
- **One question per screen.** They never see the next question — no wall-of-form intimidation.
- **Exactly 5 questions.** Just enough to prefill the profile, few enough that they don't bail.
- **Visible progress** with momentum language: `1 of 5` → `2 of 5` → `3 of 5` → `4 of 5 · Almost done!` → `5 of 5`.
- **No login to start.** Account creation comes *after* the score of small wins, framed as claiming the profile they just built.
- **Everything is editable later** in My Profile.

---

## 2. The 5 questions

Single-selects auto-advance on tap (no Next button needed). The one multi-select (Q4) and the text inputs (Q5) get a Next button.

| # | Screen header | Question | Input | Prefills |
|---|---------------|----------|-------|----------|
| 1 | `1 of 5` | "What's your main craft?" | **Dropdown / tap-list, single-select** — full role list (below) | `profiles.specialty` (primary role) + seeds `specialties[]` |
| 2 | `2 of 5` | "Where are you based?" | Single-select tap-list — Tahoe-area towns + "Somewhere else" (reveals a text field) | `profiles.city` (drives map pin) |
| 3 | `3 of 5` | "What are your rates?" | **Half-day + full-day rate inputs** + **"Show my rates on my profile" toggle** | `profiles.half_day_rate` + `profiles.full_day_rate` + `profiles.show_rates` |
| 4 | `4 of 5 · Almost done!` | "What else do you bring to a shoot?" | **Multi-select** chips (gear/skills) → Next | `profiles.specialties[]` (merged with Q1) |
| 5 | `5 of 5` | "Where can clients see your work?" | Text — Instagram handle **or** portfolio URL → Next | `profiles.handle` / `profiles.portfolio_url` |

After Q5 → **claim screen** (not numbered): *"You're on the map. Create your account to claim your profile."* → Google OAuth or email magic link → lands in My Profile, prefilled.

### Q1 primary-role options (reuse existing `TAG_META` keys)
Photographer, Videographer, Drone Op, Film Photographer, B-Roll Cam, DP, 1st AC, 2nd AC, Director, AD, 2nd AD, Producer, PA, Editor, Colorist, Motion Graphics, Sound, Gaffer, Stylist, Model, Snowboard, Ski, Off-Road.

> Q1 is the single most-bookable label, shown as a clean searchable dropdown. Q4 is the broader multi-select for everything else they do, so a DP who also edits and flies a drone is captured fully.

### Q2 city options
Truckee · Tahoe City · South Lake Tahoe · Incline Village · Kings Beach · Reno · **Somewhere else** (→ free-text). Tahoe-first matches the launch beachhead; "Somewhere else" keeps the door open for the mountain/surf-town expansion without locking copy to Tahoe-only.

### Q3 rates
Two simple numeric inputs on one screen — **Half-day rate** and **Full-day rate** (USD, whole dollars, `$` prefix; either may be left blank). Keep it to just these two for now; tiered bands / hourly can come later.

Below them, a **"Show my rates on my profile"** toggle (`show_rates`, default **on**). When off, the rates are still saved to their profile (so search/sort can use them internally) but the public profile shows "Rates on request" instead of the numbers. Editable later in My Profile.

### Q4 multi-select chips
Drone · Editing · Color · Sound · Lighting/Gaffer · Photo · Video · Styling · FAA Part 107 · Owns own gear · Will travel. (Tune freely — these map to `specialties[]` plus a couple of boolean-ish tags.)

---

## 3. Data model

Mirror the Bookable Score quiz pattern so we capture the funnel **even for people who answer but don't finish signing up** (retargeting + conversion analytics), then link to the real profile at account creation.

### New table — `onboarding_responses`
```sql
create table public.onboarding_responses (
  id            uuid primary key default gen_random_uuid(),
  session_id    text not null,            -- client-generated, stored in localStorage
  primary_role  text,                     -- Q1
  city          text,                     -- Q2
  half_day_rate int,                      -- Q3
  full_day_rate int,                      -- Q3
  show_rates    boolean default true,     -- Q3 toggle: public rate visibility
  specialties   text[] default '{}',      -- Q1 + Q4 merged
  contact       text,                     -- Q5 (handle or URL)
  source        text,                     -- utm_source / ?src= (e.g. ig_ad)
  step_reached  int default 1,            -- 1..5, for drop-off funnel
  completed     boolean default false,    -- reached the claim screen
  claimed_by    uuid references auth.users(id),  -- set when they sign up
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.onboarding_responses enable row level security;
-- public can INSERT and UPDATE their own session row only; NO public SELECT
create policy "anon insert" on public.onboarding_responses for insert to anon with check (true);
create policy "anon update own session" on public.onboarding_responses for update to anon
  using (true) with check (true);
```
RLS = public insert/update only, no public read (same posture as `quiz_submissions`). One row per `session_id`; upsert on each answer so `step_reached` tracks the drop-off funnel.

### Write path
1. On questionnaire load: generate `session_id` (uuid) → `localStorage['shutter.onboarding']`; read `?src=` / `utm_source` into `source`.
2. After each answer: upsert the row (set the field + `step_reached`, `updated_at`). This is what gives Marketing the funnel ("70% reach Q3, 40% finish").
3. On the claim screen: set `completed = true`.
4. On account creation: read the localStorage answers → **write them into the `profiles` INSERT payload** (specialty, specialties[], city, half_day_rate, full_day_rate, show_rates, handle/portfolio, `signup_source`) → set `onboarding_responses.claimed_by = auth.uid()`.
5. They land in My Profile, prefilled, every field editable.

### `profiles` columns this assumes
`specialty text`, `specialties text[]`, `city text`, `handle text`, plus **NEW**: `half_day_rate int`, `full_day_rate int`, `show_rates boolean default true`, and `portfolio_url text` (add via migration if not present). Per the codebase rule, **every new column must also be added to `toCreator(r)`** so the mapper picks it up (e.g. `halfDayRate`, `fullDayRate`, `showRates`, `portfolioUrl`). The public profile / map card reads `showRates` to decide whether to render the rates or "Rates on request."

---

## 4. Flow / UX

```
IG ad  →  shutterfind.app/start?src=ig_ad
            │  (no login)
            ▼
   ┌───────────────────────────┐
   │  1 of 5  What's your craft │  tap → advance
   │  2 of 5  Where based       │  tap → advance
   │  3 of 5  Day rate          │  tap → advance
   │  4 of 5  Almost done! gear │  multi-select → Next
   │  5 of 5  Show your work     │  text → Next
   └───────────────────────────┘
            ▼
   "You're on the map. Claim your profile."
       Google OAuth  |  Email magic link
            ▼
   My Profile (prefilled, editable)  →  Live-on-map toggle
```

- Mobile-first, dark/cinematic to match the brand. Big thumb targets, one decision per screen, progress bar at top, a Back arrow (forward is locked — they can't skip ahead).
- Single-selects auto-advance (feels like a game, not a form). Q4 multi-select + Q5 text use a Next button.
- Smooth slide transition between screens.
- If they bail mid-flow, the partial row is already saved; a returning `session_id` can resume.

---

## 5. How it connects to what already exists

- **Profession list** is already defined in `TAG_META` (the specialties expansion) — Q1 and Q4 read straight from it; no new taxonomy.
- **`?src=` attribution** already ships (`profiles.signup_source`, `localStorage['shutter.signup_source']`) — the ad link just tags `?src=ig_ad` and it flows through. Use `?src=quiz` for the Bookable Score handoff and `?src=ig_ad`/`?src=onboarding` here so the two funnels are distinguishable.
- **Join flow** today is OAuth/magic-link straight into Supabase with an empty profile. This questionnaire wraps *in front* of that same auth step and prefills the INSERT — no change to the auth mechanism itself.
- **Bookable Score quiz** can hand off here: its "Get on the map" button can point at `/start` so a quiz finisher flows directly into prefill onboarding.

---

## 6. Build estimate & rules

≈ 3–4h Claude Code: one new SQL migration (`onboarding_responses` + 2 profile columns), one new screen flow in `app.js`, markup in `index.html`, single cache-bust bump on the `app.js` script tag. Respect the codebase invariants: increment `?v=N`; any function in an inline `onclick=` must be on `window`; no `//` comments inside single-line functions; add the new `profiles` columns to `toCreator(r)`; if Q2 ever uses the map location picker, keep `pointer-events: none` on the picker overlay.

Staged build prompt: **`CLAUDE_CODE_PROMPTS/onboarding-prefill-questionnaire.md`**.
