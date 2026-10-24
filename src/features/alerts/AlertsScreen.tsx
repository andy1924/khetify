import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useDemo } from '../../demo';
import { apiBase, connectionError } from '../../lib/api';
import { Button, Card, Chip, colors, Header, Icon, Notice, Screen, Text } from '../../ui';

type AreaEvent = {
  id: string; title: string; detail: string; category: 'weather' | 'incident'; severity: string;
  occurredAt: string; expiresAt?: string; distanceKm?: number;
  source: { name: string; url: string; basis: string };
};
type AlertsResult = {
  checkedAt: string; radiusKm: number; weatherStatus: 'ready' | 'unavailable'; incidentStatus: 'ready' | 'unconfigured';
  warnings: AreaEvent[]; events: AreaEvent[]; attribution: string;
};
const dateLabel = (value: string) => new Date(value).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function AlertsScreen() {
  const { state } = useDemo();
  const fields = state.monitoring.fields;
  const [selected, setSelected] = useState(fields[0]?.id ?? '');
  const [tab, setTab] = useState<'warnings' | 'events'>('warnings');
  const [radius, setRadius] = useState(10);
  const [result, setResult] = useState<AlertsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const field = fields.find(item => item.id === selected) ?? fields[0];
  const points = field?.polygon;
  const request = useRef(0);
  const refresh = useCallback(async () => {
    if (!points?.length) return;
    const id = ++request.current;
    setLoading(true); setError(''); setResult(null);
    // Only a rounded field center is sent; never the precise boundary.
    const lat = (points.reduce((sum, p) => sum + p.latitude, 0) / points.length).toFixed(2);
    const lon = (points.reduce((sum, p) => sum + p.longitude, 0) / points.length).toFixed(2);
    try {
      if (!apiBase) throw new Error(connectionError());
      let response: Response;
      try { response = await fetch(`${apiBase}/api/area-alerts?lat=${lat}&lon=${lon}&radius=${radius}`, { signal: AbortSignal.timeout(20000) }); }
      catch { throw new Error(connectionError()); }
      if (!response.ok) throw new Error(response.status === 404 ? 'Your backend needs the latest update to load area alerts. Restart the backend and refresh.' : 'Area updates could not load. Please retry.');
      const data: AlertsResult = await response.json();
      if (!Array.isArray(data.warnings) || !Array.isArray(data.events)) throw new Error('Area updates returned an unexpected response.');
      if (id === request.current) setResult(data);
    } catch (failure) { if (id === request.current) setError(failure instanceof Error ? failure.message : 'Area updates could not load.'); }
    finally { if (id === request.current) setLoading(false); }
  }, [points, radius]);
  useEffect(() => {
    const token = request;
    const start = setTimeout(() => { void refresh(); }, 0);
    return () => { clearTimeout(start); token.current++; };
  }, [refresh]);
  const entries = result?.[tab] ?? [];
  return <Screen gap={24}>
    <View style={styles.heading}><Text variant="label" color={colors.accentDeep}>AROUND YOUR FARM</Text><Header title="Alerts & area updates" /><Text variant="caption">What to watch for now, and what happened nearby.</Text></View>
    {!field ? <Card gap={16} tone="soft">
      <Icon name="map-pin" size={28} color={colors.accentDeep} />
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
      <Button title="Refresh area updates" variant="outline" icon="refresh-cw" loading={loading} onPress={refresh} />
      {loading ? <Text variant="caption">Checking local sources…</Text> : null}
      {error ? <Notice tone="warning" title="Updates unavailable">{error}</Notice> : null}
      {result?.weatherStatus === 'unavailable' ? <Notice tone="warning" title="Weather source unavailable">We could not check the forecast. An empty list does not mean your area is free of weather risks.</Notice> : null}
      {result?.incidentStatus === 'unconfigured' ? <Notice title="Reviewed incident feed not connected">Local pest, disease and damage reports will appear here when a reviewed public feed is connected. Community demo posts are not treated as live incidents.</Notice> : null}
      {entries.map(item => <Card key={`${item.category}-${item.id}`} gap={12} tone={tab === 'warnings' ? 'warning' : 'soft'} padding={18}>
        <View style={styles.eventHeader}><Icon name={item.category === 'weather' ? 'cloud-rain' : 'triangle-alert'} size={22} color={tab === 'warnings' ? colors.warningInk : colors.accentDeep} /><Text variant="subtitle" style={styles.eventTitle}>{item.title}</Text></View>
        <View style={styles.row}><Chip label={item.category === 'weather' ? 'Weather estimate' : 'Reviewed report'} size="sm" />{item.distanceKm !== undefined ? <Text variant="caption">About {item.distanceKm} km away</Text> : null}</View>
        <Text>{item.detail}</Text>
        <Text variant="caption">{`${item.category === 'weather' && tab === 'warnings' ? 'Forecast for' : 'Date'}: ${dateLabel(item.occurredAt)}`}</Text>
        {item.expiresAt ? <Text variant="meta">Valid until {dateLabel(item.expiresAt)}</Text> : null}
        <Text variant="meta">{item.source.basis}</Text>
        <Button title={`Source: ${item.source.name}`} variant="ghost" fullWidth={false} trailingArrow={false} onPress={() => { if (item.source.url.startsWith('https://')) void Linking.openURL(item.source.url).catch(() => setError('The source link could not open.')); }} />
      </Card>)}
      {result && !entries.length ? <Card tone="soft" gap={10}>
        <Icon name={tab === 'warnings' ? 'bell' : 'clock'} size={24} color={colors.muted} />
        <Text variant="subtitle">{tab === 'warnings' ? 'No advisories returned' : 'No events returned'}</Text>
        <Text variant="caption">{tab === 'warnings' ? 'No advisories were returned by the available sources. This is not an all-clear for local hazards.' : 'No matching events were returned for this radius and time range.'}</Text>
      </Card> : null}
      {result ? <View style={styles.heading}><Text variant="meta">Checked {dateLabel(result.checkedAt)}</Text><Text variant="meta">{result.attribution}</Text></View> : null}
    </>}
  </Screen>;
}

const styles = StyleSheet.create({
  heading: { gap: 8 }, row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  switcher: { flexDirection: 'row', gap: 6, padding: 5, borderRadius: 24, backgroundColor: colors.surfaceSoft },
  switchButton: { flex: 1, paddingHorizontal: 10 },
  eventHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, eventTitle: { flex: 1 },
});
