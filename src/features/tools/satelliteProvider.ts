import { apiBase, connectionError } from '../../lib/api';
export { apiBase } from '../../lib/api';

export type Point = { latitude: number; longitude: number };
export type FieldPolygon = Point[];
export type RegisteredField = { id: string; name: string; polygon: FieldPolygon; crop: string; sowingDate: string; alertsOptIn: boolean; shareApproximate: boolean; radiusKm: number };
export type PestReport = { id: string; fieldId: string; crop: string; date: string; notes: string; status: 'pending-review' | 'withdrawn' };
export interface SatelliteObservation {
  imageUrl?: string;
  imageError?: string;
  capturedAt: string; source: string; cloudPercent: number | null; fieldCoveragePercent: number | null;
  confidence: 'low' | 'moderate'; summary: string; ndvi: number | null;
}
export type ObservationResult = { status: 'ready' | 'unconfigured' | 'no-coverage'; observations: SatelliteObservation[] };
export interface FieldMonitoringProvider { readonly id: string; getObservations(polygon: FieldPolygon): Promise<ObservationResult> }
export const fieldMonitoringProvider: FieldMonitoringProvider = {
  id: 'copernicus-sentinel-2',
  async getObservations(polygon) {
    if (!apiBase) return { status: 'unconfigured', observations: [] };
    let response: Response;
    try {
      response = await fetch(`${apiBase}/api/field-observations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ polygon }), signal: AbortSignal.timeout(90000) });
    } catch { throw new Error(connectionError()); }
    if (!response.ok) throw new Error(response.status === 400 ? 'The field boundary was rejected. Check its corners and try again.' : 'The satellite provider could not complete this request. Please retry shortly.');
    return response.json();
  },
};
export function validDate(value: string) { const date = new Date(value); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10); }
