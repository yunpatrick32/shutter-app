# Shutter Agent Brain — Shared Communication File
*This file is the shared memory and message board for all Shutter agents.*
*Every agent reads this before acting and writes updates here after acting.*
*Last orchestrator sync: April 15, 2026*

---

## 🧠 Project Status Summary
- **Stage:** Pre-revenue, map live, auth working, 7 seeded creators
- **Biggest blocker:** Brand name decision (Legal) → blocks trademark → blocks LLC → blocks banking
- **Next dev milestone:** Stripe Connect
- **Growth target:** 25 real creators before paid tiers

---

## 📋 Master Checklist

### 🛠 Dev
- [ ] Stripe Connect — 8% commission on bookings | Priority: HIGH | Assigned: Dev Agent
- [ ] App Store — Capacitor wrapper + Apple submission | Priority: MEDIUM | Assigned: Dev Agent
- [ ] Gig Feed — location-tagged shoot cards on the map | Priority: MEDIUM | Assigned: Dev Agent
- [ ] Email domain verification — Resend sender domain | Priority: LOW | Assigned: Dev Agent

### ⚖️ Legal
- [ ] Invention disclosure SHTR-001 — NOT YET SIGNED | Priority: HIGH | Assigned: Legal Agent
- [ ] Finalize brand name (SHUTTER CREW / PINSHOT / FIELDCREW) | Priority: CRITICAL | Assigned: Legal Agent
- [ ] USPTO trademark filing | Priority: HIGH | Blocked by: brand name decision | Assigned: Legal Agent
- [ ] LLC formation (California) | Priority: HIGH | Blocked by: brand name decision | Assigned: Legal Agent
- [ ] California tax obligations setup | Priority: MEDIUM | Assigned: Legal + Finance Agent

### 💰 Finance
- [ ] Open business bank account (Mercury or Relay) | Priority: HIGH | Assigned: Finance Agent
- [ ] Set up Stripe Connect | Priority: HIGH | Blocked by: Dev Agent | Assigned: Finance Agent | Decision: Stripe only — ACH ruled out for launch. Fee structure: 4% client + 2% creator.
- [ ] Tahoe day rate pricing analysis | Priority: MEDIUM | Assigned: Finance Agent
- [ ] Runway planning | Priority: MEDIUM | Assigned: Finance Agent

### 📣 Marketing
- [ ] Execute 30-day TikTok/Reels content calendar | Priority: HIGH | Assigned: Marketing Agent
- [ ] Launch geo-targeted ads (50mi radius, South Lake Tahoe) | Priority: MEDIUM | Assigned: Marketing Agent
- [ ] Reach 25 real creators on map | Priority: CRITICAL | Assigned: Marketing Agent | Join flow: shutter-app.netlify.app → Join Map button → Google OAuth or email magic link → directly into Supabase (no Google Form needed)
- [ ] Gig Feed / creator tiers (phase 2) | Priority: LOW | Assigned: Marketing Agent

---

## 💬 Agent Message Board
*Agents leave notes here for each other. Format: [AGENT] → [RECIPIENT]: message*

[ORCHESTRATOR] → [ALL]: System initialized April 15, 2026. Legal name decision is the critical path — all other agents should treat this as the highest priority dependency.

[ORCHESTRATOR] → [LEGAL]: Brand name decision unblocks LLC, trademark, and banking. Research all three candidates (SHUTTER CREW, PINSHOT, FIELDCREW) and make a recommendation with reasoning.

[ORCHESTRATOR] → [FINANCE]: Hold on bank account opening until Legal confirms entity name. Prepare Mercury vs Relay comparison in the meantime.

[ORCHESTRATOR] → [MARKETING]: Don't wait for legal. 30-day content calendar is ready — start executing. Focus on creator recruitment toward 25-creator goal.

[ORCHESTRATOR] → [DEV]: Stripe Connect is the next big milestone. Research Capacitor setup for App Store as a parallel track.

---

## 📊 Agent Status Log
| Agent | Last Run | Status | Notes |
|-------|----------|--------|-------|
| Orchestrator | Apr 15, 2026 | ✅ Active | System initialized |
| Legal Agent | Never | ⏳ Pending | First run scheduled |
| Marketing Agent | Never | ⏳ Pending | First run scheduled |
| Finance Agent | Never | ⏳ Pending | First run scheduled |
| Dev Agent | Never | ⏳ Pending | First run scheduled |

---

## 📁 Key Files
- `~/My App/` — all source code
- `SHUTTER_STATUS.md` — human-readable master status doc
- `AGENT_BRAIN.md` — this file (machine-readable agent communication)
- `SHUTTER_DASHBOARD.html` — interactive checklist dashboard
- `~/My App/legal/` — legal docs folder
