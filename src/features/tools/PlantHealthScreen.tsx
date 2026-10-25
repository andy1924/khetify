import React, { useEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiBase, connectionError } from '../../lib/api';
import { Button, Card, Chip, Field, Header, Notice, Screen, Text, Toggle } from '../../ui';

type Photo = { uri: string; mimeType: string; base64: string };
type Assessment = {
  imageQuality: string; confidence: string; observedSymptoms: string[]; possibleCauses: { condition: string; explanation: string }[];
  nextSteps: string[]; questions: string[]; pesticideNotice: string; safety: string[];
  pesticideOptions: { id: string; activeIngredient: string; formulation: string; condition: string; sourceUrl: string; reviewedAt: string; precautions: string[] }[];
  limitations: string; analyzedAt: string; model: string; safetySource: { name: string; url: string };
};

export function PlantHealthScreen() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [crop, setCrop] = useState(''), [region, setRegion] = useState(''), [symptoms, setSymptoms] = useState('');
  const [consent, setConsent] = useState(false), [loading, setLoading] = useState(false), [picking, setPicking] = useState(false);
  const [error, setError] = useState(''), [result, setResult] = useState<Assessment | null>(null);
  const [capability, setCapability] = useState<{ configured: boolean; reviewedLabelCount: number } | null>(null);
  const request = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    if (apiBase) void fetch(`${apiBase}/api/plant-health/capabilities`, { signal: controller.signal }).then(async response => {
      if (response.ok) setCapability(await response.json());
    }).catch(() => {});
    const token = request;
    return () => { controller.abort(); token.current++; };
  }, []);
  const pick = async (camera: boolean) => {
    setPicking(true); setError('');
    try {
      if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) throw new Error('Camera permission was denied. You can still choose a photo from your library.');
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.75, allowsEditing: true };
      const selection = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (selection.canceled) return;
      const asset = selection.assets[0];
      if (!asset.base64) throw new Error('The selected photo could not be read. Choose a JPEG, PNG or WebP photo.');
      if (asset.base64.length > Math.ceil(5 * 1024 * 1024 / 3) * 4) throw new Error('Photo is too large. Crop it or choose a smaller photo (up to 5 MiB).');
      const mimeType = asset.mimeType ?? 'image/jpeg';
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) throw new Error('Please use a JPEG, PNG or WebP photo.');
      setPhoto({ uri: asset.uri, mimeType, base64: asset.base64 }); setResult(null); setConsent(false);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'The photo picker could not open.'); }
    finally { setPicking(false); }
  };
  const analyze = async () => {
    if (!photo || !consent || !crop.trim() || !region.trim()) return;
    const id = ++request.current;
    setLoading(true); setError(''); setResult(null);
    try {
      if (!apiBase) throw new Error(connectionError());
      let response: Response;
      try {
        response = await fetch(`${apiBase}/api/plant-health`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(60000),
          body: JSON.stringify({ image: { mimeType: photo.mimeType, base64: photo.base64 }, crop: crop.trim(), state: region.trim(), symptoms: symptoms.trim(), consentToAnalysis: true }) });
      } catch { throw new Error(connectionError()); }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The plant assessment failed. Please retry.');
      if (!['observedSymptoms', 'possibleCauses', 'nextSteps', 'questions', 'pesticideOptions', 'safety'].every(k => Array.isArray(data[k]))) throw new Error('The assessment response was incomplete. Please retry.');
      if (id === request.current) setResult(data);
    } catch (failure) { if (id === request.current) setError(failure instanceof Error ? failure.message : 'The plant assessment failed.'); }
    finally { if (id === request.current) setLoading(false); }
  };
  const openSource = (url: string) => { if (url.startsWith('https://')) void Linking.openURL(url).catch(() => setError('The source link could not open.')); };
  return <Screen gap={22}>
    <Header title="Plant health check" />
    <Text>Photograph the symptoms, confirm your crop, then review possible causes and next steps.</Text>
    <Notice title="A second opinion, not a diagnosis">AI can confuse infection with nutrient, water or chemical injury. Do not spray based only on a photo.</Notice>
    {capability?.configured === false ? <Notice tone="warning" title="OpenAI is not connected">Add the actual OPENAI_API_KEY value to server/.env.local, save and restart the backend. The default model is gpt-4.1-mini. Never put the key in EXPO_PUBLIC variables.</Notice> : null}
    <Card gap={14} tone="soft">
      <Text variant="subtitle">1 · Add a clear plant photo</Text>
      <Text variant="caption">Use daylight. Include the affected leaf and its underside. No demo image is substituted.</Text>
      {photo ? <Image source={{ uri: photo.uri }} style={styles.photo} accessibilityLabel="Selected plant photo" resizeMode="contain" /> : null}
      <View style={styles.row}>
        <Button title="Camera" icon="camera" variant="secondary" fullWidth={false} disabled={loading || picking} onPress={() => void pick(true)} />
        <Button title="Choose photo" icon="image" variant="outline" fullWidth={false} disabled={loading || picking} onPress={() => void pick(false)} />
      </View>
      {photo ? <Button title="Remove photo & result" variant="ghost" disabled={loading} onPress={() => { setPhoto(null); setResult(null); setConsent(false); }} /> : null}
    </Card>
    <Card gap={14} tone="soft">
      <Text variant="subtitle">2 · Confirm the context</Text>
      <Field label="Crop" value={crop} maxLength={80} editable={!loading} placeholder="e.g. Tomato" onChangeText={v => { setCrop(v); setResult(null); }} />
      <Field label="Indian state" value={region} maxLength={80} editable={!loading} placeholder="e.g. Maharashtra" onChangeText={v => { setRegion(v); setResult(null); }} />
      <Field label="What changed? (optional)" value={symptoms} maxLength={1000} editable={!loading} multiline placeholder="When it started, affected plants, recent spraying or watering…" onChangeText={v => { setSymptoms(v); setResult(null); }} />
      <Toggle value={consent} disabled={loading} onValueChange={setConsent} label="Send this photo and context to OpenAI for assessment" />
      <Text variant="meta">The backend removes photo metadata and does not save your photo or result. OpenAI receives the image and text; API data-handling policies apply. No community post or alert is created.</Text>
      <Button title={loading ? 'Assessing your photo…' : 'Assess plant photo'} icon="scan-line" loading={loading} disabled={!photo || !consent || !crop.trim() || !region.trim() || picking} onPress={() => void analyze()} />
    </Card>
    {error ? <Notice title="Assessment unavailable" tone="warning">{error}</Notice> : null}
    {result ? <>
      <Card gap={14} tone="soft">
        <Text variant="subtitle">3 · Review the assessment</Text>
        <Chip label={`${result.confidence} confidence · AI estimate, not calibrated`} />
        {result.imageQuality !== 'clear' ? <Notice tone="warning" title="A better photo is needed">{result.imageQuality === 'not_a_plant' ? 'A usable plant could not be identified.' : 'Retake the photo in daylight, with the symptoms in focus.'}</Notice> : null}
        <Text variant="strong">Visible symptoms</Text>
        {result.observedSymptoms.length ? result.observedSymptoms.map((s, i) => <Text key={i}>{s}</Text>) : <Text>No clear symptoms identified.</Text>}
        <Text variant="strong">Possible causes · not confirmed</Text>
        {result.possibleCauses.map((cause, i) => <View key={i} style={styles.stack}><Text variant="strong">{cause.condition}</Text><Text>{cause.explanation}</Text></View>)}
        <Text variant="strong">What to do next</Text>
        {result.nextSteps.map((s, i) => <Text key={i}>{s}</Text>)}
        {result.questions.map((s, i) => <Text variant="caption" key={i}>{s}</Text>)}
      </Card>
      <Card gap={14} tone="soft">
        <Text variant="subtitle">Pesticides & precautions</Text>
        <Text>{result.pesticideNotice}</Text>
        {result.pesticideOptions.map(option => <Card key={option.id} gap={10}>
          <Text variant="strong">{option.activeIngredient} · {option.formulation}</Text>
          <Text variant="caption">Label-backed discussion option for {option.condition}; expert confirmation required.</Text>
          {option.precautions.map((s, i) => <Text key={i}>{s}</Text>)}
          <Text variant="meta">Label reviewed {new Date(option.reviewedAt).toLocaleDateString()}</Text>
          <Button title="Read the official product label" variant="ghost" onPress={() => openSource(option.sourceUrl)} />
        </Card>)}
        {result.safety.map((s, i) => <Text key={i}>{s}</Text>)}
        <Button title={result.safetySource.name} variant="ghost" onPress={() => openSource(result.safetySource.url)} />
      </Card>
      <Text variant="meta">{result.limitations}</Text>
      <Text variant="meta">{`Assessed ${new Date(result.analyzedAt).toLocaleString()} · ${result.model}`}</Text>
    </> : null}
    {capability?.reviewedLabelCount === 0 ? <Text variant="meta">No reviewed pesticide label catalog is connected. Possible causes and precautions can still be assessed when OpenAI is configured; chemical recommendations will remain unavailable.</Text> : null}
  </Screen>;
}
const styles = StyleSheet.create({ photo: { width: '100%', height: 230, borderRadius: 18 }, row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' }, stack: { gap: 6 } });
