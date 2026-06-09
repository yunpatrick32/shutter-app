# Claude Code Prompt — Booking Form Redesign

## Overview
Redesign the "Book Creator" panel in `src/app.js` and `index.html`. This is the panel that opens when a client clicks "Book Now" on a creator's profile card. Four changes: (1) fix rates visibility bug, (2) expand and rename shoot type options, (3) expand deliverables with categories, (4) replace the date text input with a vanilla JS calendar picker that supports single day or multi-day range selection.

---

## 1. Fix: Rates should respect the `show_rates` toggle

**Bug:** The price preview at the bottom of the booking form (e.g. "Half day · 350") currently renders unconditionally regardless of whether the creator has `show_rates` enabled.

**Fix:** In the booking panel render function, wrap the price preview element in a conditional. Only show the price if the creator's `show_rates` field is truthy. If `show_rates` is false (or falsy/undefined), replace the price line with:

```
"Rates to be discussed with the creator"
```

Check how the creator object stores this. It's likely `creator.show_rates`, `creator.rates_visible`, or similar. Look for where the price preview is rendered and add the guard.

---

## 2. Shoot Type — Replace "Snowboard" default with full project type list

Replace the current shoot type `<select>` options. The dropdown should represent the *type of project* a client is booking, not the creator's specialty. Use these options in this order:

```
Snow Sports
Mountain Biking
Off-Road / Motorsport
Rock Climbing / Hiking
Water / Surfing
Commercial / Brand
Social Media Content
Event Coverage
Documentary
Music Video
Post-Production Only
Other
```

The first option should be a placeholder: `<option value="" disabled selected>Select project type</option>`

---

## 3. Date — Vanilla JS calendar picker with optional multi-day range

Remove the current date text input entirely. Replace with a custom calendar picker built in vanilla JS (no external libraries).

### Layout — CRITICAL: prevent overflow
The date field and calendar dropdown MUST be fully contained within the panel width. Apply these styles to the date field container:
```css
width: 100%;
box-sizing: border-box;
max-width: 100%;
overflow: hidden;
```
The calendar dropdown must NOT overflow the right edge of the panel. Use `position: absolute; left: 0; right: 0;` so it stretches to the panel edges, not beyond.

### Multi-day checkbox
Directly below the DATE label, show a single checkbox row:

```
☐  Multiple days
```

- Default: unchecked (single day mode)
- When checked: switches to range selection mode
- This is a plain `<input type="checkbox">` styled to match the app's existing checkbox style, with the label "Multiple days" next to it

### Calendar UI
- Opens as a dropdown below the date field when the field is clicked
- Shows one month at a time with ‹ Prev / Next › arrows in the header showing "April 2026"
- 7-column grid: Sun Mon Tue Wed Thu Fri Sat column headers
- Past dates grayed out, `pointer-events: none`
- Dark background (`#1a1f2e`), selected date(s) in app purple (`#6366f1`)

### Single day mode (checkbox unchecked)
- Click any future date to select it
- Selected date gets a filled purple circle
- Date field shows: `"Apr 20, 2026"`
- Calendar closes automatically on selection

### Range mode (checkbox checked)
- First click = start date (solid purple circle)
- Hover after first click shows live range preview (lighter purple fill across days)
- Second click = end date (solid purple circle), full span highlighted
- Date field shows: `"Apr 20 – Apr 23, 2026"`
- Calendar stays open until both dates are selected, then closes
- Clicking a third time resets and starts a new selection from scratch

### Hidden inputs
Store the values as ISO strings:
- `booking_date_start` — always set
- `booking_date_end` — same as start for single day; end of range for multi-day

### Duration field behavior
- Checkbox **unchecked** (single day): show the Duration row (Half Day / Full Day / Custom)
- Checkbox **checked** (multiple days): **hide the Duration row entirely** — the date range communicates duration

---

## 4. Deliverables — Expand with categories

Replace the current 4 checkboxes (Highlight Reel, Raw Footage, Photos, Drone Shots) with an expanded set organized by category. Each category has a small label above it. Use the same pill/checkbox style as the current UI.

```
VIDEO
☐ Highlight Reel   ☐ Full Edit   ☐ Social Cuts (Vertical)   ☐ Raw Footage   ☐ BTS   ☐ Music Video Edit   ☐ Documentary Cut

PHOTO
☐ Edited Gallery   ☐ RAW Files   ☐ Film Scans   ☐ Social Ready Crops

AERIAL
☐ Drone Highlights   ☐ Raw Aerial Footage

POST-PRODUCTION
☐ Color Grade   ☐ Sound Mix   ☐ Subtitles / Captions
```

Style the category labels (VIDEO, PHOTO, etc.) in uppercase, small, muted text (like the existing section labels in the app). The checkboxes themselves use the same pill style as the current deliverables.

The values saved to Supabase in the `bookings` table should be a comma-separated string or JSON array of the selected deliverable labels. Check how the current `deliverables` column is stored and match that format.

---

## Implementation Notes

- **Cache bust:** Increment `?v=N` on the `app.js` script tag in `index.html` after making changes.
- **Window exposure:** Any new functions called from inline `onclick=` handlers must be on `window`.
- **No `//` comments** inside single-line functions.
- **toCreator(r) mapper:** If any new fields are added to the bookings form that read from the creator object (e.g. `show_rates`), make sure the field is present in the `toCreator(r)` mapper in `app.js`.
- The booking panel appears to be a full-screen slide-in panel (based on "Book Creator" header with back arrow). Keep the same layout/structure — only modify the form fields inside it.
- Test the calendar picker on mobile viewport sizes since this is also a PWA.

---

## Files to edit
- `src/app.js` — all logic: booking panel render, calendar JS, rates visibility guard, shoot type options, deliverables list
- `index.html` — update cache bust version on `app.js` script tag

## What NOT to change
- The "Book Creator" header / back arrow
- The creator avatar, name, location shown at the top of the panel
- The Notes textarea
- The "Send Booking Request" button behavior (still saves to Supabase + sends auto-message — payment step comes later)
