// Reading and navigation work without JavaScript; these are enhancements only.
(() => {
  const printButton = document.querySelector('[data-print-recipe]');
  if (printButton) {
    printButton.hidden = false;
    printButton.addEventListener('click', () => window.print());
  }
  const links = [...document.querySelectorAll('.publication-contents nav a')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const targets = new Map(links.map(link => [link, decodeURIComponent(link.hash.slice(1))]));
  const sections = [...targets.values()].map(id => document.getElementById(id)).filter(Boolean);
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of links) {
        if (targets.get(link) === entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
  }, {rootMargin: '-110px 0px -65% 0px'});
  sections.forEach(section => observer.observe(section));
})();
