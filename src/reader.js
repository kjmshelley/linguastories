const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const catalog = require('../data/stories.json');
router.get('/catalog', (_req,res) => res.json({...catalog, stories: catalog.stories.map(s => {
 const base = path.join(__dirname, '..', 'client', 'assets', 'img', `story-${s.id}`);
 const ext = fs.existsSync(`${base}.webp`) ? 'webp' : fs.existsSync(`${base}.png`) ? 'png' : null;
 return {...s, image: ext ? `/assets/img/story-${s.id}.${ext}` : s.image};
})}));
module.exports=router;
