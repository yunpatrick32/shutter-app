# Shutter — Geo-Targeted Ads Campaign Spec
*Prepared by Marketing Agent — April 22, 2026 | Last updated: May 13, 2026 | Status: **STAGED, DO NOT LAUNCH YET***

> **May 13 reconciliation (Marketing Agent fourth run):** Per Orchestrator May 4 ruling, the launch gate is "all 7 must be true." Top-of-file preconditions section below was stale (4 explicitly numbered while the body referenced 6 and the bottom "Launch trigger" checklist enumerated 7). Cleaned up so the count and slot list match — gate is **7 preconditions**. Current state of the 7: 3 cleared ✅ (custom domain, Stripe webhook, Legal mark sign-off), 4 outstanding (15 real creators, pixels, SB-478 verified screenshot, brand handle org-post). Realistic earliest launch: **late May–early June** given the one-week slip on the Mercury cascade flagged by Orchestrator May 11.
>
> **Apr 29 update (kept for history):** Legal CLEARED mark-usage Apr 28 with 4 conditions (see § "Legal / compliance notes"). Two new launch-gate preconditions added: **SB-478 fee-disclosure verified** + **brand handle (`@shutterapp`/`@shutterfind`) claimed with ≥1 organic post**. **Domain CLEARED (Apr 29):** Patrick registered `shutterfind.app` (chose `.app` over `.com`; same word-mark, no new trademark exposure). All ad URLs in this spec now reference `shutterfind.app`.

## Do-not-launch preconditions
Per Orchestrator May 4 ruling — paid ads do not go live until ALL 7 of these are true:
1. **Custom domain registered** (`shutterfind.app`) — ad URLs should be brand-safe, not `*.netlify.app`. ✅ **CLEARED Apr 29** (Patrick registered at Cloudflare; cutover LIVE).
2. **Stripe webhook deployed** — otherwise a booking conversion from an ad click can't charge end-to-end. ✅ **CLEARED Apr 21** (deployed to `https://panktkmwgcttjpebucqy.supabase.co/functions/v1/stripe-webhook`).
3. **Legal clearance on mark usage in ads** — no ®, ™ ok, no comparative/superlative claims, creator-feature consent required. ✅ **CLEARED Apr 28** (4 conditions folded into § "Legal / compliance notes").
4. **At least 15 real creators on the map** — or the density is too thin and the ad CPA will spike. ⏳ Current: 0 real, 7 seeded. Likely unlock: ~late May to early June.
5. **Meta + TikTok pixels installed** and conversion events firing (verified in Meta Events Manager / TikTok Events API). ⏳ Dev one-day task post-custom-domain (see § "Pixel / tracking setup").
6. **CA SB-478 fee-disclosure verified** — test-mode-checkout screenshot showing 8% `application_fee_amount` as a discrete line item, signed off by Legal. ⏳ Patrick captures during E2E Stripe test; saves at `legal/sb478_test_mode_checkout.png`.
7. **Brand handle claimed + ≥1 organic post** — `@shutterapp` preferred / `@shutterfind` fallback on TikTok + Instagram. Day-1 brand-account post = re-post of the Day 8 product-demo. ⏳ Patrick action, ~5 min to claim handles + 30 min to crosspost.

Until those are true: campaigns below are **built and paused** in Ads Manager so day-zero launch is a single toggle.

---

## Target audience
- **Geography:** 50-mile radius centered on South Lake Tahoe, CA (38.9399° N, 119.9772° W). Covers: South Lake, Tahoe City, Truckee, Kings Beach, Carson City (partial), Reno (edge). Excludes: Sacramento, Stockton.
- **Age:** 18–44 (skews 22–35 for creatives).
- **Interests:** photography, videography, snowboarding, skiing, freelance work, DJI, Sony Alpha, drone photography, mountain biking, outdoor recreation.
- **Behavior:** "Engaged shoppers" + "Small business owners" + "Creators" on Meta. "Content creators" on TikTok.
- **Exclusions:** tourists (exclude "Recently traveled to Lake Tahoe" on Meta — we want residents/regulars, not weekend visitors who won't book from the map).
- **Custom audiences (build, don't activate yet):**
  - Website visitors last 30 days (pixel required — see below).
  - Engaged with Shutter IG/TikTok in last 30 days.
  - Lookalike 1% of seeded creators' audiences (requires email list upload — post-25-creator milestone).

## Campaign structure — Meta (Instagram + Facebook)
Two campaigns running in parallel when launched:

### Campaign A — "Creator Signup" (top of funnel)
- **Objective:** Leads or Traffic (test both, pick winner after week 1).
- **Budget:** $10/day to start, scale to $30/day if CPA <$15 per signup.
- **Placements:** Reels + Stories + Feed (automatic placements).
- **Ad format:** 9:16 vertical video, 15s. Reuse TikTok Day 1 founder monologue.
- **Primary text:** "Tahoe snowboard filmer built a map so creators can find each other. Put your pin on it — free for the first 25 creators."
- **Headline:** "Join the Tahoe creator map"
- **CTA:** "Sign Up"
- **Landing:** `shutterfind.app` with `?src=meta_creator` param (once Dev ships attribution — see `outreach_templates.md`).
- **Success metric:** cost per real creator signup. Kill if >$30 after 7 days.

### Campaign B — "Client / Booker Awareness" (middle of funnel)
- **Objective:** Traffic.
- **Budget:** $5/day to start.
- **Audience overlay:** Add interests in "Brands we'd ghostwrite for" proxies — "outdoor brands," "ski resorts," "Patagonia," "Burton," "North Face."
- **Ad format:** 9:16 vertical video, 15–30s. Product demo (map UX + booking flow).
- **Primary text:** "Need a filmer, photographer, or drone op in Tahoe this weekend? Tap a pulsing pin — see who's available right now."
- **Headline:** "Find your crew in Tahoe"
- **CTA:** "Learn More"
- **Success metric:** landing page time-on-site >20s. Kill if bounce >80% after 7 days.

## Campaign structure — TikTok Ads
- **Objective:** Traffic (TikTok lacks a clean Leads objective equivalent at small budget).
- **Budget:** $10/day.
- **Placement:** TikTok only (skip Pangle audience network).
- **Audience:** Same 50mi radius, ages 18–44, interests: photography, film, snow sports, outdoor.
- **Ad format:** Spark Ads using organic posts from the 30-day calendar that have >2k organic views. Don't shoot dedicated paid creative until we know what lands.
- **Primary text:** matches organic caption.
- **Landing:** same as Meta Campaign A, param `?src=tiktok_creator`.
- **Success metric:** CPM and CTR; treat TikTok as brand awareness, not direct response, for the first 2 weeks.

## Pixel / tracking setup (Dev: one-day task when Patrick is ready)
- [ ] Create Meta Business Manager account under Shutter Find LLC (blocked until EIN).
- [ ] Create Meta Pixel. Install `<script>` on `index.html` AND `privacy.html`. Fire events: `PageView` (default), `Lead` on signup submit, `CompleteRegistration` on first profile save, `Purchase` on first booking.
- [ ] Create TikTok Ads Manager account (same entity blocker).
- [ ] Install TikTok Pixel; same event set.
- [ ] Add querystring handling: read `?src=` on load, persist to localStorage, write to `creators.signup_source` on signup insert.

## Creative rotation plan
3 creatives per campaign, rotate weekly. Prevents ad fatigue in small-radius market.

| Week | Campaign A creative | Campaign B creative |
|---|---|---|
| 1 | Founder monologue | Product demo (map pan + pulsing pin) |
| 2 | Creator spotlight #1 (snowboard filmer) | Booking flow end-to-end |
| 3 | Testimonial from first real signup (if exists) else creator spotlight #2 | "Available Now" pin explainer |
| 4 | Highest-performing organic post from Weeks 1-3 as Spark Ad | Map + CTA overlay |

## Budget ceiling
Pre-revenue, cap total paid spend at **$500/month**. At $10/day Meta A + $5/day Meta B + $10/day TikTok = $25/day = ~$750/month. Below $500 cap means running only 2 of the 3 campaigns at a time until first bookings cover spend. Recommended v0 mix:
- Meta Campaign A: $10/day
- TikTok: $5/day ($150 ceiling)
- Meta Campaign B: paused until Campaign A is profitable

## Legal / compliance notes
- **Pricing claim:** any mention of fees must say "8% service fee" (Orchestrator lock) — never "4% + 2%."
- **Brand usage:** ad copy uses "**Shutter**" (consumer brand). Legal disclaimers / app-store metadata use "Shutter Find LLC." Mark-usage CLEARED by Legal Apr 28.
- **Privacy:** landing page already has /privacy.html + Terms linked; Meta/TikTok require a privacy policy URL on the ad account — ready.
- **No "guaranteed income" / "earn $X" claims** about creators' revenue. FTC exposure.

### Legal Apr 28 — 4 conditions on creative (mandatory)
1. **No ®** on either "Shutter" or "Shutter Find LLC" mark in any ad creative until USPTO certificate issues. ® on an unregistered mark = §43(a) Lanham Act violation.
2. **™ permitted** on either mark to assert common-law rights. Use sparingly — once per ad, not on every mention.
3. **No comparative or superlative claims.** Ban list: "America's #1," "the best," "more than [competitor]," named comparisons against Shutterfly / Splacer / Bookalook / Thumbtack. FTC § 5 risk.
4. **Creator-feature consent.** Any ad creative that names or shows a real (non-Patrick) creator requires written consent. Implementation: add a checkbox to the join-flow signup screen — *"I allow Shutter Find LLC to feature my profile in promotional material until I opt out via DM."* Until that checkbox ships, get an explicit "yes" via DM and screenshot it before featuring the creator. Patrick is auto-cleared (founder consent implicit).

### CA SB-478 fee-disclosure check (NEW — Legal flagged Apr 28)
The 8% service fee must be itemized in the booking confirmation/checkout UI — not buried in TOS. Stripe Checkout's default `application_fee_amount` rendering almost certainly already complies. Dev to verify with a test-mode-checkout screenshot. Up to $1,000-per-violation under CA Civ. Code § 1770.1 if non-compliant. **Folded into launch gate as precondition #6.**

## What Marketing needs from Dev before launch
- [ ] `?src=` querystring attribution → `creators.signup_source` column (see `outreach_templates.md`)
- [ ] Meta + TikTok pixel install (post-custom-domain)
- [ ] Conversion event for signup + booking
- [ ] Custom domain live so ad URLs are `shutterfind.app` not `shutterfind.app`

## What Marketing needs from Finance before launch
- [ ] Ad budget approval ($500/mo ceiling) and the card on file (Mercury debit once open)
- [ ] Booking attribution into QuickBooks with ad source as a P&L tag

## What Marketing needs from Legal before launch
- [ ] Confirm "Shutter" (consumer brand) vs "Shutter Find LLC" usage split in ad creative is safe pre-trademark-registration
- [ ] Confirm first captured ad creative can double as the specimen of use for USPTO §1(a) filing (or whether we stay §1(b) intent-to-use until bookings)

## Launch trigger
All 7 of the following must be TRUE before toggling any campaign to ACTIVE (this list is the canonical gate — top-of-file numbered list mirrors it):
- [x] Custom domain (`shutterfind.app`) live and serving the app (CLEARED Apr 29)
- [x] Stripe webhook deployed to production (CLEARED Apr 21)
- [x] Legal sign-off on mark usage (CLEARED Apr 28 with 4 conditions — see § Legal / compliance notes)
- [ ] 15+ real creators on the map (current: 0 real / 7 seeded as of May 13)
- [ ] Meta + TikTok pixels installed + events firing (verified in Meta Events Manager / TikTok Events API)
- [ ] CA SB-478 fee-disclosure verified (Dev test-mode-checkout screenshot → Legal sign-off)
- [ ] Brand handle (`@shutterapp` preferred / `@shutterfind` fallback) claimed on TikTok + Instagram with at least 1 organic post
