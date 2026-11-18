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

  // horizontal tabs: pill buttons switch the panel below
  document.querySelectorAll('.tabx').forEach(function (box) {
    var btns = Array.prototype.slice.call(box.querySelectorAll('.tabx-nav button')), panes = Array.prototype.slice.call(box.querySelectorAll('.tabx-pane'));
    btns.forEach(function (b, i) { b.addEventListener('click', function () {
      btns.forEach(function (x, k) { x.setAttribute('aria-selected', k === i); });
      panes.forEach(function (p, k) { p.hidden = k !== i; });
      b.scrollIntoView({ block: 'nearest', inline: 'center' }); fit();
    }); });
  });

  // before and after slider
  document.querySelectorAll('.ba').forEach(function (ba) {
    var r = ba.querySelector('input[type=range]');
    function set() { ba.style.setProperty('--pos', r.value + '%'); }
    r.addEventListener('input', set); set();
  });

  // ROI estimate: interviews x minutes saved, in hours
  document.querySelectorAll('.roi').forEach(function (f) {
    var ins = f.querySelectorAll('input'), out = f.querySelector('[data-out]');
    function calc() { var v = +ins[0].value || 0, a = +ins[1].value || 0, b = +ins[2].value || 0; out.textContent = Math.round(Math.max(0, v * (a - b) / 60)).toLocaleString('en-IN'); }
    Array.prototype.forEach.call(ins, function (i) { i.addEventListener('input', calc); }); calc();
  });

  // floating contact widget
  var cw = document.querySelector('.chatw');
  if (cw) cw.querySelector('.chatw-btn').addEventListener('click', function () { var o = cw.classList.toggle('open'); this.setAttribute('aria-expanded', o); });

  // forms with states: validation, loading, success, error. Preview forms do not send data.
  document.querySelectorAll('form[data-states]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var em = f.querySelector('input[type=email]'), ok = !em || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim());
      f.classList.remove('is-error', 'is-success');
      if (em) em.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok) { em.focus(); return; }
      f.classList.add('is-loading');
      setTimeout(function () { f.classList.remove('is-loading'); f.classList.add(f.dataset.states === 'error' ? 'is-error' : 'is-success'); }, 900);
    });
  });

  // hero leans toward the cursor; cards catch a soft light
  var calm = figma || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!calm && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.hero, .phero').forEach(function (h) {
      var raf;
      h.addEventListener('pointermove', function (e) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () { var r = h.getBoundingClientRect(); h.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5).toFixed(3)); h.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5).toFixed(3)); });
      });
      h.addEventListener('pointerleave', function () { h.style.setProperty('--mx', 0); h.style.setProperty('--my', 0); });
    });
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.ft, .pc, .door, .plan, .fx-node, .job, .val');
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--px', (e.clientX - r.left) + 'px'); c.style.setProperty('--py', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }


  // hero field: dot grid that brightens and parts around the cursor, with a glowing comet trail and click ripples
  if (!calm) document.querySelectorAll('.hero, .phero').forEach(function (h) {
    var cv = document.createElement('canvas'); cv.className = 'hfx'; cv.setAttribute('aria-hidden', 'true'); h.insertBefore(cv, h.firstChild);
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1), G = 32;
    var p = { x: -999, y: -999, on: false }, s = { x: -999, y: -999 }, trail = [], rip = [], vis = true, raf = 0, t0 = performance.now();
    function size() { var r = h.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener('resize', size);
    function col(a) { return document.documentElement.getAttribute('data-mode') === 'dark' ? 'rgba(127,205,242,' + a + ')' : 'rgba(31,141,203,' + a + ')'; }
    h.addEventListener('pointermove', function (e) { var r = h.getBoundingClientRect(); p.x = e.clientX - r.left; p.y = e.clientY - r.top; if (!p.on) { s.x = p.x; s.y = p.y; } p.on = true; });
    h.addEventListener('pointerleave', function () { p.on = false; });
    h.addEventListener('pointerdown', function (e) { var r = h.getBoundingClientRect(); rip.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis && !raf) raf = requestAnimationFrame(draw); }).observe(h);
    function draw(now) {
      raf = 0; if (!vis) return;
      var t = (now - t0) / 1000; ctx.clearRect(0, 0, W, H);
      s.x += (p.x - s.x) * .18; s.y += (p.y - s.y) * .18;
      if (p.on) trail.unshift({ x: s.x, y: s.y }); else if (trail.length) trail.pop();
      if (trail.length > 28) trail.length = 28;
      var R = 180, dark = document.documentElement.getAttribute('data-mode') === 'dark';
      for (var y = G / 2; y < H; y += G) for (var x = G / 2; x < W; x += G) {
        var wave = .5 + .5 * Math.sin(x * .012 + y * .008 - t * 1.2), dx = x - s.x, dy = y - s.y, d = Math.sqrt(dx * dx + dy * dy), k = p.on ? Math.max(0, 1 - d / R) : 0;
        var ox = k ? dx / (d || 1) * k * 14 : 0, oy = k ? dy / (d || 1) * k * 14 : 0;
        for (var i = 0; i < rip.length; i++) { var q = rip[i], rr = (now - q.t) / 1000 * 520, dd = Math.hypot(x - q.x, y - q.y), band = Math.max(0, 1 - Math.abs(dd - rr) / 48) * Math.max(0, 1 - rr / 700); k = Math.max(k, band); }
        ctx.fillStyle = col((dark ? .16 : .2) + wave * .1 + k * .75);
        ctx.beginPath(); ctx.arc(x + ox, y + oy, 1 + k * 2.2, 0, 6.283); ctx.fill();
      }
      rip = rip.filter(function (q) { return now - q.t < 1400; });
      if (trail.length > 2) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (var j = 1; j < trail.length; j++) {
          var a = 1 - j / trail.length; ctx.strokeStyle = col(a * .55); ctx.lineWidth = 10 * a + 1;
          ctx.shadowColor = col(.8); ctx.shadowBlur = 16 * a;
          ctx.beginPath(); ctx.moveTo(trail[j - 1].x, trail[j - 1].y); ctx.lineTo(trail[j].x, trail[j].y); ctx.stroke();
        }
        ctx.shadowBlur = 0;
        var g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 28); g.addColorStop(0, col(.55)); g.addColorStop(1, col(0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, 28, 0, 6.283); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
  });

  // numbers count up when they come into view
  if (!calm && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (en) { en.forEach(function (x) {
      if (!x.isIntersecting) return; cio.unobserve(x.target);
      var el = x.target, m = el.textContent.match(/^(\d[\d,.]*)(.*)$/); if (!m) return;
      var end = parseFloat(m[1].replace(/,/g, '')), dec = (m[1].split('.')[1] || '').length, suf = m[2], t0 = performance.now();
      if (end >= 1900 && end <= 2100) return;
      (function step(t) { var k = Math.min(1, (t - t0) / 1400), v = end * (1 - Math.pow(1 - k, 3)); el.textContent = (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-IN')) + suf; if (k < 1) requestAnimationFrame(step); else el.textContent = m[1] + suf; })(t0);
    }); }, { threshold: .6 });
    document.querySelectorAll('.metric .v .acc, .metric .v.acc, .roi-out b, .fmap-count b').forEach(function (el) { if (!el.hasAttribute('data-out')) cio.observe(el); });
  }

  // friction map: tap opens a point, hover previews it
  document.querySelectorAll('.fnode > button').forEach(function (b) {
    b.addEventListener('click', function () {
      var li = b.parentElement, o = !li.classList.contains('open');
      li.parentElement.querySelectorAll('.fnode.open').forEach(function (x) { x.classList.remove('open'); x.firstElementChild.setAttribute('aria-expanded', 'false'); });
      li.classList.toggle('open', o); b.setAttribute('aria-expanded', o);
    });
  });

  // gallery filters
  document.querySelectorAll('[data-gallery]').forEach(function (g) {
    var bar = document.querySelector('[data-filters="' + g.dataset.gallery + '"]'); if (!bar) return;
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      bar.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      g.querySelectorAll('[data-cat]').forEach(function (c) { c.hidden = b.dataset.f !== 'all' && c.dataset.cat !== b.dataset.f; });
    });
  });

  // careers: job details and application in a dialog
  var dlg = document.getElementById('jobDialog');
  if (dlg) {
    document.querySelectorAll('[data-apply]').forEach(function (b) {
      b.addEventListener('click', function () {
        var j = b.closest('.job'), info = dlg.querySelector('.jd-info');
        info.querySelector('h2').textContent = j ? j.dataset.title : 'Share your profile';
        info.querySelector('.jm').innerHTML = j ? j.querySelector('.jm').innerHTML : '<span>careers@wizergos.com</span>';
        info.querySelector('.jd-desc').innerHTML = j ? j.querySelector('.jd-src').innerHTML : '<p>Tell us a little about yourself. We’d love to hear what you could bring to the team.</p>';
        var f = dlg.querySelector('form'); f.classList.remove('is-success', 'is-error'); f.querySelector('[name=role]').value = j ? j.dataset.title : 'General application';
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      });
    });
    dlg.querySelector('.jd-x').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  // CV upload: drag and drop, type and size check
  document.querySelectorAll('.upload').forEach(function (u) {
    var inp = u.querySelector('input'), name = u.querySelector('.fname span');
    function take(file) {
      var ok = file && /\.(pdf|docx?)$/i.test(file.name) && file.size <= 5 * 1024 * 1024;
      u.classList.toggle('has', !!ok); u.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (ok) name.textContent = file.name;
    }
    inp.addEventListener('change', function () { take(inp.files[0]); });
    ['dragenter', 'dragover'].forEach(function (t) { u.addEventListener(t, function () { u.classList.add('drag'); }); });
    ['dragleave', 'drop'].forEach(function (t) { u.addEventListener(t, function () { u.classList.remove('drag'); }); });
    u.closest('form').addEventListener('submit', function (e) { if (!u.classList.contains('has')) { u.setAttribute('aria-invalid', 'true'); e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  });

  if (!figma && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('.rv').forEach(function (el, i) { el.style.transitionDelay = ((i % 3) * 80) + 'ms'; io.observe(el); });
  }
})();
