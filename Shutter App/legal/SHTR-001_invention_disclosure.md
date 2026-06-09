# Invention Disclosure SHTR-001
### Shutter — Map-First Freelance Marketplace for Outdoor Sports Creatives

**Inventor:** Patrick Yun
**Residence:** Truckee, California
**Disclosure Number:** SHTR-001
**Date of Disclosure:** `[to be dated and initialed by inventor upon signing]`
**Date of First Conception:** April 15, 2026 (or earlier — inventor to confirm)
**Date of First Reduction to Practice:** April 15, 2026 (working deployed prototype at shutter-app.netlify.app)
**Witnesses:** (none required for solo inventor; optional)

---

## 1. Title of the Invention
Shutter — a map-first freelance marketplace matching outdoor-sports clients to local photographers, filmers, drone operators, models, and related creatives.

## 2. Brief Summary
Shutter is a web/progressive-web-app-based marketplace in which freelance outdoor-sports creators register geo-located profiles that surface as interactive pins on a 3D terrain map (initially focused on the Lake Tahoe region). Clients browse creators by map proximity, specialty filter, availability status, and gig feed, then message, negotiate rate, and book directly through the platform. Payments are processed end-to-end via Stripe Connect Express with a flat 8% platform fee applied at charge time via Stripe's `application_fee_amount`. The platform layers real-time presence ("Available Now"), a gig feed, and creator portfolios on a single map-first experience.

## 3. Problem Solved
Existing freelance platforms (Upwork, Fiverr) and photography-specific marketplaces (Shutterfly, Shuttercraft, Splento) are list-first or search-first and do not surface local proximity, current availability, or specialty-appropriate filtering for outdoor-sports shoots (snowboard, ski, MTB, climbing, watersports, off-road, drone). Industry creators discover each other today through Instagram DMs, word-of-mouth in Truckee/Tahoe, and local ski/board crews — which is high-friction and opaque to clients. Shutter solves the discovery problem for both sides by (a) making proximity and availability spatially obvious, (b) integrating booking + payments in-app, and (c) creating a local network effect around a defined geographic region.

## 4. Novel / Distinguishing Features
The following features are believed by the inventor to be novel in combination, whether or not individually patentable:

### 4.1 Map-First Creator Pins
Circular avatar pins with color-coded rings keyed to the creator's primary specialty (snowboard, ski, photo, video, drone, model, off-road). Pins include an availability dot and a pulsing "Available Now" aura when the creator has self-attested as available in the current 8-hour window.

### 4.2 Available-Now Pulsing Presence
An 8-hour self-attested availability window that visually pulses the creator's pin and auto-expires without user action. Unlike typical "online now" indicators tied to active session presence, this is an explicit time-boxed intent signal appropriate to the episodic, shoot-by-shoot nature of freelance creative work.

### 4.3 Gig Feed with Map-Pinned Opportunities
A second pin class — square card pins with a date ribbon, color-coded by gig type (paid / collab / looking_for) — co-resident on the same map and filterable via a toggle (Creators / Gigs / Both). Creators post location-tagged shoot opportunities that other creators can apply to. Expiring-soon gigs pulse for urgency (within 48 hours of shoot date). *Design stage as of April 21, 2026; database layer landed April 20.*

### 4.4 Specialty-First Filter Bar
A top-of-screen chip row (All, Snowboard, Ski, Photo, Video, Drone, Model, Off-Road) that filters both the creator pins and the gig pins on the single map surface. Tag metadata (color, label, background) is centralized in a single config (`data.js → TAG_META`) to keep rendering consistent across pins, profile cards, and filter chips.

### 4.5 Two-Query Chat Architecture
Rather than an OR-filter on a Supabase messages table (which triggers unavoidable row-level-security edge cases when users are on both sides of different threads), Shutter splits chat reads into a "sent by me" query and a "received by me" query and merges them in JavaScript. This pattern is a Shutter-specific architectural choice tuned to Supabase's RLS implementation.

### 4.6 Bookings with Cancellation Tier + Weather-Reschedule State Machine
Bookings transition through `pending_payment → paid → completed → refunded`, with cancellation refunds tiered by time-to-shoot (72h+ full, 24-72h 50%, <24h none) and a 14-day weather-reschedule window before auto-refund. Implementation landed in database schema April 20, 2026; `cancel-booking` Edge Function to wire in April 24+ Dev run.

### 4.7 `toCreator(r)` Normalization Pattern
A single mapper function sits between every database row and every render site, camelCasing keys, coercing null-safe defaults, and unifying ISO-date handling. This keeps the UI schema-change-resilient.

## 5. Related Prior Art (known to inventor)
- Shutterfly, Inc. — photo printing + sharing. Different goods/services.
- Upwork, Fiverr — general-purpose freelance marketplaces. No map-first discovery, no geo-locality.
- Bark, Splento — photographer-matching platforms. List-first, global.
- Instagram / TikTok Creator Discovery — discovery by posted content only; no availability, no booking, no payments.

No prior-art system known to the inventor combines (a) a 3D-terrain map-first discovery surface, (b) real-time availability pulsing, (c) creator and gig pins on the same map with filter toggle, (d) integrated Stripe Connect marketplace booking with the refund-tier state machine described above, (e) geographic scoping to a specific outdoor-sports region.

## 6. Current State of Reduction to Practice
As of the date of disclosure:
- Working deployed PWA at https://shutter-app.netlify.app
- Vanilla JS / HTML / CSS (no framework) — full source at github.com/yunpatrick32/shutter-app
- Mapbox GL JS v3.3.0 rendering 3D dark terrain around Lake Tahoe with fog + stars
- Supabase (Postgres + Auth + Storage + Edge Functions) backend
- 7 seeded creator profiles live; Google OAuth + magic-link auth operational
- Portfolio photos, profile editor, messaging with Send-Offer, email notifications via Resend
- Stripe Connect Express webhook + onboarding UI written locally (commit `c6a9727`, pending push as of Apr 20)
- Database migrations for gigs table + bookings refund columns written locally
- Brand: legal entity "Shutter Find LLC" (filing pending), app/consumer brand "Shutter"

## 7. Commercial Potential
- Immediate market: Lake Tahoe / Truckee / Reno outdoor-sports creators (snowboard, ski, MTB, climbing, watercraft)
- Near-term expansion: Mammoth, Jackson Hole, Park City, Whistler, Colorado Front Range, PNW — same template
- Monetization: Phase 1 free → Phase 2 Creator Pro subscription ~$14/mo at 25 active creators → Phase 3 flat 8% platform commission on completed bookings at 50+ creators + booking volume

## 8. Assignment
Upon formation of Shutter Find LLC and execution of the Operating Agreement referenced herein, the inventor hereby assigns all right, title, and interest in the inventions described in this disclosure to Shutter Find LLC pursuant to Article 6 of the Operating Agreement.

## 9. Confidentiality
This disclosure is a confidential record of invention and should not be shared outside of the inventor, the inventor's attorney, and the inventor's accountant without written permission.

---

## Inventor's Attestation

I, the inventor named above, affirm that the information in this disclosure is true and correct to the best of my knowledge, that I am the original inventor of the subject matter disclosed, and that I have not previously assigned these inventions to any third party.

Inventor signature: _________________________________________

Printed name: Patrick Yun

Date: _________________________________________

Witness (optional): _________________________________________

Witness date: _________________________________________
