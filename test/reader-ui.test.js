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

test('site language link opens a modal and supports selection and dismissal', async () => {
  const handlers={},saved={};let focused=false,prevented=false;
  const trigger={focus(){focused=true;}};
  const modal={open:false,showModal(){this.open=true;},close(){this.open=false;}};
  const root={innerHTML:'',addEventListener:(type,handler)=>handlers[type]=handler,querySelector:selector=>selector==='#site-language'?modal:selector==='#site-language-link'?trigger:null,querySelectorAll:()=>[]};
  const document={querySelector:selector=>selector==='#app'?root:null,documentElement:{dataset:{}},createTreeWalker:()=>({nextNode:()=>false})};
  const context={document,NodeFilter:{SHOW_TEXT:4},location:{pathname:'/',search:''},URLSearchParams,localStorage:{getItem:()=>null,setItem:(key,value)=>saved[key]=value},fetch:async()=>({ok:true,json:async()=>({genres:[],stories:[]})})};
  const script=fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  await vm.runInNewContext(`(async()=>{${script}\n})()`,context);
  assert.match(root.innerHTML,/<a href="#site-language" id="site-language-link"/);
  assert.match(root.innerHTML,/<dialog id="site-language"/);
  assert.match(root.innerHTML,/data-site-language="en"[^>]*aria-pressed="true"/);
  handlers.click({preventDefault(){prevented=true;},target:{closest:selector=>selector==='[data-action="open-language"]'?{}:null}});
  assert.ok(prevented && modal.open);
  handlers.click({target:{closest:selector=>selector==='[data-site-language]'?{dataset:{siteLanguage:'es'}}:null}});
  assert.equal(saved['site-language'],'es');
  assert.equal(document.documentElement.lang,'es');
  assert.match(root.innerHTML,/data-site-language="es"[^>]*aria-pressed="true"/);
  assert.ok(focused);
  focused=false;modal.open=true;
  handlers.keydown({key:'Escape',target:{closest:()=>null}});
  assert.equal(modal.open,false);assert.ok(focused);
  modal.open=true;
  handlers.click({target:{id:'site-language',matches:()=>true,closest:()=>null}});
  assert.equal(modal.open,false);
});

test('reader settings persist the translation default without saving per-story overrides', async () => {
  const storage={};
  const localStorage={getItem:key=>storage[key]??null,setItem:(key,value)=>{storage[key]=value;}};
  const script=fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  const story={id:'01-01',title:'Test',description:'Text',genre:'Adventure',level:'A1',image:'/image',targetLanguage:'en',sourceLanguages:['zh-Hant'],paragraphs:[{target:'Hello.',translations:{'zh-Hant':{text:'你好。'}}}]};
  async function page(pathname) {
    const handlers={};let focused=false;
    const settings={open:false,showModal(){this.open=true;},querySelector:()=>({focus(){focused=true;}})};
    const root={innerHTML:'',addEventListener:(type,handler)=>{handlers[type]=handler;},querySelector:selector=>selector==='#reader-settings'?settings:null};
    const document={querySelector:selector=>selector==='#app'?root:null,documentElement:{dataset:{}}};
    const context={document,location:{pathname,search:''},URLSearchParams,localStorage,fetch:async url=>({ok:true,json:async()=>url.includes('/story/')?story:{genres:['Adventure'],stories:[story]}})};
    await vm.runInNewContext(`(async()=>{${script}\n})()`,context);
    return {root,handlers,settings,wasFocused:()=>focused};
  }
  const home=await page('/');assert.doesNotMatch(home.root.innerHTML,/id="reader-settings"/);
  const library=await page('/library');
  assert.match(library.root.innerHTML,/<a href="#reader-settings" id="reader-settings-trigger"/);
  assert.match(library.root.innerHTML,/<span class="settings-link-label">Settings<\/span>/);
  assert.match(library.root.innerHTML,/id="reader-settings"/);
  assert.match(library.root.innerHTML,/id="always-show-translation"[^>]*checked/);
  let prevented=false;
  library.handlers.click({preventDefault(){prevented=true;},target:{closest:selector=>selector==='[data-action="open-settings"]'?{}:null}});
  assert.ok(prevented && library.settings.open);
  library.handlers.change({target:{id:'always-show-translation',checked:false}});
  assert.equal(storage['reader-always-show-translation'],'false');
  const detail=await page('/story/01-01');
  assert.match(detail.root.innerHTML,/id="reader-settings"/);
  assert.doesNotMatch(detail.root.innerHTML,/你好。/);
  assert.doesNotMatch(detail.root.innerHTML,/id="show-translation"[^>]*checked/);
  detail.handlers.change({target:{id:'show-translation',checked:true}});
  assert.match(detail.root.innerHTML,/你好。/);
  assert.equal(storage['reader-always-show-translation'],'false');
  const next=await page('/story/01-01');assert.doesNotMatch(next.root.innerHTML,/你好。/);
  next.handlers.change({target:{id:'always-show-translation',checked:true}});
  assert.equal(storage['reader-always-show-translation'],'true');
  assert.match(next.root.innerHTML,/你好。/);
  assert.ok(next.settings.open && next.wasFocused());
  const genre=await page('/library/genre/adventure');assert.match(genre.root.innerHTML,/id="reader-settings"/);
});

test('story navigation follows explicit series order and ends at the library', async () => {
  const catalog=require('../data/catalog.json');
  const root={innerHTML:'',addEventListener(){}};
  const context={document:{querySelector:()=>root,documentElement:{dataset:{}}},location:{pathname:'/',search:'?source=es-MX&level=A2'},URLSearchParams,localStorage:{getItem:()=>null},fetch:async()=>({ok:true,json:async()=>catalog})};
  const script=fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  const result=await vm.runInNewContext(`(async()=>{${script}\nconst make=id=>{const s=catalog.stories.find(item=>item.id===id);return {...s,level:'A1',sourceLanguages:['zh-Hant'],paragraphs:[]};};const first=make('01-01'),last=make('01-10'),standalone=make('02-01');return {first:story(first),last:story(last),standalone:story(standalone),next:nextStoryInSeries(first)?.id,nextUrl:nextStoryUrl(nextStoryInSeries(first)),afterLast:nextStoryInSeries(last),labels:Object.keys(siteLanguages).every(code=>nextStoryLabels[code]&&nextChapterLabels[code])};})()`,context);
  assert.equal(result.next,'01-02');
  assert.match(result.first,/Ready for the next chapter\?/);
  assert.doesNotMatch(result.first,/Ready for another little adventure/);
  assert.match(result.first,/Read next story →/);
  assert.match(result.first,/href="\/story\/01-02\?target=en&amp;source=es-MX"/);
  assert.doesNotMatch(result.nextUrl,/level=A2/);
  assert.equal(result.afterLast,null);
  assert.match(result.last,/href="\/library\?[^\"]*">Explore more stories →/);
  assert.match(result.standalone,/Explore more stories →/);
  assert.equal(result.labels,true);
});


test('story level control preserves preferences and links only available levels', async () => {
  const story={id:'01-01',title:'Test',description:'Text',genre:'Adventure',level:'A2',levels:[{level:'A1'},{level:'A2'}],image:'/image',targetLanguage:'en',sourceLanguages:[],paragraphs:[{target:'English text',translations:{}}]};
  const handlers={};
  const root={innerHTML:'',addEventListener:(type,handler)=>{handlers[type]=handler;}};
  const location={pathname:'/story/01-01',search:'?level=A2&source=ja',href:'http://localhost/story/01-01?level=A2&source=ja'};
  const context={document:{querySelector:()=>root,documentElement:{dataset:{}}},location,URL,URLSearchParams,localStorage:{getItem:()=>null},fetch:async url=>({ok:true,json:async()=>url.includes('/story/')?story:{genres:[],stories:[story]}})};
  const script=fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  await vm.runInNewContext(`(async()=>{${script}\n})()`,context);
  assert.match(root.innerHTML,/<legend>Level<\/legend>/);
  assert.match(root.innerHTML,/href="\/story\/01-01\?level=A1&amp;source=ja"[^>]*>A1<\/a>/);
  assert.match(root.innerHTML,/href="\/story\/01-01\?level=A2&amp;source=ja" aria-current="page">A2<\/a>/);
  assert.doesNotMatch(root.innerHTML,/>B1<\/a>/);
  assert.doesNotMatch(root.innerHTML,/id="show-translation"/);
  assert.match(root.innerHTML,/Translation is not available for this level yet\./);
});

test('Spanish chapters are discoverable and navigate within their series', async () => {
  const catalog=require('../data/catalog.json');
  const root={innerHTML:'',addEventListener(){}};
  const context={document:{querySelector:()=>root,documentElement:{dataset:{}}},location:{pathname:'/',search:'?target=es-MX&source=en'},URLSearchParams,localStorage:{getItem:()=>null},fetch:async()=>({ok:true,json:async()=>catalog})};
  const script=fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  const result=await vm.runInNewContext(`(async()=>{${script}\nconst first=catalog.stories.find(s=>s.id==='es-mx-01-01');return {ids:filteredStories().map(s=>s.id),next:nextStoryInSeries(first)?.id,url:nextStoryUrl(nextStoryInSeries(first))};})()`,context);
  assert.equal(result.ids.length,10);
  assert.ok(result.ids.includes('es-mx-01-01'));
  assert.equal(result.next,'es-mx-01-02');
  assert.equal(result.url,'/story/es-mx-01-02?target=es-MX&source=en');
});

test('Indonesian chapters are discoverable and navigate within their series', async () => {
  const catalog=require('../data/catalog.json');
  const root={innerHTML:'',addEventListener(){}};
  const context={document:{querySelector:()=>root,documentElement:{dataset:{}}},location:{pathname:'/',search:'?target=id&source=en'},URLSearchParams,localStorage:{getItem:()=>null},fetch:async()=>({ok:true,json:async()=>catalog})};
  const script=fs.readFileSync(require.resolve('../client/reader/reader.js'),'utf8');
  const result=await vm.runInNewContext(`(async()=>{${script}\nconst first=catalog.stories.find(s=>s.id==='id-01-01');return {ids:filteredStories().map(s=>s.id),next:nextStoryInSeries(first)?.id,url:nextStoryUrl(nextStoryInSeries(first))};})()`,context);
  assert.equal(result.ids.length,10);
  assert.ok(result.ids.includes('id-01-01'));
  assert.equal(result.next,'id-01-02');
  assert.equal(result.url,'/story/id-01-02?target=id&source=en');
});
