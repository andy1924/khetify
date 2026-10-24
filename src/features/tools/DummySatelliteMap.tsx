import React, { useMemo } from 'react';
import Svg, { Circle, G, Path, Polygon, Rect } from 'react-native-svg';
import type { FieldPolygon } from './satelliteProvider';

/**
 * Deterministic pseudo-random source, seeded from the field id so the same
 * field always renders the same tile — a demo map should not reshuffle every
 * time the screen mounts.
 */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Farmland seen from orbit: greens, olive scrub, dry tan plots and bare soil. */
const PLOT_TONES = [
  '#6F8A52', '#7E975D', '#5E7A47', '#8DA268', '#A5B076',
  '#C3B781', '#94A96C', '#B0A46F', '#7A8E55', '#889B60',
  '#D2C68F', '#9DAE6E',
];

const TREE_TONES = ['#4F6B3C', '#44603A', '#5A7444'];

function round(n: number) {
  return Math.round(n * 100) / 100;
}

type Tile = {
  parcels: { points: string; fill: string }[];
  roads: { d: string; width: number; tone: string }[];
  trees: { cx: number; cy: number; r: number; fill: string }[];
  river: string;
  outline: string | null;
};

/** Fit the real field boundary into the middle of the tile, like a zoomed view. */
function projectOutline(polygon: FieldPolygon | undefined, span: number): string | null {
  if (!polygon || polygon.length < 3) return null;
  const lats = polygon.map(p => p.latitude);
  const lons = polygon.map(p => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const w = Math.max(maxLon - minLon, 1e-6);
  const h = Math.max(maxLat - minLat, 1e-6);
  const scale = span / Math.max(w, h);
  const offsetX = 50 - (w * scale) / 2;
  const offsetY = 50 - (h * scale) / 2;
  return polygon
    .map(p => `${round(offsetX + (p.longitude - minLon) * scale)},${round(offsetY + (maxLat - p.latitude) * scale)}`)
    .join(' ');
}

function buildTile(seed: string, polygon: FieldPolygon | undefined): Tile {
  const rand = seeded(seed);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];

  // Column and row boundaries with jitter, so the plots read as a real cadastre
  // rather than a ruler-drawn grid.
  const columns: number[] = [-8];
  let x = -8;
  while (x < 108) {
    x += 9 + rand() * 12;
    columns.push(x);
  }
  const rows: number[] = [-8];
  let y = -8;
  while (y < 108) {
    y += 10 + rand() * 13;
    rows.push(y);
  }
  const jitter = () => (rand() - 0.5) * 2.6;

  const parcels: Tile['parcels'] = [];
  for (let r = 0; r < rows.length - 1; r += 1) {
    for (let c = 0; c < columns.length - 1; c += 1) {
      const x0 = columns[c];
      const x1 = columns[c + 1];
      const y0 = rows[r];
      const y1 = rows[r + 1];
      const points = [
        [x0 + jitter(), y0 + jitter()],
        [x1 + jitter(), y0 + jitter()],
        [x1 + jitter(), y1 + jitter()],
        [x0 + jitter(), y1 + jitter()],
      ]
        .map(([px, py]) => `${round(px)},${round(py)}`)
        .join(' ');
      parcels.push({ points, fill: pick(PLOT_TONES) });
    }
  }

  // A few dirt lanes and one paved road through the plots.
  const roads: Tile['roads'] = [];
  const laneCount = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < laneCount; i += 1) {
    const row = rows[Math.floor(rand() * (rows.length - 1))] ?? 40;
    roads.push({
      d: `M -10 ${round(row + jitter())} L 110 ${round(row + jitter())}`,
      width: 1.1 + rand() * 0.7,
      tone: '#C7BFA0',
    });
  }
  roads.push({
    d: `M -12 ${round(18 + rand() * 10)} L 112 ${round(74 + rand() * 12)}`,
    width: 2.2,
    tone: '#D3CBB0',
  });

  const trees: Tile['trees'] = [];
  const groves = 2 + Math.floor(rand() * 3);
  for (let g = 0; g < groves; g += 1) {
    const gx = rand() * 100;
    const gy = rand() * 100;
    const size = 3 + Math.floor(rand() * 6);
    for (let i = 0; i < size; i += 1) {
      trees.push({
        cx: round(gx + (rand() - 0.5) * 14),
        cy: round(gy + (rand() - 0.5) * 14),
        r: round(0.7 + rand() * 1.3),
        fill: pick(TREE_TONES),
      });
    }
  }

  const riverY = 62 + rand() * 20;
  const river = `M -10 ${round(riverY)} C 24 ${round(riverY - 14)}, 52 ${round(riverY + 16)}, 78 ${round(riverY - 6)} S 108 ${round(riverY + 10)}, 112 ${round(riverY + 4)}`;

  return { parcels, roads, trees, river, outline: projectOutline(polygon, 38) };
}

/**
 * Stand-in for a Sentinel-2 tile. Synthetic, deterministic and offline: the
 * demo has no imagery provider, so an empty grey card would say less than a
 * plausible field mosaic with the real boundary drawn on top.
 */
export function DummySatelliteMap({
  fieldId,
  polygon,
  outlineColor,
  fieldColor,
}: {
  fieldId: string;
  polygon?: FieldPolygon;
  outlineColor: string;
  fieldColor: string;
}) {
  const tile = useMemo(() => buildTile(fieldId, polygon), [fieldId, polygon]);

  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      <Rect width="100" height="100" fill="#7E8B60" />
      <G transform="rotate(-4 50 50)">
        {tile.parcels.map(parcel => (
          <Polygon
            key={parcel.points}
            points={parcel.points}
            fill={parcel.fill}
            stroke="#00000018"
            strokeWidth={0.16}
          />
        ))}
        {tile.roads.map(road => (
          <Path
            key={road.d}
            d={road.d}
            stroke={road.tone}
            strokeWidth={road.width}
            strokeLinecap="round"
            fill="none"
            opacity={0.85}
          />
        ))}
        <Path d={tile.river} stroke="#54707E" strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.9} />
        <Path d={tile.river} stroke="#7C9BAA" strokeWidth={1.1} strokeLinecap="round" fill="none" opacity={0.75} />
        {tile.trees.map(tree => (
          <Circle key={`${tree.cx}-${tree.cy}-${tree.r}`} cx={tree.cx} cy={tree.cy} r={tree.r} fill={tree.fill} opacity={0.85} />
        ))}
        {tile.outline ? (
          <>
            <Polygon points={tile.outline} fill={fieldColor} opacity={0.34} />
            <Polygon
              points={tile.outline}
              fill="none"
              stroke={outlineColor}
              strokeWidth={0.9}
              strokeDasharray="2.4 1.6"
              strokeLinejoin="round"
            />
          </>
        ) : null}
      </G>
      {/* Vignette: reads as a lens edge and keeps the caption row grounded. */}
      <Rect width="100" height="100" fill="#0B1A0C" opacity={0.06} />
    </Svg>
  );
}
