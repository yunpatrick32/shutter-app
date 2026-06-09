# Finish-Week Sprint Prompt — April 20, 2026
*Goal: Ship everything that can ship this week. Patrick handles deploy/auth/registry steps; Claude Code handles code.*

**How to use:** Copy everything between `---PROMPT START---` and `---PROMPT END---` and paste it into Claude Code from inside `~/My App/`.

**Recommended order for Patrick:**
1. First, clear the 3 deploy blockers from last run (push `c6a9727`, run 2 SQL migrations, set secrets + deploy webhook, register in Stripe Dashboard). Those must be done BEFORE the e2e test step at the end of this prompt can pass.
2. Then run this prompt in Claude Code.

---PROMPT START---

You are finishing Shutter — a map-first freelance marketplace for outdoor sports creatives around Lake Tahoe — this week. Source is at `~/My App/`, live at shutter-app.netlify.app, auto-deploys on `git push`.

## Context you must read first (in this order)
1. `~/Documents/Shutter App/AGENT_BRAIN.md` — the full project state. Pay close attention to the "Dev Agent Report — April 20, 2026" section. Everything in this prompt builds on what was already shipped there (commit `c6a9727`: `stripe-webhook` Edge Function, Express onboarding banner, `toGig(r)` mapper, 2 SQL migrations, SW cache-name fix at `?v=83`).
2. `~/My App/index.html` — verify current cache bust `?v=N` before bumping.
3. `~/My App/src/app.js` — familiarize with `toCreator(r)`, `toGig(r)`, `renderPayoutBanner()`, booking flow, filter chip rendering.
4. `~/My App/supabase/functions/stripe-webhook/index.ts` — pattern to mirror for the new `cancel-booking` function (signature verification, service-role client, fee math).

## Critical code rules (unchanged — never break)
1. Cache bust: every `app.js`/`sw.js` change bumps `?v=N` in `index.html`. Keep `sw.js` `CACHE_VERSION` in lockstep.
2. Window exposure: inline `onclick=` functions must be on `window` (e.g. `window.postGig = postGig;`, `window.cancelBooking = cancelBooking;`, `window.applyToGig = applyToGig;`).
3. No `//` single-line comments inside single-line arrow functions.
4. Two-query chat pattern for messages (sent + received merged in JS) — do NOT introduce Supabase OR filters on the messages table. For `gigs`/`gig_applications`, normal filters are fine.
5. `toCreator(r)` and `toGig(r)` are the mappers — every DB row passes through them. Add new columns there.
6. Location picker overlay keeps `pointer-events: none` so Mapbox drag works.

## Locked decisions (don't re-litigate)
- Commission: flat **8%** via `application_fee_amount`, `Math.round((amountCents*800)/10000)`.
- Cancellation refund tiers: `hoursUntilShoot ≥ 72` → 100% refund; `24 ≤ hoursUntilShoot < 72` → 50% refund; `hoursUntilShoot < 24` → 0%.
- Weather reschedule: if `cancellation_reason = 'weather'`, do NOT auto-refund. Instead, set `weather_reschedule_at = now()` and enter a 14-day window where either party can propose a new `shoot_date`. If no new date accepted within 14 days, auto-refund per standard tiers.
- Partial-refund accounting (pattern b, PROPORTIONAL): A 50% refund = 50% of client charge returned AND 50% of platform fee returned (via Stripe `refund_application_fee: true`). Finance may override later; proceed with (b) for now.
- Push notifications: ship with v1 in the Capacitor pass — NOT this week. Web-push is out of scope.

## Priority 1 — `cancel-booking` Edge Function

Create `~/My App/supabase/functions/cancel-booking/index.ts` mirroring `stripe-webhook/index.ts` structure (Deno, service-role client, `corsHeaders` helper).

**Input:** POST `{ bookingId: uuid, reason: 'client_cancel' | 'creator_cancel' | 'weather' | 'other', note?: string }` with caller's Supabase session JWT in `Authorization` header.

**Logic:**
```
1. Verify JWT; fetch booking by id.
2. Authorize: caller must be client_id OR creator_id on the booking. Else 403.
3. If booking.status not in ['paid','pending_payment'] → 409 "cannot cancel".
4. Compute hoursUntilShoot = (booking.shoot_date - now()) / 3600_seconds.
5. If reason === 'weather':
     - Update booking: cancellation_reason='weather', weather_reschedule_at=now(), status unchanged (still 'paid').
     - Insert a system message to the thread: "Weather cancellation — 14 days to propose a new date."
     - Return { rescheduleWindowEndsAt: now + 14 days, refunded: false }.
6. Else (standard cancel):
     - refundPct = hoursUntilShoot >= 72 ? 1.0 : hoursUntilShoot >= 24 ? 0.5 : 0.0.
     - If refundPct > 0:
         refundAmountCents = Math.round(booking.amount_cents * refundPct)
         stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id, amount: refundAmountCents, refund_application_fee: true, reverse_transfer: true, metadata: { bookingId, reason, refundPct } })
         Update booking: status='refunded', amount_refunded = refundAmountCents, platform_fee_remaining = Math.round(booking.amount_cents * 0.08 * (1 - refundPct)), cancellation_reason = reason.
     - Else (refundPct === 0):
         Update booking: status='cancelled_no_refund', cancellation_reason = reason.
     - Insert system message summarizing the outcome.
7. Return { refunded: refundPct > 0, refundAmountCents, refundPct }.
```

**Deploy command (Patrick will run):**
```
npx supabase functions deploy cancel-booking --project-ref panktkmwgcttjpebucqy
```
(Keep JWT verification enabled — this one needs the caller's session.)

**Client-side wiring:** In `src/app.js`, add a "Cancel booking" button inside the booking detail view. Before calling the function, show a confirmation modal with the refund amount preview (compute same math client-side for UX; server is still source of truth). Also add a "Cancel due to weather" secondary option with different copy. Bump `?v=` accordingly.

## Priority 2 — Gig Feed UI (wraps up the Gig Feed work; schema already shipped last run)

Add to `src/app.js`:

**A. `renderGigPin(gig)`** — distinct from creator pins:
- Square 44×44 card with rounded corners, avatar omitted.
- Date ribbon across top showing `shoot_date` in `MMM D` format.
- Left-edge color bar: `paid` → orange `#f59e0b`, `collab` → blue `#3b82f6`, `looking_for` → green `#10b981`.
- If `hoursUntilShoot < 48`: add a CSS pulse animation (`@keyframes pulse-urgent`).
- Click → opens bottom-sheet card (same pattern as creator cards).

**B. Filter bar toggle** — new chip row above the existing specialty chips (All/Snowboard/Ski/Photo/Video/Drone/Model/Off-Road):
- 3 exclusive chips: `Creators` / `Gigs` / `Both` (default: Both).
- Persist selection in `localStorage` under key `shutter.mapLayer`.
- When `Gigs` or `Both`, fetch `gigs` where `status='open' AND expires_at > now()` and render pins.
- When `Creators` or `Both`, render creator pins as today.

**C. "Post a Gig" entry point** — in the My Profile panel, add a button visible only to listed creators (`creators.is_listed = true`):
- Button: "+ Post a Gig"
- Opens a 4-step modal (reuse existing modal patterns):
  1. **Type:** radio — Collab / Paid / Looking for help. Sets `gig_type`.
  2. **Location:** reuse existing location picker overlay. Writes `lat`, `lng`, `location_name` (reverse-geocode via existing Mapbox call).
  3. **Date/time:** `shoot_date` (date input), `shoot_start_time` (optional), `duration_hours` (optional).
  4. **Details:** `title` (required), `description` (textarea, 500 char max with counter), `specialties[]` (multi-select from existing specialty chips), `spots_available` (default 1). If gig_type='paid': show `rate_type` select + `rate_amount_cents` input. Final step has a "Post gig" submit button.
- On submit: INSERT into `gigs` via Supabase client. Set `expires_at = shoot_date + INTERVAL '24 hours'` (unless already computed server-side). Refresh map.

**D. Gig detail bottom-sheet:**
- Title, poster info (link to creator profile), date/time, location, specialties as chips, description, rate if paid.
- If viewer is not the poster: "Apply to Gig" primary CTA (opens textarea → INSERT into `gig_applications`, then auto-message the poster).
- If viewer IS the poster: "Edit" / "Close gig" / list of applications with Accept/Decline buttons.

**E. `toGig(r)` reminder:** If any new columns were added in the migration (e.g. `location_name`), make sure they're in the mapper. Currently includes `id`, `creatorId`, `title`, `description`, `gigType`, `specialties`, `lat`, `lng`, `locationName`, `shootDate`, `shootStartTime`, `durationHours`, `rateType`, `rateAmountCents`, `spotsAvailable`, `spotsFilled`, `status`, `expiresAt`, `createdAt`. Double-check.

**F. Window exposure:** add `window.postGig`, `window.applyToGig`, `window.closeGig`, `window.acceptApplication`, `window.declineApplication`, `window.setMapLayer` for all new inline handlers.

## Priority 3 — End-to-end Stripe test

Only attempt after Patrick confirms:
- commit `c6a9727` pushed and Netlify deploy is green,
- both April 20 SQL migrations executed,
- `STRIPE_WEBHOOK_SECRET` + `SUPABASE_SERVICE_ROLE_KEY` set,
- `stripe-webhook` deployed + endpoint registered in Stripe Dashboard.

Write a markdown checklist `~/My App/TEST_PLAN_STRIPE.md` Patrick can work through live:

1. Sign in as creator, click "Connect payouts" → complete Stripe test Express onboarding using test info (Stripe docs provide fake SSN/DOB). Banner should flip to "Payouts active."
2. Sign in as a different account as client, book the creator for tomorrow at any rate.
3. Pay with `4242 4242 4242 4242`, any future exp, any CVC, any ZIP.
4. Confirm:
   - Stripe Dashboard → Payments shows the charge with the 8% application_fee.
   - Booking row in Supabase shows `status='paid'`.
   - Creator and client both receive the notify-message email.
5. In Stripe Dashboard, click "Refund" on the test charge → confirm webhook updates `bookings.status = 'refunded'` and populates `amount_refunded`.
6. Repeat for cancel-booking flow:
   - Book a shoot 96h out, cancel → expect 100% refund.
   - Book a shoot 48h out, cancel → expect 50% refund.
   - Book a shoot 12h out, cancel → expect 0% refund (status='cancelled_no_refund').
   - Book a shoot 96h out, cancel with reason='weather' → expect booking stays paid, `weather_reschedule_at` set.

If any step fails, print the failing step + the Stripe Dashboard event ID + the Supabase row state so Patrick can triage.

## Deploy

```
cd ~/My\ App && git add . && git commit -m "feat: cancel-booking + gig feed UI + tests (finish-week sprint)" && git push
```

Never force push. Never skip hooks. If git push fails with auth error, print the exact error and stop — do NOT retry. Patrick will handle credential issues.

## Things to NOT touch this week
- Capacitor wrapping / App Store submission (HOLD until LLC + custom domain)
- Resend email domain verification (HOLD until `shutterfind.com` registered)
- Push notifications (HOLD — v1 with Capacitor)
- 1099-K dashboard (Stripe handles; no UI needed yet)
- Any Legal / Marketing / Finance concerns (not in Dev scope)

## Open items Claude Code should FLAG (not solve)
- If `bookings` table is missing any columns referenced in `cancel-booking` (e.g. `stripe_payment_intent_id`, `client_id`, `amount_cents`), stop and report the missing column — do NOT auto-add with a third migration; Patrick wants to review schema changes first.
- If any existing function with the same name as new window exports exists, stop and report it.
- If the Gig Feed Mapbox layer conflicts with the existing creator pin source/layer ids, rename with a `gigs-` prefix and report the change.

## When you're done, print
- All files changed (with new `?v=N`).
- New files created.
- Any schema changes required beyond what was already in the Apr 20 migrations.
- Whether `git push` succeeded. If not, the exact auth error and the local commit hash.
- Whether you attempted the e2e Stripe test or skipped it (with reason if skipped).
- Any flags from the "Open items" list above.

---PROMPT END---

## Assumptions I made (so you can override before running)
1. **Partial-refund accounting = pattern (b) proportional** (refund 50% of everything including platform fee, using Stripe's `refund_application_fee: true`). If Finance rules pattern (a) later, a one-line flag flip in `cancel-booking` handles it.
2. **`cancel-booking` keeps JWT verification ON** (unlike `stripe-webhook` which is `--no-verify-jwt`). This one needs the caller's session to authorize.
3. **Gig Feed ships in this same sprint**, not a separate PR. Time is the constraint.
4. **Web push is out of scope** — push notifications are the Capacitor-pass job.
5. **E2E test is a markdown checklist for you to run manually**, not automated. Stripe test mode needs a human-in-the-loop for the test Express onboarding.

Flip any of these if you want them different, and I'll regenerate.
