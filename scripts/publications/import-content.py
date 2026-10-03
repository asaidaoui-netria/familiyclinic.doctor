#!/usr/bin/env python3
"""Offline import of the client's Word originals. Builds use checked-in JSON, not Word."""
import argparse, hashlib, json, re, subprocess, tempfile, zipfile
from pathlib import Path
import xml.etree.ElementTree as ET

NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W='{'+NS['w']+'}'
def text_of(node):
    return ''.join('\n' if e.tag==W+'br' else '\t' if e.tag==W+'tab' else '‑' if e.tag==W+'noBreakHyphen' else e.text or '' for e in node.iter() if e.tag in [W+'t',W+'br',W+'tab',W+'noBreakHyphen']).strip()
def read_word(path):
    if path.suffix.lower()=='.doc':
        with tempfile.TemporaryDirectory() as temp:
            converted=Path(temp)/(path.stem+'.docx')
            # textutil flattens .doc tables; LibreOffice retains cells and styles.
            subprocess.run(['soffice',f'-env:UserInstallation={Path(temp).as_uri()}/profile','--headless','--convert-to','docx','--outdir',temp,str(path)],check=True,capture_output=True)
            return read_word(converted)
    with zipfile.ZipFile(path) as doc:
        root=ET.fromstring(doc.read('word/document.xml'))
        numbering={}
        if 'word/numbering.xml' in doc.namelist():
            nums=ET.fromstring(doc.read('word/numbering.xml'))
            for num in nums.findall('w:num',NS):
                abstract=num.find('w:abstractNumId',NS)
                if abstract is not None:
                    a=nums.find(f'w:abstractNum[@w:abstractNumId="{abstract.get(W+"val")}"]',NS)
                    if a is not None:
                        for lvl in a.findall('w:lvl',NS):
                            fmt=lvl.find('w:numFmt',NS)
                            numbering[(num.get(W+'numId'),lvl.get(W+'ilvl'))]=fmt.get(W+'val') if fmt is not None else 'bullet'
        blocks=[]
        for el in root.find('w:body',NS):
            if el.tag==W+'tbl':
                rows=[]
                for row in el.findall('w:tr',NS):
                    rows.append(['\n'.join(text_of(p) for p in cell.findall('.//w:p',NS) if text_of(p)) for cell in row.findall('w:tc',NS)])
                if rows:blocks.append({'type':'table','rows':rows})
                continue
            if el.tag!=W+'p':continue
            text=text_of(el)
            if not text:continue
            props=el.find('w:pPr',NS)
            style=el.find('w:pPr/w:pStyle',NS)
            style=style.get(W+'val','') if style is not None else ''
            size=el.find('w:pPr/w:rPr/w:sz',NS)
            size=int(size.get(W+'val','0')) if size is not None else 0
            runs=el.findall('.//w:r',NS)
            bold=sum(len(text_of(r)) for r in runs if r.find('w:rPr/w:b',NS) is not None)
            heading=(re.match(r'(Titre|Heading)[1-6]',style) is not None or size>=26 or bold/max(1,len(text))>.85) and len(text)<180
            # Short, punctuated prose is not a heading even when it was styled as one.
            if heading and len(text.split())>14 and text.endswith(('.',':')):heading=False
            if heading:
                blocks.append({'type':'heading','level':2 if size>=26 or style in ['Titre1','Titre2','Heading1','Heading2'] else 3,'text':text})
            elif el.find('w:pPr/w:numPr',NS) is not None:
                num=el.find('w:pPr/w:numPr/w:numId',NS);lvl=el.find('w:pPr/w:numPr/w:ilvl',NS)
                ordered=numbering.get((num.get(W+'val') if num is not None else '',lvl.get(W+'val') if lvl is not None else '0'),'bullet')!='bullet'
                depth=int(lvl.get(W+'val','0')) if lvl is not None else 0
                if blocks and blocks[-1]['type']=='list' and blocks[-1]['ordered']==ordered:
                    blocks[-1]['items'].append(text);blocks[-1]['levels'].append(depth)
                else:blocks.append({'type':'list','ordered':ordered,'items':[text],'levels':[depth]})
            else:blocks.append({'type':'paragraph','text':text})
        title=blocks.pop(0)['text']
        # Documents often style everything as normal. Promote short standalone section labels.
        for b in blocks:
            if b['type']=='paragraph' and len(b['text'])<100 and not re.search(r'[.!?;:]$',b['text']) and len(b['text'].split())<13:
                b['type']='heading';b['level']=2
        first=next((b for b in blocks if b['type']=='heading'),None)
        if first:first['level']=2
        return title,blocks

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--catalog',default='docs/design/publications-2026-10-03/catalog.json');args=parser.parse_args()
    catalog=json.loads(Path(args.catalog).read_text());out=Path('content/publications');out.mkdir(parents=True,exist_ok=True)
    existing={r["id"]:r for r in json.loads((out/"manifest.json").read_text())} if (out/"manifest.json").exists() else {}
    figures=json.loads((out/'figures.json').read_text()) if (out/'figures.json').exists() else {}
    manifest=[]
    for row in catalog['articles']:
        source=Path(row['bodyPath']);title,blocks=read_word(source)
        for figure in figures.get(row['code'],[]):
            anchor=next(i for i,b in enumerate(blocks) if b.get('text')==figure['afterSourceText'])
            blocks.insert(anchor+1,{'type':'figure',**{key:figure[key] for key in ['src','width','height']},'alt':figure['alt']['fr'],'caption':figure['caption']['fr']})
        _,teaser=read_word(Path(row['teaserPath']))
        summary=' '.join(b.get('text','') for b in teaser).strip()
        edition={'language':'fr','status':'published','title':title,'summary':summary,'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest(),'blocks':blocks}
        folder=out/row['code'];folder.mkdir(exist_ok=True)
        (folder/'fr.json').write_text(json.dumps(edition,ensure_ascii=False,indent=2)+'\n')
        manifest.append({'id':row['code'],'categoryId':row['categoryId'],'slug':row['slug'],'proposedEnglishTitle':row['proposedEnglishTitle'],'legacy':row['existingEnglishUrl'],'source':{'body':source.name,'teaser':Path(row['teaserPath']).name,'sha256':edition['sourceHash']},'image':{'src':f'/assets/images/publications/{row["code"]}-640.webp','small':f'/assets/images/publications/{row["code"]}-240.webp','width':640,'height':960}})
    for record in manifest:
        previous=existing.get(record['id'],{})
        if 'image' in previous:record['image']=previous['image']
        for key in ['legacyArabicTitle','relatedIds','relatedCategoryId']:
            if key in previous:record[key]=previous[key]
    (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(f'Imported {len(manifest)} French originals with paragraph/list/table structure.')
if __name__=='__main__':main()
