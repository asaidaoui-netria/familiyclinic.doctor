import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const catalog=JSON.parse(fs.readFileSync('docs/design/publications-2026-10-03/catalog.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('content/publications/manifest.json','utf8'));
const book=JSON.parse(fs.readFileSync('content/publications/book.json','utf8'));
const arabicBook=JSON.parse(fs.readFileSync('content/publications/book-ar.json','utf8'));
const arabicBookImage='.playwright-mcp/publications-source/Publications family clinic/Extrait du livre cuisiner pour guérir/livre cuisiner pour guérir AR/livre cuisiner pour guérir AR-image.jpg';
const frenchBook=JSON.parse(fs.readFileSync('content/publications/book-fr.json','utf8'));
const frenchBookImage='.playwright-mcp/publications-source/Publications family clinic/Extrait du livre cuisiner pour guérir/Livre cuisiner pour guérir FR/Livre cuisiner pour guérir FR-image.jpg';
const figures=JSON.parse(fs.readFileSync('content/publications/figures.json','utf8'));
fs.mkdirSync('assets/images/publications',{recursive:true});
for(const [id,path,record] of [...catalog.articles.map(a=>[a.code,a.imagePath,manifest.find(r=>r.id===a.code)]),['book',catalog.book.imagePath,book],['book-fr',frenchBookImage,frenchBook],['book-ar',arabicBookImage,arabicBook]]){
  const source=await loadImage(path);
  for(const width of [240,640]){
    const height=Math.round(source.height*width/source.width);
    const canvas=createCanvas(width,height);
    canvas.getContext('2d').drawImage(source,0,0,width,height);
    fs.writeFileSync(`assets/images/publications/${id}-${width}.webp`,await canvas.encode('webp',76));
    if(width===640)Object.assign(record.image,{width,height});
  }
}
for(const [id,items] of Object.entries(figures)){
  const article=catalog.articles.find(article=>article.code===id);
  for(const figure of items){
    const source=await loadImage(execFileSync('unzip',['-p',article.bodyPath,figure.sourcePart]));
    const canvas=createCanvas(source.width,source.height);
    canvas.getContext('2d').drawImage(source,0,0);
    fs.writeFileSync(figure.src.slice(1),await canvas.encode('webp',85));
  }
}
fs.writeFileSync('content/publications/manifest.json',JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync('content/publications/book.json',JSON.stringify(book,null,2)+'\n');
fs.writeFileSync('content/publications/book-ar.json',JSON.stringify(arabicBook,null,2)+'\n');
fs.writeFileSync('content/publications/book-fr.json',JSON.stringify(frenchBook,null,2)+'\n');
console.log('Optimized 59 cover illustrations and the explanatory body figure.');
