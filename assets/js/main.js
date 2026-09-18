// Smooth scroll for in-page links, offset for the floating nav
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId.length < 2) return;
        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            const offset = 90;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
    });
});

const nav = document.querySelector('.nav');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

// Nav thickens once content scrolls beneath it
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 20);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile menu
const closeMenu = () => {
    nav.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
};
navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
});
navLinks.forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', (e) => {
    if (nav.classList.contains('nav-open') && !nav.contains(e.target)) closeMenu();
});

// Highlight the nav link for the section currently in view
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
                link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
            });
        }
    });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(section => sectionObserver.observe(section));

// Reveal-on-scroll: one quiet fade-and-rise per element, first time only
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
