import type { Point } from './satelliteProvider';

/** A 500 m sample around the GPS fix, not a registered farm boundary. */
export function locationArea(point: Point): Point[] {
  const { latitude, longitude } = point;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 6 || latitude > 38 || longitude < 68 || longitude > 98) throw new Error('Satellite coverage in this app is currently limited to India.');
  const dy = 250 / 111320, dx = 250 / (111320 * Math.cos(latitude * Math.PI / 180));
  return [{ latitude: latitude - dy, longitude: longitude - dx }, { latitude: latitude - dy, longitude: longitude + dx },
    { latitude: latitude + dy, longitude: longitude + dx }, { latitude: latitude + dy, longitude: longitude - dx }];
}

/** Real, undated imagery for display only; never a source of NDVI readings. */
export function satelliteBasemap(polygon: Point[]) {
  const xs = polygon.map(p => p.longitude), ys = polygon.map(p => p.latitude);
  const latitude = (Math.min(...ys) + Math.max(...ys)) / 2, longitude = (Math.min(...xs) + Math.max(...xs)) / 2;
  const lonMeters = 111320 * Math.cos(latitude * Math.PI / 180);
  const half = Math.max(300, (Math.max(...xs) - Math.min(...xs)) * lonMeters * .7, (Math.max(...ys) - Math.min(...ys)) * 111320 * .7);
  const bounds = { west: longitude - half / lonMeters, east: longitude + half / lonMeters, south: latitude - half / 111320, north: latitude + half / 111320 };
  const query = new URLSearchParams({ bbox: [bounds.west, bounds.south, bounds.east, bounds.north].join(','), bboxSR: '4326', imageSR: '4326', size: '768,768', format: 'jpg', f: 'image' });
  return { url: `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?${query}`, bounds };
}
