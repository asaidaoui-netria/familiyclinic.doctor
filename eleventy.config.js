import fs from "node:fs";
import { I18nPlugin } from "@11ty/eleventy";

const routes = {
  home: { en: "/index.html", fr: "/fr/index.html", ar: "/ar/index.html" },
  about: { en: "/about.html", fr: "/fr/about.html", ar: "/ar/about.html" },
  services: { en: "/services.html", fr: "/fr/services.html", ar: "/ar/services.html" },
  contact: { en: "/contact.html", fr: "/fr/contact.html", ar: "/ar/contact.html" },
  notFound: { en: "/404.html" }
};

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(I18nPlugin, {
    defaultLanguage: "en",
    errorMode: "strict"
  });

  eleventyConfig.on("eleventy.before", async () => {
    await fs.promises.rm("_site", { recursive: true, force: true });
  });

  eleventyConfig.addFilter("localizedUrl", (pageKey, locale) => {
    const localizedRoutes = routes[pageKey];

    if (!localizedRoutes) {
      throw new Error(`Unknown page key: ${pageKey}`);
    }

    if (!localizedRoutes[locale]) {
      throw new Error(`Unsupported locale \"${locale}\" for page key \"${pageKey}\"`);
    }

    return localizedRoutes[locale];
  });
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value));

  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("assets/*.css");
  eleventyConfig.addPassthroughCopy("assets/*.js");
  eleventyConfig.addPassthroughCopy("assets/favicon");
  eleventyConfig.addPassthroughCopy("assets/images/optimized/clinic");
  eleventyConfig.addPassthroughCopy("assets/images/optimized/logos");
  eleventyConfig.addPassthroughCopy("assets/images/optimized/netria");
  eleventyConfig.addPassthroughCopy("assets/images/optimized/services");
  eleventyConfig.addPassthroughCopy("assets/images/optimized/team");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    }
  };
}
