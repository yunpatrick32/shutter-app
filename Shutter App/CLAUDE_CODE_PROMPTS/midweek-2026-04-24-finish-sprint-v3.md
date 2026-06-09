# Finish-Week Sprint Prompt v3 — April 24, 2026
*Supersedes v2. **Critical change:** the partial-refund rule in v2 (`refund_application_fee: true` for the 50% tier, aka option b, proportional) is WRONG. Finance ruled option (a) on Apr 23 — platform keeps 100% of the 8% fee on any booking that was consummated; refund is proportional to the client's share only. Everything else in v2 stands.*

**How to use:** Copy everything between `---PROMPT START---` and `---PROMPT END---` and paste into Claude Code from `~/My App/`.

---PROMPT START---

You are finishing Shutter. Source is at `~/My App/`, live at shutter-app.netlify.app (current cache bust `?v=83`, in production, auto-deployed on push to main).

## Production reality as of April 24, 2026

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
- Signup-source attribution (`creators.signup_source`) — Marketing's Apr 22 ask; see Priority 5

## Priority 0 — Fix the on-disk gigs migration so disk matches prod

Edit `~/My App/supabase/migrations/20260420_gigs.sql`. Two changes:
1. Line that declares `gigs.creator_id`: change `uuid` → `integer`.
2. Line that declares `gig_applications.applicant_id`: change `uuid` → `integer`.

Add a comment at the top: `-- Corrected Apr 21: creator_id + applicant_id are integer to match profiles.id schema.`

No re-run needed — prod is already correct.

## Context you must read first
1. `~/Documents/Shutter App/AGENT_BRAIN.md` — full current state. Pay close attention to "Dev Agent Report — April 24, 2026" and "Finance Agent Report — April 23, 2026 § 2" (partial-refund ruling).
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
- **Partial refunds = OPTION (a)** (Finance Apr 23 ruling). Platform keeps 100% of 8% fee on consummated bookings; refund is proportional to client's share only. Translation into Stripe API:
  - **72h+ tier (full refund, booking not consummated):** `refund_application_fee: true`, `reverse_transfer: true`. Platform returns the fee.
  - **24–72h tier (50% refund):** `refund_application_fee: false`, `reverse_transfer: false`. `amount = Math.round(original_charge_cents * 0.5)`. Platform keeps 100% of original fee; creator's portion of the retained 50% is their 92% share. `bookings.platform_fee_remaining = original_fee_cents` (unchanged — full fee retained).
  - **<24h tier (0% refund):** no refund fires. Status → `cancelled_no_refund`. Both creator and platform retain everything.
  - **Weather (14-day window):** no immediate refund. Status unchanged. Auto-convert to 50% tier only if window expires without a rescheduled date.
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

## Priority 2 — `cancel-booking` Edge Function (REFUND LOGIC UPDATED)

Create `~/My App/supabase/functions/cancel-booking/index.ts` mirroring `stripe-webhook` structure (Deno, service-role client, corsHeaders). Keep JWT verify ON — caller's session authorizes.

**Input:** POST `{ bookingId, reason: 'client_cancel'|'creator_cancel'|'weather'|'other', note? }`.

**Logic:**
1. Verify JWT; fetch booking.
2. Authorize: caller must be `client_user_id` or `creator_profile_id`'s `user_id` (remember the naming — the existing insert uses `client_user_id` and `creator_profile_id`, not `client_id`/`creator_id`). If neither → 403.
3. If `booking.status not in ['paid','pending_payment','confirmed']` → 409 "cannot cancel".
4. `hoursUntilShoot = (shoot_date - now()) / 3600`.
5. **Weather branch:** set `cancellation_reason='weather'`, `weather_reschedule_at=now()`, status unchanged. Insert a system message to the thread: "Weather cancellation — 14 days to propose a new date." Return `{ rescheduleWindowEndsAt, refunded: false }`.
6. **Standard branch (Finance Apr 23 option-a rules):**
   - `refundPct = hoursUntilShoot >= 72 ? 1 : hoursUntilShoot >= 24 ? 0.5 : 0`.
   - `refundAmountCents = Math.round(amount_total_cents * refundPct)` (NOTE: check whether `amount_total` is stored as cents or dollars — `bookings` had `amount_total numeric`. If dollars, convert. Inspect `create-payment-intent` to confirm unit.)
   - **If `refundPct === 1` (booking NOT consummated):**
     `stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id, amount: refundAmountCents, refund_application_fee: true, reverse_transfer: true, metadata: { bookingId, reason, refundPct } })`.
     Update booking: `status='refunded'`, `amount_refunded=refundAmountCents`, `platform_fee_remaining=0`, `cancellation_reason`.
   - **If `refundPct === 0.5` (consummated, client-side late cancel — platform keeps fee):**
     `stripe.refunds.create({ payment_intent: booking.stripe_payment_intent_id, amount: refundAmountCents, refund_application_fee: false, reverse_transfer: false, metadata: { bookingId, reason, refundPct } })`.
     Update booking: `status='refunded'`, `amount_refunded=refundAmountCents`, `platform_fee_remaining` **unchanged** (full original fee retained), `cancellation_reason`.
   - **If `refundPct === 0` (<24h, no refund):**
     No Stripe call. Update booking: `status='cancelled_no_refund'`, `cancellation_reason`.
   - Insert system message summarizing outcome. Client refund preview must match: 72h+ → "100% refund ($X)"; 24–72h → "50% refund ($Y) — platform service fee is non-refundable"; <24h → "No refund issued."
7. Return `{ refunded, refundAmountCents, refundPct, feeRetained: (refundPct === 0.5 ? original_fee_cents : 0) }`.

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
6. Cancel-booking flow tests (verify Finance option-a rules):
   - Book 96h out → cancel → expect `status='refunded'`, 100% refund, `platform_fee_remaining=0`, Stripe shows `application_fee` reversed.
   - Book 48h out → cancel → 50% refund, `platform_fee_remaining` **unchanged from original fee**, Stripe shows `application_fee` **NOT** reversed (platform keeps the $X fee).
   - Book 12h out → cancel → `status='cancelled_no_refund'`, no Stripe call.
   - Book 96h out → cancel with reason='weather' → booking stays `paid`, `weather_reschedule_at` set, no refund.

## Priority 6 — Custom domain `shutterfind.app` cutover (NEW Apr 29)

Patrick registered **`shutterfind.app`** (not `.com`) at Cloudflare Registrar on Apr 29. The app needs to start serving from the new domain. Treat this as parallel to Priorities 1–4; touches code in three places.

**6.1 — Code: hardcoded URL references**
Grep for any of these strings in `~/My App/`:
- `shutter-app.netlify.app`
- `https://shutter-app.netlify.app`
- `shutterfind.com`

Replace forward-looking instances with `shutterfind.app` / `https://shutterfind.app`. Leave any historical/audit references (e.g., comments noting "previously hosted at...") alone if you find them.

Specific files to inspect:
- `index.html` — meta tags (`og:url`, `og:image` if absolute, `canonical`), any inline JS configs, manifest references.
- `src/app.js` — Stripe Connect onboarding `return_url` / `refresh_url` (search for the redirect strings passed into `stripe-onboard`), any `from`-address or share-URL helpers.
- `supabase/functions/stripe-onboard/index.ts` — return URL on the Express onboarding link. Likely a constant near the top of the function.
- `supabase/functions/notify-message/index.ts` — `from` field (will swap to `hello@shutterfind.app` only after Resend verifies the domain — see 6.3 below; do NOT change this until Patrick confirms verification).
- `manifest.json` — `start_url`, `scope`.
- `privacy.html` — any contact-email or canonical-URL references.

**6.2 — DNS / Netlify (Patrick action, document only)**
Decision Patrick must make and execute:
- **Path A (recommended):** in Cloudflare Registrar settings, change nameservers to Netlify's 4 NS records. Then Netlify Dashboard → Domain Management → Add Custom Domain → `shutterfind.app`. Netlify provisions Let's Encrypt; HTTPS is mandatory on `.app` (HSTS preload at TLD level), which is fine because Netlify auto-issues. Add `www.shutterfind.app` as alias if desired.
- **Path B (DNS at Cloudflare):** keep Cloudflare DNS active. Add A/ALIAS for the apex pointing at Netlify's load balancer + CNAME for `www`. Set Cloudflare proxy OFF (DNS-only / gray cloud) on those records, otherwise Netlify's SSL handshake fights Cloudflare's edge.

Recommend Path A. Simpler, fewer edge-cases, also makes 6.3 easier (Netlify DNS panel can host Resend's TXT/CNAME records inline).

Write this decision out in `~/My App/DOMAIN_CUTOVER.md` so Patrick has a single-page reference. Include a screenshot-step list and the rollback procedure (point CNAME back, leave HTTPS-redirect untouched on Netlify).

**6.3 — Resend domain verification (sequenced after DNS lands)**
Once DNS is propagated and Netlify is serving `shutterfind.app`:
1. Resend Dashboard → Domains → Add Domain → `shutterfind.app`. Resend will display 3 records: a `_resend` TXT (verification), a `resend._domainkey` CNAME (DKIM), and an SPF TXT.
2. Add those at whichever DNS host is authoritative (Netlify DNS if Path A, Cloudflare if Path B).
3. Wait for Resend to flip green (15min – 24h).
4. Edit `supabase/functions/notify-message/index.ts`: change the `from` address from `onboarding@resend.dev` → `hello@shutterfind.app` (or `notifications@shutterfind.app`).
5. Redeploy: `npx supabase functions deploy notify-message --project-ref panktkmwgcttjpebucqy`.
6. Send a test message in-app from a test creator → verify the email lands and the From header is the new address.
7. Add a DMARC TXT at `_dmarc.shutterfind.app` with `v=DMARC1; p=none; rua=mailto:dmarc@shutterfind.app;` to start. Upgrade `p=quarantine` after 2 weeks of clean deliverability.

**6.4 — OAuth + Stripe redirect URL allowlists (Patrick action in dashboards)**
Add the new domain to every place that allowlists redirect URLs. Document for Patrick:
- **Supabase Dashboard** → Authentication → URL Configuration → add `https://shutterfind.app/**` to Redirect URLs. Set Site URL to `https://shutterfind.app`.
- **Google Cloud Console** → APIs & Services → Credentials → OAuth 2.0 client ID → Authorized redirect URIs → add `https://shutterfind.app/auth/callback` (or whatever path Supabase expects — typically `https://<project>.supabase.co/auth/v1/callback` is the actual one Google sees, but the post-auth client redirect needs the new domain). Also add to Authorized JavaScript origins.
- **Stripe Dashboard** → Connect settings → Branding → return URLs / business URLs → swap to `https://shutterfind.app`. The Express onboarding return URL is set per-call in code (see 6.1) — make sure it matches.

Write the dashboard-action checklist into `DOMAIN_CUTOVER.md` so Patrick can knock it out in 10 minutes.

**6.5 — Keep the netlify subdomain as a redirect**
Do NOT remove `shutter-app.netlify.app` from Netlify. Leave it and add a domain-level redirect rule (`_redirects` file or `netlify.toml`):
```
/* https://shutterfind.app/:splat 301
```
applied to `shutter-app.netlify.app` only (not the new primary). This keeps any links already shared in DMs / outreach replies / app-store metadata working.

**6.6 — Bump cache-bust**
Any of these touching `app.js`/`index.html` requires bumping `?v=N`. Bundle the cache-bust with the cancel-booking + gig-feed + signup-source bumps from Priorities 2–5; one combined `?v=84` (or whatever increments cleanly) for the whole sprint.

## Priority 5 — Marketing ask: signup-source attribution (if time permits)

Per [MARKETING] → [DEV] on Apr 22. Non-blocking for this sprint, but small enough to include if the first 4 priorities wrap cleanly.

- New migration `supabase/migrations/20260424_signup_source.sql`:
  ```sql
  alter table public.creators add column if not exists signup_source text;
  create index if not exists creators_signup_source_idx on public.creators (signup_source);
  ```
- Client-side in `app.js` boot:
  ```js
  const params = new URLSearchParams(location.search);
  const src = params.get('src');
  if (src && !localStorage.getItem('shutter.signup_source')) {
    localStorage.setItem('shutter.signup_source', src.slice(0, 64));
  }
  ```
- On join-form submit, read `localStorage['shutter.signup_source']` and include in the `creators` INSERT payload.
- `toCreator(r)` — add `signupSource: r.signup_source || null`.

## Deploy
```
cd ~/My\ App && git add . && git commit -m "feat: cancel-booking (option-a refund) + stripe-account-status + gig feed UI + signup-source (finish-week sprint v3)" && git push
```
No force push, no `--no-verify`. If `git push` fails with auth error, print the error and stop — do NOT retry.

## What NOT to touch
Capacitor / App Store, Resend email domain, push notifications, 1099-K dashboard, Legal/Marketing/Finance concerns, the platform-side webhook endpoint (it's already live and working).

## FLAG (don't solve)
- Missing columns referenced in `cancel-booking` — stop and report the missing column. Do NOT auto-add with a new migration.
- Name collisions with existing window exports — stop and report.
- Mapbox layer id conflicts — prefix `gigs-` and report.
- If `amount_total` is stored as dollars (not cents), flag that Stripe's refund amount needs conversion and note which unit you assumed.
- If the Stripe API version pinned in the existing webhook doesn't support `refund_application_fee: false` on destination-charge refunds (unlikely — supported since 2017), flag and stop.

## When you're done, print
Files changed (with new `?v=N`), new files, whether any schema gaps were flagged, whether `git push` succeeded (or exact auth error + commit hash). Skip the E2E test — that's Patrick's manual pass after deploy.

---PROMPT END---

## Key delta from v2 (why v3 exists)
| Topic | v2 (Apr 21) | v3 (Apr 24) |
|---|---|---|
| Partial-refund rule | Proportional (option b, `refund_application_fee: true` on 50% tier) | **Option (a)** — platform keeps full fee on consummated bookings. 50% tier uses `refund_application_fee: false` (Finance ruling Apr 23) |
| 72h+ tier refund call | Not distinct from 50% tier | Distinct: `refund_application_fee: true` + `reverse_transfer: true` (booking not consummated → platform returns fee) |
| <24h tier | No refund fires | Same — unchanged |
| `platform_fee_remaining` on 50% tier | 50% of original fee | **100% of original fee** (fee unchanged on retained half) |
| Signup-source attribution | Not scoped | Priority 5 (Marketing's Apr 22 ask, non-blocking) |
| E2E test assertions | Generic refund verification | Explicit `application_fee` reversal vs retention check per tier |

## Assumptions baked in (flip before running if wrong)
1. **Polling over webhook for `account.updated`** — simpler MVP, no dual-secret handler needed. Connect-side webhook can be added later as an enhancement.
2. **Partial refunds = OPTION (a)** per Finance Apr 23 ruling.
3. **`cancel-booking` + `stripe-account-status` both keep JWT verification ON.**
4. **Gig Feed ships in same PR** as the two new Edge Functions.
5. **E2E is a manual checklist**, not automated.
6. **On-disk `20260420_gigs.sql` gets corrected to integer FKs** as Priority 0, not skipped.
7. **Signup-source is nice-to-have** this sprint; ship if time, otherwise next week.

If any of these are wrong, flip them and re-paste the prompt into Claude Code.
