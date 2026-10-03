import fs from "node:fs";
import { I18nPlugin } from "@11ty/eleventy";
import site from "./src/_data/site.js";
import {renderPublicationText} from "./src/lib/publication-content.js";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(I18nPlugin, {
    defaultLanguage: "en",
    errorMode: "strict"
  });

  eleventyConfig.on("eleventy.before", async () => {
    await fs.promises.rm("_site", { recursive: true, force: true });
  });
  eleventyConfig.addGlobalData("buildYear", new Date().getFullYear());

  eleventyConfig.addFilter("localizedUrl", site.localizedUrl);
  eleventyConfig.addFilter("publicationText", renderPublicationText);
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value));
  eleventyConfig.addFilter("jsonLd", (value) => JSON.stringify(value).replace(/</g, "\\u003c"));

  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("assets/*.css");
  eleventyConfig.addPassthroughCopy("assets/*.js");
  eleventyConfig.addPassthroughCopy("assets/favicon");
  eleventyConfig.addPassthroughCopy("assets/fonts");
  eleventyConfig.addPassthroughCopy("assets/images/optimized/clinic");
  eleventyConfig.addPassthroughCopy("assets/images/optimized/logos");
  eleventyConfig.addPassthroughCopy("assets/images/optimized/netria");
  eleventyConfig.addPassthroughCopy("assets/images/optimized/services");
  eleventyConfig.addPassthroughCopy("assets/images/optimized/team");
  eleventyConfig.addPassthroughCopy("assets/images/publications");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
}
