import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const manifest = [
  {
    input: "index.html",
    output: "src/en/index.njk",
    locale: "en",
    pageKey: "home",
    permalink: "/index.html",
    activeNav: "home",
    indexable: true,
    stylesheets: ["styles.css", "localization.css"],
    scripts: ["script.js", "localization.js"]
  }
];

function requiredMatch(value, expression, label, input) {
  const match = value.match(expression);

  if (!match) {
    throw new Error(`Unable to extract ${label} from ${input}`);
  }

  return match;
}

for (const page of manifest) {
  const html = await readFile(page.input, "utf8");
  const title = requiredMatch(html, /<title>([\s\S]*?)<\/title>/i, "title", page.input)[1].trim();
  const descriptionTag = requiredMatch(html, /<meta\b[^>]*\bname=["']description["'][^>]*>/i, "description meta tag", page.input)[0];
  const description = requiredMatch(descriptionTag, /\bcontent=(["'])([\s\S]*?)\1/i, "description content", page.input)[2];
  const main = requiredMatch(html, /<main class="main">([\s\S]*?)<\/main>/i, "main content", page.input)[1];
  const frontMatter = [
    "---",
    "layout: layouts/base.njk",
    `locale: ${page.locale}`,
    `pageKey: ${page.pageKey}`,
    `permalink: ${page.permalink}`,
    `activeNav: ${page.activeNav}`,
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
