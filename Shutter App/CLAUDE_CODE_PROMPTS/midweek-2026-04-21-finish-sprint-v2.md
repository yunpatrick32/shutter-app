# Finish-Week Sprint Prompt v2 — April 21, 2026
*Supersedes v1. Baseline is now correct: commit `c6a9727` is on `origin/main`, both Apr-20 SQL migrations have run in prod, the `stripe-webhook` Edge Function is deployed and smoke-tested (returned `400 missing stripe-signature` from an unsigned Supabase Test panel request), platform-side endpoint is registered in Stripe Dashboard.*

**How to use:** Copy everything between `---PROMPT START---` and `---PROMPT END---` and paste into Claude Code from `~/My App/`.

---PROMPT START---

You are finishing Shutter. Source is at `~/My App/`, live at shutter-app.netlify.app (current cache bust `?v=83`, in production, auto-deployed on push to main).

## Production reality as of April 21, 2026

Before you do anything, understand what's REAL vs. WRITTEN:

**Confirmed in prod:**
- `origin/main` HEAD is `c6a9727`
- `?v=83` is live on Netlify
- `supabase/functions/stripe-webhook/index.ts` is deployed and signature-verified (platform endpoint in Stripe: 3 events — `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_DB_URL`, `RESEND_API_KEY` — all set in Supabase secrets
- DB: `profiles` has `stripe_payouts_enabled`/`stripe_account_status`/`last_payout_at`; `bookings` has `amount_refunded`/`platform_fee_remaining`/`weather_reschedule_at`/`cancellation_reason`; `gigs` + `gig_applications` tables exist (with `creator_id` + `applicant_id` as `integer`, not `uuid` — see schema correction below)

**Schema correction already applied in prod (but NOT yet reflected on disk):**
Claude Code's April 20 `supabase/migrations/20260420_gigs.sql` declared `gigs.creator_id uuid REFERENCES profiles(id)`. That failed because `profiles.id` is `integer` in this project (not the common Supabase uuid pattern). Patrick fixed it in the SQL Editor before running — the tables in prod have `integer` FKs. The file on disk still has the wrong `uuid` types. **Your first task below is to bring the file in line with prod.**

**Confirmed NOT in prod:**
- Connect-side webhook endpoint (no `account.updated` / `payout.paid` subscription). Creators cannot currently transition to "Payouts active" state via webhook — we'll solve this with polling instead.
- `cancel-booking` Edge Function
- Gig Feed UI (map pins, filter toggle, posting form) — the DB layer is live but nothing renders in the app
- E2E Stripe test with 4242 card

## Priority 0 — Fix the on-disk gigs migration so disk matches prod

Edit `~/My App/supabase/migrations/20260420_gigs.sql`. Two changes:
1. Line that declares `gigs.creator_id`: change `uuid` → `integer`.
2. Line that declares `gig_applications.applicant_id`: change `uuid` → `integer`.

Add a comment at the top: `-- Corrected Apr 21: creator_id + applicant_id are integer to match profiles.id schema.`

No re-run needed — prod is already correct.

## Context you must read first
1. `~/Documents/Shutter App/AGENT_BRAIN.md` — full current state. Pay close attention to "Dev Agent Report — April 21, 2026 (Mid-week unblock run)" at the bottom.
2. `~/My App/src/app.js` — familiarize with `toCreator(r)`, `toGig(r)`, `renderPayoutBanner()`, booking flow, filter chip rendering.
3. `~/My App/supabase/functions/stripe-webhook/index.ts` — this is your pattern for new Edge Functions (Deno runtime, service-role client, cors helper, signature verify).
4. `~/My App/supabase/functions/stripe-onboard/index.ts` — this is the Express onboarding function; we'll tap into its return-from-onboarding flow for the polling strategy.

## Critical code rules (never break)
1. Cache bust: every `app.js`/`sw.js` change bumps `?v=N` in `index.html`. Keep `sw.js` `CACHE_VERSION` in lockstep.
2. Inline `onclick=` functions must be on `window` (e.g., `window.postGig = postGig;`).
3. No `//` single-line comments inside single-line arrow functions.
4. Two-query chat pattern for messages — no Supabase OR filter on that table.
5. `toCreator(r)` and `toGig(r)` are the mappers — every DB row passes through them.
6. Location picker overlay keeps `pointer-events: none`.

## Locked decisions (don't re-litigate)
- Commission: flat **8%** via `application_fee_amount`.
- Cancellation refund tiers: `≥72h` → 100%; `24-72h` → 50%; `<24h` → 0%.
- Weather: `cancellation_reason='weather'` → set `weather_reschedule_at=now()`, enter 14-day reschedule window. Only auto-refund if nothing agreed within 14 days.
- Partial refunds = PROPORTIONAL (Stripe `refund_application_fee: true`).
- `profiles.id` is `integer`. `profiles.user_id` is `uuid`. Remember this for any new SQL or mapper code.
- Push notifications: NOT this week — Capacitor pass only.

## Priority 1 — `stripe-account-status` Edge Function (replaces Connect-side webhook for MVP)

Instead of subscribing to `account.updated` via a second webhook endpoint (which would require handler changes to verify a second signing secret), fetch account status on demand from the client when the creator returns from Express onboarding.

Create `~/My App/supabase/functions/stripe-account-status/index.ts`:
- Input: POST `{ }` with Supabase JWT in Authorization header.
- Logic:
  1. Verify JWT, resolve to `profiles.id` via `user_id` lookup.
  2. Read `profiles.stripe_account_id`. If null → `{ connected: false, payoutsEnabled: false }`.
  3. Call `stripe.accounts.retrieve(stripe_account_id)`.
  4. Map Stripe's response: `payoutsEnabled = account.payouts_enabled`, `status = account.requirements.disabled_reason ? 'restricted' : account.payouts_enabled ? 'active' : account.details_submitted ? 'pending_verification' : 'pending_onboarding'`.
  5. Upsert into `profiles`: `stripe_payouts_enabled`, `stripe_account_status` (and `last_payout_at` if Stripe exposes a recent payout timestamp).
  6. Return `{ connected: true, payoutsEnabled, status }`.
- Deploy with JWT verification ON (caller's session authorizes the lookup):
  ```
  npx supabase functions deploy stripe-account-status --project-ref panktkmwgcttjpebucqy
  ```

Client-side wiring in `app.js`:
- When the "Payouts active" banner first mounts AND when the user returns from the onboarding link (detect via URL query param `?stripe=return` or similar — whatever `stripe-onboard` sets), call `stripe-account-status` and re-render `renderPayoutBanner()` with the fresh state.
- Also call on a 10-second interval while the banner shows "Finish Stripe setup" (gives live feedback without user refresh). Clear the interval once `payoutsEnabled=true`.

## Priority 2 — `cancel-booking` Edge Function

Create `~/My App/supabase/functions/cancel-booking/index.ts` mirroring `stripe-webhook` structure (Deno, service-role client, corsHeaders). Keep JWT verify ON — caller's session authorizes.

**Input:** POST `{ bookingId, reason: 'client_cancel'|'creator_cancel'|'weather'|'other', note? }`.

**Logic:**
1. Verify JWT; fetch booking.
2. Authorize: caller must be `client_user_id` or `creator_profile_id`'s `user_id` (remember the naming — the existing insert uses `client_user_id` and `creator_profile_id`, not `client_id`/`creator_id`). If neither → 403.
3. If `booking.status not in ['paid','pending_payment','confirmed']` → 409 "cannot cancel".
4. `hoursUntilShoot = (shoot_date - now()) / 3600`.
5. Weather branch: set `cancellation_reason='weather'`, `weather_reschedule_at=now()`, status unchanged. Insert a system message to the thread: "Weather cancellation — 14 days to propose a new date." Return `{ rescheduleWindowEndsAt, refunded: false }`.
6. Standard branch:
   - `refundPct = >=72 ? 1 : >=24 ? 0.5 : 0`.
   - `refundAmountCents = Math.round(amount_total_cents * refundPct)` (NOTE: check whether `amount_total` is stored as cents or dollars in your current schema — `bookings` had `amount_total numeric` from the 2024 migration. If it's dollars, convert. Look at how `create-payment-intent` constructs the PaymentIntent to confirm the unit.)
   - If `refundPct > 0`: `stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id, amount: refundAmountCents, refund_application_fee: true, reverse_transfer: true, metadata: { bookingId, reason, refundPct } })`. Update booking `status='refunded'`, `amount_refunded`, `platform_fee_remaining = round(amount_total_cents * 0.08 * (1 - refundPct))`, `cancellation_reason`.
   - Else: update `status='cancelled_no_refund'`, `cancellation_reason`.
   - Insert system message summarizing outcome.
7. Return `{ refunded, refundAmountCents, refundPct }`.

**Client-side:** Add "Cancel booking" button in booking detail. Confirmation modal shows refund-amount preview (compute same math client-side; server is source of truth). Secondary "Cancel due to weather" option with different copy. Bump `?v=`.

## Priority 3 — Gig Feed UI

DB layer is live. Build the UI.

**A. `renderGigPin(gig)`** — square 44×44 pin, date ribbon at top showing `shoot_date` as `MMM D`, left-edge color bar (orange=paid, blue=collab, green=looking_for). Pulse animation if `hoursUntilShoot < 48`.

**B. Filter bar toggle** above the existing specialty chips — 3 exclusive chips: `Creators / Gigs / Both`, default Both. Persist to `localStorage['shutter.mapLayer']`. When showing Gigs or Both, fetch `gigs WHERE status='open' AND expires_at > now()` and render.

**C. "Post a Gig" button** in My Profile (visible when `profiles.is_listed=true`) → 4-step modal:
1. Type radio: Collab / Paid / Looking for help.
2. Location picker (reuse overlay).
3. `shoot_date` (required), optional `shoot_start_time`, optional `duration_hours`.
4. `title` (required), `description` (textarea, 500 char max with counter), multi-select `specialties[]`, `spots_available` (default 1). If paid: `rate_type` + `rate_amount_cents`.

On submit: INSERT into `gigs` via Supabase client. Remember `creator_id` is `integer` (the caller's `profiles.id`, not their `auth.uid()`). `expires_at = shoot_date + INTERVAL '24 hours'`.

**D. Gig detail bottom-sheet:** title, poster (link to profile), date/time/location, specialties chips, description, rate if paid. Non-poster → "Apply to Gig" CTA (INSERT `gig_applications` + auto-message poster). Poster → Edit / Close gig / applications list with Accept/Decline.

**E. `toGig(r)` audit** — confirm all columns from `supabase/migrations/20260420_gigs.sql` are in the mapper. `creatorId` should be an integer.

**F. Window exposure** for `postGig`, `applyToGig`, `closeGig`, `acceptApplication`, `declineApplication`, `setMapLayer`.

## Priority 4 — E2E Stripe test plan

Write `~/My App/TEST_PLAN_STRIPE.md` with a manual checklist for Patrick to run after all three priorities are deployed:

1. Switch to Stripe test mode (or use test keys in a staging env — whatever Patrick has set up). Creator account: click "Connect payouts" → complete Stripe test Express onboarding using test info (Stripe docs provide fake SSN/DOB). On return, `stripe-account-status` fires → banner should flip to "Payouts active."
2. Different account as client → book the creator tomorrow at any rate.
3. Pay with `4242 4242 4242 4242`, any future exp, CVC, ZIP.
4. Confirm: Stripe Dashboard shows charge with 8% `application_fee`; `bookings.status='paid'`; both parties received notify-message email.
5. In Stripe Dashboard → Refund on the test charge → confirm webhook flips booking to `'refunded'` and `amount_refunded` populates.
6. Cancel-booking flow tests:
   - Book 96h out → cancel → expect `status='refunded'`, 100% refund.
   - Book 48h out → cancel → 50% refund.
   - Book 12h out → cancel → `status='cancelled_no_refund'`.
   - Book 96h out → cancel with reason='weather' → booking stays `paid`, `weather_reschedule_at` set.

## Deploy
```
cd ~/My\ App && git add . && git commit -m "feat: cancel-booking + stripe-account-status + gig feed UI (finish-week sprint v2)" && git push
```
No force push, no `--no-verify`. If `git push` fails with auth error, print the error and stop — do NOT retry.

## What NOT to touch
Capacitor / App Store, Resend email domain, push notifications, 1099-K dashboard, Legal/Marketing/Finance concerns, the platform-side webhook endpoint (it's already live and working).

## FLAG (don't solve)
- Missing columns referenced in `cancel-booking` — stop and report the missing column. Do NOT auto-add with a new migration.
- Name collisions with existing window exports — stop and report.
- Mapbox layer id conflicts — prefix `gigs-` and report.
- If `amount_total` is stored as dollars (not cents), flag that Stripe's refund amount needs conversion and note which unit you assumed.

## When you're done, print
Files changed (with new `?v=N`), new files, whether any schema gaps were flagged, whether `git push` succeeded (or exact auth error + commit hash). Skip the E2E test — that's Patrick's manual pass after deploy.

---PROMPT END---

## Assumptions baked in (flip before running if wrong)
1. **Polling over webhook for `account.updated`** — simpler MVP, no dual-secret handler needed. Connect-side webhook can be added later as an enhancement.
2. **Partial refunds = proportional** (pattern b, `refund_application_fee: true`).
3. **`cancel-booking` + `stripe-account-status` both keep JWT verification ON.**
4. **Gig Feed ships in same PR** as the two new Edge Functions.
5. **E2E is a manual checklist**, not automated.
6. **On-disk `20260420_gigs.sql` gets corrected to integer FKs** as Priority 0, not skipped.

If any of these are wrong, flip them and re-paste the prompt into Claude Code.
