# Claude Code Prompt — Shutter Sprint v4 (Friday May 15, 2026)

**Authored by:** Dev Agent (scheduled run May 15, 2026)
**Status:** READY-TO-RUN. Source-mount blocker remains on Dev Agent scheduled runs; Patrick fires this from Terminal inside `~/My App/` (same productive write-path used Apr 29 for prompt v3).
**Supersedes:** `midweek-2026-04-24-finish-sprint-v3.md` (v3 SHIPPED Apr 29 at `?v=84`).
**Target cache-bust on ship:** `?v=85`.
**Estimated runtime:** ≈2.5 h Claude Code + small SQL migration + 1 Edge Function redeploy.
**Pre-ship dependency:** E2E Stripe test with card `4242 4242 4242 4242` per `~/My App/TEST_PLAN_STRIPE.md`. If E2E green → ship v4 as-scoped. If E2E red → fold the green-fix into v4 alongside the 7 originally-scoped items (Orchestrator May 4 / May 11 standing ruling).

---

## Locked decisions (do NOT re-derive — these are settled)

1. **Commission:** flat **8%** via `application_fee_amount`. Not 4%+2%. (Apr 20)
2. **Refund semantics:** **option (a)** — platform keeps 100% of the 8% fee on any consummated booking. (Finance Apr 23; Orchestrator Apr 27)
3. **Per-tier Stripe API:**
   - **72h+ cancel:** full refund, `refund_application_fee: true`, `reverse_transfer: true`.
   - **24–72h cancel:** 50% of the creator's share, `refund_application_fee: false`, no `reverse_transfer`. Platform retains the 8%.
   - **<24h cancel:** no Stripe call. Booking stays charged.
4. **Schema:** the user-facing table is **`profiles`** (NOT `creators`). `profiles.id` is integer, `profiles.user_id` is uuid. `toCreator(r)` maps DB rows to the client object. All new columns flow through `toCreator(r)`.
5. **Amount unit:** `bookings.amount_total` is stored in **DOLLARS, not cents**. Convert to cents before any `stripe.refunds.create` / `stripe.charges.create` / `application_fee_amount` call. Documented in `cancel-booking/index.ts` header.
6. **Two-query chat:** sent + received are TWO separate Supabase queries merged in JS. Do NOT use Supabase `or` filter on chat.
7. **Brand naming:** legal entity `Shutter Find LLC` (Entity No. **B20260200090**, formed 04/27/2026); consumer/app brand `Shutter`. Domain `shutterfind.app`.
8. **Cache bust:** every change to `index.html` or `src/app.js` increments `?v=N` on the `app.js` script tag in `index.html`. Currently `?v=84` live; this sprint ships `?v=85`.
9. **Window exposure:** any function referenced from `onclick=` in HTML must be assigned to `window.<name>`.
10. **No `//` comments inside single-line functions.** (Pinned style rule — survives minify cleanly.)
11. **pointer-events:** `none` on location-picker overlay.

---

## Priority 0 — Pre-flight checks (5 min)

- Confirm `git status` is clean on `main`. Confirm `?v=84` on the `app.js` script tag in `index.html`. Confirm last commit is `7b49205` (or `c1f3ee5` if Patrick re-deployed since).
- If `notify-message` `from`-address swap (Priority 1) was already shipped by Patrick over the weekend, paste the deploy log into `AGENT_BRAIN.md` and skip Priority 1. Else proceed.
- If E2E test (`~/My App/TEST_PLAN_STRIPE.md`) has not been run, **STOP** and have Patrick run it before continuing. If E2E surfaces failures, add a "Priority 7 — E2E green-fix" section to this prompt and address those failures in the same PR.

---

## Priority 1 — `notify-message` `from`-address swap + redeploy (5 min)

`supabase/functions/notify-message/index.ts` — change line ~14:

```ts
from: 'onboarding@resend.dev',
```

to:

```ts
from: 'notifications@shutterfind.app',
```

Then redeploy:

```sh
npx supabase functions deploy notify-message --project-ref panktkmwgcttjpebucqy
```

Function-only redeploy. **No `?v=` cache-bust on `app.js` for this priority** (no HTML/JS touched). Resend domain `shutterfind.app` was VERIFIED Apr 29 — no DNS work needed.

Verify by sending a test message in the app and confirming the recipient's email shows `notifications@shutterfind.app` in the From line.

---

## Priority 2 — "Shutter Find LLC" footer + `<title>` attribution (5 min)

Per Legal Apr 28 + bumped LOW → MEDIUM per Orchestrator May 4. Two `index.html` edits:

1. Update `<title>`:
   ```html
   <title>Shutter — find your crew | Shutter Find LLC</title>
   ```
2. Add a footer attribution line (place inside the map container or a small fixed bottom-right corner so it doesn't displace UI on mobile):
   ```html
   <footer class="footer-attribution">© 2026 Shutter Find LLC</footer>
   ```
   With minimal CSS:
   ```css
   .footer-attribution {
     position: fixed;
     bottom: 8px;
     right: 12px;
     font-size: 10px;
     color: rgba(255,255,255,0.45);
     pointer-events: none;
     z-index: 1;
     font-family: var(--font-mono, monospace);
   }
   ```

This satisfies USPTO TEAS Plus specimen-of-use prerequisite if filing reactivates (Legal Apr 28 § 2). It is also load-bearing for any creator-featured Meta/TikTok ad that screenshots the live UI.

Cache-bust eligible: this edit touches `index.html`. Combined with later priorities, final ship is `?v=85`.

---

## Priority 3 — Referral mechanic (≈90 min)

Per Marketing Apr 29 § 4.6. Schema gotcha: column on **`profiles`**, NOT `creators`.

### 3.1 Migration

Create `supabase/migrations/20260515_referral.sql`:

```sql
-- Referral attribution: who referred this profile
alter table public.profiles
  add column if not exists referred_by_handle text;

-- Index to support "show me everyone <handle> referred" lookups
create index if not exists profiles_referred_by_handle_idx
  on public.profiles (referred_by_handle)
  where referred_by_handle is not null;
```

Run against prod: `npx supabase db push` (or apply via Supabase Dashboard SQL editor).

### 3.2 Client capture (`src/app.js`)

On first page load (same place that captures `?src=...`), also read `?ref=<handle>`:

```js
const url = new URL(window.location.href);
const refHandle = url.searchParams.get('ref');
if (refHandle && refHandle.length <= 64) {
  // Persist to localStorage in case the user doesn't sign up immediately
  localStorage.setItem('shutter.referred_by_handle', refHandle);
}
```

On join-form submit, include the captured handle in the `profiles` INSERT payload:

```js
const referredBy = localStorage.getItem('shutter.referred_by_handle');
// ...inside the insert payload:
referred_by_handle: referredBy || null,
```

Then clear from `localStorage` post-insert to avoid attributing future signups from the same browser.

### 3.3 `toCreator(r)` mapper

Extend `toCreator(r)` in `src/data.js` (and any cousin in `app.js`):

```js
function toCreator(r) {
  return {
    // ...existing fields...
    referredByHandle: r.referred_by_handle ?? null,
  };
}
```

### 3.4 My Profile "Invite a creator" button

In the My Profile panel, add a button below the existing controls:

```html
<button id="invite-creator-btn" class="profile-action-btn" onclick="copyInviteLink(this)">
  Invite a creator
</button>
```

Bind globally so `onclick=` resolves (per critical code rule):

```js
window.copyInviteLink = function(btn) {
  const myHandle = (window.currentProfile && window.currentProfile.handle) || '';
  if (!myHandle) return;
  const link = `https://shutterfind.app/?ref=${encodeURIComponent(myHandle)}`;
  navigator.clipboard.writeText(link).then(() => {
    showToast('Invite link copied');
    btn.textContent = 'Copied ✓';
    setTimeout(() => { btn.textContent = 'Invite a creator'; }, 2000);
  });
};
```

(No `//` comments inside single-line callbacks, per critical code rule.)

### 3.5 Analytics query (for Marketing)

Once any referrals land:

```sql
select referred_by_handle, count(*) as referred_count
from public.profiles
where referred_by_handle is not null
group by 1
order by 2 desc;
```

This unblocks the Phase-2 "first 3 referrals = 1 month free" lever per Marketing's pricing-roadmap thinking.

---

## Priority 4 — `consent_log` table for join-flow consent (≈30 min)

Per Legal May 5 (schema spec) + Legal May 12 refinement (`text NOT NULL`, no `varchar` length cap — consent language grows over time and we don't want to truncate audit-trail evidence).

### 4.1 Migration

Create `supabase/migrations/20260515_consent_log.sql`:

```sql
-- CA Civ. Code § 3344 (right of publicity) audit trail
-- Captures verbatim consent text + timestamp + IP + user reference
-- on join-flow checkbox.
create table if not exists public.consent_log (
  id           bigserial primary key,
  user_id      uuid references auth.users(id) on delete set null,
  profile_id   integer references public.profiles(id) on delete set null,
  consent_text text not null,
  consent_at   timestamptz not null default now(),
  ip_address   inet,
  user_agent   text
);

create index if not exists consent_log_user_id_idx on public.consent_log (user_id);
create index if not exists consent_log_profile_id_idx on public.consent_log (profile_id);
create index if not exists consent_log_consent_at_idx on public.consent_log (consent_at desc);

-- RLS: only service role can read consent_log (audit trail integrity).
-- Users cannot read or modify their own consent entries.
alter table public.consent_log enable row level security;

create policy "service_role_full_access"
  on public.consent_log
  for all
  to service_role
  using (true)
  with check (true);
```

Run against prod: `npx supabase db push`.

### 4.2 Join-flow checkbox UI

In the join form (after the email/Google sign-in step, before the "Submit" button), add a required checkbox with **Legal-approved enumerated copy** (preferred over the shorter version per Legal May 5):

```html
<label class="consent-checkbox">
  <input type="checkbox" id="feature-consent-cb" required />
  <span>I allow Shutter Find LLC to feature my profile, name, and uploaded portfolio in promotional material (including social media, paid ads, the Shutter website, and partner channels) until I opt out via DM to @shutterapp.</span>
</label>
```

Disable the submit button until checked. On submit, capture the verbatim text and write a row to `consent_log`:

```js
const consentText = document.querySelector('label.consent-checkbox span').textContent.trim();
const { data: { user } } = await supabase.auth.getUser();
await supabase.from('consent_log').insert({
  user_id: user?.id ?? null,
  profile_id: newProfileId,
  consent_text: consentText,
  ip_address: null,
  user_agent: navigator.userAgent || null,
});
```

(IP capture is server-side only — leave `ip_address` null on the client write; if needed, populate via a future Edge Function. Client-collected IP is unreliable enough that Legal would rather have null than wrong.)

---

## Priority 5 — Cancel-booking modal "Why?" expand link (10 min)

Optional defensive disclosure per Legal Apr 28 (CA Civ. Code § 1671(b) liquidated-damages defensibility). Approved for inclusion per Orchestrator May 4.

Below the existing modal copy ("50% refund. The 8% platform service fee is non-refundable once a booking is accepted."), add a collapsible "Why?" link:

```html
<details class="cancel-why">
  <summary>Why?</summary>
  <p>Late cancellations leave creators with held dates and unrecoverable prep time, so they retain 50% of their share. The platform's matching and payment-handling work is performed at booking acceptance, so the service fee remains non-refundable.</p>
</details>
```

Minimal CSS to match modal styling. Default collapsed; user opens if curious.

---

## Priority 6 — SB-478 fee-line screenshot routing (5 min, doc-only)

This is not a code change — it's a workflow change. Patrick captures `legal/sb478_test_mode_checkout.png` during the E2E test (Priority 0 prerequisite). Document in `~/My App/TEST_PLAN_STRIPE.md`:

Add a new section after the existing E2E walkthrough:

> ### Step N: capture SB-478 fee-line evidence
> While in the Stripe Checkout page with the test card flow open, take a screenshot of the price-breakdown panel showing the 8% service fee as a discrete line item. Save at `~/My App/Shutter App/legal/sb478_test_mode_checkout.png`. Legal Agent verifies the screenshot at the next Tuesday run; Finance pre-confirms the QuickBooks reconciliation pattern; Marketing uses for ad-creative QA.

---

## Priority 7 — Pre-stub "claim your pin" tactic SQL (10 min)

Per Marketing May 13 ask. Orchestrator-approved tactic test (May 4): 3 stub profile rows inserted into `public.profiles` with `is_listed=false`, signup_source `prestub_marketing`. Patrick DMs each from his personal handle to invite claim. 2-week kill at May 29 if 0/3 land.

**Path (a):** one-time SQL snippet (Marketing-preferred — no schema change, lower review surface, single-use). Marketing will populate the actual handles/specialties/cities before the migration runs.

Create `legal/claim_stub_2026-05.sql` (place in `legal/` so it sits alongside other one-off SQL artifacts that Patrick runs manually):

```sql
-- Pre-stub "claim your pin" tactic test — Marketing May 13
-- 3 stub profiles for IG-scraped Tahoe creators. Patrick DMs each.
-- 2-week kill date: 2026-05-29. If 0/3 claimed, delete rows.
-- Schema: public.profiles (NOT creators — Apr 29 naming gotcha)

insert into public.profiles (handle, specialty, city, is_listed, signup_source)
values
  ('<HANDLE_1>', '<SPECIALTY_1>', '<CITY_1>', false, 'prestub_marketing'),
  ('<HANDLE_2>', '<SPECIALTY_2>', '<CITY_2>', false, 'prestub_marketing'),
  ('<HANDLE_3>', '<SPECIALTY_3>', '<CITY_3>', false, 'prestub_marketing');

-- Rollback at 2-week kill if 0/3 claimed:
-- delete from public.profiles where signup_source = 'prestub_marketing' and is_listed = false;
```

Marketing replaces the `<HANDLE_N>` / `<SPECIALTY_N>` / `<CITY_N>` placeholders with actual values before Patrick runs the snippet via `psql` or the Supabase SQL editor.

**Note:** this priority does not bump the cache version on its own (no `index.html` / `app.js` edits) — it ships as part of the same PR for atomic record-keeping but is operationally a separate manual SQL run by Patrick.

---

## Priority 8 — Cache-bust + commit + push

After Priorities 2–5 land in `index.html` / `src/app.js`:

1. Update `<script src="src/app.js?v=85">` (and any other versioned asset references in `index.html` / `sw.js`).
2. Update `sw.js` `CACHE_VERSION = 'v85'` if that pattern is still in use.
3. Single commit message: `feat: prompt v4 — referral mechanic + consent_log + footer attribution + notify-message swap + cancel modal Why link (v85)`
4. `git add . && git commit -m "<above>" && git push`

---

## Verification checklist (post-deploy)

- [ ] Open `https://shutterfind.app` in incognito. Title shows `Shutter — find your crew | Shutter Find LLC`. Footer shows `© 2026 Shutter Find LLC`.
- [ ] DevTools → Network tab → confirm `app.js?v=85` (not v=84) is the version loaded.
- [ ] Visit `https://shutterfind.app/?ref=test_handle` → DevTools → Application → Local Storage → confirm `shutter.referred_by_handle = "test_handle"`.
- [ ] Sign up a test profile → confirm `profiles.referred_by_handle` row in Supabase = `"test_handle"`.
- [ ] Sign up another test profile → confirm `consent_log` row written with verbatim checkbox text + `consent_at` timestamp + `user_id`.
- [ ] My Profile → click "Invite a creator" → confirm clipboard contains `https://shutterfind.app/?ref=<your_handle>` and toast shows "Invite link copied".
- [ ] Open the cancel-booking modal on a test booking → confirm the "Why?" `<details>` element renders + expands cleanly.
- [ ] Send a test message in the app → confirm recipient email From line shows `notifications@shutterfind.app`.

---

## Cross-agent posting

After the ship, post to `AGENT_BRAIN.md`:

```
[DEV] → [ALL]: ✅ Prompt v4 SHIPPED <date> at ?v=85. Commit <hash>. 7 priorities landed:
notify-message from-address swap + Shutter Find LLC footer/title attribution + referral mechanic
(?ref=<handle>) + consent_log table + cancel-booking "Why?" expand link + SB-478 screenshot routing
docs + claim_stub_2026-05.sql staged. Full verification checklist green.

[DEV] → [MARKETING]: claim_stub_2026-05.sql staged at legal/. Replace 3 handle/specialty/city
placeholders with your scraped values, then Patrick runs the snippet via psql or Supabase
SQL editor. Insert into public.profiles (NOT creators). Kill date 2026-05-29.

[DEV] → [LEGAL]: consent_log table LIVE with text NOT NULL on consent_text per your May 12
refinement. Enumerated channel-list consent copy used. RLS service-role-only on consent_log.

[DEV] → [FINANCE]: notify-message from-address now notifications@shutterfind.app. No accounting
implications. P&L tag map unchanged.
```

---

## Out of scope for v4 (track for v5)

- 14-day weather-reschedule flow on `cancel-booking` (deferred Apr 29; auto-converts to 50% tier on window expiry).
- Capacitor iOS wrapper (gated on Apple Developer org enrollment — pending D-U-N-S + LLC + $99/yr enrollment).
- Phase 2 ($14/mo Creator Pro) gates and paywall (gated on 25 real creators, currently 0).

End of v4 prompt.
