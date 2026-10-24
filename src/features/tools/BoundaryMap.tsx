import React, { useRef, useState } from 'react';
import { Image as TileImage, Pressable, View } from 'react-native';
import Svg, { Polygon, Circle } from 'react-native-svg';
import { Button, Text } from '../../ui';
import type { Point } from './satelliteProvider';
const size = 2 ** 17 * 256;
const project = (p: Point) => ({ x: (p.longitude + 180) / 360 * size, y: (1 - Math.asinh(Math.tan(p.latitude * Math.PI / 180)) / Math.PI) / 2 * size });
export function BoundaryMap({ center, points, onChange, onAvailabilityChange }: { center: Point; points: Point[]; onChange: (p: Point[]) => void; onAvailabilityChange?: (available: boolean) => void }) {
  const [failed, setFailed] = useState(false);
  const [tileAttempt, setTileAttempt] = useState(0);
  const [mapSize, setMapSize] = useState(300);
  const pressedAt = useRef<{ x: number; y: number } | null>(null);
  const c = project(center), left = c.x - mapSize / 2, top = c.y - mapSize / 2;
  const tiles = [];
  for (let y = Math.floor(top / 256); y <= Math.floor((top + mapSize) / 256); y++) for (let x = Math.floor(left / 256); x <= Math.floor((left + mapSize) / 256); x++) tiles.push({ x, y });
  return <View style={{ gap: 12 }} onLayout={event => setMapSize(Math.min(420, Math.floor(event.nativeEvent.layout.width)))}>
    <Text variant="caption">{points.length === 0 ? 'Tap your first corner on the map.' : points.length < 3 ? `${points.length} corners marked. Add ${3 - points.length} more to close the outline.` : `${points.length} corners marked. Add more for a closer fit, or continue.`}</Text>
    <Pressable accessibilityLabel="Field boundary map: tap corners" disabled={failed} onPressIn={e => {
      const { locationX, locationY } = e.nativeEvent;
      // RN Web onPress is a click event without native locationX/Y. Its
      // responder onPressIn does supply map-relative coordinates.
      pressedAt.current = Number.isFinite(locationX) && Number.isFinite(locationY) ? { x: locationX, y: locationY } : null;
    }} onPress={e => {
      const locationX = Number.isFinite(e.nativeEvent.locationX) ? e.nativeEvent.locationX : pressedAt.current?.x;
      const locationY = Number.isFinite(e.nativeEvent.locationY) ? e.nativeEvent.locationY : pressedAt.current?.y;
      pressedAt.current = null;
      if (locationX === undefined || locationY === undefined || !Number.isFinite(locationX) || !Number.isFinite(locationY) || locationX < 0 || locationY < 0 || locationX > mapSize || locationY > mapSize) return;
      const x = left + locationX, y = top + locationY;
      if (points.length < 50) onChange([...points, { longitude: x / size * 360 - 180, latitude: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / size))) * 180 / Math.PI }]);
    }} style={{ width: mapSize, height: mapSize, borderRadius: 20, alignSelf: 'center', backgroundColor: '#e9eee4', overflow: 'hidden' }}>
      <View key={tileAttempt} pointerEvents="none" style={{ position: 'absolute', width: mapSize, height: mapSize }}>
      {tiles.map(t => <TileImage key={`${t.x}/${t.y}`} style={{ position: "absolute", left: t.x * 256 - left, top: t.y * 256 - top, width: 256, height: 256 }} source={{ uri: `https://tile.openstreetmap.org/17/${t.x}/${t.y}.png` }} onError={() => { setFailed(true); onAvailabilityChange?.(false); }} />)}
      </View>
      <Svg pointerEvents="none" width={mapSize} height={mapSize} viewBox={`0 0 ${mapSize} ${mapSize}`}>
        <Polygon points={points.map(p => { const v = project(p); return `${v.x - left},${v.y - top}`; }).join(' ')} fill="#67a83b44" stroke="#286434" strokeWidth={2} />
        {points.map((p, i) => { const v = project(p); return <Circle key={i} cx={v.x - left} cy={v.y - top} r={4} fill="#286434" />; })}
      </Svg>
    </Pressable>
    <Text variant="meta">© OpenStreetMap contributors · Street map</Text>
    {failed ? <Text>Map tiles unavailable. Retry when connected before confirming a boundary.</Text> : null}
    <Button title="Undo corner" variant="ghost" disabled={points.length === 0} onPress={() => onChange(points.slice(0, -1))} />
    {failed ? <Button title="Reload map" variant="secondary" onPress={() => { setFailed(false); onAvailabilityChange?.(true); setTileAttempt(value => value + 1); }} /> : null}
  </View>;
}
