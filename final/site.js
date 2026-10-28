(function () {
  var root = document.documentElement, figma = root.classList.contains('figma');
  if (!figma) root.classList.add('js');

  document.getElementById('themeToggle').addEventListener('click', function () {
    var next = root.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('wzf-theme', next); } catch (e) {}
    window.wzMode();
  });

  // header: glass once scrolled, drawer on small screens
  var header = document.querySelector('header.site'), burger = document.getElementById('burger'), drawer = document.getElementById('drawer');
  function onScroll() { header.classList.toggle('scrolled', scrollY > 8); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', function () {
    var o = drawer.classList.toggle('open');
    burger.setAttribute('aria-expanded', o);
    header.classList.toggle('menu-open', o);
  });
  drawer.addEventListener('click', function (e) { if (e.target.closest('a')) { drawer.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); header.classList.remove('menu-open'); } });

  // dropdowns: hover on desktop, click and Escape for touch and keyboards
  var dds = Array.prototype.slice.call(document.querySelectorAll('.dd'));
  function closeAll(except) { dds.forEach(function (d) { if (d !== except) { d.classList.remove('open'); d.firstElementChild.setAttribute('aria-expanded', 'false'); } }); }
  dds.forEach(function (d) {
    var b = d.firstElementChild;
    b.addEventListener('click', function (e) { e.stopPropagation(); var o = !d.classList.contains('open'); closeAll(d); d.classList.toggle('open', o); b.setAttribute('aria-expanded', o); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.dd')) closeAll(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });

  // scale fixed-size illustrations to their column
  var stages = document.querySelectorAll('[data-fit]');
  function fit() { stages.forEach(function (st) { if (st.clientWidth) st.firstElementChild.style.transform = 'scale(' + (st.clientWidth / +st.dataset.fit) + ')'; }); }
  if (stages.length) { fit(); addEventListener('resize', fit); }

  // tab lists: panels beside the list on desktop, an accordion under each title below 1080px
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, acc = matchMedia('(max-width: 1080px)');
  document.querySelectorAll('.ctabs').forEach(function (ctabs) {
    var tabs = Array.prototype.slice.call(ctabs.querySelectorAll('.ctab')), ti = 0, ttimer, home = ctabs.nextElementSibling;
    function pick(i) {
      ti = i;
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i); document.getElementById(t.dataset.p).classList.toggle('on', k === i); var p = t.querySelector('.pg'); if (p) { p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; } });
      fit();
    }
    function layout() {
      tabs.forEach(function (t) { var p = document.getElementById(t.dataset.p); if (acc.matches) t.after(p); else home.appendChild(p); });
      if (acc.matches) { clearInterval(ttimer); ctabs.classList.remove('auto'); }
      fit();
    }
    layout(); if (acc.addEventListener) acc.addEventListener('change', layout);
    tabs.forEach(function (t, i) { t.addEventListener('click', function () {
      clearInterval(ttimer); ctabs.classList.remove('auto');
      if (acc.matches && ti === i && t.getAttribute('aria-selected') === 'true') { t.setAttribute('aria-selected', 'false'); document.getElementById(t.dataset.p).classList.remove('on'); return; }
      pick(i);
      if (acc.matches) { var r = t.getBoundingClientRect(); if (r.top < 88) scrollBy(0, r.top - 96); }
    }); });
    if (!figma && !reduce && !acc.matches && ctabs.classList.contains('auto')) ttimer = setInterval(function () { if (!document.hidden) pick((ti + 1) % tabs.length); }, 8000); else ctabs.classList.remove('auto');
  });

  // in-page switcher follows the section in view
  var sub = document.querySelector('.subnav');
  if (sub && !figma && 'IntersectionObserver' in window) {
    var links = Array.prototype.slice.call(sub.querySelectorAll('a[href^="#"]'));
    var spy = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + x.target.id); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var t = document.querySelector(a.getAttribute('href')); if (t) spy.observe(t); });
  }

  // contact form: maps to the HubSpot form fields; posts only when data-live="true"
  var form = document.getElementById('contactForm');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = form.querySelector('[name="email"]');
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    email.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (!ok) { email.focus(); return; }
    var done = function () { form.classList.add('sent'); };
    if (form.dataset.live !== 'true') { done(); return; }
    var fields = ['firstname', 'lastname', 'email', 'phone', 'message'].map(function (n) { return { objectTypeId: '0-1', name: n, value: (form.querySelector('[name="' + n + '"]') || {}).value || '' }; });
    fetch('https://api.hsforms.com/submissions/v3/integration/submit/' + form.dataset.portal + '/' + form.dataset.form, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: fields, context: { pageUri: location.href, pageName: document.title } })
    }).then(done, done);
  });

  if (!figma && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.rv').forEach(function (el, i) { el.style.transitionDelay = ((i % 3) * 80) + 'ms'; io.observe(el); });
  }
})();
