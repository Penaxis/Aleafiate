/* =========================================================
   HALDEN — animation system
   Libraries: GSAP 3.13 (ScrollTrigger, SplitText, Draggable) + Lenis
   Every effect is driven by data-attributes, so you can reuse
   them on any element:
     data-words      heading fades in word by word
     data-lines      heading lines slide up from a mask
     data-letters    letters rise from a mask
     data-up / data-left / data-right   fade + slide in
     data-stagger    children fade up one after another
     data-settle     image inside scales 1.12 → 1 when revealed
     data-parallax   image drifts while scrolling
     data-count      number counts up (e.g. data-count="4.9")
     data-roll       button / link: letter-roll on hover
     data-hover + data-roll-text   letter-roll text inside a hover card
     data-accordion  FAQ list: .acc__item > .acc__q + .acc__a
     data-faq-search / data-faq-group / data-faq-cats   FAQ search + section nav
     data-profile    practitioner card → opens [data-drawer] with its <template>
     data-form       contact form validation + success state
     data-draw       vertical line draws while scrolling (process steps)
     data-offset     on an in-page link: stop this many px above the target
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur = reduce ? 0 : 1; // scales UI animation durations; 0 = instant
  let lenis = null;

  /* ---------- placeholders: hide label when a real image loads ---------- */
  $$('.media img').forEach(img => {
    const mark = () => img.getAttribute('src') && img.naturalWidth && img.closest('.media').classList.add('has-img');
    img.complete ? mark() : img.addEventListener('load', mark);
  });
  $$('[data-year]').forEach(e => e.textContent = new Date().getFullYear());

  /* ---------- mobile menu ---------- */
  const burger = $('.nav__burger');
  burger && burger.addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

  /* ---------- treatments: expanding cards ---------- */
  const tCards = $$('.t-card');
  const activate = c => tCards.forEach(x => x.classList.toggle('is-active', x === c));
  tCards.forEach(c => { c.addEventListener('mouseenter', () => activate(c)); c.addEventListener('click', () => activate(c)); });

  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger, SplitText, Draggable);

  /* =========================================================
     LETTER ROLL (buttons + card titles)
     ========================================================= */
  function buildRoll(el) {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    const row = cls => `<span class="roll__row ${cls}" aria-hidden="true">${[...text].map(c => `<span class="roll__ch">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</span>`;
    el.classList.add('roll');
    el.innerHTML = row('') + row('roll__row--clone');
    const [a, b] = $$('.roll__row', el).map(r => $$('.roll__ch', r));
    gsap.set(b, { yPercent: 105 });
    return dir => {
      gsap.to(a, { yPercent: dir ? -105 : 0, duration: .55, ease: 'power3.inOut', stagger: .016, overwrite: true });
      gsap.to(b, { yPercent: dir ? 0 : 105, duration: .55, ease: 'power3.inOut', stagger: .016, overwrite: true });
    };
  }
  $$('[data-roll]').forEach(btn => {
    const roll = buildRoll($('.btn__label', btn) || btn);
    const fill = $('.btn__fill', btn);
    btn.addEventListener('mouseenter', e => {
      if (fill) { const r = btn.getBoundingClientRect(); btn.style.setProperty('--x', `${e.clientX - r.left}px`); btn.style.setProperty('--y', `${e.clientY - r.top}px`); }
      roll(true);
    });
    btn.addEventListener('mouseleave', () => roll(false));
  });
  $$('[data-hover]').forEach(card => {
    const rolls = $$('[data-roll-text]', card).map(buildRoll);
    card.addEventListener('mouseenter', () => rolls.forEach(r => r(true)));
    card.addEventListener('mouseleave', () => rolls.forEach(r => r(false)));
  });

  /* =========================================================
     TESTIMONIAL SLIDER (works without scroll animations too)
     ========================================================= */
  const vTrack = $('[data-voices-track]');
  if (vTrack) {
    const cards = $$('.quote', vTrack);
    const dotsWrap = $('[data-voices-dots]');
    let i = 0, timer;
    const perView = () => innerWidth <= 600 ? 1 : 2;
    const max = () => Math.max(0, cards.length - perView());
    const dots = [];
    const buildDots = () => {
      dotsWrap.innerHTML = ''; dots.length = 0;
      for (let k = 0; k <= max(); k++) { const d = document.createElement('button'); d.setAttribute('aria-label', `Slide ${k + 1}`); d.onclick = () => go(k); dotsWrap.appendChild(d); dots.push(d); }
    };
    const go = k => {
      i = k < 0 ? max() : k > max() ? 0 : k;
      const step = cards[0].offsetWidth + 16;
      vTrack.style.transform = `translateX(${-i * step}px)`;
      cards.forEach((c, n) => c.style.opacity = n >= i && n < i + perView() ? 1 : .35);
      dots.forEach((d, n) => d.classList.toggle('is-active', n === i));
    };
    const auto = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 5500); };
    $('[data-voices-prev]').onclick = () => { go(i - 1); auto(); };
    $('[data-voices-next]').onclick = () => { go(i + 1); auto(); };
    vTrack.addEventListener('mouseenter', () => clearInterval(timer));
    vTrack.addEventListener('mouseleave', auto);
    addEventListener('resize', () => { buildDots(); go(Math.min(i, max())); });
    buildDots(); go(0); auto();
  }

  /* =========================================================
     ABOUT: approach crossfade slider
     ========================================================= */
  const aStage = $('[data-approach]');
  if (aStage) {
    const slides = $$('.approach__slide', aStage);
    const items = $$('.approach__item');
    const count = $('[data-approach-count]');
    let i = 0, busy = false, timer;
    const pad = n => String(n).padStart(2, '0');
    const show = (k, dir = 1) => {
      if (busy || k === i) return; busy = true;
      const from = i; i = (k + slides.length) % slides.length;
      const tl = gsap.timeline({ onComplete: () => busy = false });
      slides[i].classList.add('is-active'); gsap.set(slides[i], { zIndex: 2 }); gsap.set(slides[from], { zIndex: 1 });
      tl.fromTo(slides[i], { clipPath: dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0%)', duration: 1.2, ease: 'expo.inOut' })
        .fromTo($('img', slides[i]), { scale: 1.15 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0)
        .add(() => slides[from].classList.remove('is-active'))
        .to(items[from], { x: -40 * dir, autoAlpha: 0, duration: .45, ease: 'power2.in' }, 0)
        .add(() => { items[from].classList.remove('is-active'); items[i].classList.add('is-active'); }, .45)
        .fromTo(items[i], { x: 40 * dir, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .9, ease: 'expo.out' }, .45);
      count.textContent = `${pad(i + 1)} / ${pad(slides.length)}`;
    };
    const auto = () => { clearInterval(timer); timer = setInterval(() => show(i + 1, 1), 6000); };
    $('[data-approach-prev]').onclick = () => { show(i - 1, -1); auto(); };
    $('[data-approach-next]').onclick = () => { show(i + 1, 1); auto(); };
    slides[0].classList.add('is-active'); items[0].classList.add('is-active');
    count.textContent = `01 / ${pad(slides.length)}`; auto();
  }

  /* =========================================================
     ABOUT: team tabs filter
     ========================================================= */
  const tabs = $$('[data-filter]');
  if (tabs.length) {
    const bar = tabs[0].closest('.tabs');
    const members = [...$(bar.dataset.target || '.a-team__grid').children];
    tabs.forEach(tab => tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.toggle('is-active', t === tab));
      const f = tab.dataset.filter;
      gsap.to(members, { autoAlpha: 0, y: 20, duration: .3, ease: 'power2.in', onComplete: () => {
        const show = members.filter(m => f === 'all' || m.dataset.cat === f);
        members.forEach(m => m.classList.toggle('is-hidden', !show.includes(m)));
        gsap.fromTo(show, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .9, ease: 'expo.out', stagger: .07 });
        ScrollTrigger.refresh();
      } });
    }));
  }

  /* =========================================================
     FAQ: accordion (one open at a time per list)
     ========================================================= */
  const setAcc = (item, open) => {
    const a = $('.acc__a', item);
    item.classList.toggle('is-open', open);
    $('.acc__q', item).setAttribute('aria-expanded', open);
    gsap.to(a, { height: open ? 'auto' : 0, duration: .8 * dur, ease: 'expo.inOut', overwrite: true, onComplete: () => ScrollTrigger.refresh() });
    if (open) gsap.fromTo($('.acc__inner', a).children, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .9 * dur, ease: 'expo.out', stagger: .06, delay: .2 * dur });
  };
  $$('[data-accordion]').forEach((acc, n) => $$('.acc__item', acc).forEach((item, k) => {
    const q = $('.acc__q', item), a = $('.acc__a', item), id = `acc-${n}-${k}`;
    a.id = id; a.setAttribute('role', 'region'); q.setAttribute('aria-controls', id); q.setAttribute('aria-expanded', 'false');
    q.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      $$('.acc__item.is-open', acc).forEach(o => o !== item && setAcc(o, false));
      setAcc(item, open);
    });
  }));

  /* ---------- FAQ: live search ---------- */
  const fSearch = $('[data-faq-search]');
  if (fSearch) {
    const groups = $$('[data-faq-group]'), items = $$('.acc__item', $('.faq__groups')), empty = $('[data-faq-empty]');
    let last = '';
    fSearch.addEventListener('input', () => {
      const q = fSearch.value.trim().toLowerCase();
      items.forEach(it => it.hidden = !!q && !it.textContent.toLowerCase().includes(q));
      groups.forEach(g => g.hidden = $$('.acc__item', g).every(it => it.hidden));
      empty.hidden = groups.some(g => !g.hidden);
      $('[data-faq-term]', empty).textContent = fSearch.value.trim();
      const shown = items.filter(it => !it.hidden), key = shown.map(it => items.indexOf(it)).join();
      if (key !== last) gsap.fromTo(shown, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .6 * dur, ease: 'expo.out', stagger: .025, overwrite: true });
      last = key;
      ScrollTrigger.refresh();
    });
  }

  /* ---------- FAQ: highlight the section in view ---------- */
  const fCats = $$('[data-faq-cats] a');
  fCats.length && $$('[data-faq-group]').forEach((g, i) => ScrollTrigger.create({ trigger: g, start: 'top 45%', end: 'bottom 45%',
    onToggle: st => st.isActive && fCats.forEach((c, k) => c.classList.toggle('is-active', k === i)) }));

  /* =========================================================
     PRACTITIONERS: profile drawer
     ========================================================= */
  const drawer = $('[data-drawer]');
  if (drawer) {
    const panel = $('.drawer__panel', drawer), back = $('.drawer__backdrop', drawer), body = $('.drawer__body', drawer);
    const dImg = $('.drawer__media img', drawer), dMedia = $('.drawer__media .media', drawer);
    let from = null;
    gsap.set(panel, { xPercent: 100 });
    const open = card => {
      from = card;
      const img = $('.doc__media img', card);
      $('[data-drawer-role]', drawer).textContent = card.dataset.role;
      $('[data-drawer-name]', drawer).textContent = card.dataset.name;
      $('[data-drawer-reg]', drawer).textContent = card.dataset.reg;
      $('[data-drawer-content]', drawer).replaceChildren($('template', card).content.cloneNode(true));
      $('[data-drawer-book]', drawer).href = `contact.html?with=${encodeURIComponent(card.dataset.name)}`;
      dImg.src = img.getAttribute('src'); dImg.alt = img.alt;
      dMedia.dataset.label = $('.media', card).dataset.label;
      dMedia.classList.toggle('has-img', !!img.getAttribute('src'));
      drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('is-locked'); lenis && lenis.stop();
      panel.scrollTop = 0;
      gsap.timeline()
        .to(back, { opacity: 1, duration: .5 * dur }, 0)
        .fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 1 * dur, ease: 'expo.out' }, 0)
        .fromTo(dImg, { scale: 1.25 }, { scale: 1, duration: 1.4 * dur, ease: 'expo.out' }, .1 * dur)
        .fromTo([...[...body.children].filter(c => !c.matches('[data-drawer-content]')), ...$('[data-drawer-content]', drawer).children], { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .9 * dur, ease: 'expo.out', stagger: .04 }, .25 * dur);
      $('.drawer__close', drawer).focus({ preventScroll: true });
    };
    const close = () => {
      if (!drawer.classList.contains('is-open')) return;
      gsap.timeline({ onComplete: () => { drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); } })
        .to(panel, { xPercent: 100, duration: .7 * dur, ease: 'expo.in' }, 0)
        .to(back, { opacity: 0, duration: .5 * dur }, .2 * dur);
      document.documentElement.classList.remove('is-locked'); lenis && lenis.start();
      from && from.focus({ preventScroll: true });
    };
    $$('[data-profile]').forEach(card => {
      card.addEventListener('click', () => open(card));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); } });
    });
    $$('[data-drawer-close]', drawer).forEach(b => b.addEventListener('click', close));
    addEventListener('keydown', e => {
      if (!drawer.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { // keep focus inside the drawer
        const f = $$('a[href],button,[tabindex="0"]', panel), first = f[0], end = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); }
        else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* =========================================================
     CONTACT: form validation + success state
     With an action="" URL (e.g. Formspree) the form is POSTed there;
     without one it opens the visitor's email app, addressed to data-mailto.
     ========================================================= */
  const form = $('[data-form]');
  if (form) {
    const pick = new URLSearchParams(location.search).get('with'), sel = $('[name="practitioner"]', form);
    if (pick && sel) { sel.add(new Option(pick, pick, true, true)); }
    const rules = { email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), tel: v => v.replace(/\D/g, '').length >= 7 };
    const check = el => {
      const v = el.value.trim(), ok = el.type === 'checkbox' ? el.checked : v && (!rules[el.type] || rules[el.type](v));
      (el.closest('.field') || el.closest('.check')).classList.toggle('is-error', !ok);
      return ok;
    };
    const req = $$('[required]', form);
    req.forEach(el => el.addEventListener(el.type === 'checkbox' ? 'change' : 'blur', () => check(el)));
    req.forEach(el => el.addEventListener('input', () => el.closest('.is-error') && check(el)));
    const done = $('.form-success', form.closest('.form-card'));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const bad = req.filter(el => !check(el));
      if (bad.length) {
        bad[0].focus();
        gsap.fromTo(bad.map(el => el.closest('.field, .check')), { x: -8 }, { x: 0, duration: .6 * dur, ease: 'elastic.out(1, .3)' });
        return;
      }
      const data = new FormData(form);
      if (form.getAttribute('action')) {
        try {
          const r = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!r.ok) throw new Error(r.status);
        } catch (err) { alert('Sorry, something went wrong sending your request. Please call or email us instead.'); return; }
      } else {
        const lines = []; data.forEach((v, k) => v && lines.push(`${k}: ${v}`));
        location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent('Consultation request')}&body=${encodeURIComponent(lines.join('\n'))}`;
        $('[data-success-note]', done).textContent = 'Your email app should now open with your request filled in — just press send.';
      }
      const tick = $$('path, circle', $('svg', done));
      lenis && lenis.scrollTo(form.closest('.form-card'), { offset: -100, duration: 1.2 });
      gsap.timeline()
        .to(form, { autoAlpha: 0, y: -20, duration: .5 * dur })
        .fromTo(done, { autoAlpha: 0, scale: .96 }, { autoAlpha: 1, scale: 1, duration: .8 * dur, ease: 'expo.out' })
        .fromTo(tick, { strokeDasharray: 300, strokeDashoffset: 300 }, { strokeDashoffset: 0, duration: 1.2 * dur, ease: 'power2.inOut', stagger: .2 }, '<')
        .from($$('h3, p, a', done), { y: 20, autoAlpha: 0, duration: .8 * dur, ease: 'expo.out', stagger: .08 }, '-=.9');
    });
  }

  if (reduce) return;

  /* =========================================================
     SMOOTH SCROLL + NAV
     ========================================================= */
  lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2 || !$(id)) return;
    e.preventDefault(); lenis.scrollTo($(id), { duration: 1.6, offset: -(+a.dataset.offset || 0) });
  }));
  const nav = $('#nav'); let lastY = 0;
  lenis.on('scroll', ({ scroll }) => {
    nav.classList.toggle('is-hidden', scroll > lastY && scroll > 120 && !document.body.classList.contains('menu-open'));
    nav.classList.toggle('is-solid', scroll > 40);
    lastY = scroll;
  });

  document.fonts.ready.then(() => {
    const mm = gsap.matchMedia();

    /* ---------- page intro ---------- */
    gsap.from('#nav', { y: -30, autoAlpha: 0, duration: 1.2, ease: 'expo.out', delay: .2 });

    /* ---------- text reveals ---------- */
    $$('[data-lines]').forEach(el => {
      const s = SplitText.create(el, { type: 'lines,words', mask: 'lines', linesClass: 'split-line' });
      gsap.from(s.words, { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: .04, delay: el.closest('.hero, .a-hero') ? .5 : 0,
        scrollTrigger: el.closest('.hero, .a-hero') ? null : { trigger: el, start: 'top 85%' } });
    });
    $$('[data-words]').forEach(el => {
      const s = SplitText.create(el, { type: 'words', wordsClass: 'split-word' });
      const inHero = !!el.closest('.a-hero');
      gsap.from(s.words, { autoAlpha: 0, yPercent: 35, filter: 'blur(6px)', duration: 1, ease: 'power3.out', stagger: .06, delay: inHero ? .4 : 0,
        scrollTrigger: inHero ? null : { trigger: el, start: 'top 85%' } });
    });
    $$('[data-letters]').forEach(el => {
      const s = SplitText.create(el, { type: 'chars', mask: 'chars' });
      gsap.from(s.chars, { yPercent: 100, duration: 1.3, ease: 'expo.out', stagger: .035, scrollTrigger: { trigger: el, start: 'top 92%' } });
    });

    /* ---------- element reveals ---------- */
    const reveal = (sel, from) => $$(sel).forEach(el => gsap.from(el, { ...from, autoAlpha: 0, duration: 1.2, ease: 'expo.out',
      delay: el.closest('.hero, .a-hero') ? .9 : 0,
      scrollTrigger: el.closest('.hero') ? null : { trigger: el, start: 'top 88%' } }));
    reveal('[data-up]', { y: 40 });
    reveal('[data-left]', { x: -60 });
    reveal('[data-right]', { x: 60 });
    $$('[data-stagger]').forEach(el => gsap.from(el.children, { y: 60, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: .09, scrollTrigger: { trigger: el, start: 'top 85%' } }));
    $$('[data-stagger-x]').forEach(el => gsap.from(el.children, { x: 90, autoAlpha: 0, duration: 1.3, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: el, start: 'top 85%' } }));
    $$('[data-settle]').forEach(el => gsap.fromTo($('img', el) || el, { scale: 1.12 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } }));
    $$('[data-parallax]').forEach(el => gsap.fromTo(el, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    $$('[data-speed]').forEach(el => gsap.to(el, { yPercent: parseFloat(el.dataset.speed) * 100, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    $$('[data-count]').forEach(el => {
      const to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, suf = el.dataset.suffix || '', o = { v: 0 };
      el.textContent = (0).toFixed(dec) + suf;
      gsap.to(o, { v: to, duration: 2.2, ease: 'power2.out', onUpdate: () => el.textContent = o.v.toFixed(dec) + suf, scrollTrigger: { trigger: el, start: 'top 92%' } });
    });

    /* =========================================================
       HOME: hero split → full width
       ========================================================= */
    if ($('#hero')) {
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .from('[data-hero-media]', { clipPath: 'inset(0 0 0 100%)', duration: 1.6, ease: 'expo.inOut' })
        .from('[data-hero-img]', { scale: 1.3, duration: 2 }, '<');
      mm.add('(min-width: 992px)', () => {
        const st = SplitText.create('[data-hero-statement]', { type: 'words' });
        gsap.set(st.words, { autoAlpha: 0, yPercent: 40 });
        gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=160%', scrub: .8, pin: true } })
          .to('.hero__content', { autoAlpha: 0, duration: .5, ease: 'none' }, 0)
          .to('[data-hero-media]', { width: '100%', duration: 1, ease: 'power2.inOut' }, 0)
          .to('[data-hero-img]', { scale: 1.12, duration: 1.6, ease: 'none' }, 0)
          .to('[data-hero-shade]', { opacity: 1, duration: .5 }, .6)
          .to(st.words, { autoAlpha: 1, yPercent: 0, stagger: .08, duration: .4, ease: 'power2.out' }, .8);
        return () => st.revert();
      });
    }

    /* ---------- HOME: intro word scrub ---------- */
    if ($('[data-scrub-words]')) {
      const w = SplitText.create('[data-scrub-words]', { type: 'words' }).words;
      gsap.fromTo(w, { opacity: .14 }, { opacity: 1, stagger: .05, ease: 'none', scrollTrigger: { trigger: '[data-scrub-words]', start: 'top 80%', end: 'bottom 45%', scrub: true } });
    }

    /* ---------- HOME: values sticky split ---------- */
    const bars = $$('.values__progress i');
    $$('[data-value]').forEach((card, i) => {
      gsap.to($('img', card), { scale: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from($('.value-card__cap', card).children, { y: 30, autoAlpha: 0, duration: 1, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 40%' } });
      bars[i] && gsap.to(bars[i], { scaleX: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top center', end: 'bottom center', scrub: true } });
    });

    /* ---------- HOME: outcomes — rows rise / side slide + parallax ---------- */
    $$('.o-item').forEach((item, i) => {
      const side = i === 2;
      gsap.from(item, { [side ? 'x' : 'y']: side ? 80 : 70, autoAlpha: 0, duration: 1.3, ease: 'expo.out', delay: (i % 3) * .08, scrollTrigger: { trigger: item, start: 'top 90%' } });
      gsap.fromTo($('.media', item), { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* ---------- HOME: studio — horizontal, then final image zooms ---------- */
    if ($('.space__pin')) mm.add('(min-width: 992px)', () => {
      const track = $('[data-h-track]'), last = $('.space__item--final');
      const endX = () => -(last.offsetLeft - (innerWidth - last.offsetWidth) / 2);
      const cover = () => Math.max(innerWidth / last.offsetWidth, innerHeight / last.offsetHeight) * 1.02;
      const q = SplitText.create('[data-space-quote]', { type: 'words' });
      gsap.set(q.words, { autoAlpha: 0, y: 20 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: '.space__pin', start: 'top top', end: () => '+=' + (Math.abs(endX()) + innerHeight * 1.6), pin: true, scrub: .8, invalidateOnRefresh: true } });
      tl.to(track, { x: endX, ease: 'none', duration: 3 })
        .to('[data-h-bar]', { scaleX: 1, ease: 'none', duration: 3 }, 0)
        .to(last, { scale: cover, borderRadius: 0, ease: 'power2.inOut', duration: 1.2 })
        .to('.space__bar', { autoAlpha: 0, duration: .3 }, '<')
        .to('.space__overlay', { opacity: 1, duration: .6 }, '-=.5')
        .to(q.words, { autoAlpha: 1, y: 0, stagger: .06, duration: .4 }, '-=.2');
      $$('.space__item:not(.space__item--final) img').forEach(img => gsap.fromTo(img, { scale: 1.2 }, { scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.space__pin', start: 'top top', end: () => '+=' + Math.abs(endX()), scrub: true, invalidateOnRefresh: true } }));
      return () => q.revert();
    });

    /* ---------- HOME: team draggable ---------- */
    const vp = $('[data-team-viewport]'), tTrack = $('[data-team-track]');
    if (vp) {
      const minX = () => Math.min(0, vp.clientWidth - tTrack.scrollWidth);
      const drag = Draggable.create(tTrack, { type: 'x', bounds: { minX: minX(), maxX: 0 }, edgeResistance: .85, onPress() { this.applyBounds({ minX: minX(), maxX: 0 }); } })[0];
      const go = dir => {
        const step = $('.member', tTrack).offsetWidth + 16;
        gsap.to(tTrack, { x: gsap.utils.clamp(minX(), 0, gsap.getProperty(tTrack, 'x') - dir * step), duration: .9, ease: 'expo.out', onUpdate: () => drag.update() });
      };
      $('[data-team-next]').onclick = () => go(1);
      $('[data-team-prev]').onclick = () => go(-1);
      gsap.from($$('.member', tTrack), { x: 120, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: vp, start: 'top 85%' } });
    }

    /* ---------- CTA: headline → framed image fills screen → card ---------- */
    if ($('.cta')) mm.add('(min-width: 992px)', () => {
      gsap.timeline({ scrollTrigger: { trigger: '.cta', start: 'top top', end: '+=180%', pin: true, scrub: .8 } })
        .to('.cta__headline', { autoAlpha: 0, y: -40, duration: .5 }, .1)
        .to('.cta__image', { opacity: 1, scale: 1, borderRadius: 0, duration: 1, ease: 'power2.inOut' }, 0)
        .fromTo('[data-cta-img]', { scale: 1.3 }, { scale: 1, duration: 1.2, ease: 'none' }, 0)
        .fromTo('.cta__card-wrap', { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: .6, ease: 'power2.out' }, .9);
    });

    /* ---------- PRACTITIONERS: process line draws, steps light up ---------- */
    $$('[data-draw]').forEach(el => gsap.to(el, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top 65%', end: 'bottom 65%', scrub: true } }));
    $$('.step').forEach(st => ScrollTrigger.create({ trigger: st, start: 'top 65%', onEnter: () => st.classList.add('is-on'), onLeaveBack: () => st.classList.remove('is-on') }));

    /* ---------- CONTACT: map pin drops in ---------- */
    $$('.map__pin').forEach(pin => gsap.from(pin, { y: -60, autoAlpha: 0, duration: 1.4, ease: 'bounce.out', scrollTrigger: { trigger: pin.closest('.map'), start: 'top 70%' } }));

    /* ---------- ABOUT: hero image parallax ---------- */
    if ($('.a-hero__media')) {
      gsap.from('.a-hero__media', { clipPath: 'inset(20% 10% 0 10% round 18px)', duration: 1.8, ease: 'expo.inOut', delay: .6 });
      gsap.from('.a-stat', { y: 50, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: .1, delay: 1.4 });
    }

    ScrollTrigger.refresh();
  });
})();
