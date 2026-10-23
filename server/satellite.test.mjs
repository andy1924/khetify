import test from 'node:test';
import assert from 'node:assert/strict';
import { geometryFor, copernicusProvider } from './satellite.mjs';
import { deliverReviewedAlerts } from './pest-alerts.mjs';
test('invalid and oversized field requests rejected', () => {
  for (const p of [[], [{latitude:NaN,longitude:0}], [{latitude:0,longitude:0},{latitude:1,longitude:0},{latitude:0,longitude:1}]]) assert.throws(() => geometryFor(p));
  assert.throws(() => geometryFor([{latitude:0,longitude:0},{latitude:0,longitude:.01},{latitude:0,longitude:.02}]));
});
test('missing credentials never produces observations', async () => {
  if (process.env.CDSE_CLIENT_ID || process.env.CDSE_CLIENT_SECRET) return;
  assert.deepEqual(await copernicusProvider.getObservations([{latitude:20,longitude:75},{latitude:20.001,longitude:75},{latitude:20,longitude:75.001}]), {status:'unconfigured',observations:[]});
});
test('only reviewed, consented, nearby opted-in fields receive redacted alerts', async () => {
  const now = Date.now(), location = {latitude:20,longitude:75};
  const report = {id:'r',ownerId:'a',status:'confirmed',reviewedBy:'expert',sharingConsent:true,date:new Date(now).toISOString(),location,crop:'wheat'};
  const field = {id:'f',ownerId:'b',alertsOptIn:true,radiusKm:5,polygon:[location]};
  const messages=[];const options={now,send:async (_,m)=>messages.push(m)};
  for (const patch of [{status:'pending-review'},{status:'withdrawn'},{sharingConsent:false},{reviewedBy:null}]) assert.deepEqual(await deliverReviewedAlerts({...report,...patch},[field],options),[]);
  assert.deepEqual(await deliverReviewedAlerts(report,[{...field,alertsOptIn:false},{...field,polygon:[{latitude:25,longitude:75}]}],options),[]);
  assert.deepEqual(await deliverReviewedAlerts(report,[field],options),['f']);
  assert.equal(messages[0].location,undefined);
});
