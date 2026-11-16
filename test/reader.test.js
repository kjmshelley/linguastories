const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');

const data = path.join(__dirname, '..', 'data');
function content(url) {
  assert.ok(url.startsWith('/content/'));
  return JSON.parse(fs.readFileSync(path.join(data, url.slice('/content/'.length)), 'utf8'));
}

test('catalog, story versions and translations are linked and readable', async t => {
  const app = require('../server');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const catalog = await (await fetch(`${base}/api/reader/catalog`)).json();
  assert.equal(catalog.genres.length, 10);
  assert.equal(catalog.stories.length, 100);
  assert.equal(new Set(catalog.stories.map(s => s.id)).size, 100);
  const expectedSources = ['ar','zh-Hant','zh-Hans','es-MX','es-ES','ja','vi','th','id','fr','de','it','nl','ko','ru','tr','my','pt'];
  for (const [index, story] of catalog.stories.entries()) {
    assert.equal(story.orderId, index + 1);
    assert.equal(story.targetLanguage, 'en');
    assert.equal(story.paragraphs, undefined);
    assert.ok(story.levels.length);
    for (const level of story.levels) {
      const document = content(level.url);
      const version = document.versions.find(v => v.storyLevelId === level.storyLevelId);
      assert.equal(document.storyId, story.id);
      assert.equal(version.level, level.level);
      assert.ok(version.paragraphs.length);
      assert.equal(new Set(version.paragraphs.map(p => p.paragraphId)).size, version.paragraphs.length, story.id);
      for (const paragraph of version.paragraphs) {
        assert.ok(paragraph.sentences.length, `${story.id}: empty paragraph`);
        assert.equal(new Set(paragraph.sentences.map(s => s.sentenceId)).size, paragraph.sentences.length, story.id);
        for (const sentence of paragraph.sentences) {
          assert.ok(sentence.tokens.length, `${story.id}: empty sentence`);
          assert.equal(new Set(sentence.tokens.map(t => t.id)).size, sentence.tokens.length, story.id);
          assert.ok(sentence.tokens.every(t => typeof t.text === 'string' && t.text.length), story.id);
          assert.ok(sentence.tokens.map(t => t.text).join('').trim(), story.id);
        }
      }
      assert.equal(new Set(level.availableLanguages.map(l => l.language)).size, level.availableLanguages.length, story.id);
      if (index < 9) assert.deepEqual(level.availableLanguages.map(x => x.language).sort(), [...expectedSources].sort());
      for (const entry of level.availableLanguages) {
        const translation = content(entry.url);
        assert.equal(translation.storyId, story.id);
        assert.equal(translation.storyLevelId, level.storyLevelId);
        assert.equal(translation.sourceLanguage, entry.language);
        assert.equal(translation.paragraphs.length, version.paragraphs.length);
        for (const paragraph of translation.paragraphs) {
          assert.ok(paragraph.text.trim());
          const target = version.paragraphs.find(p => p.paragraphId === paragraph.paragraphId);
          assert.ok(target);
          for (const item of paragraph.sentences) {
            const sentence = target.sentences.find(s => s.sentenceId === item.sentenceId);
            assert.ok(sentence);
            const used = new Set();
            for (const gloss of item.glosses) {
              assert.ok(gloss.translation && gloss.tokenIds.length);
              const indices = gloss.tokenIds.map(id => sentence.tokens.findIndex(token => token.id === id));
              assert.ok(indices.every((n, i) => n >= 0 && (i === 0 || n === indices[i - 1] + 1)));
              for (const id of gloss.tokenIds) { assert.ok(!used.has(id)); used.add(id); }
            }
          }
        }
      }
    }
  }
  for (const entry of catalog.stories) {
    const response = await fetch(`${base}/api/reader/story/${encodeURIComponent(entry.id)}`);
    assert.equal(response.status, 200, entry.id);
    const story = await response.json();
    const version = content(entry.levels[0].url).versions.find(v => v.storyLevelId === story.storyLevelId);
    assert.equal(story.paragraphs.length, version.paragraphs.length, entry.id);
    for (let i = 0; i < version.paragraphs.length; i++) {
      const text = version.paragraphs[i].sentences.flatMap(s => s.tokens).map(t => t.text).join('');
      assert.equal(story.paragraphs[i].target, text, entry.id);
      assert.deepEqual(Object.keys(story.paragraphs[i].translations).sort(), [...entry.sourceLanguages].sort(), entry.id);
    }
  }
  assert.equal((await fetch(`${base}/content/catalog.json`)).status, 200);
  const first = catalog.stories[0];
  assert.equal((await fetch(base + first.levels[0].url)).status, 200);
  assert.equal((await fetch(base + first.levels[0].availableLanguages[0].url)).status, 200);
  const story = await (await fetch(`${base}/api/reader/story/01-01`)).json();
  assert.match(story.paragraphs[0].target, /^Mia wakes up early\./);
  assert.equal((await fetch(`${base}/api/reader/story/01-01?level=A1`)).status, 200);
  assert.equal((await fetch(`${base}/api/reader/story/01-01?level=C2`)).status, 404);
  assert.equal(story.paragraphs[0].translations['zh-Hant'].sentences[0].glosses[1].translation, '醒來');
  assert.ok((await (await fetch(`${base}/api/reader/search?q=birds&searchBy=target`)).json()).ids.includes('01-01'));
  assert.ok((await (await fetch(`${base}/api/reader/search?q=鳥&searchBy=source&source=zh-Hant`)).json()).ids.includes('01-01'));
  for (const route of ['/', '/library', '/library/genre/food-cafes', '/story/01-01']) assert.equal((await fetch(`${base}${route}`)).status, 200);
  for (const route of ['/reader-login', '/reader-signup', '/saved', '/api/reader/me']) assert.equal((await fetch(`${base}${route}`)).status, 404);
  const missing = await fetch(`${base}/does-not-exist`, {headers:{Accept:'text/html'}});
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /id="app"/);
  assert.equal((await fetch(`${base}/api/reader/register`, {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'})).status, 404);
});
