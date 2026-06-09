# Shutter Marketing — May 13, 2026 Weekly Update (Week 4 of 30-day plan)
*Prepared by Marketing Agent (4th scheduled run) | Date: 2026-05-13 (Wed) | Replaces nothing — appends to `marketing/2026-04-29_week2_update.md`*

> **Run-integrity heartbeat ✅** — scheduled Wed May 13 10am run fired on schedule; brain write succeeded. **First scheduled Marketing run to land after the May 6 miss.** Per Orchestrator May 11 directive, treating this run as double-loaded with the missed May 6 slot.

## 1. State of the world coming in (May 13)

- **Map count baseline:** 0 real / 7 seeded — **unchanged from Apr 29.** No real signups confirmed in workspace evidence. Patrick has not yet flipped his own pin live (queue item 7 from May 11 sync still pending). If/when he does, count moves to 1 real / 7 seeded.
- **Patrick's 6-item reply (now fourth reminder):** STILL BLANK. No brain entries from Patrick on Cynthia/Luke/Victoria handles+roles, no Day-1 monologue confirmation or links, no Week-1 DM tally, no brand-handle claim status. Three weeks of carry-over. Escalated to Orchestrator at the bottom of this update as a recurring blocker.
- **Legal/Finance/Dev artifacts blocking marketing's geo-ads gate:** no movement. `legal/` directory holds Articles PDF + unsigned OA template + unsigned SHTR-001 only — no EIN CP 575, no signed OA, no SB-478 screenshot. Confirmed via Legal May 12 run + this run's workspace diff.
- **Stickermule order:** UNVERIFIED. No brain confirmation from Patrick that the ~$30 sticker print was placed. Cannot verify externally — recommend Patrick confirm in brain with order number + ship date when placed so Finance can pre-tag the expense to `marketing_irl_print`.
- **Brand-account handles (`@shutterapp` / `@shutterfind`):** still presumed unclaimed (no Patrick confirmation). Blocking precondition #7 of the geo-ads gate; cheap 5-min Patrick action.
- **`marketing/consent_screenshots/` folder:** does not exist in workspace as of this run. Per Legal May 12 ask — the interim DM-consent protocol has NOT been exercised this week (or if it has, screenshots haven't been saved to the canonical path). Implication: no creator-featured ad creative has been produced yet, which tracks with no posts confirmed shipped.

## 2. Geo-ads gate count reconciled (Orchestrator May 4 ruling, surfaced May 11)

`geo_ads_campaign_spec.md` had drifted into a count-vs-slot mismatch — top-of-file note said "6 preconditions" while the bottom "Launch trigger" enumerated 7 and the body said "precondition #6 of 6" but #5 (brand handle) was never explicitly numbered up top. **This run cleaned it up.** Canonical gate is now **7 preconditions, top section mirrors bottom section, each marked CLEARED ✅ or outstanding ⏳:**

| # | Precondition | Status | Owner |
|---|---|---|---|
| 1 | Custom domain (`shutterfind.app`) live + serving | ✅ Apr 29 | Patrick/Dev — done |
| 2 | Stripe webhook deployed | ✅ Apr 21 | Dev — done |
| 3 | Legal sign-off on mark usage (4 conditions) | ✅ Apr 28 | Legal — done |
| 4 | 15+ real creators on map | ⏳ 0 / 15 (was 0 Apr 29 too — zero progress this week) | Marketing — outreach |
| 5 | Meta + TikTok pixels installed + events firing | ⏳ blocked on Dev one-day task | Dev — bundle with prompt v4 |
| 6 | CA SB-478 fee-disclosure verified screenshot | ⏳ Patrick captures during E2E Stripe test | Patrick + Legal verify |
| 7 | Brand handle claimed + ≥1 organic post | ⏳ Patrick action, ~5 min + 30 min | Patrick |

**Realistic launch window pushed:** late May → **early June** baseline, reflecting the one-week slip Orchestrator flagged May 11. Slot 4 (15 real creators) is the highest-variance unknown.

## 3. Daily prompts Day 22–28 (May 13–19) — this week's content

Same format as the Apr 29 Week 2 update §3 prompts. Patrick can copy-paste the caption text; Marketing Agent has no read-access to Patrick's TikTok/IG/YT so execution remains presumed-unverified until Patrick replies in brain with post links.

**Operating constraint reminder:** if `@shutterapp`/`@shutterfind` handles aren't claimed by Day 23, the Day 8 product-demo repost-onto-brand-account doesn't happen and the brand handle remains a geo-ads gate blocker.

### Day 22 — Wed May 13 — Product demo (booking flow end-to-end)
**Hook (first 1.5s):** Screen-record cursor tapping a pulsing pin → profile card pops → tap Book → date picker → Pay button → Stripe Checkout flash → confirmation.
**Caption draft:** "From pin → booked in 90 seconds. No DMs in the dark. shutterfind.app — Tahoe creator map."
**B-roll alt:** if Patrick wants voiceover instead: "This is what it looks like to book a filmer at 8am for a 2pm shoot."
**CTA:** "shutterfind.app — Join the map. Free for the first 25 creators."
**Hashtags:** `#tahoe #snowboardfilmer #freelancephotographer #creators #booking`
**SB-478 note:** capture the **fee-breakdown screenshot** while filming this demo — kills two birds (precondition #6 AND content). Save at `legal/sb478_test_mode_checkout.png`.

### Day 23 — Thu May 14 — Behind-the-shot (turnaround story)
**Hook:** Patrick at the FX3 → cut → final color-graded frame → text overlay "Booked 8am. Footage by 2pm. Shutter."
**Caption draft:** "Found my filmer on Shutter at breakfast. Had the cut by lunch. This is what density does. shutterfind.app."
**Pillar mix:** Patrick is auto-cleared as featured creator (founder consent implicit) — no DM-consent screenshot needed. If filming with another creator, get explicit "yes" via DM, screenshot, save at `marketing/consent_screenshots/<handle>_<date>.png` per Legal May 5 interim protocol.

### Day 24 — Fri May 15 — Creator spotlight (Creator #7, last seeded)
**Hook:** Spotlight card → "Spotlight: [@handle] — [specialty] — based in [city]."
**Caption draft:** "Spotlight #7 — [@handle], [specialty]. On Shutter."
**Pillar:** This is the final seeded-creator spotlight. From Day 28 forward, spotlights need to feature real signups, so creator-recruitment outreach in §4 below has high leverage between now and then.

### Day 25 — Sat May 16 — Tahoe POV (spring corn)
**Hook:** Silent. Spring corn snowboard run, mid-mountain Palisades or Heavenly. Patrick's existing footage. Lower-third "shutterfind.app" watermark, no narration.
**Caption draft:** "Saturday in Tahoe. Who's filming this weekend? Drop a pin."
**Brand atmosphere only** — no CTA pressure. The point is the vibe; CTA is in the on-screen watermark.

### Day 26 — Sun May 17 — Educational (the 8% fee, plainly)
**Hook:** 3-slide carousel (still images) OR 30s talking-head. "How the 8% service fee works."
**Slide / line 1:** "You charge $700 for a full day."
**Slide / line 2:** "Client pays $700. Shutter takes 8% = $56."
**Slide / line 3:** "You keep $644. We handle Stripe, refunds, and the map."
**Caption draft:** "Transparency. The 8% is the only money Shutter touches. Save this if you're a creator. shutterfind.app."
**Legal compliance note:** verbatim "8% service fee" language per Orchestrator Apr 20 ruling. No comparative claims, no superlatives, no ®.

### Day 27 — Mon May 18 — Founder story (the first non-seed message)
**Hook:** Patrick on-camera, natural light, Truckee backdrop. "I got the first DM from someone I didn't know last week. They booked an FX3 morning shoot."
**Caption draft:** "Three weeks ago Shutter was 7 names I personally messaged. Last week someone I'd never met booked through it. That's the curve we're climbing."
**Note:** This script is template — if no real-creator booking has actually landed by May 18, swap to "**One more creator hits the map and the gravity flips. We're at [N]/25.**"

### Day 28 — Tue May 19 — Creator spotlight (first real non-seed creator)
**Hook:** Spotlight card → real creator who joined via the map this week.
**Caption draft:** "Spotlight: [@handle]. First creator to join Shutter from a DM. Tahoe-based. [specialty]. shutterfind.app."
**Fallback:** if zero real signups by May 19, swap to a **gear-and-craft tip educational post** ("3 things I check before every cold shoot in Tahoe") to avoid a hole in the spotlight cadence. The spotlight slot rolls to Day 31 in that case (Week 5 extension).

## 4. Creator recruitment v3 — pipeline status & this week's pushes

### 4.1 Standing-blocked contacts (Patrick must reply with handles + roles)
*Same 6-item reply ask, FOURTH reminder. No movement since Apr 22. Marketing cannot send these DMs without the handles.*

| Name | Role guess | Reason flagged | Reply needed |
|---|---|---|---|
| Cynthia | unknown (photo? content?) | Patrick mentioned at Apr 16 kickoff as "biggest network value" | Handle + specialty |
| Luke Lacey | possibly filmer? | Patrick listed as a key contact in original brief | Handle + specialty + city |
| Victoria | unknown | Patrick listed as a key contact in original brief | Handle + specialty |

**If still blank by next Marketing run (Wed May 20), escalating to Orchestrator as a P1 recurring blocker** — three weeks of carry-over with zero movement suggests either the names are stale, the contacts have soft-declined, or Patrick's attention bandwidth is consumed by the Mercury cascade. All three explanations are legitimate; we just need to know which so we can stop including these as blockers.

### 4.2 Active outreach channels (no Patrick input required)
*These run regardless of Patrick's reply on §4.1 — IRL + cold-outreach paths.*

- **IG hashtag scrub** — `#tahoesnowboarding`, `#truckeefilmmaker`, `#laketahoephotographer`, `#palisadestahoe` — sort by Recent, identify ≥3 creators/day with active posting + Tahoe geotag + bookable look. DM via outreach_templates.md "Cold IG DM v2" template. **Target:** 5 DMs/week (≈25 messages by Memorial Day).
- **YouTube Shorts comment outreach** — find Tahoe-region snowboard/ski/drone Shorts <30 days old, leave a non-spammy comment ("dope shot, you film for hire? we just built a map for Tahoe creators if you're around"), follow up via DM if they respond. **Target:** 3/week.
- **Tahoe Discord + FB groups** — Tahoe Locals FB, r/Truckee, r/Tahoe, the few Discord servers for backcountry/skitouring folks. Drop a single non-spammy intro post per group, link `shutterfind.app/?src=group_<name>`. **Target:** 2 groups/week.
- **Resort media-team handoffs** — Palisades, Heavenly, Northstar, Sugar Bowl PR/Comms emails. Outreach line cleared by Legal May 5 (*"would love to feature your photo team"* — plain prospect outreach, no FTC § 5 trigger). **Target:** 1 resort/week. Status: PALISADES sent Apr 29 (no reply), HEAVENLY next.
- **FAA Part 107 alt-sourcing** — search Reno-Tahoe area Part 107 holders via FAA's public airman database, cross-reference IG/website. **Target:** 1/week scouted, 1/2-weeks DM'd.
- **Athlete-team scouts** — Burton/Patagonia/Smith local team riders (≈5-10 in Tahoe). Their personal filmer/photog is often a hireable creative. **Target:** identify by Memorial Day, no outreach yet (relationship-based, founder-led).

### 4.3 IRL sticker drop (~$30 Stickermule, ~$0 paid spend)
**Status:** awaiting Patrick brain-confirmation that order placed. Print spec from Apr 29 update §4.4 unchanged: 50 stickers, white-on-black with map-pin glyph + `shutterfind.app` URL + a unique `?src=sticker_<location>` QR code per location.

**8 placement locations** (Truckee/Tahoe priority order):
1. **Wild Cherries Coffee** (Truckee) — `?src=sticker_wildcherries`
2. **Coffeebar Truckee** — `?src=sticker_coffeebar`
3. **Palisades Tahoe lower-lot bulletin board** — `?src=sticker_palisades`
4. **Northstar village ride-up rack** — `?src=sticker_northstar`
5. **Heavenly Gondola line bulletin** — `?src=sticker_heavenly`
6. **Tahoe Mountain Sports (Truckee)** — `?src=sticker_tahoesports`
7. **South Lake's Stateline coffee shop (any)** — `?src=sticker_southlake`
8. **Reno-Tahoe Airport baggage claim restroom** *(high-density, low-permission)* — `?src=sticker_RNO`

**When Patrick confirms order placed in brain:** Marketing pings Finance to pre-tag the expense to `marketing_irl_print` per Apr 30 P&L Taxonomy.

### 4.4 Pre-stub "claim your pin" tactic (Orchestrator-approved May 4)
**Plan:** scrape 30 Tahoe creators from IG hashtag pass (§4.2 row 1), pre-create stub profiles on the map (no contact info, just handle + specialty + "claim this pin" CTA), then DM each one a personalized "Hey, we made a placeholder pin for you on shutterfind.app — claim it to add gear/rates/availability." Kill threshold: 0 of 3 claimed within 14 days.

**Status May 13:** NOT YET RUN. Was not exercised during May 6 missed slot. Planning execution this week:
- **Wed May 13 (today, post-report):** scrape 3 high-fit Tahoe creators from IG `#tahoesnowboarding` recent. Document criteria + handle list in brain (no public posting).
- **Thu May 14:** create 3 stub profiles via Supabase admin (Marketing Agent doesn't have DB write access in scheduled runs — needs Patrick or Dev to insert; alternative is to draft the SQL `INSERT` for prompt v4 bundle).
- **Fri May 15:** Patrick DMs each of 3 from his personal handle.
- **2-week kill date:** Fri May 29. If 0/3 claimed, kill.
- **If ≥1 claims:** scale to 10 next batch; document outcome for Phase 2/3 expansion-market playbook.

**Action item for Dev (added to message board below):** can the stub-profile insert be scoped into prompt v4 as a one-row `creators_stub` Supabase migration OR a Patrick-runs-locally `claim_stub.sql` snippet? Marketing prefers the second (no schema change, lower review surface).

## 5. Gig Feed launch-day post — scheduled into Day 29 of calendar

Per Orchestrator May 11 ruling, the 3-day heads-up window has long expired (prompt v3 LIVE 14 days, Gig Feed UI shipped Apr 29). Marketing Agent is releasing the swap-in slot and **scheduling the launch-day post to Day 29 (Wed May 20)** of the existing 30-day calendar:

- **Day 29 (was generic "Product demo: My Profile panel"):** **swap to Gig Feed launch-day post.** 30s screen-capture of Gig Feed posting flow with 4-step form visible.
- **Caption draft:** "New on Shutter: Gig Feed. Post the shoot you need filmed. Show creators where the work is, in real time. shutterfind.app."
- **Day 30 (May 21) unchanged** — Founder story / CTA: "30 days of Shutter. [N] creators on the map. Your turn."

Asset to record before Day 29: the 30s screen-cap. Patrick can capture during the same E2E test trip that nets the SB-478 screenshot (same Stripe-onboarding flow exercises Gig Feed posting if Patrick is `is_listed=true`).

## 6. Stuff that ran during the May 6 missed slot (or didn't)

Brutal honesty per Orchestrator May 11 directive on observability — the May 6 scheduled run didn't fire (or fired and silently failed). Treating the slot's expected output as "shipped at zero verified output" — same convention used Apr 29 for Patrick's content channels. **What was scoped for May 6 that didn't land:**
- Tally of Patrick's 6-item reply (still blank, fourth reminder this run)
- Geo-ads gate count reconciliation (done THIS run instead, see §2)
- Real-creator count update (still 0 / 7 baseline)
- Gig Feed launch-day post slotting (done THIS run, see §5)
- Stickermule QR convention confirmation (still UNVERIFIED, see §4.3)
- Creator-featured ad creative DM-consent routing (no creator-featured creative produced this week, see §1 — `marketing/consent_screenshots/` folder does not exist)
- Pre-stub "claim your pin" tactic outcomes (NOT YET RUN, plan staged this run in §4.4)

**Net effect of the miss:** ~7 days of double-load on this run. None of the May 6 priorities were emergency-tier; the consequence is delayed visibility into recurring-blocker patterns (especially Patrick's 6-item reply).

## 7. Asks routed to other agents this run

See AGENT_BRAIN.md message board for verbatim text. Summary:

- **[MARKETING] → [PATRICK]:** fourth reminder on the 6-item reply. Add: confirm Stickermule order placed; confirm brand-handle claim status; flip "Live on map" toggle when convenient.
- **[MARKETING] → [ORCHESTRATOR]:** if 6-item reply is still blank by May 20 run, escalate as P1 recurring blocker — recommend triage call (drop the 3 named contacts vs. wait further vs. reach out via shared mutual).
- **[MARKETING] → [DEV]:** for prompt v4 — add a `claim_stub.sql` snippet path or a one-time `INSERT` for 3 pre-stub profiles (Marketing's "claim your pin" tactic test). Schema reminder: `profiles` not `creators`.
- **[MARKETING] → [FINANCE]:** Stickermule $30 still pending Patrick confirmation; will ping you with order number + date when posted. P&L tag `marketing_irl_print` per Apr 30 taxonomy.
- **[MARKETING] → [LEGAL]:** `marketing/consent_screenshots/` folder is empty this week (no creator-featured ad creative produced). Will surface again when produced.

## 8. Phase-2 trigger and standing protocol

Phase 2 ($14/mo Creator Pro tier) still inactive at 0/25 real creators (0% of target). Standing protocol unchanged: at 25, ping Orchestrator + Finance same-day. No movement to report this week.

## 9. Open requests for Orchestrator (May 18 sync)

1. **6-item reply escalation guidance** — if still blank May 20, what's the right triage step? (Drop contacts vs. wait vs. mutual-friend route vs. founder-direct text.)
2. **Pre-stub tactic SQL routing** — is the prompt v4 channel (Dev bundle) the right home for the 3-row `INSERT`, or should Marketing wait for a separate sprint? Marketing prefers bundling — single review surface.
3. **Gig Feed launch-day post slot move (Day 9 → Day 29)** — informational. Releasing the swap-in slot.
4. **Geo-ads launch window** — late May → early June revised baseline given the one-week Mercury slip. Confirm acceptable, or flag if pulling forward.

---

*Next Marketing Agent run: Wed May 20, 2026. Run-integrity heartbeat required at top of report.*
