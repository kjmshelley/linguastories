const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');

test('catalog and public reader routes', async t => {
  const app = require('../server');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const catalog = await (await fetch(`${base}/api/reader/catalog`)).json();
  assert.equal(catalog.genres.length, 10);
  assert.equal(catalog.stories.length, 100);
  assert.equal(new Set(catalog.stories.map(s => s.id)).size, 100);
  assert.ok(catalog.stories.every(s => s.targetLanguage === 'en' && s.sourceLanguages.includes('zh-Hant') && s.paragraphs.every(p => p.target && p.translations['zh-Hant']?.text && p.translations['zh-Hant']?.romanization && !p.romanization)));
  assert.ok(catalog.stories.every(s => s.sourceLanguages.every(code => s.paragraphs.every(p => p.translations[code]?.text))));
  const first = catalog.stories.find(s => s.id === '01-01');
  const expectedSources = ['ar','zh-Hant','zh-Hans','es-MX','es-ES','ja','vi','th','id','fr','de','it','nl','ko','ru','tr','my','pt'];
  assert.deepEqual([...first.sourceLanguages].sort(), expectedSources.sort());
  assert.equal(first.paragraphs.length, 3);
  assert.ok(expectedSources.every(code => first.paragraphs.every(p => p.translations[code]?.text?.trim())));

  for (const route of ['/', '/library', '/library/genre/food-cafes', '/story/01-01']) {
    assert.equal((await fetch(`${base}${route}`)).status, 200);
  }
  for (const route of ['/reader-login', '/reader-signup', '/saved', '/api/reader/me']) {
    assert.equal((await fetch(`${base}${route}`)).status, 404);
  }
  const missing = await fetch(`${base}/does-not-exist`, {headers:{Accept:'text/html'}});
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /id="app"/);
  assert.equal((await fetch(`${base}/api/reader/register`, {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'})).status, 404);
});
