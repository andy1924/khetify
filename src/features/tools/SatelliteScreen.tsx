import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { router } from 'expo-router';
import { useDemoSlices, useDemoDispatch } from '../../demo';
import { Button, Card, Chip, Header, Icon, Notice, Screen, Text } from '../../ui';
import { useAccentPalette, useStyles, type AccentPalette } from '../../ui/AccentTheme';
import { FieldSetup } from './FieldSetup';
import { DummySatelliteMap } from './DummySatelliteMap';
import { fieldMonitoringProvider, type ObservationResult, type RegisteredField } from './satelliteProvider';

const captureDate = (value: string) => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export function SatelliteScreen() {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  const state = useDemoSlices(['monitoring'] as const);
  const dispatch = useDemoDispatch();
  const { fields } = state.monitoring;
  const [selected, setSelected] = useState<string | null>(fields[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const active = fields.find(field => field.id === selected) ?? fields[0];
  const [result, setResult] = useState<ObservationResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState(0);
  const request = useRef(0);
  const fieldId = active?.id;
  const polygon = active?.polygon;
  const refresh = useCallback(async (force = false) => {
    if (!polygon) return;
    const id = ++request.current;
    setCheckedAt(Date.now()); setLoading(true); setError(''); setFailedImage(null); setResult(null);
    try {
      const data = await fieldMonitoringProvider.getObservations(polygon, force);
      if (id === request.current) setResult(data);
    } catch (failure) { if (id === request.current) setError(failure instanceof Error ? failure.message : 'Your images could not load. Check your connection and try again.'); }
    finally { if (id === request.current) setLoading(false); }
  }, [polygon]);
  useEffect(() => {
    const token = request;
    const start = setTimeout(() => { if (!adding) void refresh(); }, 0);
    return () => { clearTimeout(start); token.current++; };
  }, [refresh, fieldId, adding]);
  const saveField = (field: RegisteredField) => {
    dispatch({ type: 'monitoring/field', field });
    setSelected(field.id); setAdding(false); setDetailsOpen(false);
  };
  if (!fields.length || adding) return <FieldSetup onSaved={saveField} onCancel={fields.length ? () => setAdding(false) : undefined} />;

  const observations = result?.observations ?? [];
  const clear = observations.filter(o => o.ndvi !== null && o.confidence === 'moderate' && checkedAt - Date.parse(o.capturedAt) <= 14 * 86400000);
  const latest = clear[0], previous = clear[1];
  const preview = observations.find(o => o.imageUrl);
  const bounds = preview?.imageBounds;
  const outline = bounds && active ? active.polygon.map(p => `${100 * (p.longitude - bounds.west) / (bounds.east - bounds.west)},${100 * (bounds.north - p.latitude) / (bounds.north - bounds.south)}`).join(' ') : '';
  return <Screen key={active?.id} gap={24}>
    <View style={styles.topRow}>
      <View style={styles.heading}><Text variant="label" color={palette.deep}>FIELD MONITORING</Text><Text variant="heading">Your fields</Text></View>
      <Button title="Add field" icon="plus" variant="secondary" fullWidth={false} trailingArrow={false} onPress={() => setAdding(true)} />
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fieldTabs}>
      {fields.map(field => <Chip key={field.id} label={field.name} selected={field.id === active?.id} icon="map-pin" onPress={() => {
        if (field.id === active?.id) return;
        request.current++; setResult(null); setError(''); setSelected(field.id); setDetailsOpen(false);
      }} />)}
    </ScrollView>
    {active ? <>
      <View style={styles.heading}><Header title={active.name} /><Text variant="caption">{`${active.crop}${active.sowingDate ? ` · Sown ${captureDate(active.sowingDate)}` : ''}`}</Text></View>
      <View style={styles.imageCard}>
        {preview?.imageUrl && failedImage !== preview.imageUrl ? <View style={styles.imageFrame}>
          <Image source={{ uri: preview.imageUrl }} accessibilityLabel={`Satellite image of ${active.name}, ${captureDate(preview.capturedAt)}`} style={StyleSheet.absoluteFill} resizeMode="stretch" onError={() => setFailedImage(preview.imageUrl!)} />
          {outline ? <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill} pointerEvents="none"><Polygon points={outline} fill="rgba(220,255,180,0.08)" stroke={palette.iconFaint} strokeWidth="0.6" /></Svg> : null}
        </View> : <View style={styles.imageFrame}>
          <DummySatelliteMap
            fieldId={active.id}
            polygon={active.polygon}
            outlineColor={palette.strong}
            fieldColor={palette.strong}
          />
          {loading ? <View style={styles.mapLoading}><ActivityIndicator size="small" color={palette.deep} /></View> : null}
        </View>}
        <View style={styles.imageCaption}>
          <View style={styles.heading}><Text variant="strong">{preview ? `Captured ${captureDate(preview.capturedAt)}` : 'Satellite view'}</Text><Text variant="meta">Copernicus Sentinel-2 · approx. 10 m detail</Text></View>
          <Icon name="satellite" size={20} color={palette.deep} />
        </View>
      </View>
      <Text variant="meta">Field outline over a wider, contrast-adjusted view. Smoothing improves presentation, not the original 10 m detail. NDVI uses unaltered bands.</Text>
      {result?.fetchedAt ? <Text variant="meta">{result.cached ? 'Cached view' : 'Fetched'} · {new Date(result.fetchedAt).toLocaleTimeString()} · cached for 15 minutes. Capture dates stay unchanged.</Text> : null}
      <Button title="Refresh images" variant="outline" icon="refresh-cw" loading={loading} onPress={() => void refresh(true)} />
      <Button title="Check a plant photo" icon="camera" variant="secondary" onPress={() => router.push('/tools/photo?tool=cropPhoto')} />
      {error ? <Notice tone="warning" title="Connection interrupted">{error}</Notice> : null}
      {result?.status === 'unconfigured' ? <Notice title="Imagery is not connected" tone="info">Your field is saved for this session. Connect the imagery provider to load images and vegetation readings.</Notice> : null}
      {result?.status === 'no-coverage' ? <Notice title="No recent captures" tone="info">No images were found for this boundary in the last 30 days. You can check again later.</Notice> : null}
      {result?.status === 'ready' ? <>
        <Card gap={16} tone="soft" style={styles.outline}>
          <View style={styles.topRow}><Text variant="subtitle">Vegetation snapshot</Text><Chip label={latest ? 'Clear reading' : 'Reading limited'} tone={latest ? 'success' : 'limited'} /></View>
          {latest && latest.ndvi !== null ? <>
            <View style={styles.metricRow}><Text style={styles.metric}>{latest.ndvi.toFixed(2)}</Text><View style={styles.heading}><Text variant="strong">Vegetation index</Text><Text variant="caption">NDVI · {captureDate(latest.capturedAt)}</Text></View></View>
            <Text variant="caption">{previous?.ndvi != null ? `Previous clear reading: ${previous.ndvi.toFixed(2)} on ${captureDate(previous.capturedAt)}.` : 'A second recent clear capture will let you compare readings.'}</Text>
          </> : <Text>Recent captures are cloudy, too old, or have too few clear field pixels for a reliable reading.</Text>}
          <Text variant="meta">NDVI ranges from −1 to 1. Buildings, water, soil and urban greenery can affect an area average. It is not proof of farmland, crop health, pests or disease.</Text>
        </Card>
        <View style={styles.heading}><Text variant="subtitle">Recent captures</Text><Text variant="caption">Quality and coverage, at a glance.</Text></View>
        {observations.map(observation => <Card key={observation.capturedAt} tone="soft" padding={16} gap={10}>
          <View style={styles.topRow}><Text variant="strong">{captureDate(observation.capturedAt)}</Text><Chip label={observation.ndvi !== null ? `NDVI ${observation.ndvi.toFixed(2)}` : 'Limited reading'} tone={observation.ndvi !== null ? 'success' : 'limited'} /></View>
          <Text variant="caption">{`Cloud / unusable: ${observation.cloudPercent === null ? 'Unknown' : `${Math.round(observation.cloudPercent)}%`}   ·   Field coverage: ${observation.fieldCoveragePercent === null ? 'Unknown' : `${Math.round(observation.fieldCoveragePercent)}%`}`}</Text>
          <Text variant="meta">{observation.summary}</Text>
          {checkedAt - Date.parse(observation.capturedAt) > 14 * 86400000 ? <Text variant="meta">Older than 14 days · use a recent capture for comparison.</Text> : null}
          {observation.imageError ? <Text variant="caption">Preview unavailable. Refresh to retry; available readings are shown above.</Text> : null}
        </Card>)}
      </> : null}
      <Button title={detailsOpen ? 'Hide field details' : 'Field details & privacy'} icon="info" variant="ghost" trailingArrow={false} onPress={() => setDetailsOpen(value => !value)} />
      {detailsOpen ? <Card tone="soft" gap={12} padding={16}>
        <Text variant="strong">{active.name} · {active.crop}</Text>
        <Text variant="caption">{active.polygon.length} boundary corners · Sowing date: {active.sowingDate || 'Not added'}</Text>
        <Text variant="caption">Your boundary is shared with the imagery service when this field opens or you refresh. Fields clear when the app restarts.</Text>
        <Text variant="caption">Pest notifications and public report sharing are not connected. No nearby farmer is notified.</Text>
      </Card> : null}
    </> : null}
  </Screen>;
}

const makeStyles = (p: AccentPalette) => StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  heading: { gap: 5, flexShrink: 1 },
  fieldTabs: { gap: 8, paddingVertical: 4 },
  imageCard: { borderRadius: 24, overflow: 'hidden', backgroundColor: p.surfaceTile, borderWidth: 1, borderColor: p.border },
  imageFrame: { width: '100%', maxWidth: 520, aspectRatio: 1, alignSelf: 'center' },
  mapLoading: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 999, padding: 7 },
  imageCaption: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: p.surfaceSoft },
  outline: { borderWidth: 1, borderColor: p.border },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metric: { fontSize: 48, lineHeight: 58, fontWeight: '600', color: p.deep, letterSpacing: -2 },
});
