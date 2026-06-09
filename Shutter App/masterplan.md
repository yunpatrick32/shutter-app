# Masterplan — Shutter "Bookable Score" Quiz

*Lead magnet MVP for Shutter — the map-first booking marketplace for outdoor & creative talent.*
*Owner: Patrick (founder, snowboard filmer, Truckee CA). Website: shutterfind.app*

---

## 1. App Overview

The Bookable Score quiz is a free, two-minute web app that scores how findable and bookable a creative is right now (0–100), labels their tier, reveals their top three fixes, and captures their email — then funnels them into Shutter.

It exists to do one job insanely well: turn a stranger's vague anxiety ("why isn't my calendar full?") into a concrete number they want to improve, and convert that desire into a lead and a Shutter signup.

**One-line pitch:** Find out how bookable you really are — in two minutes.

---

## 2. Goals & Success Metrics

The whole product succeeds or fails on three numbers:

- **Quiz completion rate** — % of starters who reach the score. Target: 70%+.
- **Email capture rate** — % of finishers who submit an email. Target: 40%+.
- **Handoff click-through** — % who click through to shutterfind.app. Target: 25%+.

Everything not serving these metrics is cut from v1.

---

## 3. Target Audience

Early-career outdoor & content creatives — videographers, photographers, drone pilots, editors, colorists, models, and crew — who are talented but underbooked, suffering feast-or-famine income, and arriving from an Instagram/TikTok ad on their phone. Mobile-first. Low patience. High desire for proof they belong.

(See persona "Gig-Gap Gabe" in project thread.)

---

## 4. Core Features (v1 scope)

1. **Welcome screen** — hook headline, "Get my score" CTA, "free, no login to start."
2. **Five questions, one per screen** — single-select options, each carrying points.
3. **Live progress bar.**
4. **Animated score reveal** — counts up 0→100.
5. **Tier label** — Off the Map / Getting Found / Local Pro / Booked-Out Ready.
6. **Top three personalized fixes** — driven by lowest-scoring answers.
7. **Email capture (gated AFTER score)** — unlock the full report.
8. **Handoff state** — "Get on the map" button → shutterfind.app.
9. **Retake option.**

### Explicitly OUT of v1
Login/accounts, social sharing images, payment, dashboards, A/B testing, admin UI (use Supabase directly).

---

## 5. The Quiz Logic

Five questions, weighted points (max 100):

| # | Question | Max pts |
|---|----------|---------|
| 1 | How complete is your online profile + portfolio? | 20 |
| 2 | Can a client see you're available right now? | 20 |
| 3 | Are your rates easy to find? | 20 |
| 4 | How do most clients find you today? | 20 |
| 5 | How fast do you respond to a new inquiry? | 20 |

**Tiers:** 0–29 Off the Map · 30–54 Getting Found · 55–79 Local Pro · 80–100 Booked-Out Ready.

**Fixes:** surface the three lowest-scoring categories as the user's "top fixes," mapped to a fixed copy block per category.

---

## 6. Tech Stack

- **Front end:** React + Vite + Tailwind (single-page, mobile-first).
- **Hosting:** Static CDN (Vercel/Netlify) — instant load.
- **Backend/DB:** Supabase (Postgres) — one table.
- **Email:** Transactional provider (Resend) for the report email + webhook into ESP (ConvertKit/Mailchimp) for the list.
- **Analytics:** Plausible (privacy-friendly) + ad pixel for retargeting (later).

Chosen for speed and near-zero ops. Nothing here needs a backend server to maintain.

---

## 7. Data Model

Single table: `quiz_submissions`

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | primary key |
| email | text | nullable until captured |
| q1..q5 | int | points per answer |
| score | int | 0–100 |
| tier | text | computed label |
| top_fixes | text[] | three category keys |
| source | text | utm/ad source |
| created_at | timestamp | default now() |

---

## 8. UI / UX Principles

- Dark, cinematic, map-inspired — consistent with Shutter's brand.
- One decision per screen. Big thumb-friendly tap targets.
- Motion rewards progress: score counts up, tier badge lands.
- Feels like a game, not a form.
- Under two minutes start to finish.
- Email gate appears only after the score, when desire peaks.

---

## 9. Security & Privacy

- No passwords, no sensitive data — only email + quiz answers.
- HTTPS everywhere; Supabase row-level security so the public client can insert but not read others' rows.
- Clear privacy note + link to shutterfind.app/privacy on the capture screen.
- Single opt-in checkbox for email follow-up (CAN-SPAM/GDPR-friendly).

---

## 10. Milestones (ship in ~1 week)

1. **Day 1–2:** Front-end quiz flow (screens, scoring, animated reveal) — works fully client-side.
2. **Day 3:** Supabase table + insert on submit; tier/fix logic finalized.
3. **Day 4:** Email capture + Resend report email + ESP webhook.
4. **Day 5:** Brand polish, mobile QA, analytics, deploy to a clean URL.
5. **Launch:** Drop URL in IG/TikTok bio + first ad.

---

## 11. Likely Challenges

- **Scoring credibility** — the score must *feel* right. Tune copy and weights after first 50 real responses.
- **Gate timing** — resist gating before the score; test only after launch.
- **Email deliverability** — use a real transactional provider, warm the domain.
- **Drop-off** — keep it to five questions; cut any that don't change the score meaningfully.

---

## 12. Future Expansion

- Shareable score card image ("I scored 47 — what's yours?").
- Personalized report email sequence → nurture into Shutter signup.
- Branching questions by creative type (shooter vs. editor vs. model).
- Retargeting pixel + lookalike audiences from completers.
- "Improve your score" mini-course tied to Shutter onboarding milestones (gamified tiers).
