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
// The whole page is dark now, so the nav stays in its smoked-glass style
nav.classList.add('on-dark');
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
            const el = entry.target;
            el.classList.add('is-visible');
            revealObserver.unobserve(el);
            // once revealed, hand the element back to its own hover transitions
            const delay = parseInt(getComputedStyle(el).getPropertyValue('--d')) || 0;
            setTimeout(() => el.classList.remove('reveal', 'is-visible'), 900 + delay);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Light / dark switch: remembers the visitor's choice; the hero chart listens for 'themechange'
const themeBtn = document.querySelector('.theme-toggle');
const root = document.documentElement;
const syncThemeBtn = () => {
    const light = root.getAttribute('data-theme') === 'light';
    themeBtn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
};
if (themeBtn) {
    syncThemeBtn();
    themeBtn.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        root.classList.add('theme-anim');
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
        syncThemeBtn();
        document.dispatchEvent(new CustomEvent('themechange', { detail: next }));
        setTimeout(() => root.classList.remove('theme-anim'), 500);
    });
}
