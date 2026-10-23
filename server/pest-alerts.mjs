// Call only from a trusted, authenticated review worker with persisted reports and recipients.
// No public endpoint permits farmers or image models to mark reports confirmed.
export async function deliverReviewedAlerts(report, fields, { send, now = Date.now() }) {
  if (report.status !== 'confirmed' || !report.reviewedBy || !report.sharingConsent || !report.location || !Number.isFinite(Date.parse(report.date)) || now - Date.parse(report.date) > 7 * 86400000 || Date.parse(report.date) > now) return [];
  const radians = n => n * Math.PI / 180;
  const distance = (a,b) => {
    const dLat = radians(a.latitude-b.latitude), dLon = radians(a.longitude-b.longitude);
    const h = Math.sin(dLat/2)**2 + Math.cos(radians(a.latitude))*Math.cos(radians(b.latitude))*Math.sin(dLon/2)**2;
    return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  };
  const sent = [];
  for (const field of fields) {
    if (!field.alertsOptIn || field.ownerId === report.ownerId || !field.polygon?.length || !Number.isFinite(field.radiusKm) || field.radiusKm < 1 || field.radiusKm > 50) continue;
    // Entire field must be inside radius; conservative selection avoids overbroadcasting.
    if (!field.polygon.every(p => distance(p, report.location) <= field.radiusKm)) continue;
    await send(field.ownerId, { id: `${report.id}:${field.id}`, reportDate: report.date, status: 'confirmed', confidence: report.confidence || 'reviewed', crop: report.crop,
      message: 'A reviewed pest concern was reported nearby. Inspect your crop and contact a local agricultural extension officer. This alert is not a diagnosis or pesticide recommendation.' });
    sent.push(field.id);
  }
  return sent;
}
