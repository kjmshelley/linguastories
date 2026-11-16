const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('reader selects translations independently and displays target romanization', async () => {
  const story = {id:'01-01',title:'Test',description:'Description',genre:'Adventure',level:'A1',image:'/image',targetLanguage:'ja',sourceLanguages:['en','es-MX'],paragraphs:[{target:'TARGET',romanization:'TARGET ROMANIZATION',translations:{en:{text:'ENGLISH TRANSLATION'},'es-MX':{text:'SPANISH TRANSLATION'}}}]};
  const handlers = {};
  const root = {innerHTML:'',addEventListener:(type, handler)=>{handlers[type]=handler;}};
  const location = {pathname:'/story/01-01', search:'?source=en', href:'http://localhost/story/01-01?source=en'};
  const document = {querySelector:()=>root,documentElement:{dataset:{}}};
  const history = {replaceState(_state,_title,url){location.href=String(url); location.search=new URL(location.href).search;}};
  const context = {document,location,history,URL,URLSearchParams,localStorage:{getItem:()=>null,setItem(){}},fetch:async url=>({ok:true,json:async()=>url.includes('/story/')?story:{genres:['Adventure'],stories:[story]}})};
  const script = fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  await vm.runInNewContext(`(async()=>{${script}\n})()`, context);
  assert.match(root.innerHTML,/TARGET/);
  assert.match(root.innerHTML,/ENGLISH TRANSLATION/);
  assert.doesNotMatch(root.innerHTML,/SPANISH TRANSLATION/);
  assert.match(root.innerHTML,/Show Romanization/);
  handlers.change({target:{id:'story-source',value:'es-MX'}});
  assert.match(root.innerHTML,/SPANISH TRANSLATION/);
  assert.doesNotMatch(root.innerHTML,/ENGLISH TRANSLATION/);
  handlers.click({target:{closest:selector=>selector==='[data-action="roman"]'?{}:null}});
  assert.match(root.innerHTML,/TARGET ROMANIZATION/);
  handlers.change({target:{id:'show-translation',checked:false}});
  assert.match(root.innerHTML,/<p lang="ja" dir="auto">TARGET<\/p>/);
  assert.doesNotMatch(root.innerHTML,/SPANISH TRANSLATION/);
  assert.doesNotMatch(root.innerHTML,/id="story-source"/);
  handlers.change({target:{id:'show-translation',checked:true}});
  assert.match(root.innerHTML,/SPANISH TRANSLATION/);
  assert.match(root.innerHTML,/id="story-source"/);
});

test('site localization leaves story text untouched', async () => {
  const storyText = {nodeValue:'Show translation',parentElement:{closest:()=>true}};
  const interfaceText = {nodeValue:'Show translation',parentElement:{closest:()=>false}};
  const root = {innerHTML:'',addEventListener(){},querySelectorAll:()=>[]};
  const document = {querySelector:()=>root,documentElement:{dataset:{}},createTreeWalker(){const nodes=[interfaceText,storyText];let i=0;return {currentNode:null,nextNode(){this.currentNode=nodes[i++];return !!this.currentNode;}}}};
  const context = {document,NodeFilter:{SHOW_TEXT:4},location:{pathname:'/',search:''},URLSearchParams,localStorage:{getItem:key=>key==='site-language'?'es':null,setItem(){}},fetch:async()=>({ok:true,json:async()=>({genres:[],stories:[]})})};
  const script = fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  await vm.runInNewContext(`(async()=>{${script}\n})()`, context);
  assert.equal(interfaceText.nodeValue,'Mostrar traducción');
  assert.equal(storyText.nodeValue,'Show translation');
  assert.equal(document.documentElement.lang,'es');
});

test('every supported site language covers the interface', async () => {
  const root = {innerHTML:'',addEventListener(){}};
  const document = {querySelector:()=>root,documentElement:{dataset:{}}};
  const context = {document,location:{pathname:'/',search:''},URLSearchParams,localStorage:{getItem:()=>null},fetch:async()=>({ok:true,json:async()=>({genres:[],stories:[]})})};
  const script = fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  const tables = await vm.runInNewContext(`(async()=>{${script}\nreturn {translations,siteLanguages};})()`, context);
  const keys = require('./interface-strings.json');
  for (const code of Object.keys(tables.siteLanguages).filter(code=>code!=='en')) {
    for (const key of keys) assert.ok(tables.translations[code]?.[key], `${code} missing ${key}`);
  }
});

test('each site language translates interface text without changing story text', async () => {
  const locales = ['ar','zh-Hant','zh-Hans','es','ja','vi','th','id','fr','de','it','nl','ko','ru','tr','my','pt'];
  const script = fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  for (const locale of locales) {
    const ui = {nodeValue:'Browse stories',parentElement:{closest:()=>false}};
    const story = {nodeValue:'Browse stories',parentElement:{closest:()=>true}};
    const root = {innerHTML:'',addEventListener(){},querySelectorAll:()=>[]};
    const document = {querySelector:()=>root,documentElement:{dataset:{}},createTreeWalker(){const nodes=[ui,story];let i=0;return {currentNode:null,nextNode(){this.currentNode=nodes[i++];return !!this.currentNode;}}}};
    const context = {document,NodeFilter:{SHOW_TEXT:4},location:{pathname:'/',search:''},URLSearchParams,localStorage:{getItem:key=>key==='site-language'?locale:null},fetch:async()=>({ok:true,json:async()=>({genres:[],stories:[]})})};
    await vm.runInNewContext(`(async()=>{${script}\n})()`,context);
    assert.notEqual(ui.nodeValue,'Browse stories',locale);
    assert.equal(story.nodeValue,'Browse stories',locale);
    assert.equal(document.documentElement.lang,locale);
  }
});

test('library cards flag a different target language', async () => {
  const root={innerHTML:'',addEventListener(){}};
  const document={querySelector:()=>root,documentElement:{dataset:{}}};
  const context={document,location:{pathname:'/',search:''},URLSearchParams,localStorage:{getItem:()=>null},fetch:async()=>({ok:true,json:async()=>({genres:[],stories:[]})})};
  const script=fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  const result=await vm.runInNewContext(`(async()=>{${script}\nconst sample={id:'01',title:'Example',description:'Text',genre:'Adventure',level:'A1',image:'/x',targetLanguage:'en-US'}; interfaceLanguage='en';const matching=card(sample);interfaceLanguage='fr';const different=card(sample);return {matching,different,traditionalMatchesSimplified:(interfaceLanguage='zh-Hant',siteMatchesTarget('zh-Hans'))};})()`,context);
  assert.doesNotMatch(result.matching,/card-language-notice/);
  assert.match(result.different,/card-language-notice/);
  assert.match(result.different,/Cette histoire est en/);
  assert.equal(result.traditionalMatchesSimplified,false);
});

test('site language choices retain their native names in every interface language', async () => {
  const root={innerHTML:'',addEventListener(){},querySelectorAll:()=>[]};
  const document={querySelector:()=>root,documentElement:{dataset:{}},createTreeWalker:()=>({nextNode:()=>false})};
  const context={document,NodeFilter:{SHOW_TEXT:4},location:{pathname:'/',search:''},URLSearchParams,localStorage:{getItem:key=>key==='site-language'?'fr':null},fetch:async()=>({ok:true,json:async()=>({genres:[],stories:[]})})};
  const script=fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  await vm.runInNewContext(`(async()=>{${script}\n})()`,context);
  for (const name of ['العربية','English','繁體中文','简体中文','日本語','한국어','Русский','Türkçe','မြန်မာဘာသာ']) assert.ok(root.innerHTML.includes(name),name);
});

test('story translation options use sorted native names independently of site language', async () => {
  const root={innerHTML:'',addEventListener(){}};
  const context={document:{querySelector:()=>root,documentElement:{dataset:{}}},location:{pathname:'/',search:''},URLSearchParams,localStorage:{getItem:()=>null},fetch:async()=>({ok:true,json:async()=>({genres:[],stories:[]})})};
  const script=fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  const options=await vm.runInNewContext(`(async()=>{${script}\nconst codes=['ja','es-MX','ar','zh-Hant','es-ES'];interfaceLanguage='en';const english=languageOptions(codes,'ja');interfaceLanguage='fr';return {english,french:languageOptions(codes,'ja')};})()`,context);
  assert.equal(options.english,options.french);
  assert.match(options.english,/>日本語<\/option>/);
  assert.match(options.english,/>العربية<\/option>/);
  assert.match(options.english,/>Español \(México\)<\/option>/);
  assert.match(options.english,/value="ja"[^>]*selected/);
  const names=[...options.english.matchAll(/>([^<]+)<\/option>/g)].map(m=>m[1]);
  assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b,'en')));
});

test('library preference language options use the shared sorted native names', async () => {
  const root={innerHTML:'',addEventListener(){}};
  const context={document:{querySelector:()=>root,documentElement:{dataset:{}}},location:{pathname:'/',search:'?source=ja&searchBy=source'},URLSearchParams,localStorage:{getItem:()=>null},fetch:async()=>({ok:true,json:async()=>({genres:[],stories:[]})})};
  const script=fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  const markup=await vm.runInNewContext(`(async()=>{${script}\nreturn filters();})()`,context);
  assert.match(markup,/<select id="preference-language">/);
  assert.match(markup,/value="ja"[^>]*selected>日本語<\/option>/);
  assert.match(markup,/>العربية<\/option>/);
  assert.match(markup,/>Español \(México\)<\/option>/);
});

test('home header omits the library link and search control', async () => {
  const root={innerHTML:'',addEventListener(){}};
  const context={document:{querySelector:()=>root,documentElement:{dataset:{}}},location:{pathname:'/',search:''},URLSearchParams,localStorage:{getItem:()=>null},fetch:async()=>({ok:true,json:async()=>({genres:[],stories:[]})})};
  const script=fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  const markup=await vm.runInNewContext(`(async()=>{${script}\nreturn header();})()`,context);
  assert.doesNotMatch(markup,/Explore stories/);
  assert.doesNotMatch(markup,/header-search/);
  assert.match(markup,/id="site-language"/);
});

test('word and phrase glosses render as clickable units without changing the sentence', async () => {
  const root={innerHTML:'',addEventListener(){}};
  const context={document:{querySelector:()=>root,documentElement:{dataset:{}}},location:{pathname:'/',search:''},URLSearchParams,localStorage:{getItem:()=>null},fetch:async()=>({ok:true,json:async()=>({genres:[],stories:[]})})};
  const script=fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  const html=await vm.runInNewContext(`(async()=>{${script}\nreturn renderTargetParagraph({target:'Mia wakes up.',sentences:[{sentenceId:'s1',tokens:[{id:'t1',text:'Mia'},{id:'t2',text:' wakes'},{id:'t3',text:' up'},{id:'t4',text:'.'}]}],translations:{'zh-Hant':{sentences:[{sentenceId:'s1',glosses:[{tokenIds:['t2','t3'],translation:'醒來',romanization:'xǐnglái'}]}]}}},'zh-Hant');})()`,context);
  assert.match(html,/Mia /);
  assert.match(html,/>wakes up<\/button>/);
  assert.match(html,/醒來/);
  assert.match(html,/xǐnglái/);
  assert.match(html,/hidden/);
  assert.match(html,/<\/span>\./);
});

test('gloss button toggles its popup and Escape closes it', async () => {
  const handlers={};
  const popup={hidden:true};
  const button={nextElementSibling:popup,attributes:{'aria-expanded':'false'},setAttribute(key,value){this.attributes[key]=value;},getAttribute(key){return this.attributes[key];}};
  const root={innerHTML:'',addEventListener:(type,handler)=>handlers[type]=handler,querySelectorAll:()=>button.attributes['aria-expanded']==='true'?[button]:[]};
  const context={document:{querySelector:()=>root,documentElement:{dataset:{}}},location:{pathname:'/',search:''},URLSearchParams,localStorage:{getItem:()=>null},fetch:async()=>({ok:true,json:async()=>({genres:[],stories:[]})})};
  const script=fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  await vm.runInNewContext(`(async()=>{${script}\n})()`,context);
  const target={closest:selector=>selector==='[data-action="gloss"]'?button:null};
  handlers.click({target});
  assert.equal(popup.hidden,false);
  assert.equal(button.attributes['aria-expanded'],'true');
  handlers.keydown({key:'Escape',target});
  assert.equal(popup.hidden,true);
  assert.equal(button.attributes['aria-expanded'],'false');
});

test('library filters source languages within the selected story level', async () => {
  const root={innerHTML:'',addEventListener(){}};
  const story={id:'01',title:'Test',description:'Text',genre:'Adventure',level:'A1',targetLanguage:'en',sourceLanguages:['zh-Hant'],image:'/x',levels:[{level:'A1',availableLanguages:[{language:'zh-Hant'}]},{level:'A2',availableLanguages:[{language:'es-MX'}]}]};
  const context={document:{querySelector:()=>root,documentElement:{dataset:{}}},location:{pathname:'/',search:'?level=A2&searchBy=source&source=es-MX'},URLSearchParams,localStorage:{getItem:()=>null},fetch:async()=>({ok:true,json:async()=>({genres:['Adventure'],stories:[story]})})};
  const script=fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  const result=await vm.runInNewContext(`(async()=>{${script}\nreturn {ids:filteredStories().map(s=>s.id),markup:card(catalog.stories[0])};})()`,context);
  assert.equal(result.ids.join(','),'01');
  assert.match(result.markup,/A2/);
});
