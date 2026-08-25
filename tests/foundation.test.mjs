import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import { outputPath, readOutput } from "./helpers/site.mjs";

test("the English homepage has the shared shell, retained stylesheet, and no Blog navigation", async () => {
  assert.equal(existsSync(outputPath("index.html")), true, "the generated English homepage exists");

  const html = await readOutput("index.html");

  assert.equal((html.match(/<header class="header">/g) ?? []).length, 1);
  assert.equal((html.match(/<main class="main" id="main-content">/g) ?? []).length, 1);
  assert.equal((html.match(/<footer class="footer">/g) ?? []).length, 1);
  assert.doesNotMatch(html, /<a\b[^>]*>\s*Blog\s*<\/a>/i);
  assert.match(html, /href="\/assets\/styles\.css"/);
  assert.match(html, /data-domain="familyclinic\.doctor"/);
  assert.match(html, /<span class="header__logo-text">Family Clinic<\/span>/);
});

test("the generated site retains the custom domain", async () => {
  assert.equal((await readOutput("CNAME")).trim(), "www.familyclinic.doctor");
});
