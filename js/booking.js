/* =========================================================
   ALEAFIATE — floating "Book appointment" button + pop-up form
   Self-contained: injects its own markup, so a page only needs
     <link rel="stylesheet" href="css/booking.css">
     <script src="js/booking.js"></script>   (before main.js)
   Load it before main.js so main.js upgrades the dropdowns and
   button hover effects. Any element with [data-book] opens the form.
   Without a form-service URL in BOOKING_ENDPOINT, a request opens the
   visitor's email app addressed to BOOKING_EMAIL.
   ========================================================= */
(() => {
  const BOOKING_EMAIL = 'admin@aleafiate.com.au';
  const BOOKING_ENDPOINT = ''; // e.g. a Formspree URL — then requests are POSTed there

  const ARROW = '<svg class="btn__arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 12L12 4M5 4h7v7"/></svg>';
  const CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M9 15l2 2 4-4"/></svg>';
  const X = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3l10 10M13 3L3 13"/></svg>';
  const options = list => list.map(o => `<option>${o}</option>`).join('');
  const input = (n, label, type, err, ac) =>
    `<div class="field"><input id="bk-${n}" name="${n}" type="${type}" placeholder=" " required autocomplete="${ac}"><label for="bk-${n}">${label} *</label><span class="field__bar"></span><span class="field__err">${err}</span></div>`;
  const select = (n, label, list) =>
    `<div class="field field--static"><select id="bk-${n}" name="${n}">${options(list)}</select><label for="bk-${n}">${label}</label><span class="field__bar"></span></div>`;

  document.body.insertAdjacentHTML('beforeend', `
  <button class="bk-fab" type="button" data-book aria-haspopup="dialog" aria-controls="bk-dialog">
    <span class="bk-fab__icon" aria-hidden="true">${CAL}</span><span class="bk-fab__label">Book appointment</span>
  </button>
  <div class="bk" data-bk aria-hidden="true">
    <div class="bk__backdrop" data-bk-close></div>
    <div class="bk__panel" id="bk-dialog" role="dialog" aria-modal="true" aria-labelledby="bk-title" data-lenis-prevent>
      <button class="bk__close" type="button" data-bk-close aria-label="Close booking form">${X}</button>
      <div class="bk__head">
        <span class="bk__orb" aria-hidden="true"></span>
        <span class="eyebrow">Free · no obligation</span>
        <h2 id="bk-title">Book an appointment</h2>
        <p>Leave your details and our team will call you back within one business day to confirm a time.</p>
      </div>
      <div class="bk__body">
        <form class="bk__form" novalidate>
          ${input('name', 'Full name', 'text', 'Please enter your name', 'name')}
          <div class="bk__row">
            ${input('phone', 'Phone', 'tel', 'Enter a valid phone', 'tel')}
            ${input('email', 'Email', 'email', 'Enter a valid email', 'email')}
          </div>
          ${select('enquiry', 'How can we help?', ['Book a free discovery call', 'Book an initial consultation', 'Book a follow-up', 'Question about fees', 'Script or pharmacy enquiry', 'Something else'])}
          <div class="bk__row">
            ${select('appointment', 'Appointment type', ['Not sure yet', 'Telehealth', 'In clinic — Logan Central'])}
            ${select('time', 'Best time to call', ['Any time', 'Morning (9am – 12pm)', 'Afternoon (12pm – 5pm)'])}
          </div>
          ${select('practitioner', 'Practitioner', ['No preference', 'Dr Frank Guerrera', 'Jeremy Chou (Nurse Practitioner)'])}
          <div class="field"><textarea id="bk-message" name="message" placeholder=" " rows="2"></textarea><label for="bk-message">Anything we should know?</label><span class="field__bar"></span></div>
          <label class="check"><input type="checkbox" name="consent" value="yes" required><span>I agree to be contacted and have read the <a href="privacy-policy.html">Privacy Policy</a>. *</span></label>
          <button type="submit" class="btn" data-roll><span class="btn__fill"></span><span class="btn__label">Request appointment</span>${ARROW}</button>
          <p class="bk__alt">Prefer to talk? Call <a href="tel:+61734733396">07 3473 3396</a> · Mon – Fri, 9am – 5pm</p>
        </form>
        <div class="bk__done" hidden aria-live="polite">
          <svg viewBox="0 0 84 84" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="42" cy="42" r="40"/><path d="M27 43l10 10 20-22"/></svg>
          <h3>Thank you.</h3>
          <p data-bk-note>We’ve received your request and will call you within one business day.</p>
          <button type="button" class="btn btn--ghost" data-bk-close>Close</button>
        </div>
      </div>
    </div>
  </div>`);

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const bk = $('[data-bk]'), panel = $('.bk__panel', bk), form = $('.bk__form', bk), done = $('.bk__done', bk), fab = $('.bk-fab');
  const root = document.documentElement;
  let from = null;

  /* ---------- open / close ---------- */
  const open = trigger => {
    from = trigger || document.activeElement;
    bk.classList.add('is-open'); bk.setAttribute('aria-hidden', 'false');
    root.classList.add('bk-open'); window.__lenis && window.__lenis.stop();
    panel.scrollTop = 0;
    setTimeout(() => $('#bk-name').focus({ preventScroll: true }), 350);
  };
  const close = () => {
    if (!bk.classList.contains('is-open')) return;
    bk.classList.remove('is-open'); bk.setAttribute('aria-hidden', 'true');
    root.classList.remove('bk-open'); window.__lenis && window.__lenis.start();
    $$('.dd.is-open', bk).forEach(d => d.classList.remove('is-open'));
    from && from.focus && from.focus({ preventScroll: true });
    if (!done.hidden) setTimeout(() => { form.reset(); form.hidden = false; done.hidden = true; bk.classList.remove('is-done'); $$('select', form).forEach(s => s.dispatchEvent(new Event('change'))); }, 500);
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-book]');
    if (t) { e.preventDefault(); open(t); return; }
    if (e.target.closest('[data-bk-close]')) close();
  });
  addEventListener('keydown', e => {
    if (!bk.classList.contains('is-open')) return;
    if (e.key === 'Escape' && !$('.dd.is-open', bk)) close();
    if (e.key === 'Tab') { // keep focus inside the dialog
      const f = $$('a[href],button:not([tabindex="-1"]),input,textarea', panel).filter(el => el.offsetParent);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- floating button appears once the visitor scrolls ---------- */
  const toggleFab = () => root.classList.toggle('bk-fab-on', fab.classList.toggle('is-visible', scrollY > innerHeight * .6));
  addEventListener('scroll', toggleFab, { passive: true }); toggleFab();

  /* ---------- validation + submit ---------- */
  const rules = { email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), tel: v => v.replace(/\D/g, '').length >= 7 };
  const check = el => {
    const v = el.value.trim(), ok = el.type === 'checkbox' ? el.checked : !!v && (!rules[el.type] || rules[el.type](v));
    (el.closest('.field') || el.closest('.check')).classList.toggle('is-error', !ok);
    return ok;
  };
  const req = $$('[required]', form);
  req.forEach(el => el.addEventListener(el.type === 'checkbox' ? 'change' : 'blur', () => check(el)));
  req.forEach(el => el.addEventListener('input', () => el.closest('.is-error') && check(el)));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const bad = req.filter(el => !check(el));
    if (bad.length) {
      bad[0].focus();
      bad.forEach(el => { const w = el.closest('.field, .check'); w.classList.remove('bk-shake'); void w.offsetWidth; w.classList.add('bk-shake'); });
      return;
    }
    const data = new FormData(form);
    if (BOOKING_ENDPOINT) {
      try {
        const r = await fetch(BOOKING_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error(r.status);
      } catch (err) { alert('Sorry, something went wrong sending your request. Please call us on 07 3473 3396.'); return; }
    } else {
      const lines = []; data.forEach((v, k) => v && lines.push(`${k}: ${v}`));
      location.href = `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent('Appointment request')}&body=${encodeURIComponent(lines.join('\n'))}`;
      $('[data-bk-note]', done).textContent = 'Your email app should now open with your request filled in — just press send.';
    }
    form.hidden = true; done.hidden = false; bk.classList.add('is-done');
    panel.scrollTop = 0;
  });
})();
