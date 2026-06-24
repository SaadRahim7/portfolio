/* ============================================================
   Saad Rahim — Futuristic B&W Portfolio · interaction engine
   Vanilla JS · 3-tier responsive (desktop / tablet / mobile)
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  /* ---------- environment / tier ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var mqDesktop = window.matchMedia('(min-width: 1200px)');
  var isDesktop = mqDesktop.matches;
  var heavy = isDesktop && canHover && !reduceMotion;   // parallax, cursor, float, magnetic

  var lerp = function (a, b, n) { return a + (b - a) * n; };
  var clamp = function (v, mn, mx) { return Math.max(mn, Math.min(mx, v)); };
  function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- back to top ---------- */
  var toTop = document.getElementById('toTop');
  if (toTop) {
    var toggleToTop = function () {
      if (window.pageYOffset > window.innerHeight * 0.6) toTop.classList.add('show');
      else toTop.classList.remove('show');
    };
    window.addEventListener('scroll', toggleToTop, { passive: true });
    toggleToTop();
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- greeter robot → opens the game ---------- */
  var bot = document.getElementById('bot');
  if (bot) {
    var botBtn = document.getElementById('botBtn');
    setTimeout(function () { bot.classList.add('say'); }, 1000);   // show CTA bubble, keep it visible
    botBtn.addEventListener('click', function () { if (typeof openHoops === 'function') openHoops(); });
  }

  /* ---------- basketball mini-game (Hoops) ---------- */
  var openHoops = (function () {
    var game = document.getElementById('game');
    var canvas = document.getElementById('gCanvas');
    if (!game || !canvas) return null;
    var ctx = canvas.getContext('2d');
    var scoreEl = document.getElementById('gScore');
    var bestEl = document.getElementById('gBest');
    var flash = document.getElementById('gFlash');

    var W = 0, H = 0, dpr = 1;
    var BALLR = 15, RIM = 34, G = 1300, K = 6.5, DRAGCAP = 200;
    var ball, hoop, score = 0, best = 0, aiming = false, aim = { x: 0, y: 0 }, raf = null, last = 0, opened = false;

    try { best = parseInt(localStorage.getItem('hoopsBest') || '0', 10) || 0; } catch (e) {}
    if (bestEl) bestEl.textContent = best;

    function size() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function resetBall() { ball = { x: W / 2, y: H - 46, vx: 0, vy: 0, flying: false }; }
    function placeHoop() { hoop = { x: W / 2, y: H * 0.30 }; }
    function moveHoop() { hoop.x = W * (0.22 + Math.random() * 0.56); }
    function evpos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

    function onDown(e) { if (!ball || ball.flying) return; aiming = true; aim = evpos(e); try { canvas.setPointerCapture(e.pointerId); } catch (er) {} }
    function onMove(e) { if (aiming) aim = evpos(e); }
    function onUp() {
      if (!aiming) return; aiming = false;
      var dx = aim.x - ball.x, dy = aim.y - ball.y, d = Math.hypot(dx, dy);
      if (d < 10) return;
      var power = Math.min(d, DRAGCAP) * K;
      ball.vx = (dx / d) * power; ball.vy = (dy / d) * power; ball.flying = true;
    }

    function scored() {
      score++; if (scoreEl) scoreEl.textContent = score;
      if (score > best) { best = score; if (bestEl) bestEl.textContent = best; try { localStorage.setItem('hoopsBest', String(best)); } catch (e) {} }
      if (flash) { flash.textContent = 'SWISH! +1'; flash.classList.remove('show'); void flash.offsetWidth; flash.classList.add('show'); }
      ball.flying = false;
      setTimeout(function () { if (opened) { moveHoop(); resetBall(); } }, 480);
    }

    function step(ts) {
      raf = requestAnimationFrame(step);
      if (!last) last = ts;
      var dt = Math.min((ts - last) / 1000, 0.032); last = ts;
      if (ball && ball.flying) {
        var prevY = ball.y;
        ball.vy += G * dt;
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.vy > 0 && prevY < hoop.y && ball.y >= hoop.y && Math.abs(ball.x - hoop.x) < RIM - 6) scored();
        if (ball.x < BALLR) { ball.x = BALLR; ball.vx *= -0.6; }
        if (ball.x > W - BALLR) { ball.x = W - BALLR; ball.vx *= -0.6; }
        if (ball.y > H + 70) resetBall();
      }
      draw();
    }

    function drawHoop() {
      var x = hoop.x, y = hoop.y;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2.5;
      ctx.strokeRect(x - 34, y - 64, 68, 44);
      ctx.strokeRect(x - 12, y - 42, 24, 16);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.ellipse(x, y, RIM, 8, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
      for (var i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(x + (i / 3) * RIM, y); ctx.lineTo(x + (i / 3) * RIM * 0.4, y + 34); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(x - RIM * 0.66, y + 17); ctx.lineTo(x + RIM * 0.66, y + 17); ctx.stroke();
    }
    function drawBall() {
      ctx.save(); ctx.translate(ball.x, ball.y);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, BALLR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0a0a0c'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, 0, BALLR, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-BALLR, 0); ctx.lineTo(BALLR, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -BALLR); ctx.lineTo(0, BALLR); ctx.stroke();
      ctx.beginPath(); ctx.arc(-BALLR, 0, BALLR, -0.6, 0.6); ctx.stroke();
      ctx.beginPath(); ctx.arc(BALLR, 0, BALLR, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
      ctx.restore();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      drawHoop();
      if (aiming && ball) {
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(aim.x, aim.y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(aim.x, aim.y, 4, 0, Math.PI * 2); ctx.fill();
      }
      if (ball) drawBall();
    }

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', function () { aiming = false; });

    function close() {
      opened = false;
      game.classList.remove('show'); document.body.style.overflow = '';
      if (raf) cancelAnimationFrame(raf); raf = null;
      setTimeout(function () { game.hidden = true; }, 350);
    }
    var gx = document.getElementById('gameX');
    if (gx) gx.addEventListener('click', close);
    game.addEventListener('click', function (e) { if (e.target === game) close(); });
    document.addEventListener('keydown', function (e) { if (opened && e.key === 'Escape') close(); });
    window.addEventListener('resize', function () { if (opened) { size(); placeHoop(); resetBall(); } });

    return function open() {
      if (opened) return;
      opened = true;
      game.hidden = false;
      requestAnimationFrame(function () { game.classList.add('show'); });
      document.body.style.overflow = 'hidden';
      size(); placeHoop(); resetBall();
      score = 0; if (scoreEl) scoreEl.textContent = '0';
      last = 0;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(step);
    };
  })();

  /* ============================================================
     NAV + progress + menu + active link
     ============================================================ */
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var navLinksWrap = document.getElementById('navLinks');
  var progress = document.getElementById('progress');

  function closeMenu() {
    navLinksWrap.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', function () {
    var open = navLinksWrap.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('scrolled', y > 24);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navLinks = document.querySelectorAll('.nav__link');
  var sections = document.querySelectorAll('section[id]');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var id = en.target.id;
          navLinks.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + id); });
        }
      });
    }, { threshold: 0.4 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ============================================================
     SMOOTH SCROLL (eased, navbar offset)
     ============================================================ */
  var navHeight = 78;
  function smoothScrollTo(targetY, duration) {
    if (reduceMotion) { window.scrollTo(0, targetY); return; }
    var startY = window.scrollY, diff = targetY - startY;
    if (Math.abs(diff) < 2) return;
    var dur = duration || clamp(Math.abs(diff) * 0.55, 500, 1100);
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      window.scrollTo(0, startY + diff * easeInOutCubic(p));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = this.getAttribute('href');
      if (!id || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      navHeight = nav ? nav.offsetHeight : navHeight;   // live navbar height (varies by breakpoint)
      var vh = window.innerHeight;
      var targetTop = target.getBoundingClientRect().top + window.scrollY;
      var sectionH = target.offsetHeight;
      var y;
      if (window.innerWidth >= 768 && sectionH < vh - navHeight) {
        // larger screens: short section → center it vertically
        y = targetTop - (vh - sectionH) / 2;
      } else {
        // phones (or tall sections) → align to top, below the navbar
        y = targetTop - navHeight + 1;
      }
      var maxY = document.documentElement.scrollHeight - vh;
      smoothScrollTo(clamp(y, 0, maxY));
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  /* ============================================================
     TEXT SPLITTING — hero (word mask) + generic word reveal
     ============================================================ */
  var title = document.querySelector('[data-split]');
  if (title) {
    var parts = title.textContent.trim().split(/\s+/);
    title.textContent = '';
    parts.forEach(function (w, i) {
      var outer = document.createElement('span'); outer.className = 'word';
      var inner = document.createElement('span'); inner.className = 'word__inner';
      inner.textContent = w;
      inner.style.setProperty('--d', (i * 0.12) + 's');
      outer.appendChild(inner); title.appendChild(outer);
    });
  }
  document.querySelectorAll('[data-words]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (w, i) {
      var s = document.createElement('span'); s.className = 'w'; s.textContent = w;
      s.style.setProperty('--wd', (i * 0.03) + 's');
      el.appendChild(s);
      el.appendChild(document.createTextNode(' '));
    });
  });

  var heroPlayed = false;
  function playHero() {
    if (heroPlayed) return;
    heroPlayed = true;
    if (title) title.classList.add('in');
    document.querySelectorAll('[data-hero]').forEach(function (el, idx) {
      setTimeout(function () { el.classList.add('in'); }, reduceMotion ? 0 : 200 + idx * 120);
    });
  }

  /* ============================================================
     LOADING SPLASH — counter, then curtain lifts to reveal hero
     ============================================================ */
  var splash = document.getElementById('splash');
  var splashCount = document.getElementById('splashCount');
  var splashFill = document.getElementById('splashFill');
  var docEl = document.documentElement;

  function endSplash() {
    if (splash) splash.classList.add('done');
    docEl.classList.remove('is-loading');
    playHero();                                  // hero animates in as the curtain lifts
    if (splash) setTimeout(function () { splash.style.display = 'none'; }, 950);
  }

  if (splash && !reduceMotion) {
    docEl.classList.add('is-loading');
    var sDur = 1700, sStart = null;
    function runSplash(ts) {
      if (sStart === null) sStart = ts;
      var p = Math.min((ts - sStart) / sDur, 1);
      var val = Math.round(easeInOutCubic(p) * 100);
      if (splashCount) splashCount.textContent = ('00' + val).slice(-3);
      if (splashFill) splashFill.style.width = val + '%';
      if (p < 1) requestAnimationFrame(runSplash);
      else endSplash();
    }
    requestAnimationFrame(runSplash);
  } else {
    if (splash) splash.style.display = 'none';
    playHero();
  }
  // ultimate safety: never leave the hero hidden / page locked
  setTimeout(function () { docEl.classList.remove('is-loading'); if (splash) splash.style.display = 'none'; playHero(); }, 5000);

  /* ============================================================
     REVEAL ENGINE (.reveal + [data-words])
     ============================================================ */
  var revealTargets = document.querySelectorAll('.reveal, [data-words]');
  if ('IntersectionObserver' in window) {
    var revObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var parent = en.target.parentElement;
          var idx = parent ? Array.prototype.indexOf.call(parent.children, en.target) : 0;
          if (en.target.classList.contains('reveal')) en.target.style.transitionDelay = Math.min(idx, 8) * 0.07 + 's';
          en.target.classList.add('in');
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach(function (el) { revObs.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('in'); });
  }

  /* ============================================================
     INDEX / PROJECTS — expandable accordion
     ============================================================ */
  var projectEls = document.querySelectorAll('[data-project]');
  projectEls.forEach(function (li) {
    var bar = li.querySelector('.idx__bar');
    bar.addEventListener('click', function () {
      var isOpen = li.classList.contains('open');
      document.querySelectorAll('[data-project].open').forEach(function (o) {
        o.classList.remove('open');
        o.querySelector('.idx__bar').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) { li.classList.add('open'); bar.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---- project imagery: inline media + floating hover preview ---- */
  var workPreview = document.getElementById('workPreview');
  projectEls.forEach(function (li) {
    var img = li.getAttribute('data-img');
    var media = li.querySelector('.idx__media');
    if (media && img) media.style.setProperty('--img', "url('" + img + "')");
  });
  if (canHover && workPreview) {
    var previewActive = false;
    projectEls.forEach(function (li) {
      var bar = li.querySelector('.idx__bar');
      var img = li.getAttribute('data-img');
      bar.addEventListener('pointerenter', function (e) {
        workPreview.style.left = e.clientX + 'px';
        workPreview.style.top = e.clientY + 'px';
        workPreview.style.setProperty('--img', img ? "url('" + img + "')" : 'none');
        workPreview.classList.add('show');
        previewActive = true;
      });
      bar.addEventListener('pointerleave', function () {
        workPreview.classList.remove('show');
        previewActive = false;
      });
    });
    window.addEventListener('pointermove', function (e) {
      if (!previewActive) return;
      workPreview.style.left = e.clientX + 'px';
      workPreview.style.top = e.clientY + 'px';
    }, { passive: true });
  }

  /* ============================================================
     EXPERIENCE — flowing path build + draw on scroll
     ============================================================ */
  var flow = document.getElementById('flow');
  var flowSvg = document.getElementById('flowSvg');
  var pathBg = document.getElementById('flowPath');
  var pathDraw = document.getElementById('flowDraw');
  var flowItems = document.querySelectorAll('.flow__item');
  var drawLen = 0, svgW = 80, cx = 40, amp = 14;

  function buildFlow() {
    if (!flow || !flowSvg) return;
    var H = flow.clientHeight;
    svgW = flowSvg.clientWidth || 80;
    cx = svgW / 2;
    amp = svgW * 0.18;
    var d = 'M ' + cx + ' 0';
    for (var y = 0; y <= H; y += 16) {
      var x = cx + Math.sin(y / 80) * amp;
      d += ' L ' + x.toFixed(1) + ' ' + y;
    }
    flowSvg.setAttribute('viewBox', '0 0 ' + svgW + ' ' + H);
    pathBg.setAttribute('d', d);
    pathDraw.setAttribute('d', d);
    drawLen = pathDraw.getTotalLength();
    pathDraw.style.strokeDasharray = drawLen;
    pathDraw.style.strokeDashoffset = drawLen;
    // ride nodes on the wave
    flowItems.forEach(function (item) {
      var node = item.querySelector('.flow__node');
      if (!node) return;
      var y = item.offsetTop + 13;
      var x = cx + Math.sin(y / 80) * amp;
      node.style.left = (x - item.offsetLeft) + 'px';
    });
    updateFlow();
  }
  function updateFlow() {
    if (!flow || !drawLen) return;
    var r = flow.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = clamp((vh * 0.72 - r.top) / (r.height * 0.85), 0, 1);
    pathDraw.style.strokeDashoffset = drawLen * (1 - p);
    var drawnY = r.height * p;
    flowItems.forEach(function (item) {
      item.classList.toggle('active', (item.offsetTop + 13) <= drawnY + 4);
    });
  }

  /* ============================================================
     SKILLS — kinetic floating text (cursor repel, desktop)
     ============================================================ */
  var field = document.getElementById('skillField');
  var kws = [];
  var kwPos = [
    { x: 0.06, y: 0.08 }, { x: 0.30, y: 0.03 }, { x: 0.54, y: 0.10 }, { x: 0.78, y: 0.05 },
    { x: 0.90, y: 0.30 }, { x: 0.70, y: 0.34 }, { x: 0.46, y: 0.40 }, { x: 0.22, y: 0.34 },
    { x: 0.04, y: 0.40 }, { x: 0.14, y: 0.66 }, { x: 0.38, y: 0.72 }, { x: 0.62, y: 0.66 },
    { x: 0.84, y: 0.70 }
  ];
  function setupSkills() {
    if (!field) return;
    var nodes = field.querySelectorAll('[data-kw]');
    if (!heavy) { field.classList.add('static'); kws = []; return; }
    field.classList.remove('static');
    var W = field.clientWidth, H = field.clientHeight;
    kws = [];
    nodes.forEach(function (el, i) {
      var pos = kwPos[i % kwPos.length];
      kws.push({
        el: el,
        bx: pos.x * (W - el.offsetWidth),
        by: pos.y * (H - el.offsetHeight),
        phase: i * 1.3, amp: 8 + (i % 3) * 5, cx: 0, cy: 0
      });
      el.style.left = '0px'; el.style.top = '0px';
    });
  }
  setupSkills();

  /* ============================================================
     MAGNETIC + CUSTOM CURSOR
     ============================================================ */
  function magMove(e) {
    if (!heavy) return;
    var el = e.currentTarget;
    var s = el.classList.contains('btn') ? 0.35 : 0.25;
    var r = el.getBoundingClientRect();
    el.style.transform = 'translate(' + ((e.clientX - (r.left + r.width/2)) * s) + 'px,' +
                                          ((e.clientY - (r.top + r.height/2)) * s) + 'px)';
  }
  function magLeave(e) { e.currentTarget.style.transform = ''; }
  document.querySelectorAll('[data-magnetic]').forEach(function (el) {
    el.addEventListener('pointermove', magMove);
    el.addEventListener('pointerleave', magLeave);
  });

  var cursor = document.getElementById('cursor');
  var mx = window.innerWidth / 2, my = window.innerHeight / 2;
  var cxp = mx, cyp = my, nmx = 0, nmy = 0, pmx = 0, pmy = 0;

  if (heavy) {
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      nmx = (e.clientX / window.innerWidth) - 0.5;
      nmy = (e.clientY / window.innerHeight) - 0.5;
      if (cursor && cursor.style.opacity !== '1') cursor.style.opacity = '1';
    });
    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      el.addEventListener('pointerenter', function () { if (cursor) cursor.classList.add('big'); });
      el.addEventListener('pointerleave', function () { if (cursor) cursor.classList.remove('big'); });
    });
    window.addEventListener('pointerout', function (e) { if (!e.relatedTarget && cursor) cursor.style.opacity = '0'; });
  }

  /* ============================================================
     HERO parallax layers
     ============================================================ */
  var parallaxEls = [];
  function collectParallax() {
    parallaxEls = [];
    document.querySelectorAll('[data-parallax-root] [data-depth]').forEach(function (el) {
      if (el.closest('.hero')) parallaxEls.push(el);
    });
  }
  collectParallax();

  /* ============================================================
     Unified rAF loop (cursor + parallax + skills float/repel)
     ============================================================ */
  var t0 = performance.now();
  var frameRunning = false;
  function frame(now) {
    if (!heavy) { frameRunning = false; return; }
    var t = (now - t0) / 1000;

    if (cursor) {
      cxp = lerp(cxp, mx, 0.2); cyp = lerp(cyp, my, 0.2);
      cursor.style.transform = 'translate(' + cxp + 'px,' + cyp + 'px) translate(-50%,-50%)';
    }

    pmx = lerp(pmx, nmx, 0.06); pmy = lerp(pmy, nmy, 0.06);
    for (var k = 0; k < parallaxEls.length; k++) {
      var el = parallaxEls[k];
      var d = parseFloat(el.getAttribute('data-depth')) || 0;
      // ghosts are centered via translate(-50%,-50%); inset-positioned layers are not
      var base = el.classList.contains('ghost') ? 'translate(-50%,-50%) ' : '';
      el.style.transform = base + 'translate3d(' + (-pmx * d * 280) + 'px,' + (-pmy * d * 280) + 'px,0)';
    }

    if (kws.length) {
      var fr = field.getBoundingClientRect();
      var lmx = mx - fr.left, lmy = my - fr.top;
      for (var s = 0; s < kws.length; s++) {
        var kw = kws[s];
        var fx = Math.sin(t * 0.5 + kw.phase) * kw.amp;
        var fy = Math.cos(t * 0.42 + kw.phase) * kw.amp;
        var ex = kw.bx + kw.el.offsetWidth / 2, ey = kw.by + kw.el.offsetHeight / 2;
        var dx = ex - lmx, dy = ey - lmy, dist = Math.sqrt(dx*dx + dy*dy);  // word - cursor (repel away)
        var tx = 0, ty = 0;
        if (dist < 200) { var push = (1 - dist / 200) * 48; tx = (dx/(dist||1))*push; ty = (dy/(dist||1))*push; }
        kw.cx = lerp(kw.cx, tx, 0.1); kw.cy = lerp(kw.cy, ty, 0.1);
        kw.el.style.transform = 'translate3d(' + (kw.bx + fx + kw.cx) + 'px,' + (kw.by + fy + kw.cy) + 'px,0)';
      }
    }
    requestAnimationFrame(frame);
  }
  function startFrame() { if (!frameRunning && heavy) { frameRunning = true; requestAnimationFrame(frame); } }

  /* clear inline transforms so layers revert to their CSS base */
  function resetParallax() {
    parallaxEls.forEach(function (el) { el.style.transform = ''; });
  }

  startFrame();

  /* ============================================================
     Scroll-bound (flow draw) throttled
     ============================================================ */
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { updateFlow(); ticking = false; }); }
  }, { passive: true });

  /* ============================================================
     Build flow after fonts/layout settle + on resize
     ============================================================ */
  function buildAll() { buildFlow(); }
  if (document.readyState === 'complete') buildAll();
  else window.addEventListener('load', buildAll);
  setTimeout(buildAll, 400);

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      isDesktop = mqDesktop.matches;
      heavy = isDesktop && canHover && !reduceMotion;
      if (!heavy) {
        document.querySelectorAll('[data-magnetic]').forEach(function (el) { el.style.transform = ''; });
        resetParallax();
        if (cursor) cursor.style.opacity = '0';
      } else {
        collectParallax();
        startFrame();
      }
      setupSkills();
      buildFlow();
    }, 200);
  });

  /* ============================================================
     CONTACT form validation (line inputs)
     ============================================================ */
  var form = document.getElementById('contactForm');
  var success = document.getElementById('formSuccess');
  function setError(field, msg) {
    var wrap = field.closest('.field-line');
    wrap.classList.toggle('invalid', !!msg);
    wrap.querySelector('.error').textContent = msg || '';
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  if (form) {
    var submitBtn = form.querySelector('button[type="submit"]');
    var btnLabel = submitBtn ? submitBtn.textContent : '';

    function showMsg(text) {
      success.textContent = text;
      success.classList.add('show');
      setTimeout(function () { success.classList.remove('show'); }, 5000);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var name = document.getElementById('name');
      var email = document.getElementById('email');
      var message = document.getElementById('message');
      if (!name.value.trim()) { setError(name, 'Name required.'); ok = false; } else setError(name, '');
      if (!email.value.trim()) { setError(email, 'Email required.'); ok = false; }
      else if (!validEmail(email.value.trim())) { setError(email, 'Enter a valid email.'); ok = false; } else setError(email, '');
      if (!message.value.trim()) { setError(message, 'Message required.'); ok = false; } else setError(message, '');
      if (!ok) return;

      // send to FormSubmit (no backend needed)
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
          if (r.ok) { form.reset(); showMsg('Transmission sent — talk soon.'); }
          else { showMsg((r.data && r.data.message) || 'Could not send — try emailing me directly.'); }
        })
        .catch(function () { showMsg('Network error — please email me directly.'); })
        .then(function () { if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = btnLabel; } });
    });
    form.querySelectorAll('input, textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        if (el.closest('.field-line').classList.contains('invalid')) setError(el, '');
      });
    });
  }
})();
