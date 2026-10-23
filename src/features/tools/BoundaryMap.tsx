import React, { useState } from 'react';
import { Image as TileImage, Pressable, View } from 'react-native';
import Svg, { Polygon, Circle } from 'react-native-svg';
import { Button, Text } from '../../ui';
import type { Point } from './satelliteProvider';
const size = 2 ** 17 * 256;
const project = (p: Point) => ({ x: (p.longitude + 180) / 360 * size, y: (1 - Math.asinh(Math.tan(p.latitude * Math.PI / 180)) / Math.PI) / 2 * size });
export function BoundaryMap({ center, points, onChange }: { center: Point; points: Point[]; onChange: (p: Point[]) => void }) {
  const [failed, setFailed] = useState(false);
  const c = project(center), left = c.x - 150, top = c.y - 150;
  const tiles = [];
  for (let y = Math.floor(top / 256); y <= Math.floor((top + 300) / 256); y++) for (let x = Math.floor(left / 256); x <= Math.floor((left + 300) / 256); x++) tiles.push({ x, y });
  return <View style={{ gap: 10 }}>
    <Text variant="meta">Tap each field corner in order. Map spans about 350 m near the equator. Change coordinates to reposition. Tiles load from OpenStreetMap, which receives the viewed area.</Text>
    <Pressable accessibilityLabel="Field boundary map: tap corners" disabled={failed} onPress={e => {
      const { locationX, locationY } = e.nativeEvent;
      const x = left + locationX, y = top + locationY;
      if (points.length < 50) onChange([...points, { longitude: x / size * 360 - 180, latitude: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / size))) * 180 / Math.PI }]);
    }} style={{ width: 300, height: 300, alignSelf: 'center', backgroundColor: '#e9eee4', overflow: 'hidden' }}>
      {tiles.map(t => <TileImage key={`${t.x}/${t.y}`} style={{ position: "absolute", left: t.x * 256 - left, top: t.y * 256 - top, width: 256, height: 256 }} source={{ uri: `https://tile.openstreetmap.org/17/${t.x}/${t.y}.png` }} onError={() => { setFailed(true); onChange([]); }} />)}
      <Svg pointerEvents="none" width={300} height={300} viewBox="0 0 300 300">
        <Polygon points={points.map(p => { const v = project(p); return `${v.x - left},${v.y - top}`; }).join(' ')} fill="#67a83b44" stroke="#286434" strokeWidth={2} />
        {points.map((p, i) => { const v = project(p); return <Circle key={i} cx={v.x - left} cy={v.y - top} r={4} fill="#286434" />; })}
      </Svg>
    </Pressable>
    <Text variant="meta">© OpenStreetMap contributors · Basemap, not satellite imagery · {points.length} corners</Text>
    {failed ? <Text>Map tiles unavailable. Retry when connected before confirming a boundary.</Text> : null}
    <Button title="Undo corner" variant="ghost" onPress={() => onChange(points.slice(0, -1))} />
  </View>;
}
