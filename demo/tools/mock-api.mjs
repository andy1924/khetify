// Fixture backend for film capture only. Serves the app's real plant-health
// contract with fixed content so the real UI can be photographed.
import http from 'node:http';

const assessment = {
  imageQuality: 'clear',
  confidence: 'medium',
  observedSymptoms: [
    'Scattered tan spots with a dark rim on the upper leaf surface',
    'Yellowing spreading from the leaf tip inward',
    'Lower leaves affected more than new growth',
  ],
  possibleCauses: [
    { condition: 'Leaf spot', explanation: 'A fungal infection that spreads in humid, still air and shows as spots with a darker edge.' },
    { condition: 'Nitrogen stress', explanation: 'Older leaves pale from the tip first when nitrogen runs short during rapid growth.' },
    { condition: 'Water stress', explanation: 'Root-zone swings can mimic spotting when leaves wilt and recover through the day.' },
  ],
  nextSteps: [
    'Inspect several plants, including leaf undersides, stems and the edge of the affected patch. Record when symptoms started.',
    'Ask a local KVK or plant-protection officer to confirm the cause before selecting a treatment.',
    'Check irrigation, recent fertilizer use and soil-test results; nutrient and water stress can resemble infection.',
  ],
  questions: ['Did the spots appear after a spell of humid weather?', 'Was the field irrigated or fertilised in the past two weeks?'],
  pesticideNotice: 'No reviewed label matches this crop and state. Chemical options stay unavailable until a verified label is connected.',
  pesticideOptions: [],
  safety: [
    'Do not spray solely on the basis of this photo. Confirm the crop, pest or disease and the product’s current approved label.',
    'If a pesticide is needed, follow its crop-specific label, protective equipment, re-entry and pre-harvest waiting periods. Do not improvise a dose or tank mixture.',
    'Protect children, animals, pollinators and water sources. Keep products in their original labelled containers, locked away from food and feed.',
  ],
  safetySource: { name: 'Government of Meghalaya · pesticide handling', url: 'https://megagriculture.gov.in/public/pesticide_handling_default.aspx' },
  limitations: 'A photo shows visible symptoms only. Causes that look alike — infection, insects, nutrient or water stress — cannot be separated from one image.',
  analyzedAt: '2026-10-12T09:20:00.000Z',
  model: 'fixture-plant-health',
};

const cors = res => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
};
const send = (res, status, body) => { cors(res); res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/plant-health/capabilities') return send(res, 200, { configured: true, maxPhotoBytes: 5242880, reviewedLabelCount: 0 });
  if (url.pathname === '/api/plant-health') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      if (body.length > 60 * 1024 * 1024) return send(res, 413, { error: 'Photo too large.' });
      send(res, 200, assessment);
    });
    return;
  }
  send(res, 404, { error: 'Not found.' });
}).listen(8787, '127.0.0.1', () => console.log('fixture api on 8787'));
