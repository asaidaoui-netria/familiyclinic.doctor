// Import the supplied English excerpt; retain the author's complete recipe text.
import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('docs/design/publications-2026-10-03/catalog.json','utf8'));
const introduction=JSON.parse(fs.readFileSync('content/publications/book-preface.json','utf8'));
const splitItems=text=>text.split(/[•]\s*/).map(s=>s.trim()).filter(Boolean);
const recipes=catalog.book.recipes.map(r=>{
  const source=r.sourceText.replace(/\s+\d+\s*$/,'').trim();
  const labels=['Health (?:Goal|Objective)','Servings','Ingredients','Preparation','Time','Benefits','Tip','Variation','Nutrition'];
  const matches=[...source.matchAll(new RegExp('  ('+labels.join('|')+')  ','gi'))];
  const sections=Object.fromEntries(matches.map((m,i)=>[m[1].toLowerCase(),source.slice(m.index+m[0].length,matches[i+1]?.index).trim()]));
  const ingredients=splitItems(sections.ingredients);
  const steps=sections.preparation.split(/\d+\)\s+/).map(s=>s.trim()).filter(Boolean);
  if(matches.length!==9||!ingredients.length||!steps.length)throw new Error('Incomplete recipe '+r.number);
  return {number:r.number,title:r.title,url:r.url.replace('pur-e','puree'),sourcePdfPage:r.pdfPage,description:`Read the ingredients and preparation for ${r.title.toLowerCase()}, a recipe excerpt from Cooking to Heal.`,goal:sections['health goal']||sections['health objective'],servings:sections.servings,ingredients,steps,time:sections.time,benefits:splitItems(sections.benefits),tip:sections.tip,variation:sections.variation,nutrition:sections.nutrition.replace(/\s+\.$/,'')};
});
const book={title:catalog.book.title,url:catalog.book.url,description:'Explore 20 complete recipe excerpts from Cooking to Heal by Dr. Said-Alaoui Moulay Abdellah, with ingredients and step-by-step instructions.',image:{src:'/assets/images/publications/book-640.webp',small:'/assets/images/publications/book-240.webp',width:640,height:906},recipes};
book.introduction=introduction;
fs.writeFileSync('content/publications/book.json',JSON.stringify(book,null,2)+'\n');
console.log(`Imported ${recipes.length} English recipes.`);
