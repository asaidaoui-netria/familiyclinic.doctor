import publicationData from "./publications.js";

const LOCALES = ["en", "fr", "ar"];

function publicationRoute(locale, slug) {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${prefix}/publications/${slug}/`;
}

function publicationOutputPath(locale, slug) {
  const prefix = locale === "en" ? "" : `${locale}/`;
  return `${prefix}publications/${slug}/index.html`;
}

function publicationPagesData() {
  const publicationPages = publicationData().flatMap((publication) => {
    const localizedRoutes = Object.freeze(
      Object.fromEntries(
        LOCALES.map((locale) => [
          locale,
          publicationRoute(locale, publication.slug),
        ]),
      ),
    );

    return LOCALES.map((locale) =>
      Object.freeze({
        publication,
        edition: publication.editions[locale],
        locale,
        permalink: publicationRoute(locale, publication.slug),
        outputPath: publicationOutputPath(locale, publication.slug),
        localizedRoutes,
      }),
    );
  });

  return Object.freeze(publicationPages);
}

publicationPagesData.publicationRoute = publicationRoute;
publicationPagesData.publicationOutputPath = publicationOutputPath;

export default publicationPagesData;
