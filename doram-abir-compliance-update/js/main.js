(function () {
  'use strict';

  var WHATSAPP_NUMBER = '972503322700';

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 30) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var navToggle = document.querySelector('.nav-toggle');
  var mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.classList.toggle('nav-open', isOpen);
    });
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Testimonials carousel ---------- */
  var carousel = document.getElementById('testimonial-carousel');
  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.carousel-slide'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('.carousel-dot'));
    var prevBtn = carousel.querySelector('.carousel-arrow-prev');
    var nextBtn = carousel.querySelector('.carousel-arrow-next');
    var current = 0;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
        dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
      });
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { showSlide(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { showSlide(current + 1); });
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { showSlide(i); });
    });

    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') showSlide(current - 1);
      if (e.key === 'ArrowLeft') showSlide(current + 1);
    });

    showSlide(0);
  }

  /* ---------- Reels carousel ---------- */
  var reelsTrack = document.getElementById('reels-track');
  if (reelsTrack) {
    var reelsPrev = document.querySelector('.reels-arrow-prev');
    var reelsNext = document.querySelector('.reels-arrow-next');
    function reelsScrollStep() {
      var card = reelsTrack.querySelector('.reel-card');
      if (!card) return 300;
      var style = window.getComputedStyle(reelsTrack);
      var gap = parseFloat(style.columnGap || style.gap || '16') || 16;
      return card.getBoundingClientRect().width + gap;
    }
    if (reelsPrev) reelsPrev.addEventListener('click', function () {
      reelsTrack.scrollBy({ left: reelsScrollStep(), behavior: 'smooth' });
    });
    if (reelsNext) reelsNext.addEventListener('click', function () {
      reelsTrack.scrollBy({ left: -reelsScrollStep(), behavior: 'smooth' });
    });
  }

  /* ---------- Lead forms (main CTA form + quick strip under hero) ---------- */
  var leadForms = document.querySelectorAll('#lead-form, #lead-form-quick');
  leadForms.forEach(function (form) {
    var statusEl = form.querySelector('.form-status');

    var validators = {
      name: function (v) { return v.trim().length >= 2; },
      phone: function (v) { return /^0\d{1,2}-?\d{7}$|^\+?\d{9,13}$/.test(v.trim().replace(/\s/g, '')); },
      email: function (v) { return v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      consent: function (v, el) { return el.checked; }
    };

    var messages = {
      name: 'נא להזין שם מלא (לפחות 2 תווים)',
      phone: 'נא להזין מספר טלפון תקין',
      email: 'כתובת הדוא"ל שהוזנה אינה תקינה',
      consent: 'יש לאשר את מדיניות הפרטיות כדי להמשיך'
    };

    function setError(row, show, key) {
      if (!row) return;
      row.classList.toggle('has-error', show);
      var errEl = row.querySelector('.field-error');
      if (errEl && show) errEl.textContent = messages[key];
    }

    function validateField(key) {
      var el = form.querySelector('[name="' + key + '"]');
      if (!el) return true;
      var row = el.closest('.form-row') || el.closest('.form-check');
      var valid = validators[key](el.value, el);
      setError(row, !valid, key);
      return valid;
    }

    ['name', 'phone', 'email'].forEach(function (key) {
      var el = form.querySelector('[name="' + key + '"]');
      if (el) el.addEventListener('blur', function () { validateField(key); });
    });
    var consentEl = form.querySelector('[name="consent"]');
    if (consentEl) consentEl.addEventListener('change', function () { validateField('consent'); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      statusEl.className = 'form-status';
      statusEl.textContent = '';

      var fields = ['name', 'phone', 'email', 'consent'];
      var allValid = fields.map(validateField).every(Boolean);

      if (!allValid) {
        statusEl.classList.add('is-error');
        statusEl.textContent = 'נא לתקן את השדות המסומנים ולנסות שוב.';
        var firstError = form.querySelector('.has-error');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      var marketingEl = form.querySelector('[name="marketing"]');
      var data = {
        name: form.querySelector('[name="name"]').value.trim(),
        phone: form.querySelector('[name="phone"]').value.trim(),
        email: form.querySelector('[name="email"]').value.trim(),
        city: (form.querySelector('[name="city"]') || {}).value || '',
        budget: (form.querySelector('[name="budget"]') || {}).value || '',
        message: (form.querySelector('[name="message"]') || {}).value || '',
        marketingConsent: !!(marketingEl && marketingEl.checked)
      };

      var lines = [
        'היי דורעם, אשמח לשיחת ייעוץ על השקעה בבוקרשט.',
        'שם: ' + data.name,
        'טלפון: ' + data.phone
      ];
      if (data.email.trim()) lines.push('דוא"ל: ' + data.email.trim());
      if (data.city.trim()) lines.push('עיר מגורים: ' + data.city.trim());
      if (data.budget.trim()) lines.push('תקציב משוער: ' + data.budget.trim());
      if (data.message.trim()) lines.push('הודעה: ' + data.message.trim());

      var waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));

      if (window.daTrack) {
        window.daTrack('lead', {
          name: data.name,
          phone: data.phone,
          email: data.email,
          city: data.city,
          budget: data.budget,
          message: data.message,
          marketingConsent: data.marketingConsent,
          formId: form.id || ''
        });
      }

      statusEl.classList.add('is-success');
      statusEl.textContent = 'תודה, ' + data.name + '! נפתחת עבורכם שיחת WhatsApp עם הפרטים שמילאתם — דורעם יחזור אליכם בהקדם.';

      window.open(waUrl, '_blank', 'noopener');
      form.reset();
    });
  });

  /* ---------- Current year in footer ---------- */
  var yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Accessibility widget ---------- */
  (function () {
    var root = document.documentElement;
    var toggle = document.getElementById('a11y-toggle');
    var panel = document.getElementById('a11y-panel');
    if (!toggle || !panel) return;

    var closeBtn = panel.querySelector('.a11y-close');
    var STORAGE_KEY = 'doramabir-a11y';
    var FONT_MIN = -2, FONT_MAX = 4, FONT_STEP = 6.25; /* percent per step */

    var state = {
      fontStep: 0,
      contrast: false,
      underline: false,
      motionOff: false,
      readable: false
    };

    function loadState() {
      try {
        var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (saved) state = Object.assign(state, saved);
      } catch (e) { /* ignore corrupted storage */ }
    }

    function saveState() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    }

    function applyState() {
      root.style.fontSize = (100 + state.fontStep * FONT_STEP) + '%';
      root.classList.toggle('a11y-contrast', state.contrast);
      root.classList.toggle('a11y-underline', state.underline);
      root.classList.toggle('a11y-motion-off', state.motionOff);
      root.classList.toggle('a11y-readable', state.readable);

      panel.querySelectorAll('.a11y-toggle-btn').forEach(function (btn) {
        var key = btn.getAttribute('data-a11y');
        var map = { contrast: 'contrast', underline: 'underline', motion: 'motionOff', readable: 'readable' };
        var isOn = !!state[map[key]];
        btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
      });
    }

    function openPanel() {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      var firstBtn = panel.querySelector('button');
      if (firstBtn) firstBtn.focus();
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('click', onOutsideClick, true);
    }

    function closePanel(returnFocus) {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('click', onOutsideClick, true);
      if (returnFocus) toggle.focus();
    }

    function onKeydown(e) {
      if (e.key === 'Escape') closePanel(true);
    }

    function onOutsideClick(e) {
      if (!panel.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) {
        closePanel(false);
      }
    }

    toggle.addEventListener('click', function () {
      if (panel.hidden) openPanel(); else closePanel(true);
    });
    if (closeBtn) closeBtn.addEventListener('click', function () { closePanel(true); });

    panel.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-a11y]');
      if (!btn) return;
      var action = btn.getAttribute('data-a11y');

      switch (action) {
        case 'font-inc':
          state.fontStep = Math.min(FONT_MAX, state.fontStep + 1);
          break;
        case 'font-dec':
          state.fontStep = Math.max(FONT_MIN, state.fontStep - 1);
          break;
        case 'contrast':
          state.contrast = !state.contrast;
          break;
        case 'underline':
          state.underline = !state.underline;
          break;
        case 'motion':
          state.motionOff = !state.motionOff;
          break;
        case 'readable':
          state.readable = !state.readable;
          break;
        case 'reset':
          state = { fontStep: 0, contrast: false, underline: false, motionOff: false, readable: false };
          break;
      }
      applyState();
      saveState();
    });

    loadState();
    applyState();
  })();
})();
