# Lovable.dev Build Prompt — Shutter Bookable Score Quiz

Copy everything inside the box below into Lovable.dev.

---

Build a mobile-first web app called the "Bookable Score" quiz — a free lead-magnet quiz for Shutter, a map-first booking marketplace for outdoor and creative talent (photographers, videographers, drone pilots, editors, colorists, models, crew). The website is shutterfind.app. The goal: a creative answers five quick questions, gets an instant score from zero to one hundred, sees their tier and top three fixes, then enters their email to unlock a full report and is sent to shutterfind.app.

DESIGN
- Dark, cinematic, map-inspired theme. Near-black background, high contrast, one accent color for the score and primary buttons. Clean, modern, premium — like an Apple product.
- Mobile-first and fully responsive. Big, thumb-friendly tap targets.
- One decision per screen. Generous spacing. Smooth transitions between screens.
- Feels like a game, not a form. Whole experience under two minutes.

SCREENS / FLOW
1. Welcome screen: headline "How bookable are you right now?", short subtext "Answer five quick questions. Get your Bookable Score and the exact things costing you gigs — in two minutes.", a large "Get my score" button, and small text "Free. No login to start."
2. Five question screens, shown one at a time, each with a progress bar at the top showing "Question X of 5":
   Q1 "How complete is your online profile and portfolio?" — Polished, gear, rates, recent work (20) / Decent but a bit outdated (13) / Bare bones or scattered links (6) / I don't really have one (0)
   Q2 "Can a client see that you're available right now?" — Yes, my availability is live (20) / Only if they message and ask (10) / No, there's no way to tell (0)
   Q3 "Are your rates easy to find?" — Clear and upfront (20) / Available on request (12) / I figure it out case by case (5) / I avoid the rate talk (0)
   Q4 "How do most clients find you today?" — They come to me or referrals (20) / Instagram and DMs (11) / Cold outreach from me (5) / Honestly, they mostly don't (0)
   Q5 "How fast do you respond to a new inquiry?" — Within minutes (20) / Within a few hours (13) / Same day-ish (7) / Whenever I see it (2)
   Selecting an option immediately advances to the next screen.
3. Score reveal screen: animate the total score counting up from zero to the final value out of one hundred. Show a tier label based on the score:
   0-29 "Off the Map" / 30-54 "Getting Found" / 55-79 "Local Pro" / 80-100 "Booked-Out Ready".
   Show a one-line encouraging message per tier. Below that, show "Your top three fixes" — pull the three lowest-scoring questions and show a fix line for each:
   Profile/portfolio low -> "Tighten your profile and portfolio so clients see your best work first."
   Availability low -> "Turn on live availability so clients know you're free right now."
   Rates low -> "Make your rates clear so inquiries don't stall on price."
   Discovery low -> "Get on a platform where local clients can actually find you."
   Response speed low -> "Respond to inquiries faster so you stop losing day-of bookings."
4. Email capture (shown after the score, on the same screen below the fixes): heading "Get your full report and fix checklist", an email input, an opt-in checkbox "Email me my report and tips", and a button "Send my report and get on the map". On submit, save the data and go to the thank-you screen.
5. Thank-you screen: "Your report is on the way." plus a large button "Get on the map" linking to https://shutterfind.app, and a small "Retake quiz" link that restarts the flow.

DATA
- Use Supabase. Create one table "quiz_submissions" with columns: id (uuid, primary key, default gen_random_uuid), email (text, nullable), q1 int, q2 int, q3 int, q4 int, q5 int, score int, tier text, top_fixes text array, source text, created_at timestamp default now(). Enable row-level security allowing public inserts only (no public reads).
- On email submit, insert one row with all answers, computed score, tier, and the three lowest-scoring category keys as top_fixes. Capture any utm_source query param into "source".

EMAIL
- After insert, trigger a transactional email to the user with their score, tier, and the three fixes. Use Resend if available; otherwise leave a clearly-marked placeholder function for the email send so I can plug in my provider key.

TECH
- React with Tailwind. Keep it a clean single-page app. Round all displayed numbers to integers. No login or accounts for quiz takers. Smooth, fast, no unnecessary libraries.

Make it beautiful, fast, and dead simple. This is the first impression of the Shutter brand.

---
