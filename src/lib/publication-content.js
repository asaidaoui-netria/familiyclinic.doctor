export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}

export function renderPublicationText(value, locale) {
  const source = String(value);
  const escape = text => escapeHtml(text).replace(/\n/g, '<br>');
  if (locale !== 'ar' && !/[\u0621-\u064a]/u.test(source)) return escape(source);
  // Isolate Latin terms, units and ranges so RTL text cannot reverse 0–12 or mg/kg.
  // Match raw text first, then escape every fragment; never transform HTML entities.
  const runs = /(?:[<>≤≥±+−]\s*)?[\p{Script=Latin}\p{Script=Greek}\p{N}][\p{Script=Latin}\p{Script=Greek}\p{N} \t\u00a0\u202f.,/'’+%°:–−‑×=\-]*/gu;
  let html = '', end = 0;
  for (const match of source.matchAll(runs)) {
    const run = match[0].trimEnd();
    html += escape(source.slice(end, match.index)) + `<bdi dir="ltr">${escape(run)}</bdi>`;
    end = match.index + run.length;
  }
  return html + escape(source.slice(end));
}

export function blockText(block) {
  if (block.type === 'table') return block.rows.flat().join(' ');
  if (block.type === 'list') return block.items.join(' ');
  if (block.type === 'figure') return block.caption;
  return block.text;
}

function renderList(block, text) {
  const roots = [], parents = [];
  block.items.forEach((item, index) => {
    const level = block.levels?.[index] || 0;
    const node = {text: item, level, children: []};
    while (parents.length && parents.at(-1).level >= level) parents.pop();
    (parents.length ? parents.at(-1).children : roots).push(node);
    parents.push(node);
  });
  const tag = block.ordered ? 'ol' : 'ul';
  const render = nodes => `<${tag}>${nodes.map(node => `<li>${text(node.text)}${node.children.length ? render(node.children) : ''}</li>`).join('')}</${tag}>`;
  return render(roots);
}

export function renderBlocks(blocks, locale) {
  const toc = [], anchors = new Set(['publication-source', 'publication-source-title', 'publication-related-title', 'main-content']);
  const text = value => renderPublicationText(value, locale);
  const html = blocks.map(block => {
    if (block.type === 'heading') {
      const base = block.text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g,'-').replace(/^-|-$/g,'') || 'section';
      let id = base, count = 2;
      while (anchors.has(id)) id = `${base}-${count++}`;
      anchors.add(id);
      const level = block.level === 3 ? 3 : 2;
      toc.push({id,title:block.text,level});
      return `<h${level} id="${id}">${text(block.text)}</h${level}>`;
    }
    if (block.type === 'list') {
      return renderList(block, text);
    }
    if (block.type === 'figure') {
      if (!/^\/assets\/images\/publications\/[a-zA-Z0-9-]+\.(?:webp|png|jpg)$/.test(block.src)) throw new Error('Invalid publication figure asset');
      if (!(block.width > 0 && block.height > 0)) throw new Error('Missing publication figure dimensions');
      return `<figure class="publication-figure"><img src="${escapeHtml(block.src)}" width="${block.width}" height="${block.height}" alt="${escapeHtml(block.alt)}" loading="lazy" decoding="async"><figcaption>${text(block.caption)}</figcaption></figure>`;
    }
    if (block.type === 'table') {
      const [head,...rows] = block.rows;
      return `<div class="publication-table" tabindex="0" role="region" aria-label="${escapeHtml(head.join(' / '))}"><table><thead><tr>${head.map(cell=>`<th scope="col">${text(cell)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${text(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    if (block.type !== 'paragraph') throw new Error(`Unsupported publication block: ${block.type}`);
    return `<p>${text(block.text)}</p>`;
  }).join('\n');
  const wordCount = blocks.map(blockText).join(' ').trim().split(/\s+/u).filter(Boolean).length;
  return {html,toc,wordCount,readingMinutes:Math.max(1,Math.ceil(wordCount/220))};
}
