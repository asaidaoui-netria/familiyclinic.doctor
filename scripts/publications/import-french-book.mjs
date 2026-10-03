// Import complete recipe excerpts from the supplied French book edition.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const books=JSON.parse(fs.readFileSync('.publication-work/design-audit/books.json','utf8'));
const source=books.find(book=>book.folder==='Livre cuisiner pour guérir FR');
const english=JSON.parse(fs.readFileSync('content/publications/book.json','utf8'));
const introduction=JSON.parse(fs.readFileSync('content/publications/book-preface-fr.json','utf8'));
const sourcePath='.playwright-mcp/publications-source/Publications family clinic/Extrait du livre cuisiner pour guérir/Livre cuisiner pour guérir FR/Livre cuisiner pour guérir FR-pdf.pdf';
const clean=text=>text.replace(/\s+/g,' ').replace(/\s+\./g,'.').replace(/\.\s*\.$/,'.').trim();
const splitItems=text=>text.split(/[•]\s*/).map(clean).filter(Boolean);
const recipes=[];
for(const [index,page] of source.pages.entries()){
  const header=page.match(/^Recette\s+(?:n°)?(\d+)\s{2,}(.+?)\s{2,}Objectif santé/);
  if(!header)continue;
  const number=Number(header[1]);
  const reference=english.recipes.find(recipe=>recipe.number===number);
  const text=page.replace(/\s+\d+\s*$/,'');
  const labels=['Objectif santé','Portions','Ingrédients','Préparation','Temps','Bienfaits','Astuce','Variante','Nutrition'];
  const matches=[...text.matchAll(new RegExp('  ('+labels.join('|')+')  ','g'))];
  const sections=matches.map((match,i)=>text.slice(match.index+match[0].length,matches[i+1]?.index).trim());
  if(matches.length!==9||!reference)throw new Error('Incomplete French recipe '+number);
  const title=clean(header[2]);
  recipes.push({number,title,url:'/fr'+reference.url,sourcePdfPage:index+1,
    printedPage:Number(page.match(/\s+(\d+)\s*$/)[1]),
    description:`Découvrez les ingrédients et les étapes de préparation : ${title}. Une recette extraite de Cuisiner pour guérir.`,
    goal:clean(sections[0]),servings:clean(sections[1]),ingredients:splitItems(sections[2]),
    steps:sections[3].split(/\d+\)\s+/).map(clean).filter(Boolean),time:clean(sections[4]),
    benefits:splitItems(sections[5]),tip:clean(sections[6]),variation:clean(sections[7]),nutrition:clean(sections[8]),
  });
}
if(recipes.length!==20)throw new Error(`Expected 20 French recipes; received ${recipes.length}`);
const book={language:'fr',title:'Cuisiner pour guérir',url:'/fr/publications/cooking-to-heal/',
  description:'Découvrez 20 recettes complètes de Cuisiner pour guérir, par le Dr Said-Alaoui Moulay Abdellah, avec les ingrédients et les étapes de préparation.',
  source:{language:'fr',filename:'Livre cuisiner pour guérir FR-pdf.pdf',sha256:createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex')},
  image:{src:'/assets/images/publications/book-fr-640.webp',small:'/assets/images/publications/book-fr-240.webp',width:640,height:905},
  recipes,introduction,
};
fs.writeFileSync('content/publications/book-fr.json',JSON.stringify(book,null,2)+'\n');
console.log(`Imported ${recipes.length} complete recipes from the French edition.`);
