import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'react-native';
import { useDemo } from '../../demo';
import { Button, Card, Chip, Field, Header, Notice, Screen, Text, Toggle } from '../../ui';
import { BoundaryMap } from './BoundaryMap';
import { apiBase, fieldMonitoringProvider, validDate, type Point, type ObservationResult } from './satelliteProvider';

export function SatelliteScreen() {
  const { state, dispatch } = useDemo();
  const { fields } = state.monitoring;
  const [selected, setSelected] = useState<string | null>(fields[0]?.id || null);
  const active = fields.find(f => f.id === selected);
  const [name, setName] = useState(''), [crop, setCrop] = useState(state.onboarding.completed ? state.farm.crop : ''), [sowing, setSowing] = useState('');
  const [lat, setLat] = useState(state.deviceLocation ? String(state.deviceLocation.latitude) : ''), [lon, setLon] = useState(state.deviceLocation ? String(state.deviceLocation.longitude) : '');
  const [center, setCenter] = useState<Point | null>(state.deviceLocation), [polygon, setPolygon] = useState<Point[]>([]);
  const [consent, setConsent] = useState(false), [share, setShare] = useState(false), [radius, setRadius] = useState('5');
  const [error, setError] = useState(''), [loading, setLoading] = useState(false), [finding, setFinding] = useState(false);
  const [places, setPlaces] = useState<{ id: string; label: string; lat: number; lon: number }[]>([]);
  const [result, setResult] = useState<ObservationResult | null>(null);
  const [observationError, setObservationError] = useState('');
  const request = useRef(0);
  const [checkedAt, setCheckedAt] = useState(0);
  const selectField = (id: string) => { request.current++; setSelected(id); setResult(null); setError(''); setLoading(false); };
  const setLocation = (latitude: number, longitude: number) => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 6 || latitude > 38 || longitude < 68 || longitude > 98) { setError('Enter coordinates in the India service area (latitude 6–38, longitude 68–98). These bounds are not a land-record verification.'); return; }
    setCenter({ latitude, longitude }); setPolygon([]); setError('');
  };
  const refresh = useCallback(async () => {
    if (!active) return;
    const id = ++request.current; setCheckedAt(Date.now()); setLoading(true); setObservationError(''); setResult(null);
    try { const data = await fieldMonitoringProvider.getObservations(active.polygon); if (id === request.current) setResult(data); }
    catch { if (id === request.current) setObservationError('We could not load the satellite images. Please try Refresh images.'); }
    finally { if (id === request.current) setLoading(false); }
  }, [active]);
  useEffect(() => {
    const requestState = request;
    const start = setTimeout(() => { void refresh(); }, 0);
    return () => { clearTimeout(start); requestState.current++; };
  }, [refresh]);
  const clearCaptures = (result?.observations ?? []).filter(o => o.ndvi !== null && o.confidence === 'moderate' && checkedAt - Date.parse(o.capturedAt) <= 14 * 86400000).sort((a, b) => Date.parse(b.capturedAt) - Date.parse(a.capturedAt));
  const latest = clearCaptures[0], previous = clearCaptures[1];
  return <Screen>
    <Header title="Your field from above" subtitle="Add your field to see recent images" />
    <Card gap={12}>
      <Text variant="subtitle">Register a field</Text>
      {state.deviceLocation ? <Notice tone="info" title="Map centered near your phone">Phone location accuracy: {state.deviceLocation.accuracy === null ? "Unknown" : `${Math.round(state.deviceLocation.accuracy)} m`}. This is your phone position; draw your field corners on the map.</Notice> : null}
      <Field label="Field name / village" value={name} onChangeText={setName} maxLength={120} />
      <Button title={finding ? 'Finding…' : 'Find village'} disabled={finding || name.trim().length < 3 || !apiBase} variant="secondary" onPress={async () => {
        setFinding(true); setError('');
        try { const r = await fetch(`${apiBase}/api/places?q=${encodeURIComponent(name)}`, { signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error('Place lookup unavailable. Enter coordinates.'); const data = await r.json(); setPlaces(data.places); if (!data.places.length) setError('No place found. Enter coordinates from your map.'); }
        catch (e) { setError((e as Error).message); } finally { setFinding(false); }
      }} />
      {places.map(p => <Button key={p.id} title={p.label} variant="ghost" onPress={() => { setLat(String(p.lat)); setLon(String(p.lon)); setLocation(p.lat, p.lon); setPlaces([]); }} />)}
      <Field label="Latitude" value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
      <Field label="Longitude" value={lon} onChangeText={setLon} keyboardType="decimal-pad" />
      <Button title="Open map at coordinates" variant="secondary" disabled={!lat.trim() || !lon.trim()} onPress={() => setLocation(Number(lat), Number(lon))} />
      {center ? <BoundaryMap key={`${center.latitude}:${center.longitude}`} center={center} points={polygon} onChange={points => { setPolygon(points); setError(''); }} /> : null}
      <Field label="Crop" value={crop} onChangeText={setCrop} maxLength={80} />
      <Field label="Sowing date · optional YYYY-MM-DD" value={sowing} onChangeText={setSowing} />
      <Text>Receive confirmed nearby pest alerts</Text><Toggle value={consent} onValueChange={setConsent} accessibilityLabel="Receive nearby alerts" />
      <Field label="Nearby radius · km (1–50)" value={radius} onChangeText={setRadius} keyboardType="decimal-pad" />
      <Text>Consent to share approximate area for reviewed reports</Text><Toggle value={share} onValueChange={setShare} accessibilityLabel="Share approximate area" />
      {error ? <Notice tone="danger" title="Please check">{error}</Notice> : null}
      <Button title="Confirm boundary and save field" disabled={polygon.length < 3 || !name.trim() || !crop.trim()} onPress={() => {
        if ((sowing && !validDate(sowing)) || !Number.isFinite(Number(radius)) || Number(radius) < 1 || Number(radius) > 50) { setError('Check sowing date and radius (1–50 km).'); return; }
        const area = polygon.reduce((sum, p, i) => { const q = polygon[(i + 1) % polygon.length]; return sum + p.longitude * q.latitude - q.longitude * p.latitude; }, 0);
        if (Math.abs(area) < 1e-10) { setError('Draw a boundary with at least three distinct corners and nonzero area.'); return; }
        const id = `field-${Date.now()}`;
        dispatch({ type: 'monitoring/field', field: { id, name: name.trim(), polygon, crop: crop.trim(), sowingDate: sowing, alertsOptIn: consent, shareApproximate: share, radiusKm: Number(radius) } });
        selectField(id); setPolygon([]);
      }} />
      <Text variant="meta">Saved in this app session, like the existing demo data. App restart or reset clears fields and private reports.</Text>
    </Card>
    {fields.map(f => <Chip key={f.id} label={f.name} selected={f.id === selected} onPress={() => selectField(f.id)} />)}
    {active ? <Card gap={12}>
      <Text variant="subtitle">{active.name} · {active.crop}</Text>
      <Text variant="meta">Sown: {active.sowingDate || 'Unknown'} · {active.radiusKm} km alert radius</Text>
      <Text>Nearby alerts</Text><Toggle value={active.alertsOptIn} accessibilityLabel="Disable or enable nearby alerts" onValueChange={value => dispatch({ type: 'monitoring/field', field: { ...active, alertsOptIn: value } })} />
      <Text>Share approximate report area</Text><Toggle value={active.shareApproximate} accessibilityLabel="Share approximate report area" onValueChange={value => dispatch({ type: 'monitoring/field', field: { ...active, shareApproximate: value } })} />
      <Text>{loading ? 'Fetching your latest satellite images…' : 'Satellite images are checked automatically when you open this field.'}</Text>
      <Button title="Refresh images" variant="secondary" disabled={loading} onPress={refresh} />
      {observationError ? <Notice title="Images could not load" tone="warning">{observationError}</Notice> : null}
      {result?.status === 'ready' ? <Card gap={8}>
        <Text variant="subtitle">Automatic crop check</Text>
        <Text>{latest && latest.ndvi !== null ? previous && previous.ndvi !== null ? `Vegetation reading: ${latest.ndvi.toFixed(2)}. Previous clear image: ${previous.ndvi.toFixed(2)}.` : `Vegetation reading: ${latest.ndvi.toFixed(2)}. A second recent clear image is needed to compare growth.` : 'Recent images are cloudy, too old, or do not cover enough of your field for a clear crop reading.'}</Text>
        <Text variant="caption">These readings track vegetation changes. They cannot identify a pest or disease or choose a treatment.</Text>
      </Card> : null}
      {result?.status === 'unconfigured' ? <Notice title="Try again later">Field images cannot be loaded right now.</Notice> : null}
      {result?.status === 'no-coverage' ? <Notice title="No imagery returned">No acquisitions were found for this field in the last 30 days. This does not confirm a crop condition.</Notice> : null}
      {result?.observations.map(o => <Card key={o.capturedAt} gap={6}>
        <Text variant="strong">Captured {new Date(o.capturedAt).toLocaleString()}</Text>
        <Text variant="meta">{o.source} · Confidence: {o.confidence}</Text>
        {o.imageUrl ? <Image source={{ uri: o.imageUrl }} accessibilityLabel={`Satellite image captured ${o.capturedAt}`} style={{ width: '100%', height: 240, borderRadius: 16 }} resizeMode="contain" /> : null}
        {o.imageError ? <Text variant="caption">{o.imageError}</Text> : null}
        <Text>Cloud / unusable pixels: {o.cloudPercent === null ? 'Unknown' : `${o.cloudPercent.toFixed(0)}%`} · Field coverage: {o.fieldCoveragePercent === null ? 'Unknown' : `${o.fieldCoveragePercent.toFixed(0)}%`}</Text>
        {checkedAt - Date.parse(o.capturedAt) > 14 * 86400000 ? <Text>Stale observation · over 14 days old</Text> : null}
        <Text>{o.summary}</Text><Text>Vegetation index (NDVI): {o.ndvi === null ? 'Unavailable due to quality or coverage' : o.ndvi.toFixed(2)}</Text>
      </Card>)}
    </Card> : null}
    <Text variant="caption">Your field boundary is shared with the image service when you request field images.</Text>
  </Screen>;
}
