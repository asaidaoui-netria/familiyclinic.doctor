const APPROVED_CATEGORIES = new Set([
  "nutrition",
  "conditions",
  "pregnancy",
  "environment",
]);

export function matchesPublicationCategory(category, selected) {
  if (!APPROVED_CATEGORIES.has(category)) return false;
  if (selected === "all") return true;
  return APPROVED_CATEGORIES.has(selected) && category === selected;
}

export function enhancePublicationCatalog(root) {
  const filters = root?.querySelector("[data-publication-filters]");
  if (!filters) return;

  const buttons = [...filters.querySelectorAll("[data-publication-filter]")];
  const cards = [...root.querySelectorAll("[data-publication-category]")];
  filters.hidden = false;

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-publication-filter]");
    if (!button || !filters.contains(button)) return;
    const selected = button.dataset.publicationFilter;
    if (selected !== "all" && !APPROVED_CATEGORIES.has(selected)) return;

    for (const candidate of buttons) {
      candidate.setAttribute(
        "aria-pressed",
        String(candidate === button),
      );
    }
    for (const card of cards) {
      card.hidden = !matchesPublicationCategory(
        card.dataset.publicationCategory,
        selected,
      );
    }
  });
}

if (typeof document !== "undefined") {
  for (const catalog of document.querySelectorAll("[data-publication-catalog]")) {
    enhancePublicationCatalog(catalog);
  }
}
