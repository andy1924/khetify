# Demo film

A 51-second marketing film for Khetify, built with
[HyperFrames](https://hyperframes.heygen.com): HTML compositions with a seekable
GSAP timeline, rendered frame by frame to MP4.

**Watch it:** [release download](https://github.com/andy1924/khetify/releases/latest)
· 1920 × 1080 · 30 fps · 51.2 s · stereo audio.

## What it shows

| Time | Act | What happens |
|---|---|---|
| 0:00–0:12.8 | Field | First-person: a phone rises into the wheat. The crop frame draws in and locks, the leaf is captured, the mode slides to Soil, a second capture, then an upload sheet fills for both photos and the camera dives into the screen. |
| 0:12.8–0:25.6 | Read | The captured leaf fills frame and a scan sweeps it, labelling three lesions. It dissolves into the phone showing **the app's real result screen**, with the real fields typeset alongside: confidence *medium*, next step *Inspect leaf undersides*, chemical options *Unavailable*. Then the real soil result (pH 7.4, organic carbon 0.6%). |
| 0:25.6–0:40 | District | Pull back into the sky and down onto Nashik district: 78 farmer dots, links to nearest neighbours, "1,284 farmers reporting this week", then market prices land on the map and the camera pushes into this field's dot. |
| 0:40–0:51.2 | Return | Back on the phone: the real "Around your farm" feed, then the real **"Compare markets"** screen with a price table and a neighbour card. Claim, then the end card. |

The farmer is referred to as **the farmer** throughout — no gendered pronouns.

## Real UI, never a mockup

Every product screen in the film is a capture of the running Expo app in this
repo, not an invention:

- `assets/screens/result-page.png` — plant-health assessment, full result page
- `assets/screens/soil-result.png` — soil result
- `assets/screens/community.png` — "Around your farm" feed
- `assets/screens/market.png` — "Compare markets"

The app was driven in a browser against a local fixture API
(`tools/mock-api.mjs`) so its own picker, consent, upload and result states
rendered; those states were captured at 390 px wide and scaled up in the
composition. All copy on screen comes either from the app's own strings or
from the brief.

Illustration (the wheat field, the district parcels, the leaf, the soil) and the
whole soundtrack are generated at author time by scripts under `tools/` from a
seeded RNG, so every render is identical and nothing needs licensing.

## Working on it

Requires Node ≥ 22 and FFmpeg on `PATH`.

```bash
npm ci
npm run dev      # Studio preview, click anything to edit
npm run check    # lint + runtime + layout + motion + contrast + craft
npm run render   # write the MP4
```

`check` passes with **0 errors and 0 warnings**. After editing a composition,
always run it — then look at the frames you changed with
`npx hyperframes snapshot --at <seconds>`; a passing check does not show how it
looks.

## Where things live

- `index.html` — the four act hosts, the 51.2 s root timeline, and every audio cue
- `compositions/01-field.html` … `04-return.html` — one file per act; each holds
  its own `gsap.timeline({ paused: true })` registered on `window.__timelines`
- `tools/build_sfx.py` — the soundtrack, synthesised from sine partials and
  shaped noise
- `tools/build_audio.py` — places every cue on the root timeline, re-deriving
  every timestamp from the act offsets so a retime re-places the sound
- `tools/build-world.py` — the wheat and parcel SVGs
- `assets/` — photos, app screens, brand marks, world art, sfx
- `REVIEW.md` — the delivery note: what is real, what is illustrative, and what
  to change before this goes in a store listing

## Before publishing

1. **The numbers are illustrative.** ₹24,350, 1,284 farmers, pH 7.4 — placeholders
   shaped like the real feature. Swap in real market data.
2. **The neighbour card names a person.** "Sunil · 3 km away" is invented; a real
   screencap would need a consented user or an anonymised label.
3. **The result screen is a fixture.** It is the app's genuine result UI, but its
   content came from `tools/mock-api.mjs`, not a live model run.
