# Claude Code Prompt — Expand Specialties / Production Roles

## Context
Shutter is a map-first freelance marketplace for outdoor sports creatives around Lake Tahoe. The app is built in vanilla JS/HTML/CSS with Mapbox GL JS and Supabase.

**Live site:** https://shutter-app.netlify.app  
**Local path:** ~/My App/  
**Key files:** src/data.js (tag definitions), src/app.js (all logic), index.html (markup + script tags)

---

## What Needs to Change

The current specialties/tags are limited to: snowboard, ski, photo, video, drone, model, off-road.

We need to expand these to cover a full video and photo production crew — including production roles, alternative camera roles, and post-production. The specialties grid appears in the **My Profile panel** (where creators set their skills) and the **map filter chips** (where clients filter creators).

---

## New Full Tag List

Replace the existing `TAG_META` in `src/data.js` with this expanded set. Keep existing tags, add the new ones. Use distinct colors for each category group.

### Outdoor Sports (keep existing)
- `snowboard` — label: Snowboard
- `ski` — label: Ski
- `off-road` — label: Off-Road
- `model` — label: Model

### Camera & Capture
- `photo` — label: Photographer (keep existing key, update label if needed)
- `video` — label: Videographer (keep existing key)
- `drone` — label: Drone Op (keep existing key)
- `film-photo` — label: Film Photographer
- `broll` — label: B-Roll Cam
- `dp` — label: DP
- `1ac` — label: 1st AC
- `2ac` — label: 2nd AC

### Direction & Production
- `director` — label: Director
- `ad` — label: AD
- `2ad` — label: 2nd AD
- `producer` — label: Producer
- `pa` — label: PA

### Post Production
- `editor` — label: Editor
- `colorist` — label: Colorist
- `motion` — label: Motion Graphics
- `sound` — label: Sound

### Other
- `gaffer` — label: Gaffer
- `stylist` — label: Stylist

Assign colors by group so tags are visually grouped. Example groupings:
- Outdoor Sports: purple/violet tones (existing)
- Camera: blue tones
- Direction/Production: orange/amber tones
- Post: green tones
- Other: slate/gray tones

Each tag needs: `{ label, color, bg }` — color is the text/chip color, bg is the chip background.

---

## Two Separate UIs to Handle

### 1. Map Filter Chips (top of map)
The filter chips on the map should stay **simple and client-facing** — only show the most bookable categories clients would search for. Suggested filter chip set:

`All | Photographer | Videographer | Drone | Film Photo | DP | Director | Editor | Model | Snowboard | Ski | Off-Road`

If filter chips are hardcoded in `index.html`, update them there. If they're rendered from TAG_META in app.js, add a `showInFilter: true/false` field to each tag in TAG_META to control which ones appear as map filters.

### 2. My Profile — Specialties Grid
The specialties grid in My Profile should show **all tags** so creators can accurately represent their full skill set. Remove the max 5 limit — creators can select as many as apply. Keep min of 1.

The grid should group tags visually by category. Consider adding a small category label (e.g. "Camera", "Production", "Post") as a non-selectable header row in the grid to make it easier to scan.

---

## Implementation Notes

1. **Cache bust:** After changing app.js, increment `?v=N` on the app.js script tag in `index.html`. Current version is v=51 — use v=52.

2. **toCreator(r):** Tags are stored as `text[]` in Supabase and mapped through `toCreator()`. No schema change needed — new tag keys just get stored as strings in the existing `tags` array.

3. **Pin colors:** Creator pins on the map use the `primaryTag` to determine ring color. Make sure new tags have valid `color` values in TAG_META so pins render correctly for creators with new primary tags.

4. **toggleSpecialty function:** This is exposed on `window.toggleSpecialty` and handles the max-5 logic. It should work without changes since it operates on tag keys generically — but verify it still works after adding new tags.

5. **Do NOT change the Supabase schema** — the `tags text[]` column already handles any string values.

---

## Deploy After Changes

```bash
cd ~/My\ App && git add . && git commit -m "expand specialties to full production roles" && git push
```

Netlify auto-deploys on push — no manual step needed.

---

## Success Criteria
- My Profile specialties grid shows all new production roles, grouped by category
- Map filter chips show a clean subset of the most client-relevant tags
- Existing creators with old tags (snowboard, ski, etc.) still render correctly
- Creator pins with new primary tags show a color (no transparent/missing ring)
- Cache bust version incremented so changes load fresh
