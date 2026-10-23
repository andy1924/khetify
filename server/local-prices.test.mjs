import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, partitionName } from './local-prices.mjs';
test('key-free archive parser preserves missing grade, source prices and quoted fields', () => {
  const rows = parseCsv('date,state,district,market,commodity,variety,grade,min_price,max_price,modal_price\r\n2026-07-02,State,District,"Market, East",Wheat,Other,,100,200,150\r\n');
  assert.equal(rows[0].market, 'Market, East');
  assert.equal(rows[0].grade, '');
  assert.equal(rows[0].modal_price, '150');
  assert.throws(() => parseCsv('wrong,headers\nx,y'), /schema/);
  assert.throws(() => parseCsv('"unclosed'), /unterminated/);
  assert.equal(partitionName('State', 'Wheat'), partitionName('state', 'wheat'));
  assert.ok(!partitionName('../../', 'Wheat').includes('..'));
});
