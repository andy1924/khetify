import { apiBase, connectionError } from '../../lib/api';
export { apiBase } from '../../lib/api';

export type Point = { latitude: number; longitude: number };
export type FieldPolygon = Point[];
export type RegisteredField = { id: string; name: string; polygon: FieldPolygon; crop: string; sowingDate: string; alertsOptIn: boolean; shareApproximate: boolean; radiusKm: number };
export type PestReport = { id: string; fieldId: string; crop: string; date: string; notes: string; status: 'pending-review' | 'withdrawn' };
export interface SatelliteObservation {
  imageUrl?: string;
  imageError?: string;
  imageBounds?: { west: number; south: number; east: number; north: number };
  capturedAt: string; source: string; cloudPercent: number | null; fieldCoveragePercent: number | null;
  confidence: 'low' | 'moderate'; summary: string; ndvi: number | null;
}
export type ObservationResult = { status: 'ready' | 'unconfigured' | 'no-coverage'; observations: SatelliteObservation[]; cached?: boolean; fetchedAt?: string; expiresAt?: number };
export interface FieldMonitoringProvider { readonly id: string; getObservations(polygon: FieldPolygon, refresh?: boolean): Promise<ObservationResult> }
export const fieldMonitoringProvider: FieldMonitoringProvider = {
  id: 'copernicus-sentinel-2',
  async getObservations(polygon, refresh = false) {
    if (!apiBase) return { status: 'unconfigured', observations: [] };
    let response: Response;
    try {
      response = await fetch(`${apiBase}/api/field-observations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ polygon, refresh }), signal: AbortSignal.timeout(90000) });
    } catch { throw new Error(connectionError()); }
    if (!response.ok) throw new Error(response.status === 400 ? 'The field boundary was rejected. Check its corners and try again.' : 'The satellite provider could not complete this request. Please retry shortly.');
    const data: ObservationResult = await response.json();
    if (!Array.isArray(data.observations)) throw new Error('Satellite response was incomplete. Please refresh.');
    // Reject invalid upstream values; never clamp them into a plausible reading.
    data.observations = data.observations.map(o => o.ndvi === null || (Number.isFinite(o.ndvi) && o.ndvi >= -1 && o.ndvi <= 1)
      ? o : { ...o, ndvi: null, confidence: 'low', summary: 'Invalid vegetation index rejected. Refresh or inspect the field.' });
    return data;
  },
};
export function validDate(value: string) { const date = new Date(value); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10); }
