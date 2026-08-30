export default {
  pagination: {
    data: "publicationPages",
    size: 1,
    alias: "publicationPage",
  },
  stylesheets: [
    "styles.css",
    "localization.css",
    "vendor/pdfjs/pdf_viewer.css",
    "publications.css",
  ],
  scripts: ["script.js", "localization.js"],
  moduleScripts: ["publication-viewer.js"],
};
