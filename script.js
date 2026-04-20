(() => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  const form = document.querySelector('.contact-form');
  const year = document.getElementById('year');

  if (year) year.textContent = new Date().getFullYear();

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 6);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const open = mobileNav.dataset.open === 'true';
      mobileNav.dataset.open = String(!open);
      mobileNav.hidden = open;
      toggle.setAttribute('aria-expanded', String(!open));
    });
    mobileNav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        mobileNav.dataset.open = 'false';
        mobileNav.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (form) {
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('#name');
      const email = form.querySelector('#email');
      if (!name.value.trim() || !email.value.trim()) {
        status.textContent = 'Please add your name and email so we can reply.';
        return;
      }
      status.textContent = `Thanks, ${name.value.trim().split(' ')[0]} — we'll be in touch within one business day.`;
      form.reset();
    });
  }
})();
