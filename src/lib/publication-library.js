import {renderBlocks} from './publication-content.js';
import copy from '../_data/publicationCopy.js';
import site from '../_data/site.js';
import englishBook from '../../content/publications/book.json' with {type: 'json'};
import frenchBook from '../../content/publications/book-fr.json' with {type: 'json'};
import arabicBook from '../../content/publications/book-ar.json' with {type: 'json'};

const BOOKS = {en: englishBook, fr: frenchBook, ar: arabicBook};

export const CATEGORIES = [
  {
    id: 'A', slug: 'nutrition', en: 'Nutrition fundamentals', fr: 'Nutrition — Notions fondamentales', ar: 'أساسيات التغذية',
    description: {
      en: 'Explore how food, digestion, genes and everyday habits relate to health.',
      fr: 'Explorez les liens entre alimentation, digestion, génétique et santé.',
      ar: 'اكتشف العلاقة بين الغذاء والهضم والجينات والعادات اليومية والصحة.',
    },
  },
  {
    id: 'B', slug: 'autoimmune-conditions', en: 'Autoimmune conditions', fr: 'Maladies autoimmunes', ar: 'أمراض المناعة الذاتية',
    description: {
      en: 'Begin with immunity and inflammation, then explore individual conditions.',
      fr: 'Découvrez les mécanismes de l’immunité et de l’inflammation, puis les différentes maladies.',
      ar: 'ابدأ بفهم المناعة والالتهاب، ثم تعرّف على أمراض المناعة الذاتية المختلفة.',
    },
  },
  {
    id: 'C', slug: 'cellular-accumulation', en: 'Conditions and cellular accumulation', fr: 'Maladies par encrassage', ar: 'الأمراض والتراكم الخلوي',
    description: {
      en: 'Explore the author’s “encrassage” model and the conditions discussed within it. The overview explains this framework and its terminology.',
      fr: 'Explorez le modèle de l’encrassage présenté par l’auteur et les maladies abordées dans ce cadre.',
      ar: 'تعرّف على نموذج التراكم الخلوي الذي يقدّمه المؤلف والأمراض التي يناقشها في إطاره. يشرح المقال التمهيدي هذا التصور ومصطلحاته.',
    },
  },
  {
    id: 'D', slug: 'elimination', en: 'Conditions and elimination', fr: 'Maladies par troubles de l’élimination', ar: 'الأمراض واضطرابات الإطراح',
    description: {
      en: 'Explore the author’s elimination model through digestive, respiratory and skin conditions.',
      fr: 'Explorez la théorie de l’élimination à travers les troubles digestifs, respiratoires et cutanés.',
      ar: 'استكشف نظرية الإطراح التي يعرضها المؤلف من خلال اضطرابات الجهاز الهضمي والجهاز التنفسي والجلد.',
    },
  },
];

const AUTHOR = 'Dr. Said-Alaoui Moulay Abdellah';
const ARTICLE_LOCALES = ['en', 'fr', 'ar'];
export const prefix = locale => locale === 'en' ? '' : `/${locale}`;
export const articleUrl = (locale, slug) => `${prefix(locale)}/publications/${slug}/`;
export const categoryUrl = (locale, slug) => `${prefix(locale)}/publications/categories/${slug}/`;
const catalogUrl = locale => `${prefix(locale)}/publications/`;
const compact = summary => summary.replace(/\s+/g, ' ').trim();

function description(summary) {
  const clean = compact(summary);
  return clean.length <= 190 ? clean : clean.slice(0, 187).replace(/\s+\S*$/, '') + '…';
}

function validate(records) {
  const ids = new Set(), slugs = new Set();
  for (const record of records) {
    if (ids.has(record.id) || slugs.has(record.slug)) throw new Error('Duplicate publication ID or slug');
    ids.add(record.id);
    slugs.add(record.slug);
    if (!CATEGORIES.some(category => category.id === record.categoryId)) throw new Error(`Unknown category ${record.categoryId}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) throw new Error(`Invalid slug ${record.slug}`);
    for (const [language, edition] of Object.entries(record.editions)) {
      if (!['en', 'fr', 'ar'].includes(language) || edition.language !== language) throw new Error(`Invalid language ${record.id}/${language}`);
      if (!['draft', 'published'].includes(edition.status)) throw new Error(`Invalid status ${record.id}/${language}`);
      if (edition.status === 'published' && (!edition.title?.trim() || !edition.summary?.trim() || !edition.blocks?.length)) throw new Error(`Incomplete publication ${record.id}/${language}`);
      if (edition.sourceHash !== record.source.sha256) throw new Error(`Source hash mismatch ${record.id}/${language}`);
    }
  }
  for (const record of records) {
    if ((record.relatedIds || []).some(id => !ids.has(id) || id === record.id)) throw new Error(`Invalid related article for ${record.id}`);
    if (record.relatedCategoryId && !CATEGORIES.some(category => category.id === record.relatedCategoryId)) throw new Error(`Invalid related category for ${record.id}`);
  }
}

function itemList(items) {
  return {
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, url: site.url + item.url, name: item.title,
    })),
  };
}

function schema(page) {
  const url = site.url + page.permalink;
  const crumbs = [{name: page.copy.title, url: catalogUrl(page.locale)}];
  if (page.kind === 'article') crumbs.push({name: page.category.title, url: page.category.url});
  if (page.kind === 'recipe') crumbs.push({name: page.book.title, url: page.book.url});
  if (page.kind !== 'catalog') crumbs.push({name: page.title, url: page.permalink});
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem', position: index + 1, name: crumb.name, item: site.url + crumb.url,
    })),
  };
  const isArticle = ['article', 'recipe'].includes(page.kind);
  const primary = {
    '@type': isArticle ? 'Article' : 'CollectionPage',
    '@id': url + '#content', url, name: page.title,
    inLanguage: page.locale, description: page.description,
  };
  if (isArticle) Object.assign(primary, {
    headline: page.title, mainEntityOfPage: url,
    author: {'@type': 'Person', name: page.author, url: site.url + prefix(page.locale) + '/about.html#dr-said-alaoui'},
  });
  if (page.image) primary.image = site.url + page.image.src;
  if (page.kind === 'article') {
    primary.articleSection = page.category.title;
    if (page.edition.publishedAt) primary.datePublished = page.edition.publishedAt;
    if (page.edition.modifiedAt) primary.dateModified = page.edition.modifiedAt;
  }
  if (page.kind === 'catalog') primary.mainEntity = itemList(page.categories);
  if (page.kind === 'category') primary.mainEntity = itemList(page.articles);
  if (page.kind === 'book') primary.mainEntity = itemList(page.book.recipes);
  return {'@context': 'https://schema.org', '@graph': [primary, breadcrumb]};
}

export function buildLibrary(records) {
  validate(records);
  const pages = [], catalogs = {}, editions = new Map();
  for (const record of records) {
    const published = Object.entries(record.editions).filter(([, edition]) => edition.status === 'published');
    const localizedRoutes = Object.fromEntries(published.map(([locale]) => [locale, articleUrl(locale, record.slug)]));
    for (const [locale, edition] of published) {
      const rendered = renderBlocks(edition.blocks, locale);
      editions.set(`${record.id}/${locale}`, {
        id: record.id, slug: record.slug, title: edition.title, summary: compact(edition.summary),
        url: articleUrl(locale, record.slug), image: record.image, readingMinutes: rendered.readingMinutes,
        edition, rendered, record, localizedRoutes,
      });
    }
  }

  for (const locale of ARTICLE_LOCALES) {
    const book = BOOKS[locale] || englishBook;
    const categories = CATEGORIES.map(category => ({
      ...category, title: category[locale], description: category.description[locale],
      url: categoryUrl(locale, category.slug),
      articles: records.filter(record => record.categoryId === category.id)
        .map(record => editions.get(`${record.id}/${locale}`)).filter(Boolean),
    }));
    const catalog = {
      kind: 'catalog', locale, title: copy[locale].title, description: copy[locale].intro,
      permalink: catalogUrl(locale), localizedRoutes: Object.fromEntries(ARTICLE_LOCALES.map(language => [language, catalogUrl(language)])),
      categories, copy: copy[locale], book,
      total: categories.reduce((total, category) => total + category.articles.length, 0), indexable: true,
    };
    catalogs[locale] = catalog;
    pages.push(catalog);
    for (const category of categories) {
      pages.push({
        kind: 'category', locale, title: category.title, description: category.description,
        permalink: category.url,
        localizedRoutes: Object.fromEntries(ARTICLE_LOCALES.filter(language => records.some(record =>
          record.categoryId === category.id && record.editions[language]?.status === 'published',
        )).map(language => [language, categoryUrl(language, category.slug)])),
        categories, category, articles: category.articles, book,
        indexable: category.articles.length > 0, copy: copy[locale],
      });
      category.articles.forEach((article, index) => pages.push({
        kind: 'article', locale, title: article.title, description: description(article.summary),
        permalink: article.url, localizedRoutes: article.localizedRoutes, categories, category,
        publication: article.record, edition: article.edition, body: article.rendered.html, book,
        toc: article.rendered.toc.filter(heading => heading.level === 2),
        readingMinutes: article.readingMinutes, summary: article.summary, image: article.image,
        indexable: true, copy: copy[locale],
        previous: category.articles[index - 1], next: category.articles[index + 1],
        related: (article.record.relatedIds || []).map(id => editions.get(`${id}/${locale}`)).filter(Boolean),
        relatedCategory: categories.find(category => category.id === article.record.relatedCategoryId),
      }));
    }
  }

  // Keep a language-choice page at a legacy URL only while its Arabic edition
  // is missing or a draft. Published Arabic editions use the full article route.
  for (const record of records.filter(record => record.legacy && !editions.has(`${record.id}/ar`))) {
    const readable = editions.get(`${record.id}/en`) || editions.get(`${record.id}/fr`);
    pages.push({
      kind: 'transition', locale: 'ar', title: record.legacyArabicTitle || record.proposedEnglishTitle,
      description: copy.ar.transition, permalink: articleUrl('ar', record.slug),
      localizedRoutes: {}, availableRoutes: readable?.localizedRoutes || {}, indexable: false, copy: copy.ar,
    });
  }
  for (const [locale, book] of Object.entries(BOOKS)) {
    pages.push({
      kind: 'book', locale, title: book.title, description: book.description, permalink: book.url,
      localizedRoutes: Object.fromEntries(Object.entries(BOOKS).map(([language, edition]) => [language, edition.url])),
      indexable: true, copy: copy[locale], book, image: book.image,
      categories: catalogs[locale].categories, introduction: renderBlocks(book.introduction.blocks, locale).html,
    });
    for (const recipe of book.recipes) pages.push({
      kind: 'recipe', locale, title: recipe.title, description: recipe.description,
      permalink: recipe.url,
      localizedRoutes: Object.fromEntries(Object.entries(BOOKS).flatMap(([language, edition]) => {
        const translation = edition.recipes.find(item => item.number === recipe.number);
        return translation ? [[language, translation.url]] : [];
      })),
      indexable: true, copy: copy[locale], book, recipe, categories: catalogs[locale].categories,
    });
  }

  const urls = new Set();
  for (const page of pages) {
    if (urls.has(page.permalink)) throw new Error(`Duplicate page URL ${page.permalink}`);
    urls.add(page.permalink);
    page.outputPath = page.permalink.slice(1) + 'index.html';
    page.author = page.locale === 'ar' ? 'الدكتور سعيد العلوي مولاي عبد الله' : AUTHOR;
    if (page.indexable) page.structuredData = schema(page);
  }
  return {pages, catalogs, categories: CATEGORIES, records};
}
