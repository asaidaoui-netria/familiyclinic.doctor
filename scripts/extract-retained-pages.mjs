import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const manifest = [
  ["index.html", "src/en/index.njk", "en", "home", "/index.html", ["styles.css", "localization.css"], ["script.js", "localization.js"], true],
  ["about.html", "src/en/about.njk", "en", "about", "/about.html", ["styles.css", "about.css", "localization.css"], ["script.js", "localization.js"], true],
  ["services.html", "src/en/services.njk", "en", "services", "/services.html", ["styles.css", "services.css", "localization.css"], ["script.js", "localization.js", "services.js"], true],
  ["contact.html", "src/en/contact.njk", "en", "contact", "/contact.html", ["styles.css", "contact.css", "localization.css"], ["script.js", "localization.js", "contact.js"], true],
  ["404.html", "src/en/404.njk", "en", "notFound", "/404.html", ["styles.css", "localization.css"], ["script.js", "localization.js"], false],
  ["fr/index.html", "src/fr/index.njk", "fr", "home", "/fr/index.html", ["styles.css", "localization.css"], ["script.js", "localization.js"], true],
  ["fr/about.html", "src/fr/about.njk", "fr", "about", "/fr/about.html", ["styles.css", "about.css", "localization.css"], ["script.js", "localization.js"], true],
  ["fr/services.html", "src/fr/services.njk", "fr", "services", "/fr/services.html", ["styles.css", "services.css", "localization.css"], ["script.js", "localization.js", "services.js"], true],
  ["fr/contact.html", "src/fr/contact.njk", "fr", "contact", "/fr/contact.html", ["styles.css", "contact.css", "localization.css"], ["script.js", "localization.js", "contact.js"], true],
  ["ar/index.html", "src/ar/index.njk", "ar", "home", "/ar/index.html", ["styles.css", "localization.css"], ["script.js", "localization.js"], true],
  ["ar/about.html", "src/ar/about.njk", "ar", "about", "/ar/about.html", ["styles.css", "about.css", "localization.css"], ["script.js", "localization.js"], true],
  ["ar/services.html", "src/ar/services.njk", "ar", "services", "/ar/services.html", ["styles.css", "services.css", "localization.css"], ["script.js", "services.js", "localization.js"], true],
  ["ar/contact.html", "src/ar/contact.njk", "ar", "contact", "/ar/contact.html", ["styles.css", "contact.css", "localization.css"], ["script.js", "contact.js", "localization.js"], true]
].map(([input, output, locale, pageKey, permalink, stylesheets, scripts, indexable]) => ({
  input,
  output,
  locale,
  pageKey,
  permalink,
  stylesheets,
  scripts,
  indexable,
  activeNav: pageKey === "notFound" ? "" : pageKey
}));

function requiredMatch(value, expression, label, input) {
  const match = value.match(expression);

  if (!match) {
    throw new Error(`Unable to extract ${label} from ${input}`);
  }

  return match;
}

function extractMainContent(html, input) {
  const openingTag = requiredMatch(html, /<main class="main">/i, "main opening tag", input);
  const tagExpression = /<main\b[^>]*>|<\/main\s*>/gi;
  tagExpression.lastIndex = openingTag.index + openingTag[0].length;
  let depth = 1;
  let match;

  while ((match = tagExpression.exec(html))) {
    depth += match[0].startsWith("</") ? -1 : 1;

    if (depth === 0) {
      return html
        .slice(openingTag.index + openingTag[0].length, match.index)
        .replace(/<main\b([^>]*)>/gi, "<div$1>")
        .replace(/<\/main\s*>/gi, "</div>")
        .trimEnd();
    }
  }

  throw new Error(`Unable to extract complete main content from ${input}`);
}

for (const page of manifest) {
  const html = await readFile(page.input, "utf8");
  const title = requiredMatch(html, /<title>([\s\S]*?)<\/title>/i, "title", page.input)[1].trim();
  const descriptionTag = requiredMatch(html, /<meta\b[^>]*\bname=["']description["'][^>]*>/i, "description meta tag", page.input)[0];
  const description = requiredMatch(descriptionTag, /\bcontent=(["'])([\s\S]*?)\1/i, "description content", page.input)[2];
  const main = extractMainContent(html, page.input);
  const frontMatter = [
    "---",
    "layout: layouts/base.njk",
    `locale: ${page.locale}`,
    `pageKey: ${page.pageKey}`,
    `permalink: ${page.permalink}`,
    `activeNav: ${page.activeNav || '""'}`,
    `indexable: ${page.indexable}`,
    `stylesheets: [${page.stylesheets.join(", ")}]`,
    `scripts: [${page.scripts.join(", ")}]`,
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    "---",
    ""
  ].join("\n");

  await mkdir(dirname(page.output), { recursive: true });
  await writeFile(page.output, `${frontMatter}${main}`, "utf8");
}
