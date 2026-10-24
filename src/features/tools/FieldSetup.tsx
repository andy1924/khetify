import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { useDemoSlices } from '../../demo';
import { Button, Card, Field, Header, Icon, Notice, Screen, Text } from '../../ui';
import { useAccentPalette, useStyles, type AccentPalette } from '../../ui/AccentTheme';
import { BoundaryMap } from './BoundaryMap';
import { apiBase, validDate, type Point, type RegisteredField } from './satelliteProvider';

const steps = ['Find field', 'Draw boundary', 'Field details'];
type Place = { id: string; label: string; lat: number; lon: number };

export function FieldSetup({ onSaved, onCancel }: { onSaved: (field: RegisteredField) => void; onCancel?: () => void }) {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  const state = useDemoSlices(['deviceLocation', 'onboarding', 'farm'] as const);
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [finding, setFinding] = useState(false);
  const [manual, setManual] = useState(false);
  const [lat, setLat] = useState(state.deviceLocation ? String(state.deviceLocation.latitude) : '');
  const [lon, setLon] = useState(state.deviceLocation ? String(state.deviceLocation.longitude) : '');
  const [center, setCenter] = useState<Point | null>(null);
  const [polygon, setPolygon] = useState<Point[]>([]);
  const [mapAvailable, setMapAvailable] = useState(true);
  const [name, setName] = useState('');
  const [crop, setCrop] = useState(state.onboarding.completed ? state.farm.crop : '');
  const [sowing, setSowing] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [error, setError] = useState('');
  const lookup = useRef<AbortController | null>(null);
  useEffect(() => () => { lookup.current?.abort(); lookup.current = null; }, []);
  const changeStep = (next: number) => { Keyboard.dismiss(); setError(''); setStep(next); };
  const locate = (latitude: number, longitude: number) => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 6 || latitude > 38 || longitude < 68 || longitude > 98) {
      setError('Choose a location in India: latitude 6–38 and longitude 68–98.'); return;
    }
    setCenter({ latitude, longitude }); setPolygon([]); setMapAvailable(true); setPlaces([]); changeStep(1);
  };
  const findVillage = async () => {
    if (finding) return;
    lookup.current?.abort();
    const controller = new AbortController(); lookup.current = controller;
    const timer = setTimeout(() => controller.abort(), 20000);
    setFinding(true); setError(''); setPlaces([]);
    try {
      const response = await fetch(`${apiBase}/api/places?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!Array.isArray(data.places)) throw new Error();
      if (lookup.current === controller && !controller.signal.aborted) {
        setPlaces(data.places);
        if (!data.places.length) setError('No match yet. Add your district to the search, or enter coordinates.');
      }
    } catch { if (lookup.current === controller) setError('Village search could not connect. Try again or enter coordinates.'); }
    finally { clearTimeout(timer); if (lookup.current === controller) { setFinding(false); lookup.current = null; } }
  };
  const next = () => {
    if (step === 1) {
      if (!mapAvailable) { setError('Reload the map before confirming your boundary.'); return; }
      if (polygon.length < 3) { setError('Tap at least three field corners on the map.'); return; }
      if (polygon.some(point => !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) || point.latitude < 6 || point.latitude > 38 || point.longitude < 68 || point.longitude > 98)) {
        setError('The boundary contains an invalid point. Go back and mark your field again.'); return;
      }
      const area = polygon.reduce((sum, p, i) => { const q = polygon[(i + 1) % polygon.length]; return sum + p.longitude * q.latitude - q.longitude * p.latitude; }, 0);
      if (!Number.isFinite(area) || Math.abs(area) < 1e-10) { setError('Spread the corners around your field instead of drawing a straight line.'); return; }
      changeStep(2); return;
    }
    if (!name.trim() || !crop.trim()) { setError('Add a field name and crop to continue.'); return; }
    if (sowing && !validDate(sowing)) { setShowDate(true); setError('Use a valid sowing date in YYYY-MM-DD format, today or earlier.'); return; }
    Keyboard.dismiss();
    onSaved({ id: `field-${Date.now()}`, name: name.trim(), crop: crop.trim(), polygon, sowingDate: sowing, alertsOptIn: false, shareApproximate: false, radiusKm: 5 });
  };
  return <Screen key={step} keyboard gap={24} footer={step > 0 ? <View style={styles.footer}>
    {step === 1 ? <Text variant="caption" align="center">{polygon.length < 3 ? `${3 - polygon.length} more corners to continue` : `${polygon.length} corners selected · check the outline`}</Text> : null}
    {error ? <Notice tone="warning" title="One quick check">{error}</Notice> : null}
    <Button title={step === 1 ? 'Use this boundary' : 'Save & view my field'} onPress={next} disabled={step === 1 ? polygon.length < 3 || !mapAvailable : !name.trim() || !crop.trim()} />
  </View> : undefined}>
    <View style={styles.topRow}>
      <Text variant="label" color={palette.deep}>YOUR FIELD, FROM ABOVE</Text>
      {onCancel ? <Button title="Cancel" variant="ghost" fullWidth={false} trailingArrow={false} onPress={onCancel} /> : null}
    </View>
    <View style={styles.steps} accessibilityLabel={`Step ${step + 1} of 3: ${steps[step]}`}>
      {steps.map((label, index) => <View key={label} style={styles.step}>
        <View style={[styles.stepLine, index <= step && styles.stepLineActive]} />
        <Text variant="meta" color={index <= step ? palette.ink : palette.muted}>{index + 1}. {label}</Text>
      </View>)}
    </View>
    <View style={styles.section}>
      <Header title={['Where is your field?', 'Mark your field', 'Make it yours'][step]} back={step > 0} onBack={() => changeStep(step - 1)} backLabel={step === 1 ? 'Change location' : 'Edit boundary'} />
      <Text variant="caption">{[
        'Search for your village. We’ll help you find the right spot.',
        'Tap the corners in order to trace the land you farm.',
        'Just a name and crop. Your images will load automatically.',
      ][step]}</Text>
    </View>
    {step === 0 ? <>
      {state.deviceLocation ? <Card gap={10} tone="soft" padding={16}>
        <View style={styles.inline}><Icon name="map-pin" size={20} /><Text variant="strong">Start near your phone</Text></View>
        <Text variant="caption">Use the location you shared during setup, then mark your field.</Text>
        <Button title="Use saved phone location" variant="secondary" onPress={() => locate(state.deviceLocation!.latitude, state.deviceLocation!.longitude)} />
      </Card> : null}
      <View style={styles.section}>
        <Field label="Village or nearby town" placeholder="e.g. Niphad, Nashik" value={query} onChangeText={value => { setQuery(value); setPlaces([]); }} onSubmitEditing={() => { if (apiBase && query.trim().length >= 3) void findVillage(); }} />
        <Button title="Find my village" icon="search" loading={finding} disabled={query.trim().length < 3 || !apiBase} onPress={findVillage} />
        {!apiBase ? <Text variant="caption">Village search is unavailable. You can still use coordinates below.</Text> : null}
        {places.map(place => <Pressable key={place.id} accessibilityRole="button" accessibilityLabel={`Choose ${place.label}`} onPress={() => locate(place.lat, place.lon)} style={styles.place}>
          <Icon name="map-pin" size={18} /><Text style={styles.placeLabel}>{place.label}</Text><Icon name="chevron-right" size={18} />
        </Pressable>)}
      </View>
      <Button title={manual ? 'Hide coordinates' : 'Enter coordinates instead'} variant="ghost" icon="map" trailingArrow={false} onPress={() => setManual(value => !value)} />
      {manual ? <Card gap={12} tone="soft" padding={16}>
        <Field label="Latitude" placeholder="20.0000" value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
        <Field label="Longitude" placeholder="75.0000" value={lon} onChangeText={setLon} keyboardType="decimal-pad" />
        <Button title="Find this spot" variant="secondary" disabled={!lat.trim() || !lon.trim()} onPress={() => locate(Number(lat), Number(lon))} />
      </Card> : null}
      {error ? <Notice tone="warning" title="Let’s try another way">{error}</Notice> : null}
      <Text variant="meta">Village results are a starting point, not a land-record lookup.</Text>
    </> : null}
    {step === 1 && center ? <>
      <BoundaryMap center={center} points={polygon} onAvailabilityChange={setMapAvailable} onChange={points => { setPolygon(points); setError(''); }} />
      <View style={styles.tip}><Icon name="info" size={18} /><Text variant="caption" style={styles.placeLabel}>Trace your actual field. This street map helps locate it; satellite images come after you save.</Text></View>
    </> : null}
    {step === 2 ? <>
      <Card tone="soft" padding={16} gap={8}>
        <View style={styles.inline}><Icon name="circle-check" color={palette.deep} size={20} /><Text variant="strong">Boundary ready</Text></View>
        <Text variant="caption">{polygon.length} corners · {center?.latitude.toFixed(4)}, {center?.longitude.toFixed(4)}</Text>
      </Card>
      <Field label="Field name" placeholder="e.g. North field" value={name} onChangeText={setName} maxLength={120} />
      <Field label="What are you growing?" placeholder="e.g. Wheat" value={crop} onChangeText={setCrop} maxLength={80} />
      <Button title={showDate ? 'Hide sowing date' : 'Add sowing date · optional'} variant="ghost" icon="calendar" trailingArrow={false} onPress={() => setShowDate(value => !value)} />
      {showDate ? <Field label="Sowing date" placeholder="YYYY-MM-DD" value={sowing} onChangeText={setSowing} maxLength={10} /> : null}
      <Text variant="caption">Your boundary is sent to the imagery service to load your field. Saved fields stay in this session and clear when the app restarts.</Text>
    </> : null}
  </Screen>;
}

const makeStyles = (p: AccentPalette) => StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  steps: { flexDirection: 'row', gap: 10 },
  step: { flex: 1, gap: 8 },
  stepLine: { height: 4, borderRadius: 4, backgroundColor: p.border },
  stepLineActive: { backgroundColor: p.deep },
  section: { gap: 12 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, padding: 14, borderWidth: 1, borderColor: p.border, borderRadius: 16 },
  placeLabel: { flex: 1 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  footer: { gap: 12, paddingBottom: 8 },
});
