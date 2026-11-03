(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  function animate(node, frames, options) {
    if (reduced.matches || !node.animate) return;
    const animation = node.animate(frames, options);
    running.add(animation);
    animation.onfinish = animation.oncancel = () => running.delete(animation);
  }
  const stop = () => { for (const a of [...running]) a.cancel(); };
  const blocks = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (entry.target.contains(document.activeElement)) return;
        const distance = innerWidth < 700 ? 22 : 46;
        const x = entry.target.dataset.direction === 'right' ? distance : -distance;
        animate(entry.target, [
          {opacity: 0, transform: `translate3d(${x}px,16px,0)`},
          {opacity: 1, transform: 'translate3d(0,0,0)'}
        ], {duration: 800, easing: 'cubic-bezier(.16,1,.3,1)'});
      });
    }, {threshold: .08, rootMargin: '0px 0px -25px 0px'});
    blocks.forEach(block => observer.observe(block));
  }
  document.querySelectorAll('.name-line').forEach((line, i) => {
    animate(line, [
      {clipPath: 'inset(100% 0 0 0)', transform: 'translateY(25px)'},
      {clipPath: 'inset(0 0 0 0)', transform: 'translateY(0)'}
    ], {duration: 1000, delay: i * 120, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards'});
  });
  const progress = document.querySelector('.reading-progress');
  const track = document.querySelector('.word-track');
  let scheduled = false;
  function updateScroll() {
    scheduled = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
    track.style.transform = reduced.matches ? 'translateX(-35px)' : `translateX(${-35 - Math.min(scrollY, 1600) * .09}px)`;
  }
  addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); }
  }, {passive: true});
  addEventListener('resize', updateScroll, {passive: true});
  reduced.addEventListener('change', () => { if (reduced.matches) stop(); updateScroll(); });
  addEventListener('beforeprint', stop);
  document.addEventListener('focusin', stop);
  updateScroll();

  const filterBar = document.querySelector('.filters');
  const filterButtons = [...filterBar.querySelectorAll('button')];
  const groups = [...document.querySelectorAll('[data-group]')];
  const status = document.querySelector('#filter-status');
  function selectFilter(value, button) {
    filterButtons.forEach(b => { const selected = b.dataset.filter === value; b.classList.toggle('active', selected); b.setAttribute('aria-pressed', String(selected)); });
    groups.forEach(group => { group.hidden = value !== 'all' && group.dataset.group !== value; });
    status.textContent = value === 'all' ? 'Exibindo todos os trabalhos.' : `Exibindo trabalhos de ${button.textContent.trim()}.`;
    updateScroll();
  }
  filterBar.hidden = false;
  filterButtons.forEach(button => button.addEventListener('click', () => selectFilter(button.dataset.filter, button)));
  document.querySelectorAll('[data-academic-link]').forEach(link => link.addEventListener('click', () => {
    selectFilter('academico', filterButtons.find(b => b.dataset.filter === 'academico'));
  }));
  document.querySelectorAll('img[data-fallback]').forEach(image => {
    const fallback = () => {
      if (!image.dataset.fallback) return;
      image.src = image.dataset.fallback;
      image.removeAttribute('data-fallback');
      image.alt = 'Capa tipográfica provisória para a matéria sobre Michelle Bolsonaro e a Ypê';
      const credit = image.closest('.feature')?.querySelector('.image-credit');
      if (credit) credit.textContent = 'Capa tipográfica provisória. Fotografia da publicação indisponível.';
    };
    image.addEventListener('error', fallback, {once:true});
    if (image.complete && image.naturalWidth === 0) fallback();
  });
  function revealHashGroup() {
    const target = document.getElementById(location.hash.slice(1));
    const group = target?.closest('[data-group]');
    if (group?.hidden) { selectFilter('all', filterButtons[0]); target.scrollIntoView({behavior:'auto'}); }
  }
  addEventListener('hashchange', revealHashGroup);
  revealHashGroup();

  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-menu');
  function closeMenu() { toggle.setAttribute('aria-expanded','false'); menu.hidden = true; }
  toggle.addEventListener('click', () => {
    const opening = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(opening)); menu.hidden = !opening;
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { closeMenu(); toggle.focus(); } });
  document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target) && !toggle.contains(e.target)) closeMenu(); });
  matchMedia('(min-width: 701px)').addEventListener('change', e => { if (e.matches) closeMenu(); });
})();
