/**
 * Blog Pagination System
 * Handles client-side pagination for blog articles
 */

class BlogPagination {
    constructor() {
        this.articlesPerPage = 6;
        this.currentPage = 1;
        this.articles = [];
        this.totalPages = 0;

        this.init();
    }

    init() {
        // Get all regular blog articles (excluding pinned)
        this.articles = Array.from(document.querySelectorAll('.blog-grid__container .blog-card'));
        this.totalPages = Math.ceil(this.articles.length / this.articlesPerPage);

        // Only initialize pagination if we have more than 6 articles
        if (this.articles.length > this.articlesPerPage) {
            this.createPaginationControls();
            this.showPage(1, false); // Don't scroll on initial load
        }
    }

    createPaginationControls() {
        const blogGrid = document.querySelector('.blog-grid');
        if (!blogGrid) return;

        const paginationHTML = `
            <div class="pagination" role="navigation" aria-label="Blog pagination">
                <div class="pagination__controls">
                    <button class="pagination__button pagination__button--prev" data-action="prev" aria-label="Previous page">
                        <span aria-hidden="true">‹</span>
                    </button>
                    <div class="pagination__numbers"></div>
                    <button class="pagination__button pagination__button--next" data-action="next" aria-label="Next page">
                        <span aria-hidden="true">›</span>
                    </button>
                </div>
                <div class="pagination__info" aria-live="polite"></div>
            </div>
        `;

        blogGrid.insertAdjacentHTML('afterend', paginationHTML);
        this.bindEvents();
        this.updatePaginationControls();
    }

    bindEvents() {
        const paginationControls = document.querySelector('.pagination__controls');
        if (!paginationControls) return;

        paginationControls.addEventListener('click', (e) => {
            const button = e.target.closest('.pagination__button');
            if (!button) return;

            const action = button.getAttribute('data-action');
            const page = button.getAttribute('data-page');

            if (action === 'prev' && this.currentPage > 1) {
                this.showPage(this.currentPage - 1);
            } else if (action === 'next' && this.currentPage < this.totalPages) {
                this.showPage(this.currentPage + 1);
            } else if (page) {
                this.showPage(parseInt(page));
            }
        });
    }

    showPage(pageNumber, shouldScroll = true) {
        if (pageNumber < 1 || pageNumber > this.totalPages) return;

        this.currentPage = pageNumber;

        // Hide all articles
        this.articles.forEach(article => {
            article.style.display = 'none';
        });

        // Show articles for current page
        const startIndex = (pageNumber - 1) * this.articlesPerPage;
        const endIndex = startIndex + this.articlesPerPage;

        for (let i = startIndex; i < endIndex && i < this.articles.length; i++) {
            this.articles[i].style.display = '';
        }

        this.updatePaginationControls();

        // Only scroll if explicitly requested (user interaction)
        if (shouldScroll) {
            this.scrollToTop();
        }
    }

    updatePaginationControls() {
        const prevButton = document.querySelector('.pagination__button--prev');
        const nextButton = document.querySelector('.pagination__button--next');
        const numbersContainer = document.querySelector('.pagination__numbers');
        const infoElement = document.querySelector('.pagination__info');

        if (!prevButton || !nextButton || !numbersContainer || !infoElement) return;

        // Update prev/next buttons
        prevButton.disabled = this.currentPage === 1;
        nextButton.disabled = this.currentPage === this.totalPages;

        // Update page numbers
        numbersContainer.innerHTML = this.generatePageNumbers();

        // Update info
        const startItem = (this.currentPage - 1) * this.articlesPerPage + 1;
        const endItem = Math.min(this.currentPage * this.articlesPerPage, this.articles.length);
        infoElement.textContent = `Showing ${startItem}-${endItem} of ${this.articles.length} articles`;
    }

    generatePageNumbers() {
        const pages = [];
        const maxVisiblePages = 5;

        if (this.totalPages <= maxVisiblePages) {
            // Show all pages if total is less than max visible
            for (let i = 1; i <= this.totalPages; i++) {
                pages.push(this.createPageButton(i));
            }
        } else {
            // Always show first page
            pages.push(this.createPageButton(1));

            let start = Math.max(2, this.currentPage - 1);
            let end = Math.min(this.totalPages - 1, this.currentPage + 1);

            // Adjust range to show 3 pages around current
            if (this.currentPage <= 3) {
                end = 4;
            } else if (this.currentPage >= this.totalPages - 2) {
                start = this.totalPages - 3;
            }

            // Add ellipsis if needed
            if (start > 2) {
                pages.push('<span class="pagination__ellipsis">…</span>');
            }

            // Add middle pages
            for (let i = start; i <= end; i++) {
                pages.push(this.createPageButton(i));
            }

            // Add ellipsis if needed
            if (end < this.totalPages - 1) {
                pages.push('<span class="pagination__ellipsis">…</span>');
            }

            // Always show last page
            if (this.totalPages > 1) {
                pages.push(this.createPageButton(this.totalPages));
            }
        }

        return pages.join('');
    }

    createPageButton(pageNumber) {
        const isActive = pageNumber === this.currentPage;
        const activeClass = isActive ? ' pagination__button--active' : '';
        const ariaCurrent = isActive ? ' aria-current="page"' : '';

        return `<button class="pagination__button${activeClass}" data-page="${pageNumber}"${ariaCurrent}>${pageNumber}</button>`;
    }

    scrollToTop() {
        const latestArticlesTitle = document.querySelector('.blog-grid__title');
        if (latestArticlesTitle) {
            // Get header height to calculate proper offset
            const header = document.querySelector('.header');
            const headerHeight = header ? header.offsetHeight : 80;

            // Calculate position to show title just below header
            const titlePosition = latestArticlesTitle.getBoundingClientRect().top + window.pageYOffset;
            const scrollPosition = titlePosition - headerHeight - 20; // 20px padding below header

            window.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        }
    }
}

// Initialize pagination when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BlogPagination();
});

// Export for potential external use
window.BlogPagination = BlogPagination;
