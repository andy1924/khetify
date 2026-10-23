import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { useDemo } from '../../demo';
import { Button, Card, Chip, Field, Header, Notice, Screen, Text, Toggle } from '../../ui';
import { BoundaryMap } from './BoundaryMap';
import { apiBase, fieldMonitoringProvider, validDate, type Point, type ObservationResult } from './satelliteProvider';

export function SatelliteScreen() {
  const { state, dispatch } = useDemo();
  const { fields, reports } = state.monitoring;
  const [selected, setSelected] = useState<string | null>(fields[0]?.id || null);
  const active = fields.find(f => f.id === selected);
  const [name, setName] = useState(''), [crop, setCrop] = useState(state.onboarding.completed ? state.farm.crop : ''), [sowing, setSowing] = useState('');
  const [lat, setLat] = useState(state.deviceLocation ? String(state.deviceLocation.latitude) : ''), [lon, setLon] = useState(state.deviceLocation ? String(state.deviceLocation.longitude) : '');
  const [center, setCenter] = useState<Point | null>(state.deviceLocation), [polygon, setPolygon] = useState<Point[]>([]);
  const [consent, setConsent] = useState(false), [share, setShare] = useState(false), [radius, setRadius] = useState('5');
  const [error, setError] = useState(''), [loading, setLoading] = useState(false), [finding, setFinding] = useState(false);
  const [places, setPlaces] = useState<{ id: string; label: string; lat: number; lon: number }[]>([]);
  const [result, setResult] = useState<ObservationResult | null>(null);
  const request = useRef(0);
  const [checkedAt, setCheckedAt] = useState(0);
  const selectField = (id: string) => { request.current++; setSelected(id); setResult(null); setError(''); setLoading(false); };
  const [date, setDate] = useState(''), [notes, setNotes] = useState('');
  const setLocation = (latitude: number, longitude: number) => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 6 || latitude > 38 || longitude < 68 || longitude > 98) { setError('Enter coordinates in the India service area (latitude 6–38, longitude 68–98). These bounds are not a land-record verification.'); return; }
    setCenter({ latitude, longitude }); setPolygon([]); setError('');
  };
  const refresh = async () => {
    if (!active) return;
    const id = ++request.current; setCheckedAt(Date.now()); setLoading(true); setError(''); setResult(null);
    try { const data = await fieldMonitoringProvider.getObservations(active.polygon); if (id === request.current) setResult(data); }
    catch (e) { if (id === request.current) setError((e as Error).message); }
    finally { if (id === request.current) setLoading(false); }
  };
  return <Screen>
    <Header title="Satellite field monitoring" subtitle="Indian farms · dated crop signals" back />
    <Notice title="Dated signals, with limits" tone="info">Clouds, revisit timing and processing cause gaps. Vegetation signals are not diagnoses. Small fields may contain too few clear 10 m pixels. Soil pH and nutrients require a soil-health card or lab result.</Notice>
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
      <Text variant="meta">No authorized Indian state land-record integration is connected. Locate your field by coordinates or village, then draw the boundary. Village results are only a starting location.</Text>
      <Field label="Latitude" value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
      <Field label="Longitude" value={lon} onChangeText={setLon} keyboardType="decimal-pad" />
      <Button title="Open map at coordinates" variant="secondary" disabled={!lat.trim() || !lon.trim()} onPress={() => setLocation(Number(lat), Number(lon))} />
      {center ? <BoundaryMap center={center} points={polygon} onChange={setPolygon} /> : null}
      <Field label="Crop" value={crop} onChangeText={setCrop} maxLength={80} />
      <Field label="Sowing date · optional YYYY-MM-DD" value={sowing} onChangeText={setSowing} />
      <Text>Receive confirmed nearby pest alerts</Text><Toggle value={consent} onValueChange={setConsent} accessibilityLabel="Receive nearby alerts" />
      <Field label="Nearby radius · km (1–50)" value={radius} onChangeText={setRadius} keyboardType="decimal-pad" />
      <Text>Consent to share approximate area for reviewed reports</Text><Toggle value={share} onValueChange={setShare} accessibilityLabel="Share approximate area" />
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
      <Button title={loading ? 'Checking observations…' : 'Check satellite observations'} disabled={loading} onPress={refresh} />
      {result?.status === 'unconfigured' ? <Notice title="Provider not connected">Backend Copernicus access is required. No observations are available.</Notice> : null}
      {result?.status === 'no-coverage' ? <Notice title="No imagery returned">No acquisitions were found for this field in the last 30 days. This does not confirm a crop condition.</Notice> : null}
      {result?.observations.map(o => <Card key={o.capturedAt} gap={6}>
        <Text variant="strong">Captured {new Date(o.capturedAt).toLocaleString()}</Text>
        <Text variant="meta">{o.source} · Confidence: {o.confidence}</Text>
        <Text>Cloud / unusable pixels: {o.cloudPercent === null ? 'Unknown' : `${o.cloudPercent.toFixed(0)}%`} · Field coverage: {o.fieldCoveragePercent === null ? 'Unknown' : `${o.fieldCoveragePercent.toFixed(0)}%`}</Text>
        {checkedAt - Date.parse(o.capturedAt) > 14 * 86400000 ? <Text>Stale observation · over 14 days old</Text> : null}
        <Text>{o.summary}</Text><Text>Vegetation index (NDVI): {o.ndvi === null ? 'Unavailable due to quality or coverage' : o.ndvi.toFixed(2)}</Text>
      </Card>)}
    </Card> : null}
    {error ? <Notice tone="danger" title="Unable to continue">{error}</Notice> : null}
    <Card gap={12}>
      <Text variant="subtitle">Report a crop concern</Text>
      <Text>Selected field: {active?.name || 'Register or select a field first'} · Crop: {active?.crop || '—'}</Text>
      <Field label="Observed date · YYYY-MM-DD" value={date} onChangeText={setDate} />
      <Field label="Symptoms / pest and notes" value={notes} onChangeText={setNotes} multiline maxLength={2000} />
      <Notice title="Private report · review required">Expert submission and photo uploads are not connected. Save a private report for this session. No farmer is notified. Image model suggestions, when available, require review. Contact your local Krishi Vigyan Kendra (KVK) or agricultural extension officer; do not select pesticides or dosage from an unverified report.</Notice>
      <Button title="Save private report for review" disabled={!active || !notes.trim() || !validDate(date)} onPress={() => {
        if (!active) return;
        dispatch({ type: 'monitoring/report', report: { id: `report-${Date.now()}`, fieldId: active.id, crop: active.crop, date, notes: notes.trim(), status: 'pending-review' } }); setNotes('');
      }} />
      {reports.map(r => <View key={r.id} style={{ gap: 8 }}><Text>{r.crop} · {r.date} · {r.status}</Text><Text>{r.notes}</Text>{r.status !== 'withdrawn' ? <Button title="Withdraw report" variant="ghost" onPress={() => dispatch({ type: 'monitoring/withdraw', id: r.id })} /> : null}</View>)}
    </Card>
    <Notice title="Location privacy">Precise boundaries stay in this session and are sent to the backend and imagery provider only when you request observations. Satellite imagery cannot track individual trespassers or identify small-farm vandalism in real time.</Notice>
  </Screen>;
}
