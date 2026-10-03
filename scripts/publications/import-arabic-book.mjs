// Import the supplied Arabic edition, including its own quantities and timings.
// The PDF text extraction reverses some lam-alef ligatures and splits words.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const books=JSON.parse(fs.readFileSync('.publication-work/design-audit/books.json','utf8'));
const source=books.find(book=>book.folder==='livre cuisiner pour guérir AR');
const english=JSON.parse(fs.readFileSync('content/publications/book.json','utf8'));
const introduction=JSON.parse(fs.readFileSync('content/publications/book-preface-ar.json','utf8'));
const sourcePath='.playwright-mcp/publications-source/Publications family clinic/Extrait du livre cuisiner pour guérir/livre cuisiner pour guérir AR/livre cuisiner pour guérir AR-pdf.pdf';
const repairs={
  'األ':'الأ','اإل':'الإ','اآل':'الآ','اال':'الا','ألل':'لأل','إلضفاء':'لإضفاء',
  'الخاليا':'الخلايا','البازالء':'البازلاء','مالعق':'ملاعق','مقالة':'مقلاة','برتقاالت':'برتقالات',
  'لاللتهاب':'للالتهاب','ب إكل يل':'بإكليل','طري قة':'طريقة','ع لى':'على','العضال ت':'العضلات',
  'قبض ة':'قبضة','المتوسطي ة':'المتوسطية','م نعشة':'منعشة','ن ظام':'نظام','ي دعم':'يدعم','حديداا':'حديدًا',
  'لألجسام':'للأجسام','لألنظمة':'للأنظمة','لألكسدة':'للأكسدة','إلضافة':'لإضافة','إلثراء':'لإثراء',
};
function clean(text){
  for(const [from,to] of Object.entries(repairs))text=text.replaceAll(from,to);
  // Isolated vocalization marks moved by PDF extraction are omitted, without changing words.
  return text.replace(/(?<=\s|^)[\u064b-\u0652]+(?=\s|$)/gu,'')
    .replace(/\s+/g,' ').replace(/\s+([.،:])/g,'$1').replace(/\(\s+/g,'(').replace(/\s+\)/g,')')
    .replace(/\.\s*\.$/,'.').trim();
}
const splitItems=text=>text.split(/[•]\s*/).map(clean).filter(Boolean);
const recipes=[];
for(const [index,page] of source.pages.entries()){
  const header=page.match(/^(?:ا\s*ل)?وصفة رقم (\d+)\s+(.+?)\s{2,}الهدف الصح/);
  if(!header)continue;
  const number=Number(header[1]);
  const reference=english.recipes.find(recipe=>recipe.number===number);
  const text=page.replace(/\s+\d+\s*$/,'').replaceAll('طري قة','طريقة');
  const labels=['الهدف الصحي?','الحصص','المكونات','طريقة التحضير','الوقت','الفوائد','نصيحة','بديل','التغذية'];
  const matches=[...text.matchAll(new RegExp('  ('+labels.join('|')+')\\s+','g'))];
  const sections=matches.map((match,i)=>text.slice(match.index+match[0].length,matches[i+1]?.index).trim());
  if(matches.length!==9||!reference)throw new Error('Incomplete Arabic recipe '+number);
  const title=clean(header[2]);
  recipes.push({number,title,url:'/ar'+reference.url,sourcePdfPage:index+1,
    printedPage:Number(page.match(/\s+(\d+)\s*$/)[1]),
    description:`المكونات وخطوات تحضير ${title}، من مقتطفات كتاب «الطبخ للشفاء» للدكتور سعيد العلوي مولاي عبد الله.`,
    goal:clean(sections[0]),servings:clean(sections[1]),ingredients:splitItems(sections[2]),
    steps:sections[3].split(/\d+\s*[).]\s+/).map(clean).filter(Boolean),time:clean(sections[4]),
    benefits:splitItems(sections[5]),tip:clean(sections[6]),variation:clean(sections[7]),nutrition:clean(sections[8]),
  });
}
if(recipes.length!==20)throw new Error(`Expected 20 Arabic recipes; received ${recipes.length}`);
// Restore reading order in the two lines whose detached ending precedes the sentence in extraction.
recipes.find(r=>r.number===131).steps[0]='اطهِ العدس في ماء مملح قليلًا حتى يصبح طريًا.';
recipes.find(r=>r.number===151).steps[0]='ضع البصل وقطع اللحم في زيت الزيتون واتركها تتحمّر قليلًا على نار هادئة.';
const book={language:'ar',title:'الطبخ للشفاء',url:'/ar/publications/cooking-to-heal/',
  description:'اكتشف 20 وصفة كاملة من كتاب «الطبخ للشفاء» للدكتور سعيد العلوي مولاي عبد الله، مع المكونات وخطوات التحضير.',
  source:{language:'ar',filename:'livre cuisiner pour guérir AR-pdf.pdf',sha256:createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex')},
  image:{src:'/assets/images/publications/book-ar-640.webp',small:'/assets/images/publications/book-ar-240.webp',width:640,height:905},
  recipes,introduction,
};
fs.writeFileSync('content/publications/book-ar.json',JSON.stringify(book,null,2)+'\n');
console.log(`Imported ${recipes.length} complete recipes from the Arabic edition.`);
