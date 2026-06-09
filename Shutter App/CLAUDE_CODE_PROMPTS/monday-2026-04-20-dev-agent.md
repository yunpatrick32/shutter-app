# Monday Claude Code Prompt — Week of April 20, 2026
*Based on Dev Agent Report from April 17, 2026 (see `~/Documents/Shutter App/AGENT_BRAIN.md`)*

**How to use:** Copy everything between the `---PROMPT START---` and `---PROMPT END---` lines below and paste it into Claude Code from inside `~/My App/`.

---PROMPT START---

You are working on Shutter — a map-first freelance marketplace for outdoor sports creatives around Lake Tahoe. Source is at `~/My App/`, live site is shutter-app.netlify.app, auto-deploys on `git push`.

## Context you must read first
1. Read `~/Documents/Shutter App/AGENT_BRAIN.md` end-to-end. It contains the Dev Agent Report (April 17, 2026) with the current implementation plan.
2. Read `~/My App/index.html` — note the current `?v=N` cache bust on the app.js script tag.
3. Read `~/My App/src/app.js` — skim structure, find `toCreator(r)`.
4. Read `~/My App/src/data.js` — understand `TAG_META`.

## Critical code rules (never break)
1. Cache bust: every change to `app.js` or `sw.js` must bump `?v=N` on the script tag in `index.html`
2. Window exposure: any function referenced in inline `onclick=` must also be assigned to `window` (e.g. `window.postGig = postGig;`)
3. No `//` single-line comments inside single-line arrow functions
4. Two-query chat: messages use two separate Supabase queries (sent + received) merged in JS — do NOT use an OR filter
5. `toCreator(r)` is the mapper — every DB row passes through it. When a new column is added, add it here.
6. Location picker overlay needs `pointer-events: none` so Mapbox drag still works.

## This week's priorities (do in this order)

### 1. Stripe webhook Edge Function (highest value, unblocks bookings going live)
Create `~/My App/supabase/functions/stripe-webhook/index.ts` handling these 6 events:
- `account.updated` → update `creators.stripe_payouts_enabled`
- `payment_intent.succeeded` → mark `bookings.status = 'paid'`
- `payment_intent.payment_failed` → mark `bookings.status = 'payment_failed'`, trigger notify-message
- `payout.paid` → log to `creators.last_payout_at`
- `charge.refunded` → mark `bookings.status = 'refunded'`, recompute platform fee
- `account.application.deauthorized` → set `creators.stripe_account_status = 'disconnected'`

Use `STRIPE_WEBHOOK_SECRET` env var for signature verification. Deploy with:
```
npx supabase functions deploy stripe-webhook --project-ref panktkmwgcttjpebucqy
```
After deploy, give me the webhook endpoint URL so I can register it in Stripe Dashboard.

**Commission model is confirmed 8% flat** via `application_fee_amount` (rounded to nearest cent). Ignore the old "4% + 2%" note.

### 2. Creator Stripe Express onboarding UI
In the My Profile panel, add a "Connect payouts" button:
- If `creators.stripe_account_id` is null → call a new Edge Function `stripe-onboard` that creates an Express account and returns an onboarding link; open it in a new tab.
- If account exists but `stripe_payouts_enabled = false` → show "Finish Stripe setup" with a refresh link.
- If enabled → show a green check + "Payouts active".

Add to `toCreator(r)`: `stripeAccountId`, `stripePayoutsEnabled`, `stripeAccountStatus`.

### 3. Gig Feed (data model first, UI second — can split across two PRs)
Full spec is in `AGENT_BRAIN.md` under "Dev Agent Report → §3. Gig Feed". Key items:
- Write SQL migration `supabase/migrations/20260420_gigs.sql` creating `gigs` + `gig_applications` tables with RLS.
- Add `toGig(r)` mapper in `app.js` mirroring `toCreator` pattern.
- Map rendering: square-card pins with date ribbon, color by `gig_type` (orange=paid, blue=collab, green=looking_for), pulse when within 48h of shoot_date.
- Filter bar toggle: Creators / Gigs / Both (default Both).
- "Post a Gig" button in profile panel, 4-step form (type → location → date/time → details+rate).

### 4. Service worker cache-name fix
`sw.js` currently probably uses a static cache name. Update it to include the version so PWA installs get the new shell after a `?v=N` bump. Pattern:
```
const CACHE_VERSION = 'v52';  // bump in lockstep with app.js ?v=N
const CACHE_NAME = `shutter-${CACHE_VERSION}`;
```
And add activate-event logic to delete old caches.

## Open questions — ASK me, don't assume
- Refund policy copy: I'm leaning toward 72h full / 24-72h 50% / under 24h no refund. Confirm before wiring into Stripe webhook + booking cancellation flow.
- Weather cancellation rule — separate or folded into refund policy?
- Do we want push notifications in the iOS wrapper from day one, or ship v1 without them?

## Deploy
```
cd ~/My\ App && git add . && git commit -m "<descriptive message>" && git push
```
Never force push. If you hit a git lock error:
```
rm -f ~/My\ App/.git/index.lock ~/My\ App/.git/HEAD.lock
```

## What NOT to touch this week
- App Store / Capacitor wrapping — waiting on LLC + custom domain.
- Email domain verification in Resend — waiting on custom domain purchase.
- 1099-K dashboard — Stripe handles it; no UI work needed until creators hit the threshold.

## When you're done
Print a short summary of:
- Files changed (with new `?v=N` if bumped)
- Any SQL migrations added (need to run manually in Supabase SQL Editor)
- Any secrets that need to be set via `npx supabase secrets set ...`
- The Stripe webhook endpoint URL so I can paste into Stripe Dashboard

---PROMPT END---

## Template for future weeks
Each Monday, after the Dev Agent runs at 9am and updates `AGENT_BRAIN.md`:
1. Replace the date at the top of this file.
2. Copy any new items from `AGENT_BRAIN.md` → "Dev Agent Report → Summary of Actions This Run" into the priorities section.
3. Update the "What NOT to touch" list based on what's still blocked.
4. Update the "Open questions" section with whatever the Dev Agent flagged for your decision.
