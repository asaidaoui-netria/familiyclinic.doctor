import assert from 'node:assert/strict';
import test from 'node:test';
import publicationData from '../src/_data/publications.js';

test('the publication library follows all 56 source IDs and four architecture categories', () => {
  const records = publicationData();
  assert.equal(records.length, 56);
  assert.equal(new Set(records.map(r => r.id)).size, 56);
  assert.deepEqual(['A','B','C','D'].map(id=>records.filter(r=>r.categoryId===id).length), [16,9,25,6]);
});

test('draft editions never create public articles or language alternates', async () => {
  const {buildLibrary} = await import('../src/lib/publication-library.js');
  const source=publicationData()[0];
  const records=structuredClone([{...source,relatedIds:[]}]);
  records[0].editions.en={...records[0].editions.fr, language:'en',status:'draft'};
  records[0].editions.ar={...records[0].editions.fr, language:'ar',status:'draft'};
  const library=buildLibrary(records);
  assert.equal(library.pages.some(p=>p.kind==='article'&&p.locale==='en'),false);
  const french=library.pages.find(p=>p.kind==='article'&&p.locale==='fr');
  assert.deepEqual(Object.keys(french.localizedRoutes),['fr']);
});

test('published Arabic editions replace legacy transitions and link to actual translations', async () => {
  const {buildLibrary}=await import('../src/lib/publication-library.js');
  const record=structuredClone({...publicationData()[0],relatedIds:[]});
  record.editions.ar={...record.editions.fr,language:'ar',status:'published',title:'التغذية والصحة',summary:'مقدمة في التغذية والصحة.',blocks:[{type:'heading',level:2,text:'مقدمة'},{type:'paragraph',text:'التغذية والصحة.'}]};
  const library=buildLibrary([record]);
  const arabic=library.pages.find(p=>p.kind==='article'&&p.locale==='ar');
  assert.ok(arabic);
  assert.match(arabic.category.title,/[\u0600-\u06ff]/);
  assert.match(arabic.author,/[\u0600-\u06ff]/);
  assert.equal(arabic.book.url,'/ar/publications/cooking-to-heal/');
  assert.equal(arabic.structuredData['@graph'][0].inLanguage,'ar');
  assert.equal(library.pages.filter(p=>p.permalink===arabic.permalink).length,1);
  for(const p of library.pages.filter(p=>p.kind==='article'))assert.equal(p.localizedRoutes.ar,arabic.permalink);
  assert.ok(library.catalogs.ar.indexable);
});

test('source blocks render escaped prose, unique heading anchors, lists and table headers', async () => {
  const {renderBlocks}=await import('../src/lib/publication-content.js');
  const rendered=renderBlocks([{type:'heading',level:2,text:'Example'},{type:'paragraph',text:'<script>alert(1)</script>'},{type:'heading',level:2,text:'Example'},{type:'list',ordered:true,items:['First','Second']},{type:'table',rows:[['Name','Value'],['A','2']]}]);
  assert.deepEqual(rendered.toc.map(h=>h.id),['example','example-2']);
  assert.match(rendered.html,/&lt;script&gt;/);
  assert.doesNotMatch(rendered.html,/<script>/);
  assert.match(rendered.html,/<ol><li>First<\/li><li>Second<\/li><\/ol>/);
  assert.match(rendered.html,/<th scope="col">Name<\/th>/);
});

test('duplicate routes and invalid publication categories stop the build',async()=>{
  const {buildLibrary}=await import('../src/lib/publication-library.js');
  const records=publicationData();
  assert.throws(()=>buildLibrary([records[0],records[0]]),/duplicate/i);
  assert.throws(()=>buildLibrary([{...records[0],categoryId:'unknown'}]),/category/i);
});

test('repeated headings cannot collide with numbered heading text',async()=>{
  const {renderBlocks}=await import('../src/lib/publication-content.js');
  const result=renderBlocks(['Example','Example','Example 2','Example'].map(text=>({type:'heading',level:2,text})));
  assert.equal(new Set(result.toc.map(h=>h.id)).size,4);
});

test('Arabic reading text isolates numeric ranges and Latin terms without accepting HTML',async()=>{
  const {renderBlocks,renderPublicationText}=await import('../src/lib/publication-content.js');
  const text=renderPublicationText('التغذية (0–12 شهرًا) وفيتامين B12 و<script>');
  assert.match(text,/<bdi dir="ltr">0–12<\/bdi>/);
  assert.match(text,/<bdi dir="ltr">B12<\/bdi>/);
  assert.doesNotMatch(text,/<script>/);
  assert.match(text,/&lt;/);
  const rendered=renderBlocks([{type:'paragraph',text:'جرعة 10–20 mg/kg مع الغذاء.'}]);
  assert.match(rendered.html,/<bdi dir="ltr">10–20 mg\/kg<\/bdi>/);
  assert.equal(renderPublicationText('English & French'),'English &amp; French');
  assert.equal(renderPublicationText('< 5,7 %','ar'),'<bdi dir="ltr">&lt; 5,7 %</bdi>');
  assert.equal(renderPublicationText('TNF‑β وAc₁','ar'),'<bdi dir="ltr">TNF‑β</bdi> و<bdi dir="ltr">Ac₁</bdi>');
  const table=renderBlocks([{type:'table',rows:[['المؤشر','القيمة'],['HbA1c','≥ 6,5 %']]}],'ar');
  assert.match(table.html,/<td><bdi dir="ltr">≥ 6,5 %<\/bdi><\/td>/);
});

test('English editions retain every source block, list item and table cell',()=>{
  for(const record of publicationData()){
    const english=record.editions.en, french=record.editions.fr;
    if(!english)continue; // Completeness of all 56 editions is asserted separately.
    assert.equal(english.sourceHash,record.source.sha256,record.id);
    assert.equal(english.translation.reviewStatus,'not-clinically-reviewed');
    const shape=b=>b.type==='table'?[b.type,b.rows.map(r=>r.length)]:b.type==='list'?[b.type,b.ordered,b.items.length,b.levels]:[b.type,b.level];
    assert.deepEqual(english.blocks.map(shape),french.blocks.map(shape),record.id);
    const text=b=>b.type==='table'?b.rows.flat():b.type==='list'?b.items:b.type==='figure'?[b.alt,b.caption]:[b.text];
    for(const block of english.blocks)for(const value of text(block))assert.ok(typeof value==='string'&&value.trim().length,record.id);
    // Detect accidentally saving a short summary in place of a full manuscript.
    const words=edition=>edition.blocks.flatMap(text).join(' ').split(/\s+/).length;
    assert.ok(words(english)>words(french)*.65,record.id+' is not abridged');
  }
});

test('Arabic editions preserve source structure, figures, numbers and translation provenance',()=>{
  const shape=b=>b.type==='table'?[b.type,b.rows.map(r=>r.length)]:b.type==='list'?[b.type,b.ordered,b.items.length,b.levels]:b.type==='figure'?[b.type,b.src,b.width,b.height]:[b.type,b.level];
  const values=b=>b.type==='table'?b.rows.flat():b.type==='list'?b.items:b.type==='figure'?[b.alt,b.caption]:[b.text];
  const numbers=b=>(values(b).join(' ').match(/\d+(?:[.,]\d+)?/g)||[]).sort();
  for(const record of publicationData()){
    const arabic=record.editions.ar,french=record.editions.fr;
    if(!arabic)continue; // The release completeness check asserts all 56 separately.
    assert.equal(arabic.language,'ar');
    assert.equal(arabic.sourceHash,record.source.sha256,record.id);
    assert.equal(arabic.translation.from,'fr');
    assert.equal(arabic.translation.reviewStatus,'not-clinically-reviewed');
    assert.deepEqual(arabic.blocks.map(shape),french.blocks.map(shape),record.id);
    for(const [index,block] of arabic.blocks.entries()){
      for(const value of values(block))assert.ok(typeof value==='string'&&value.trim(),`${record.id}/${index}`);
      assert.deepEqual(numbers(block),numbers(french.blocks[index]),`${record.id}/${index} preserves source numbers`);
    }
    const body=arabic.blocks.flatMap(values).join(' ');
    assert.ok((body.match(/[\u0621-\u064a]/g)||[]).length>(body.match(/[a-z]/gi)||[]).length,record.id+' has Arabic body text');
    const words=edition=>edition.blocks.flatMap(values).join(' ').split(/\s+/).length;
    assert.ok(words(arabic)>words(french)*.6,record.id+' has a full manuscript rather than a summary');
  }
});

test('legacy Word documents retain their original tables',()=>{
  const records=publicationData();
  assert.equal(records.find(r=>r.id==='A12').editions.fr.blocks.filter(b=>b.type==='table').length,1);
  assert.equal(records.find(r=>r.id==='C08').editions.fr.blocks.filter(b=>b.type==='table').length,2);
});

test('source list hierarchy and explanatory figures remain readable in HTML',async()=>{
  const {renderBlocks}=await import('../src/lib/publication-content.js');
  const rendered=renderBlocks([
    {type:'list',ordered:false,items:['Mechanisms','First mechanism','Second mechanism','Results'],levels:[0,1,1,0]},
    {type:'figure',src:'/assets/images/publications/C04-tender-points.webp',width:498,height:693,alt:'Front and back views',caption:'Illustration from the original article.'},
  ]);
  assert.match(rendered.html,/<li>Mechanisms<ul><li>First mechanism<\/li><li>Second mechanism<\/li><\/ul><\/li><li>Results<\/li>/);
  assert.match(rendered.html,/<figure[^>]*>[\s\S]*<img[^>]+width="498"[^>]+height="693"[\s\S]*<figcaption>Illustration from the original article\.<\/figcaption>/);
});


test('related reading connects the diabetes articles and the autoimmune category', async()=>{
  const {buildLibrary}=await import('../src/lib/publication-library.js');
  const pages=buildLibrary(publicationData()).pages.filter(p=>p.kind==='article'&&p.locale==='en');
  for(const id of ['C07','C08','C09']){
    const p=pages.find(p=>p.publication.id===id);
    for(const other of ['C07','C08','C09'].filter(other=>other!==id))assert.ok(p.related.some(r=>r.id===other));
  }
  assert.equal(pages.find(p=>p.publication.id==='C15').relatedCategory.id,'B');
});
