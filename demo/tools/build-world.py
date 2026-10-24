"""Deterministic SVG world-building for the Khetify demo film.

Every shape is generated once, at author time, from a seeded RNG, and written
into assets/world/. The composition only ever displays these files, so a render
is identical on every pass.
"""
import math
import os
import random

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "world"))
os.makedirs(OUT, exist_ok=True)

WHEAT = ["#E2E7CB", "#CBD8B2", "#B4C898", "#9DBB80", "#83A268", "#6A8B52", "#557641"]
STALK = ["#C8D6AC", "#B2C594", "#9BB67D", "#86A168"]


def blade(x, y, h, bend, w, fill, op=1.0):
    """A tapered wheat blade: a filled cubic with a pointed tip."""
    tipx, tipy = x + bend, y - h
    c1 = (x - w, y - h * 0.45)
    c2 = (tipx - bend * 0.22 - w * 0.35, tipy + h * 0.34)
    c3 = (tipx + bend * 0.22 + w * 0.35, tipy + h * 0.34)
    c4 = (x + w, y - h * 0.45)
    return (
        f'<path d="M{x:.1f} {y:.1f} C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} '
        f'{tipx:.1f} {tipy:.1f} C{c3[0]:.1f} {c3[1]:.1f} {c4[0]:.1f} {c4[1]:.1f} '
        f'{x:.1f} {y:.1f} Z" fill="{fill}" opacity="{op:.2f}"/>'
    )


def ear(x, y, h, bend, fill, tilt=0.0):
    """A wheat ear: a slim stem with paired spikelets."""
    out = [f'<path d="M{x:.1f} {y:.1f} Q{x + bend * 0.4:.1f} {y - h * 0.6:.1f} {x + bend:.1f} {y - h:.1f}" '
           f'stroke="{fill}" stroke-width="3.4" fill="none" opacity="0.85"/>']
    n = 9
    for i in range(n):
        t = i / (n - 1)
        px = x + bend * (t ** 1.15)
        py = y - h * (0.52 + 0.48 * t)
        s = (1 - t) * 0.85 + 0.35
        lean = tilt + bend * 0.25
        for side in (-1, 1):
            ex = px + side * 13 * s + lean
            ey = py - 9 * s
            out.append(
                f'<ellipse cx="{ex:.1f}" cy="{ey:.1f}" rx="{7.5 * s:.1f}" ry="{4.4 * s:.1f}" '
                f'transform="rotate({-26 * side + tilt * 0.3:.1f} {ex:.1f} {ey:.1f})" fill="{fill}" opacity="0.92"/>'
            )
    return "".join(out)


def wheat_field(path, w, h, count, ear_ratio, seed, scale=1.0, band=None):
    rng = random.Random(seed)
    parts = []
    for _ in range(count):
        x = rng.uniform(-60, w + 60)
        if band:
            lo, hi = band
            y = rng.uniform(h * lo, h * hi)
        else:
            y = rng.uniform(h * 0.55, h * 1.04)
        depth = (y - h * 0.55) / (h * 0.5)  # 0 far, 1 near
        depth = max(0.0, min(1.0, depth))
        hh = (h * (0.30 + 0.30 * depth)) * rng.uniform(0.75, 1.15) * scale
        ww = (4.2 + 7.5 * depth) * rng.uniform(0.8, 1.25) * scale
        bend = rng.uniform(-0.16, 0.16) * hh
        fill = WHEAT[min(len(WHEAT) - 1, int((1 - depth) * 3 + rng.uniform(0, 2.6)))]
        parts.append(blade(x, y, hh, bend, ww, fill, 0.85 + 0.15 * depth))
        if rng.random() < ear_ratio:
            parts.append(ear(x + bend, y - hh * 0.62, hh * 0.34, bend * 0.35,
                             STALK[min(len(STALK) - 1, int(rng.uniform(0, 3.99)))], rng.uniform(-8, 8)))
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'viewBox="0 0 {w} {h}">' + "".join(parts) + "</svg>"
    )
    open(os.path.join(OUT, path), "w", encoding="utf-8").write(svg)
    print(path, len(parts), "shapes")


# --- 1. The field, seen from inside it -------------------------------------
wheat_field("wheat-far.svg", 3400, 1500, 900, 0.35, seed=11, scale=0.95)
wheat_field("wheat-near.svg", 2400, 1700, 60, 0.55, seed=29, scale=2.1, band=(0.1, 0.95))

# --- 2. The district from above -------------------------------------------
PARCEL = ["#CBD8B2", "#B7CA97", "#A3BE82", "#8FAE6F", "#7C9C5E", "#DCE4C7", "#E9EED8", "#6E8C52"]
LANE = "#F3E9D6"

rng = random.Random(5)
cols, rows = 9, 6
pw, ph = 200, 150
cells = []
for r in range(rows):
    for c in range(cols):
        x0 = c * pw + rng.uniform(-14, 14)
        y0 = r * ph + rng.uniform(-12, 12)
        # a field parcel: a slightly irregular quad, inset inside its lane
        j = lambda: rng.uniform(-9, 9)
        pts = [
            (x0 + 8 + j(), y0 + 8 + j()),
            (x0 + pw - 8 + j(), y0 + 8 + j()),
            (x0 + pw - 8 + j(), y0 + ph - 8 + j()),
            (x0 + 8 + j(), y0 + ph - 8 + j()),
        ]
        # interior furrow lines
        furrows = []
        n = rng.randint(5, 11)
        horizontal = rng.random() < 0.55
        for i in range(n):
            t = (i + 0.7) / (n + 0.4)
            if horizontal:
                yy = y0 + 8 + (ph - 16) * t
                furrows.append(f'<line x1="{x0 + 12:.1f}" y1="{yy:.1f}" x2="{x0 + pw - 12:.1f}" y2="{yy - rng.uniform(-3, 3):.1f}"/>')
            else:
                xx = x0 + 8 + (pw - 16) * t
                furrows.append(f'<line x1="{xx:.1f}" y1="{y0 + 12:.1f}" x2="{xx + rng.uniform(-3, 3):.1f}" y2="{y0 + ph - 12:.1f}"/>')
        cells.append(
            f'<polygon points="{" ".join(f"{px:.1f},{py:.1f}" for px, py in pts)}" fill="{rng.choice(PARCEL)}"/>'
            f'<g stroke="#000" stroke-opacity="0.055" stroke-width="1.6">{"".join(furrows)}</g>'
        )

# a river / lane cutting through, drawn as a paper strip
lane = (
    f'<path d="M-40 470 C 320 400, 520 620, 900 560 S 1500 430, 1860 520" '
    f'stroke="{LANE}" stroke-width="26" fill="none" opacity="0.85"/>'
    f'<path d="M-40 470 C 320 400, 520 620, 900 560 S 1500 430, 1860 520" '
    f'stroke="#B9C9C4" stroke-width="9" fill="none" opacity="0.55"/>'
)
svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" width="{cols * pw}" height="{rows * ph}" '
    f'viewBox="0 0 {cols * pw} {rows * ph}">'
    f'<rect width="100%" height="100%" fill="{LANE}"/>' + "".join(cells) + lane + "</svg>"
)
open(os.path.join(OUT, "parcels.svg"), "w", encoding="utf-8").write(svg)
print("parcels.svg", len(cells), "parcels")
