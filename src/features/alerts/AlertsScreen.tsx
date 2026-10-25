import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useDemoSlices } from '../../demo';
import { apiBase, connectionError } from '../../lib/api';
import { Button, Card, Chip, colors, Header, Icon, Notice, Screen, Text } from '../../ui';
import { useAccentPalette, useStyles, type AccentPalette } from '../../ui/AccentTheme';

type AreaEvent = {
  id: string; title: string; detail: string; category: 'weather' | 'incident'; severity: string;
  occurredAt: string; expiresAt?: string; distanceKm?: number;
  source: { name: string; url: string; basis: string };
};
type AlertsResult = {
  checkedAt: string; radiusKm: number; weatherStatus: 'ready' | 'partial' | 'unavailable'; incidentStatus: 'ready' | 'unconfigured';
  warnings: AreaEvent[]; events: AreaEvent[]; attribution: string;
  outlook?: { temperature: number | null; minTemperature: number | null; maxTemperature: number | null; rainTotal: number | null; maxGust: number | null; hours: number; validFrom: string; validUntil: string } | null;
  weatherFetchedAt?: string | null; thresholds?: string;
};
const dateLabel = (value: string) => new Date(value).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function AlertsScreen() {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  // Only field registrations are read; monitoring reports do not re-render alerts.
  const state = useDemoSlices(['monitoring'] as const);
  const fields = state.monitoring.fields;
  const [selected, setSelected] = useState(fields[0]?.id ?? '');
  const [tab, setTab] = useState<'warnings' | 'events'>('warnings');
  const [radius, setRadius] = useState(10);
  const [result, setResult] = useState<AlertsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const field = fields.find(item => item.id === selected) ?? fields[0];
  const points = field?.polygon;
  const request = useRef(0);
  const refresh = useCallback(async (force = false) => {
    if (!points?.length) return;
    const id = ++request.current;
    setLoading(true); setResult(null);
    // Only a rounded field center is sent; never the precise boundary.
    const lat = (points.reduce((sum, p) => sum + p.latitude, 0) / points.length).toFixed(2);
    const lon = (points.reduce((sum, p) => sum + p.longitude, 0) / points.length).toFixed(2);
    try {
      if (!apiBase) throw new Error(connectionError());
      let response: Response;
      try { response = await fetch(`${apiBase}/api/area-alerts?lat=${lat}&lon=${lon}&radius=${radius}&refresh=${force}`, { signal: AbortSignal.timeout(20000) }); }
      catch { throw new Error(connectionError()); }
      if (!response.ok) throw new Error(response.status === 404 ? 'Your backend needs the latest update to load area alerts. Restart the backend and refresh.' : 'Area updates could not load. Please retry.');
      const data: AlertsResult = await response.json();
      if (!Array.isArray(data.warnings) || !Array.isArray(data.events)) throw new Error('Area updates returned an unexpected response.');
      if (id === request.current) setResult(data);
    } catch { /* a failed check leaves the previous result cleared by design */ }
    finally { if (id === request.current) setLoading(false); }
  }, [points, radius]);
  useEffect(() => {
    const token = request;
    const start = setTimeout(() => { void refresh(); }, 0);
    return () => { clearTimeout(start); token.current++; };
  }, [refresh]);
  const entries = result?.[tab] ?? [];
  return <Screen gap={24}>
    <View style={styles.heading}><Text variant="label" color={palette.deep}>AROUND YOUR FARM</Text><Header title="Alerts & area updates" /><Text variant="caption">What to watch for now, and what happened nearby.</Text></View>
    {!field ? <Card gap={16} tone="soft">
      <Icon name="map-pin" size={28} color={palette.deep} />
      <Text variant="subtitle">Choose your area first</Text>
      <Text>Add a field on Home to see local weather advisories and nearby reviewed reports.</Text>
      <Button title="Add my field" icon="plus" onPress={() => router.navigate('/(tabs)/home')} />
    </Card> : <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {fields.map(item => <Chip key={item.id} icon="map-pin" label={item.name} selected={item.id === field.id} onPress={() => {
          if (item.id === field.id) return;
          request.current++; setResult(null); setSelected(item.id);
        }} />)}
      </ScrollView>
      <View style={styles.heading}><Text variant="strong">Around {field.name}</Text><Text variant="caption">Weather uses your approximate field area. Incident reports are filtered by distance.</Text></View>
      <View style={styles.row}>{[5, 10, 25, 50].map(km => <Chip key={km} label={`${km} km`} selected={radius === km} onPress={() => setRadius(km)} />)}</View>
      <View style={styles.switcher} accessibilityRole="tablist">
        <Button title={`Current warnings${result ? ` (${result.warnings.length})` : ''}`} icon="bell" variant={tab === 'warnings' ? 'primary' : 'ghost'} style={styles.switchButton} fullWidth={false} trailingArrow={false} onPress={() => setTab('warnings')} accessibilityLabel="Show current warnings" />
        <Button title={`Recent events${result ? ` (${result.events.length})` : ''}`} icon="clock" variant={tab === 'events' ? 'primary' : 'ghost'} style={styles.switchButton} fullWidth={false} trailingArrow={false} onPress={() => setTab('events')} accessibilityLabel="Show recent nearby events" />
      </View>
      <View style={styles.heading}><Text variant="subtitle">{tab === 'warnings' ? 'Current warnings' : 'Recent nearby events'}</Text><Text variant="caption">{tab === 'warnings' ? 'Weather outlook for the next 24 hours, plus active reviewed incidents.' : 'Last 7 days of weather estimates and up to 30 days of reviewed incidents.'}</Text></View>
      <Button title="Refresh area updates" variant="outline" icon="refresh-cw" loading={loading} onPress={() => void refresh(true)} />
      {loading ? <Text variant="caption">Checking local sources…</Text> : null}
      {result?.outlook ? <Card tone="soft" gap={12}>
        <Text variant="subtitle">Your area’s weather outlook</Text>
        <Text variant="caption">Model estimates · {dateLabel(result.outlook.validFrom)} to {dateLabel(result.outlook.validUntil)}</Text>
        <Text variant="strong">{result.outlook.temperature === null ? 'Temperature unavailable' : `${result.outlook.temperature.toFixed(1)}°C near the current hour`}</Text>
        <Text>{`Range ${result.outlook.minTemperature?.toFixed(1) ?? '—'}–${result.outlook.maxTemperature?.toFixed(1) ?? '—'}°C · Rain ${result.outlook.rainTotal ?? '—'} mm · Gusts up to ${result.outlook.maxGust ?? '—'} km/h`}</Text>
        <Text variant="meta">{`Forecast coverage: ${result.outlook.hours} hourly samples. ${result.thresholds ?? ''}`}</Text>
        {result.weatherFetchedAt ? <Text variant="meta">Source fetched {dateLabel(result.weatherFetchedAt)} · cached up to 10 minutes</Text> : null}
        <Button title="Official IMD warnings" variant="ghost" trailingArrow={false} onPress={() => { void Linking.openURL('https://mausam.imd.gov.in/').catch(() => { }); }} />
      </Card> : null}
      {result?.weatherStatus === 'unavailable' ? <Notice tone="warning" title="Weather source unavailable">We could not check the forecast. An empty list does not mean your area is free of weather risks.</Notice> : null}
      {result?.weatherStatus === 'partial' ? <Notice tone="warning" title="Some forecast measurements are missing">Available measurements are shown, but the warning check is incomplete. Missing values are not treated as zero or as an all-clear.</Notice> : null}
      {result?.incidentStatus === 'unconfigured' ? <Notice title="Reviewed incident feed not connected">Local pest, disease and damage reports will appear here when a reviewed public feed is connected. Community posts are not treated as live incidents.</Notice> : null}
      {entries.map(item => <Card key={`${item.category}-${item.id}`} gap={12} tone={tab === 'warnings' ? 'warning' : 'soft'} padding={18}>
        <View style={styles.eventHeader}><Icon name={item.category === 'weather' ? 'cloud-rain' : 'triangle-alert'} size={22} color={tab === 'warnings' ? colors.warningInk : palette.deep} /><Text variant="subtitle" style={styles.eventTitle}>{item.title}</Text></View>
        <View style={styles.row}><Chip label={item.category === 'weather' ? 'Weather estimate' : 'Reviewed report'} size="sm" />{item.distanceKm !== undefined ? <Text variant="caption">About {item.distanceKm} km away</Text> : null}</View>
        <Text>{item.detail}</Text>
        <Text variant="caption">{`${item.category === 'weather' && tab === 'warnings' ? 'Forecast for' : 'Date'}: ${dateLabel(item.occurredAt)}`}</Text>
        {item.expiresAt ? <Text variant="meta">Valid until {dateLabel(item.expiresAt)}</Text> : null}
        <Text variant="meta">{item.source.basis}</Text>
        <Button title={`Source: ${item.source.name}`} variant="ghost" fullWidth={false} trailingArrow={false} onPress={() => { if (item.source.url.startsWith('https://')) void Linking.openURL(item.source.url).catch(() => { }); }} />
      </Card>)}
      {result && !entries.length ? <Card tone="soft" gap={10}>
        <Icon name={tab === 'warnings' ? 'bell' : 'clock'} size={24} color={palette.muted} />
        <Text variant="subtitle">{tab === 'warnings' ? 'No advisories returned' : 'No events returned'}</Text>
        <Text variant="caption">{tab === 'warnings' ? result.weatherStatus === 'ready' ? 'No available forecast values crossed the app’s advisory thresholds, and no active reviewed incident was returned. This is not an all-clear. Check official IMD updates for local warnings.' : 'The weather check is incomplete or unavailable, and no active reviewed incident was returned. This is not an all-clear. Check official IMD updates.' : 'No matching events were returned for this radius and time range.'}</Text>
      </Card> : null}
      {result ? <View style={styles.heading}><Text variant="meta">Checked {dateLabel(result.checkedAt)}</Text><Text variant="meta">{result.attribution}</Text></View> : null}
    </>}
  </Screen>;
}

const makeStyles = (p: AccentPalette) => StyleSheet.create({
  heading: { gap: 8 }, row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  switcher: { flexDirection: 'row', gap: 6, padding: 5, borderRadius: 24, backgroundColor: p.surfaceSoft },
  switchButton: { flex: 1, paddingHorizontal: 10 },
  eventHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, eventTitle: { flex: 1 },
});
