const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const dataDir = path.join(__dirname, '..', 'data');
const catalog = require('../data/catalog.json');
const cache = new Map();

function readContent(url) {
  if (typeof url !== 'string' || !url.startsWith('/content/')) throw new Error('Invalid content URL');
  const file = path.resolve(dataDir, url.slice('/content/'.length));
  if (!file.startsWith(dataDir + path.sep)) throw new Error('Invalid content path');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function metadata(story) {
  const version = story.levels[0];
  const base = path.join(__dirname, '..', 'client', 'assets', 'img', `story-${story.id}`);
  const ext = fs.existsSync(`${base}.webp`) ? 'webp' : fs.existsSync(`${base}.png`) ? 'png' : null;
  return {...story, level:version.level, storyLevelId:version.storyLevelId,
    sourceLanguages:version.availableLanguages.map(item=>item.language),
    image:ext ? `/assets/img/story-${story.id}.${ext}` : story.image};
}
function loadStory(story, levelId) {
  const level = levelId ? story.levels.find(v=>v.storyLevelId===levelId || v.level===levelId) : story.levels[0];
  if (!level) return null;
  const key = `${story.id}:${level.storyLevelId}`;
  if (cache.has(key)) return cache.get(key);
  const doc = readContent(level.url);
  const version = doc.versions.find(v=>v.storyLevelId===level.storyLevelId);
  if (!version) throw new Error('Story version missing');
  const paragraphs = version.paragraphs.map(p=>({
    paragraphId:p.paragraphId,
    target:p.sentences.map(sentence=>sentence.tokens.map(token=>token.text).join('')).join(''),
    sentences:p.sentences,
    ...(p.romanization ? {romanization:p.romanization} : {}),
    translations:{}
  }));
  for (const entry of level.availableLanguages) {
    const translation = readContent(entry.url);
    for (const p of translation.paragraphs) {
      const target = paragraphs.find(item=>item.paragraphId===p.paragraphId);
      if (target) target.translations[entry.language] = p;
    }
  }
  const result = {...metadata(story),level:level.level,storyLevelId:level.storyLevelId,
    sourceLanguages:level.availableLanguages.map(item=>item.language),paragraphs};
  cache.set(key,result);
  return result;
}
router.get('/catalog', (_req,res) => res.json({...catalog,stories:catalog.stories.map(metadata)}));
router.get('/story/:id', (req,res) => {
  const entry=catalog.stories.find(s=>s.id===req.params.id);
  const story=entry&&loadStory(entry,req.query.level);
  if(!story)return res.status(404).json({error:'Story not found'});
  res.json(story);
});
router.get('/search', (req,res) => {
  const term=String(req.query.q||'').trim().toLocaleLowerCase();
  if(!term)return res.json({ids:[]});
  const source=String(req.query.source||'');
  const mode=req.query.searchBy==='source'?'source':'target';
  const ids=catalog.stories.filter(entry=>{
    const story=loadStory(entry,req.query.level);
    if(!story)return false;
    const fields=mode==='target'?[story.title,story.description,...story.paragraphs.map(p=>p.target)]:story.paragraphs.map(p=>p.translations[source]?.text);
    return fields.some(value=>String(value||'').toLocaleLowerCase().includes(term));
  }).map(s=>s.id);
  res.json({ids});
});
module.exports=router;
