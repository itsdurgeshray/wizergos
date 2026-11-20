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
    links.forEach(function (a) { var id = a.getAttribute('href').slice(1), t = id && document.getElementById(id); if (t) spy.observe(t); });
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

  // horizontal tabs: pill buttons switch the panel below; data-auto="ms" advances on its own while in view
  document.querySelectorAll('.tabx').forEach(function (box) {
    var nav = box.querySelector('.tabx-nav'), btns = Array.prototype.slice.call(box.querySelectorAll('.tabx-nav button')), panes = Array.prototype.slice.call(box.querySelectorAll('.tabx-pane'));
    var cur = Math.max(0, btns.findIndex(function (b) { return b.getAttribute('aria-selected') === 'true'; }));
    function show(i, user) {
      cur = i;
      btns.forEach(function (x, k) { x.setAttribute('aria-selected', k === i); });
      panes.forEach(function (p, k) { p.hidden = k !== i; if (k === i && !user) { p.classList.remove('swap'); void p.offsetWidth; p.classList.add('swap'); } });
      var b = btns[i]; nav.scrollTo({ left: b.offsetLeft - (nav.clientWidth - b.offsetWidth) / 2, behavior: 'smooth' });
      if (typeof fit === 'function') fit();
      if (auto) restart();
    }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { show(i, true); }); });
    var auto = !figma && !matchMedia('(prefers-reduced-motion: reduce)').matches && parseInt(box.getAttribute('data-auto'), 10), timer = 0, seen = false, held = false;
    function restart() {
      clearTimeout(timer); box.classList.remove('ticking'); void box.offsetWidth;
      if (!seen || held) return;
      box.classList.add('ticking'); timer = setTimeout(function () { show((cur + 1) % btns.length); }, auto);
    }
    if (auto) {
      box.style.setProperty('--tick', auto + 'ms');
      box.addEventListener('pointerenter', function () { held = true; restart(); });
      box.addEventListener('pointerleave', function () { held = false; restart(); });
      box.addEventListener('focusin', function () { held = true; restart(); });
      box.addEventListener('focusout', function () { held = false; restart(); });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { seen = en[0].isIntersecting; restart(); }, { threshold: .35 }).observe(box);
    }
  });

  // video language picker: updates the label and data-lang; a real video swaps to data-src-<lang> when present
  document.querySelectorAll('.vlang').forEach(function (v) {
    var btn = v.querySelector('.vl-btn'), menu = v.querySelector('.vl-menu'), opts = Array.prototype.slice.call(menu.querySelectorAll('li')), player = v.closest('.vplayer');
    opts.forEach(function (o) { o.tabIndex = -1; });
    function close() { v.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); var o = !v.classList.contains('open'); v.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); if (o) (menu.querySelector('[aria-selected="true"]') || opts[0]).focus(); });
    function pick(o) {
      opts.forEach(function (x) { x.setAttribute('aria-selected', x === o); });
      v.querySelector('.vl-cur').textContent = o.querySelector('span').textContent;
      if (player) { player.setAttribute('data-lang', o.dataset.lang); var vid = player.querySelector('video'), src = vid && vid.getAttribute('data-src-' + o.dataset.lang); if (src) { var t = vid.currentTime; vid.src = src; vid.currentTime = t; } }
      close(); btn.focus();
    }
    opts.forEach(function (o, i) {
      o.addEventListener('click', function (e) { e.stopPropagation(); pick(o); });
      o.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(o); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); opts[(i + 1) % opts.length].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); opts[(i - 1 + opts.length) % opts.length].focus(); }
        else if (e.key === 'Escape') { close(); btn.focus(); }
      });
    });
    document.addEventListener('click', function (e) { if (!v.contains(e.target)) close(); });
  });

  // article pages: reading progress, contents highlight, share links
  var art = document.querySelector('.prose');
  if (art) {
    var bar = document.querySelector('.rprog');
    var tocs = Array.prototype.slice.call(document.querySelectorAll('.toc ol a'));
    var heads = tocs.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var onScroll = function () {
      var r = art.getBoundingClientRect(), k = Math.min(1, Math.max(0, (innerHeight * .35 - r.top) / r.height));
      if (bar) bar.style.setProperty('--rp', k.toFixed(3));
      var cur = -1; heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < innerHeight * .3) cur = i; });
      tocs.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    var u = encodeURIComponent(location.href.split('#')[0]), ti = encodeURIComponent(document.title);
    document.querySelectorAll('[data-share="linkedin"]').forEach(function (a) { a.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + u; });
    document.querySelectorAll('[data-share="x"]').forEach(function (a) { a.href = 'https://x.com/intent/post?url=' + u + '&text=' + ti; });
    document.querySelectorAll('[data-share="copy"]').forEach(function (b) { b.addEventListener('click', function () {
      var done = function () { b.querySelector('.copied').textContent = 'Link copied'; b.classList.add('done'); setTimeout(function () { b.classList.remove('done'); }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(location.href.split('#')[0]).then(done, done); else done();
    }); });
  }

  // scroll stories: pinned services track, process path, outcome statements, capability stage, outcome lines
  (function () {
    var still = figma || matchMedia('(prefers-reduced-motion: reduce)').matches;
    var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
    var jobs = [];
    // services: pinned horizontal track (desktop), swipe row (phone)
    document.querySelectorAll('.hsx').forEach(function (sec) {
      var track = sec.querySelector('.hsx-track'), view = sec.querySelector('.hsx-view'), cards = Array.prototype.slice.call(track.children), n = cards.length;
      var count = sec.querySelector('.hsx-count b'), bar = sec.querySelector('.hsx-bar'), dist = 0, last = -1;
      function mark(i) { if (i === last) return; last = i; cards.forEach(function (c, k) { c.classList.toggle('on', k === i); }); if (count) count.textContent = (i + 1 < 10 ? '0' : '') + (i + 1); if (bar) bar.style.setProperty('--hp', ((i + 1) / n).toFixed(3)); }
      function setup() {
        var pin = !still && innerWidth > 760;
        sec.classList.toggle('pinned', pin); track.style.transform = ''; sec.style.height = '';
        if (pin) { dist = Math.max(0, track.scrollWidth - innerWidth); sec.style.height = (innerHeight + dist) + 'px'; }
      }
      setup(); addEventListener('resize', setup);
      view.addEventListener('scroll', function () { if (!sec.classList.contains('pinned')) mark(Math.round(view.scrollLeft / Math.max(1, view.scrollWidth - view.clientWidth) * (n - 1))); }, { passive: true });
      jobs.push(function () {
        if (!sec.classList.contains('pinned')) return;
        var r = sec.getBoundingClientRect(), k = clamp(-r.top / Math.max(1, r.height - innerHeight));
        track.style.transform = 'translate3d(' + (-k * dist).toFixed(1) + 'px,0,0)';
        mark(Math.round(k * (n - 1)));
      });
      mark(0);
    });
    // process path
    document.querySelectorAll('.pline').forEach(function (ol) {
      var steps = Array.prototype.slice.call(ol.children);
      if (still) { steps.forEach(function (s) { s.classList.add('on'); }); ol.style.setProperty('--pl', 1); return; }
      jobs.push(function () {
        var r = ol.getBoundingClientRect(), line = innerHeight * .6;
        ol.style.setProperty('--pl', clamp((line - r.top - 28) / Math.max(1, r.height - 56)).toFixed(3));
        steps.forEach(function (s) { var b = s.querySelector('.pl-node').getBoundingClientRect(); s.classList.toggle('on', b.top + b.height / 2 < line); });
      });
    });
    // outcome statements
    document.querySelectorAll('.stmt-list').forEach(function (ol) {
      var li = Array.prototype.slice.call(ol.children);
      if (still) { li.forEach(function (x) { x.classList.add('lit'); }); return; }
      jobs.push(function () { li.forEach(function (x) { var b = x.getBoundingClientRect(); x.classList.toggle('lit', b.top + b.height / 2 < innerHeight * .64); }); });
    });
    // capability stage
    document.querySelectorAll('.cstory').forEach(function (cs) {
      var items = Array.prototype.slice.call(cs.querySelectorAll('.cs-item')), ics = cs.querySelectorAll('.cs-ic'), tts = cs.querySelectorAll('.cs-t'), cnt = cs.querySelector('.cs-count b'), vis = cs.querySelector('.cs-vis'), n = items.length, last = -1;
      function mark(i) {
        if (i === last) return; last = i;
        items.forEach(function (x, k) { x.classList.toggle('on', k === i); });
        Array.prototype.forEach.call(ics, function (x, k) { x.classList.toggle('on', k === i); });
        Array.prototype.forEach.call(tts, function (x, k) { x.classList.toggle('on', k === i); });
        if (cnt) cnt.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
        if (vis) vis.style.setProperty('--cp', ((i + 1) / n).toFixed(3));
      }
      mark(0);
      if (still) { items.forEach(function (x) { x.classList.add('on'); }); return; }
      jobs.push(function () { var i = 0; items.forEach(function (x, k) { if (x.getBoundingClientRect().top < innerHeight * .5) i = k; }); mark(i); });
    });
    // outcome lines from the seal to each outcome
    document.querySelectorAll('.medal').forEach(function (m, mi) {
      var seal = m.querySelector('.seal'), bns = Array.prototype.slice.call(m.querySelectorAll('.bn'));
      if (!seal || !bns.length) return;
      bns.sort(function (a, b) { return (+(a.querySelector('small') || {}).textContent || 0) - (+(b.querySelector('small') || {}).textContent || 0); });
      var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), fgs = [], dots = [];
      svg.setAttribute('class', 'mlines'); svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = '<defs><linearGradient id="mlg' + mi + '" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8B7CF6"/><stop offset="1" stop-color="#4FB5E3"/></linearGradient></defs>';
      m.insertBefore(svg, m.firstChild);
      function draw() {
        if (innerWidth <= 1080) return;
        var mr = m.getBoundingClientRect(), sr = seal.getBoundingClientRect(), cx = sr.left - mr.left + sr.width / 2, cy = sr.top - mr.top + sr.height / 2, rad = sr.width * .36;
        svg.querySelectorAll('path, circle').forEach(function (e) { e.remove(); }); fgs = []; dots = [];
        var g = svg.querySelector('linearGradient'); g.setAttribute('x1', 0); g.setAttribute('x2', mr.width);
        bns.forEach(function (b) {
          var ir = b.querySelector('.ic').getBoundingClientRect(), x = ir.left - mr.left + ir.width / 2, y = ir.top - mr.top + ir.height / 2;
          var dir = x < cx ? -1 : 1, ang = Math.atan2(y - cy, x - cx), sx = cx + Math.cos(ang) * rad, sy = cy + Math.sin(ang) * rad, ex = x - dir * (ir.width / 2 + 6);
          var d = 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ' C ' + ((sx + ex) / 2).toFixed(1) + ' ' + sy.toFixed(1) + ', ' + ((sx + ex) / 2).toFixed(1) + ' ' + y.toFixed(1) + ', ' + ex.toFixed(1) + ' ' + y.toFixed(1);
          var bg = document.createElementNS(NS, 'path'); bg.setAttribute('d', d); bg.setAttribute('class', 'bg'); svg.appendChild(bg);
          var fg = document.createElementNS(NS, 'path'); fg.setAttribute('d', d); fg.setAttribute('class', 'fg'); fg.setAttribute('pathLength', '1'); fg.style.stroke = 'url(#mlg' + mi + ')'; svg.appendChild(fg); fgs.push(fg);
          var c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', ex.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); c.setAttribute('r', 4); c.setAttribute('class', 'dot'); svg.appendChild(c); dots.push(c);
        });
      }
      var drawn = false, k0 = -1;
      function apply(k) { if (k === k0) return; k0 = k; bns.forEach(function (b, i) { var on = i < k; b.classList.toggle('lit', on); if (fgs[i]) fgs[i].classList.toggle('on', on); if (dots[i]) dots[i].classList.toggle('on', on); }); }
      if (still) { draw(); apply(bns.length); return; }
      m.classList.add('lining');
      addEventListener('resize', function () { drawn = false; k0 = -1; });
      jobs.push(function () {
        if (!drawn) { draw(); drawn = true; }
        var r = m.getBoundingClientRect(), p = clamp((innerHeight * .8 - r.top) / (r.height + innerHeight * .2));
        apply(Math.round(p * bns.length));
      });
    });
    if (!jobs.length) return;
    var tick = 0;
    function run() { tick = 0; jobs.forEach(function (f) { f(); }); }
    addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(run); }, { passive: true });
    addEventListener('resize', function () { if (!tick) tick = requestAnimationFrame(run); });
    addEventListener('load', run); run();
  })();

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


  // hero light field: WebGL contour lines over warped noise; the cursor is a lens, speed bends harder, clicks ripple
  (function () {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (figma) return;
    var FS = '#version 300 es\nprecision highp float;\nuniform vec2 r;uniform float t,mv,dk;uniform vec2 m;uniform vec3 rp;out vec4 o;\n' +
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n' +
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}\n' +
      'float fb(vec2 p){float v=0.,a=.5;for(int i=0;i<3;i++){v+=a*n(p);p=p*1.9+17.;a*=.45;}return v;}\n' +
      'void main(){vec2 uv=gl_FragCoord.xy/r;vec2 p=(gl_FragCoord.xy-.5*r)/r.y;vec2 mp=(m-.5*r)/r.y;vec2 d=p-mp;float dl=length(d);\n' +
      'vec2 q=p-d*exp(-dl*dl*6.)*(.55+mv*1.2);\n' +
      'vec2 rc=(rp.xy-.5*r)/r.y;float rd=length(p-rc),rr=rp.z*.75,ring=exp(-pow((rd-rr)*10.,2.))*max(0.,1.-rp.z*.7);q+=(p-rc)*ring*.08;\n' +
      'float T=t*.05;vec2 w=vec2(fb(q*.9+vec2(T,-T*.7)),fb(q*.9+vec2(-T*.8,T)+5.2));float f=fb(q*.7+w*1.3+T*.6);\n' +
      'float k=f*18.;float ln=1.-clamp(abs(fract(k)-.5)/max(fwidth(k),1e-4)*1.1,0.,1.);\n' +
      'float pulse=smoothstep(.9,1.,fract(f*3.-t*.12))*1.4;float spot=exp(-dl*dl*7.);\n' +
      'vec3 c1=mix(vec3(.12,.55,.8),vec3(.5,.8,.95),f);vec3 c2=vec3(.55,.49,.96);vec3 c=mix(c1,c2,spot*.55+ring*.6);\n' +
      'if(dk<.5)c=mix(vec3(.06,.37,.58),vec3(.12,.55,.8),f),c=mix(c,vec3(.43,.36,.88),spot*.5+ring*.6);\n' +
      'float mask=mix(.3,1.,smoothstep(.15,.75,uv.x))*smoothstep(0.,.18,uv.y)*smoothstep(1.,.85,uv.y);\n' +
      'float a=ln*(.05+spot*.6+pulse*.12+ring*.5)*mask;a+=spot*.04*mask;a*=mix(.8,1.,dk);\n' +
      'o=vec4(c*a,a);}';
    var VS = '#version 300 es\nin vec2 v;void main(){gl_Position=vec4(v,0,1);}';
    document.querySelectorAll('.hero, .phero').forEach(function (h) {
      var cv = document.createElement('canvas'); cv.className = 'hfx'; cv.setAttribute('aria-hidden', 'true');
      var gl = cv.getContext('webgl2', { premultipliedAlpha: true, antialias: false, alpha: true }); if (!gl) return;
      function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
      var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
      h.insertBefore(cv, h.firstChild); h.classList.add('has-field');
      gl.useProgram(pr); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var lv = gl.getAttribLocation(pr, 'v'); gl.enableVertexAttribArray(lv); gl.vertexAttribPointer(lv, 2, gl.FLOAT, false, 0, 0);
      var U = {}; ['r', 't', 'mv', 'dk', 'm', 'rp'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });
      var W = 0, H = 0, dpr = Math.min(1.5, window.devicePixelRatio || 1);
      function size() { var r = h.getBoundingClientRect(); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); gl.viewport(0, 0, cv.width, cv.height); }
      size(); addEventListener('resize', size);
      var tx = .72, ty = .45, sx = tx, sy = ty, vel = 0, rip = { x: 0, y: 0, t: -9 }, vis = true, raf = 0, t0 = performance.now(), last = 0, idle = true;
      h.addEventListener('pointermove', function (e) { var r = h.getBoundingClientRect(); tx = (e.clientX - r.left) / W; ty = (e.clientY - r.top) / H; idle = false; });
      h.addEventListener('pointerleave', function () { idle = true; });
      h.addEventListener('pointerdown', function (e) { var r = h.getBoundingClientRect(); rip = { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; });
      function frame(now) {
        raf = 0; if (!vis) return;
        var t = (now - t0) / 1000;
        if (idle) { tx = .7 + Math.sin(t * .23) * .14; ty = .48 + Math.cos(t * .31) * .18; }
        var px = sx, py = sy; sx += (tx - sx) * .08; sy += (ty - sy) * .08;
        vel += (Math.min(1, Math.hypot(sx - px, sy - py) * 40) - vel) * .1;
        gl.uniform2f(U.r, cv.width, cv.height); gl.uniform1f(U.t, t); gl.uniform1f(U.mv, vel);
        gl.uniform1f(U.dk, document.documentElement.getAttribute('data-mode') === 'dark' ? 1 : 0);
        gl.uniform2f(U.m, sx * cv.width, (1 - sy) * cv.height);
        gl.uniform3f(U.rp, rip.x * dpr, (H - rip.y) * dpr, (now - rip.t) / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (!reduce) raf = requestAnimationFrame(frame);
      }
      if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis && !raf) raf = requestAnimationFrame(frame); }).observe(h);
      raf = requestAnimationFrame(frame);
    });
  })();

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
