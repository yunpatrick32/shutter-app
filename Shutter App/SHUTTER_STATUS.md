# Shutter App — Master Status Doc
*Last updated: April 15, 2026 | Maintained by Cowork*

---

## What Is Shutter
A map-first freelance marketplace for outdoor sports photographers, filmers, models, and creatives around Lake Tahoe. Think Zillow but for finding local creators. Built by Patrick Yun, a snowboard filmer based in Truckee, CA.

**Live site:** https://shutter-app.netlify.app  
**GitHub:** https://github.com/yunpatrick32/shutter-app (PUBLIC)  
**Local path:** `~/My App/`  
**Deploy:** Netlify auto-deploys on every `git push` to main

---

## Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | Vanilla JS ES module, plain HTML/CSS (no framework, no bundler) |
| Map | Mapbox GL JS v3.3.0 |
| Backend | Supabase JS v2 (UMD CDN in index.html) |
| Auth | Supabase Auth — Google OAuth + magic link email |
| Storage | Supabase Storage (avatars + portfolio buckets) |
| Email | Resend via Supabase Edge Function (`notify-message`) |
| Hosting | Netlify |

---

## File Structure
```
~/My App/
├── index.html          — ALL markup + inline CSS + script tags
├── src/
│   ├── app.js          — ALL app logic (currently ?v=51 cache bust)
│   └── data.js         — TAG_META only (tag colors, labels, bg colors)
├── privacy.html        — Privacy Policy + Terms of Service page
├── supabase/
│   └── functions/
│       └── notify-message/
│           └── index.ts — Edge function: emails via Resend on new message
├── manifest.json       — PWA manifest
└── sw.js               — Service worker
```

---

## Critical Code Rules
1. **Cache bust** — increment `?v=N` on app.js script tag in index.html every change (currently v=51)
2. **Window exposure** — any function in inline `onclick=` must be on `window`
3. No `//` comments inside single-line functions
4. **Two-query chat** — messages use two separate queries (sent + received) merged in JS. Do NOT use Supabase OR filter
5. **toCreator(r)** — every DB row goes through this mapper; always add new columns here
6. `pointer-events: none` on location picker overlay so Mapbox drag works

---

## What's Already Built ✅
- Dark 3D Mapbox map with terrain, fog, stars
- Creator pins with colored rings, avatars, availability dot + pulsing Available Now aura
- Filter chips (All, Snowboard, Ski, Photo, Video, Drone, Model, Off-Road)
- Locate-me compass button
- Google OAuth + magic link auth (production, not testing mode)
- Join form with photo upload, geocoded location, specialties, gear, rates, terms checkbox
- Profile card bottom sheet (avatar, bio, gear, rates, schedule, portfolio, book, message)
- My Profile panel (full editing, live toggle, Available Now, location picker, invite button)
- Messaging with threads, chat bubbles, Send Offer (rate proposals), unread badge
- Email notifications on message via Resend Edge Function
- Booking flow (shoot type, date, duration, notes → Supabase + auto-message)
- Available Now system (8hr window, pulsing pin, auto-expire)
- Portfolio photos (6 per creator, lightbox, Supabase storage)
- Stats (Views via RPC, Inquiries from messages, Rating display)
- Privacy Policy + Terms of Service page (`/privacy.html`)
- PWA (installable)

---

## Checklist — What Still Needs to Get Done

### 🛠 Dev
- [ ] Stripe Connect — 8% commission on bookings (Phase 3)
- [ ] App Store — Capacitor wrapper + Apple submission
- [ ] Gig Feed — creators post location-tagged shoot cards on the map
- [ ] Email domain verification — verify domain in Resend so emails come from a Shutter address

### ⚖️ Legal
- [ ] Finalize brand name decision
  - "SHUTTER" = high conflict with live USPTO marks
  - Clean alternatives: **SHUTTER CREW**, **PINSHOT**, **FIELDCREW**
- [ ] Proceed to USPTO trademark filing once name is locked
- [ ] Invention disclosure Doc SHTR-001 — NOT YET SIGNED

### 💰 Finance
- [ ] Open dedicated business bank account (Mercury or Relay)
- [ ] Set up Stripe Connect
- [ ] LLC formation + California tax obligations
- [ ] Tahoe day rate pricing analysis
- [ ] Runway planning

### 📣 Marketing
- [ ] Execute TikTok/Reels content calendar (30-day plan already built)
- [ ] Launch geo-targeted ads (50-mile radius from South Lake Tahoe)
- [ ] Gig Feed / creator strata tiers (phase 2, post-launch)
- [ ] Reach 25 active creators before introducing paid tiers

---

## Monetization Roadmap
- **Phase 1 (now):** Free — grow to 25–40 active creators
- **Phase 2:** Creator Pro subscription
- **Phase 3:** 8% platform commission + brand/resort partnerships

---

## Key Contacts
| Name | Handle | Role |
|------|--------|------|
| Bevan | ClawMechanic.ai | Technical collaborator |
| Cynthia | — | Outreach |
| Luke Lacey | — | Outreach |
| Victoria | — | Outreach |
| Dolph | @dolph_mcd | Outreach |
| Chris | @generikal | Outreach |
| Kyle Martz | @kylemartzmedia | Suggested Reno/SF expansion |

---

## Brand
- Patagonia-inspired raw/gritty aesthetic
- Taglines: *"Your crew is already out there."* / *"Find your shot. Find your crew."* / *"Built for the mountain. Built for right now."*

---

## Git / Deploy Commands
```bash
# Deploy
cd ~/My\ App && git add . && git commit -m "message" && git push

# Fix git lock errors
rm -f ~/My\ App/.git/index.lock ~/My\ App/.git/HEAD.lock

# Deploy Edge Function
npx supabase functions deploy notify-message --project-ref panktkmwgcttjpebucqy

# Set secrets
npx supabase secrets set RESEND_API_KEY=re_xxx --project-ref panktkmwgcttjpebucqy
```

---

## How the Three Claude Tools Connect
| Tool | File Access | Best For |
|------|-------------|----------|
| **Cowork** (this app) | ✅ `~/My App/` | Planning, docs, memory, browser, scheduling |
| **Claude Code** (terminal) | ✅ `~/My App/` | Coding, git, running local server |
| **Claude.ai Chat** (web) | ❌ None | Mobile brainstorming, quick questions |

> To sync Claude.ai: upload this file to your Shutter App project knowledge on claude.ai.

---

*Auto-maintained by Cowork. Updated every Monday at 9am. To manually update, ask Cowork to "refresh the status doc".*
