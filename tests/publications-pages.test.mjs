import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import test from 'node:test';
import publicationData from '../src/_data/publications.js';
import {buildLibrary} from '../src/lib/publication-library.js';
import {outputPath,readOutput} from './helpers/site.mjs';
const library=buildLibrary(publicationData());

test('the complete collection has all 56 full articles in English, French and Arabic',()=>{
  for(const locale of ['en','fr','ar'])assert.equal(library.pages.filter(p=>p.kind==='article'&&p.locale===locale).length,56,locale);
  assert.equal(library.pages.filter(p=>p.kind==='transition').length,0,'Complete Arabic editions replace every legacy transition');
});

test('the directory and categories expose ordinary links in architecture order',async()=>{
  for(const locale of ['en','fr','ar']){
    const catalog=library.catalogs[locale];
    const html=await readOutput(catalog.outputPath);
    let position=-1;
    for(const category of catalog.categories){
      const next=html.indexOf(`href="${category.url}"`,position+1);
      assert.ok(next>position,category.title);position=next;
      const categoryPage=await readOutput(category.url.slice(1)+'index.html');
      for(const a of category.articles)assert.ok(categoryPage.includes(`href="${a.url}"`));
    }
    assert.doesNotMatch(html,/type="search"|data-publication-filter/);
  }
});

test('every article renders its complete source body, contents and provenance without JavaScript',async()=>{
  for(const page of library.pages.filter(p=>p.kind==='article')){
    const html=await readOutput(page.outputPath);
    assert.ok(html.includes(page.body),`${page.permalink} includes every source block`);
    assert.match(html,/class="publication-prose"/);
    for(const heading of page.toc)assert.ok(html.includes(`href="#${heading.id}"`),heading.id);
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(ids.length,new Set(ids).size,`${page.permalink} has unique anchors`);
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
    assert.doesNotMatch(html,/class="publication-source"/);
  }
});

test('all recipes have real ingredients, full instructions, and book navigation',async()=>{
  const recipes=library.pages.filter(p=>p.kind==='recipe');
  assert.equal(recipes.length,60);
  assert.equal(recipes.filter(page=>page.locale==='ar').length,20);
  for(const page of recipes){
    const html=await readOutput(page.outputPath);
    assert.match(html,/id="ingredients"/);assert.match(html,/id="preparation"/);
    assert.ok(page.recipe.steps.length>=3);assert.ok(page.recipe.ingredients.length>=3);
    assert.ok(html.includes(`href="${page.book.url}"`));
    assert.match(html,/data-print-recipe/);
  }
});

test('French remains available across the directory, all articles, book and recipe pages',async()=>{
  assert.equal(library.pages.filter(page=>page.kind==='article'&&page.locale==='fr').length,56);
  const book=library.pages.find(page=>page.kind==='book'&&page.locale==='fr');
  assert.ok(book,'The French cookbook has its own route');
  assert.equal(book.permalink,'/fr/publications/cooking-to-heal/');
  const html=await readOutput(book.outputPath);
  assert.match(html,/Cuisiner pour guérir/);
  assert.match(html,/Lire la préface de l’auteur/);
  assert.ok(html.includes(book.introduction));
  assert.equal(book.book.recipes.length,20);
  for(const page of library.pages.filter(page=>['book','recipe'].includes(page.kind))){
    const frRoute=page.localizedRoutes.fr;
    assert.ok(frRoute,`${page.permalink} offers French`);
    assert.ok((await readOutput(page.outputPath)).includes(`href="${frRoute}" data-lang="fr"`));
  }
});

test('publication routes ship no PDF viewer or embedded document runtime',async()=>{
  for(const page of library.pages){
    const html=await readOutput(page.outputPath);
    assert.doesNotMatch(html,/pdfjs|publication-viewer|<iframe|<embed|<object|data-pdf|\.pdf(?:"|\?)/i,page.permalink);
  }
  for(const asset of ['assets/publication-viewer.js','assets/publication-catalog.js','assets/vendor/pdfjs/pdf.min.mjs'])assert.equal(existsSync(outputPath(asset)),false);
});

test('published pages expose correct metadata; transitions stay out of indexing and alternates',async()=>{
  const sitemap=await readOutput('sitemap.xml');
  for(const page of library.pages){
    const html=await readOutput(page.outputPath);
    assert.ok(html.includes(`rel="canonical" href="https://www.familyclinic.doctor${page.permalink}"`));
    assert.equal(sitemap.includes(`<loc>https://www.familyclinic.doctor${page.permalink}</loc>`),page.indexable);
    for(const [locale,url] of Object.entries(page.localizedRoutes))assert.ok(html.includes(`hreflang="${locale}" href="https://www.familyclinic.doctor${url}"`));
    if(page.kind==='transition'){
      assert.match(html,/noindex, follow/);assert.doesNotMatch(html,/hreflang=/);
    }else{
      const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
      const graph=schemas.find(s=>s['@graph'])?.['@graph'];assert.ok(graph,page.permalink);
      assert.equal(graph[0]['@type'],['article','recipe'].includes(page.kind)?'Article':'CollectionPage');
      assert.equal(graph[1]['@type'],'BreadcrumbList');
      assert.equal(new Set(graph[1].itemListElement.map(i=>i.item)).size,graph[1].itemListElement.length);
      assert.equal(graph[0].dateModified,undefined,'No invented review date');
      assert.equal(graph[0].inLanguage,page.locale);
      for(const [locale,url] of Object.entries(page.localizedRoutes)){
        const equivalent=library.pages.find(other=>other.permalink===url);
        assert.ok(equivalent?.indexable,`${page.permalink} links to a published ${locale} equivalent`);
        assert.equal(equivalent.localizedRoutes[page.locale],page.permalink,'Language alternates are reciprocal');
      }
    }
  }
});


test('the book preface and explanatory figure are preserved in the built content',async()=>{
  const book=library.pages.find(p=>p.kind==='book');
  const html=await readOutput(book.outputPath);
  assert.ok(html.includes(book.introduction));
  assert.match(html,/Read the author’s preface/);
  for(const p of library.pages.filter(p=>p.kind==='article'&&p.publication.id==='C04'))assert.match(await readOutput(p.outputPath),/class="publication-figure"/);
});

test('the requested guidance and source panels are absent',async()=>{
  for(const p of library.pages){
    const html=await readOutput(p.outputPath);
    assert.doesNotMatch(html,/class="publication-(?:guide|count-label|source)"/);
    assert.doesNotMatch(html,/A guide to the collection|shown in the collection’s reading order|Sources and review/);
  }
});

test('Arabic book pages use the supplied edition and keep navigation and visible labels in Arabic',async()=>{
  const book=library.pages.find(page=>page.kind==='book'&&page.locale==='ar');
  assert.equal(book.book.source.language,'ar');
  const bookHtml=await readOutput(book.outputPath);
  assert.ok(bookHtml.includes(book.introduction));
  assert.match(bookHtml,/اقرأ مقدمة المؤلف/);
  assert.match(bookHtml,/book-ar-640\.webp/);
  assert.doesNotMatch(bookHtml,/Read the author|Recipe \d|Cooking to Heal/);
  const recipe=library.pages.find(page=>page.kind==='recipe'&&page.locale==='ar'&&page.recipe.number===1);
  assert.equal(recipe.recipe.sourcePdfPage,15);
  assert.ok(recipe.recipe.ingredients.includes('100 مل من اللبن النباتي (مثل لبن جوز الهند أو الصويا)'));
  for(const page of library.pages.filter(page=>page.kind==='recipe'&&page.locale==='ar')){
    const html=await readOutput(page.outputPath);
    assert.match(html,/المكونات|طريقة التحضير/);
    assert.doesNotMatch(html,/The author’s nutrition notes|Health goal|>Benefits<|>Nutrition</);
    assert.ok(html.includes(`href="${book.permalink}"`));
  }
});
