import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const contentRoot = fileURLToPath(new URL('../../content/publications/', import.meta.url));

export default function publicationData() {
  const manifest = JSON.parse(fs.readFileSync(`${contentRoot}/manifest.json`, 'utf8'));
  return manifest.map(record => ({
    ...record,
    editions: Object.fromEntries(['en', 'fr', 'ar'].flatMap(locale => {
      const path = `${contentRoot}/${record.id}/${locale}.json`;
      return fs.existsSync(path) ? [[locale, JSON.parse(fs.readFileSync(path, 'utf8'))]] : [];
    })),
  }));
}
