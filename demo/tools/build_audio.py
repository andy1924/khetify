#!/usr/bin/env python3
"""Write the soundtrack into index.html.

The cues are placed at global times computed from each act's authored beat times
scaled by the film's F = 0.8 speed-up, plus the act's offset on the root
timeline. Run `python tools/build_audio.py` after any retime.

Every sound is original (tools/build_sfx.py), so nothing needs clearing.
"""

import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))

F = 0.8
FILM = 51.2

DUR = {
    "shutter": 0.22, "pop": 0.16, "tick": 0.06, "press": 0.09,
    "whoosh-short": 0.42, "whoosh": 0.62, "whoosh-long": 1.0,
    "rise": 0.9, "chime": 1.1, "sparkle": 0.8, "thunk": 0.55,
}
ACTS = [(0.0, 12.8), (12.8, 12.8), (25.6, 14.4), (40.0, 11.2)]

# (act index, authored beat, cue, gain, comment)
CUES = [
    # ---- act 1: the field, the camera, the two shots, the upload
    (0, 0.25, "whoosh", 0.34, "the phone lifts into frame"),
    (0, 1.10, "tick", 0.30, "crop frame draws"),
    (0, 1.22, "tick", 0.24, ""),
    (0, 1.34, "tick", 0.24, ""),
    (0, 1.46, "tick", 0.30, ""),
    (0, 1.95, "press", 0.40, "the frame locks"),
    (0, 2.00, "pop", 0.30, "copy lands"),
    (0, 3.70, "shutter", 0.72, "first capture"),
    (0, 4.42, "tick", 0.34, "mode slides leaf -> soil"),
    (0, 5.40, "shutter", 0.72, "second capture"),
    (0, 5.90, "whoosh-short", 0.32, "upload sheet rises"),
    (0, 7.86, "sparkle", 0.26, "half the photos are up"),
    (0, 9.56, "chime", 0.34, "both photos are in"),
    (0, 10.40, "rise", 0.30, "the dive into the screen"),

    # ---- act 2: the leaf, the read, the soil
    (1, 0.00, "whoosh", 0.34, "the leaf fills the frame"),
    (1, 0.50, "whoosh-short", 0.30, "the scan pass"),
    (1, 1.20, "tick", 0.26, "lesion one"),
    (1, 1.60, "tick", 0.26, "lesion two"),
    (1, 2.00, "tick", 0.26, "lesion three"),
    (1, 3.90, "thunk", 0.34, "the result arrives"),
    (1, 4.80, "tick", 0.22, "confidence"),
    (1, 5.02, "tick", 0.22, "next step"),
    (1, 5.24, "tick", 0.22, "chemical options"),
    (1, 9.50, "whoosh-short", 0.30, "turn to the soil result"),
    (1, 9.95, "pop", 0.26, "the two soil values"),

    # ---- act 3: the district, the dots, the prices
    (2, 0.00, "whoosh", 0.34, "pull back into the sky"),
    (2, 1.15, "sparkle", 0.28, "the dots light up"),
    (2, 3.40, "pop", 0.28, "the district reads"),
    (2, 5.60, "pop", 0.26, "price chip one"),
    (2, 5.82, "pop", 0.26, ""),
    (2, 6.04, "pop", 0.26, ""),
    (2, 6.26, "pop", 0.26, ""),
    (2, 8.20, "pop", 0.24, "the price question"),
    (2, 11.90, "whoosh-long", 0.36, "push into the field"),
    (2, 13.60, "sparkle", 0.24, "this field, named"),

    # ---- act 4: the prices, the neighbour, the sign-off
    (3, 0.00, "thunk", 0.36, "land back on the phone"),
    (3, 1.15, "whoosh-short", 0.28, "the market screen"),
    (3, 1.50, "whoosh", 0.26, "the phone leans aside"),
    (3, 2.70, "tick", 0.24, "price row"),
    (3, 2.94, "tick", 0.24, ""),
    (3, 3.18, "tick", 0.24, ""),
    (3, 3.75, "pop", 0.28, "what a neighbour changed"),
    (3, 7.20, "thunk", 0.30, "the claim"),
    (3, 9.95, "chime", 0.34, "the mark"),
    (3, 10.35, "sparkle", 0.26, "the wordmark"),
]

START = '    <div id="snd" data-hf-id="hf-snd">\n'
END = "    </div>\n"


def build():
    rows = []
    for act, beat, cue, gain, note in CUES:
        t = round(ACTS[act][0] + beat * F, 3)
        rows.append((t, cue, gain, note))

    rows.sort()
    lines = []
    for i, (t, cue, gain, note) in enumerate(rows):
        d = DUR.get(cue, 0.6)
        # never let a cue run past the film's last frame
        d = min(d, round(FILM - t, 3))
        lines.append(
            '      <audio data-hf-id="hf-a%02d" id="sfx-%02d" src="assets/sfx/%s.wav" '
            'data-start="%s" data-duration="%s" data-track-index="%d" '
            'data-volume="%s" preload="auto"></audio>'
            % (i, i, cue, t, d, 20 + i, gain)
        )
    block = START + "\n".join(lines) + "\n" + END

    path = os.path.join(ROOT, "index.html")
    s = open(path, encoding="utf-8").read()
    s = re.sub(r'    <div id="snd"[^>]*>.*?\n    </div>\n', "", s, flags=re.S)
    s = s.replace("    </div>\n    <script>\n      window.__timelines",
                  block + "    </div>\n    <script>\n      window.__timelines")
    open(path, "w", encoding="utf-8").write(s)
    print("wrote %d cues into index.html" % len(rows))


if __name__ == "__main__":
    build()
