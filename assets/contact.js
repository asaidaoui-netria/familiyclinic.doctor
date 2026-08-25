// Contact Page JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all contact page functionality
    initFAQ();
    initNoticeBanner();
});

// FAQ Functionality
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-item__question');
        const answer = item.querySelector('.faq-item__answer');

        if (question && answer) {
            question.addEventListener('click', () => toggleFAQ(item, question, answer));

            // Add keyboard support
            question.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleFAQ(item, question, answer);
                }
            });
        }
    });
}

// Notice Banner Functionality
function initNoticeBanner() {
    // Notice banner functionality removed - no close button
}

function toggleFAQ(item, question, answer) {
    const isExpanded = question.getAttribute('aria-expanded') === 'true';

    // Close all other FAQ items
    const allQuestions = document.querySelectorAll('.faq-item__question');
    const allAnswers = document.querySelectorAll('.faq-item__answer');

    allQuestions.forEach((q, index) => {
        if (q !== question) {
            q.setAttribute('aria-expanded', 'false');
            allAnswers[index].classList.remove('active');
        }
    });

    // Toggle current item
    if (isExpanded) {
        question.setAttribute('aria-expanded', 'false');
        answer.classList.remove('active');
    } else {
        question.setAttribute('aria-expanded', 'true');
        answer.classList.add('active');
    }
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', (event) => {
            if (link.classList.contains('skip-link')) return;
            const href = link.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                event.preventDefault();
                const motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                target.scrollIntoView({
                    behavior: motionOK ? 'smooth' : 'auto',
                    block: 'start'
                });
            }
        });
    });
}

// Initialize smooth scrolling
document.addEventListener('DOMContentLoaded', initSmoothScrolling);


