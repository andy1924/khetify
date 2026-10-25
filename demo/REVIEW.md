# Khetify — 51-second demo film

**File:** `renders/khetify-demo_2026-10-24_11-30-51.mp4`
1920 × 1080, 30 fps, 51.2 s, H.264 + AAC stereo, 40.9 MB.

## What changed in this cut

- **The hand is gone.** It read as cartoon sausages however it was drawn, so the
  camera now sits exactly at the farmer's eye: the phone is the only thing in
  frame, held in a first-person view. Nothing is lost — the two taps are still
  the whole interaction.
- **The phone is a modern device.** A machined-metal rim with a raking
  highlight, a true bezel, rounded screen corners, a dynamic island, and a
  glancing reflection across the glass. Acts 1, 2 and 4 all share it.
- **The capture UI is a real camera.** Corner crop brackets that draw in and
  snap-lock with a pulse, a rule-of-thirds grid, a "Fill the frame" hint, a
  Leaf/Soil mode pill whose thumb slides, 1×/2× zoom chips, a gallery chip and
  a shutter that depresses under your finger. The second capture slides the
  mode pill to Soil and re-locks the brackets, so the two shots read as one
  deliberate sequence rather than two stock photos.
- **The film is no longer silent.** 45 cues, all synthesised from scratch in
  `tools/build_sfx.py` (shutter, pop, tick, press, whoosh ×3, rise, chime,
  sparkle, thunk) — original, so nothing needs licensing. Peaks at −3.8 dBFS.
- **Movement is tighter overall.** The dive into the screen, the district
  pull-back, the price push-in and the return are all retimed for a snappier
  read; the district's copy now sits on its own paper card so it never fights
  the parcels behind it.

## What it shows

| Time | Act | What happens |
|---|---|---|
| 0:00–0:12.8 | Field | First-person: a modern phone rises into the wheat. The crop frame draws itself and locks, the copy lands, the lens pushes in, a shutter fires and the leaf is captured; the mode slides to Soil, a second shutter, the upload sheet fills 0 → 52% → 100% for both photos, then the camera dives into the screen. |
| 0:12.8–0:25.6 | Read | The captured leaf fills frame and a scan sweeps it; three lesions get labelled. It dissolves into the phone showing **the real Khetify result screen**, scrolling through the actual assessment, with the real fields typeset alongside: confidence *medium*, next step *Inspect leaf undersides*, chemical options *Unavailable*. Then the real soil result (pH 7.4, organic carbon 0.6%). |
| 0:25.6–0:40 | District | Pull back into the sky and down onto Nashik district: 78 farmer dots light outward from this field, links draw to the nearest neighbours, "1,284 farmers reporting this week", then four market prices land on the map (Lasalgaon ₹2,520/q, Nashik ₹2,560/q, Pimpalgaon ₹2,500/q, Yeola ₹2,470/q) and small prices fill the rest. The camera pushes into this field's dot. |
| 0:40–0:51.2 | Return | Back on the phone: the real "Around your farm" feed, then the real **"Compare markets"** screen, with a price table beside it (Lasalgaon ₹24,350 *best net*, Nashik ₹24,250, Pimpalgaon *incomplete — transport missing*) and a neighbour card: Sunil, 3 km away, sowed a resistant variety after the same leaf spots and the next check came back clear. Claim, then the end card. |

## What is real

Every product screen in the film is a capture of the running Expo app, not an invention:

- `assets/screens/result-page.png` — plant-health assessment, full result page
- `assets/screens/soil-result.png` — soil result
- `assets/screens/community.png` — "Around your farm" feed
- `assets/screens/market.png` — "Compare markets" (the app renamed this from "Compare mandis"; the capture was refreshed so the film uses the current wording)

The app was driven in a browser against a local fixture API (`tools/mock-api.mjs`) so its own picker, consent, upload and result states rendered; those states were captured at 390 px wide and scaled up in the composition. **No dashboard was invented.** All copy on screen comes either from the app's own strings or from the brief.

Illustration (the wheat field, the district parcels, the leaf, the soil) is generated at author time by scripts under `tools/`, from a seeded RNG, so every render is identical. The soundtrack is synthesised the same way.

## Look and rules applied

- Warm cut-paper palette: ground `#F3E9D6`, ink `#263B29`, sage `#BEDDA7`. No dark void, no glass cards as decoration.
- Labels are **serif italic, sentence case, untracked** at ~30 px — never tracked uppercase mono.
- Smallest reading text is ≥28 px at 1080. Every line holds long enough to read; nothing sits on screen for less than it takes.
- The farmer is referred to as **the farmer** throughout — no gendered pronouns anywhere in the film.

## Audio

All 45 cues are original: sine partials, shaped noise and short exponential decays, written to `assets/sfx/*.wav` by `tools/build_sfx.py`, then placed at their beats by `tools/build_audio.py` (which re-derives every timestamp from the act offsets, so a retime re-places the sound automatically).

| Cue | Where it lands |
|---|---|
| `whoosh`, `whoosh-long` | phone rise, scan pass, district pull-back, the dive, the pushes |
| `shutter` ×2 | both captures — a two-stage mechanical click with a low knock under it |
| `tick` | crop brackets drawing, lesion marks, price rows, mode slide |
| `press` / `pop` | the frame locking, copy and chips landing |
| `rise` | the dive into act two |
| `chime` | both photos uploaded; the end-card mark |
| `sparkle` | the dots lighting up; the wordmark |
| `thunk` | the result arriving, the land back on the phone, the claim |

## Render notes

- `npx hyperframes check` is clean: **0 errors and 0 warnings** in lint, runtime, layout, motion, contrast and craft.
- Render: 3 m 21 s on 16 cores, hardware GPU, screenshot capture. 1536 frames.
- FFmpeg 9.0.2 was installed via winget but is not on `PATH` in a new shell; the render was run with it prepended explicitly. If you re-render, either restart the shell or prepend:
  `C:\Users\p\AppData\Local\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin`

## Editing it

Studio is running at **http://127.0.0.1:3002/#project/khetify-demo** — click anything on the canvas, drag clips on the timeline, and the change saves to the project. Stop it with `npx hyperframes preview --stop`.

Where things live:

- `index.html` — the four act hosts, the 51.2 s root timeline, and every audio cue
- `compositions/01-field.html` … `04-return.html` — one file per act; each holds its own `gsap.timeline({ paused: true })` registered on `window.__timelines`
- `tools/build_sfx.py` — the soundtrack, synthesised
- `tools/build_audio.py` — places every cue on the root timeline
- `tools/build-world.py` — the wheat and parcel SVGs
- `assets/` — photos, screens, brand marks, world art, sfx

## What you'd want to change before publishing

1. **The numbers are illustrative.** ₹24,350, 1,284 farmers, pH 7.4 — all placeholders shaped like the real feature. Swap in real market data before this goes in a store listing.
2. **The neighbour card names a person.** "Sunil · 3 km away" is invented for the film; a real product screencap would need a real (consented) user or an anonymised label.
3. **The result screen is a fixture.** It is the app's genuine result UI, but its content came from `tools/mock-api.mjs`, not from a live model run.
