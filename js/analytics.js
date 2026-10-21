(function () {
  'use strict';

  var ENDPOINT = '/api/track';
  var CONSENT_KEY = 'da_cookie_consent';

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /* ---------- consent ---------- */
  function getConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); } catch (e) { return null; }
  }
  function hasAnalyticsConsent() {
    var c = getConsent();
    return !!(c && c.analytics === true);
  }
  window.daHasAnalyticsConsent = hasAnalyticsConsent;
  window.daGetConsent = getConsent;

  /* ---------- visitor / session ids (only created once analytics consent exists) ---------- */
  var isNewVisitor = false;
  var visitorId = 'na';
  var sessionId = 'na';
  function ensureIds() {
    if (visitorId !== 'na') return;
    try {
      visitorId = localStorage.getItem('da_vid');
      if (!visitorId) {
        visitorId = uuid();
        localStorage.setItem('da_vid', visitorId);
        isNewVisitor = true;
      }
    } catch (e) { /* private mode / storage blocked */ }
    try {
      sessionId = sessionStorage.getItem('da_sid');
      if (!sessionId) {
        sessionId = uuid();
        sessionStorage.setItem('da_sid', sessionId);
      }
    } catch (e) { /* ignore */ }
  }

  function qs(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }

  function classifySource(ref) {
    if (!ref) return 'direct';
    var host = '';
    try { host = new URL(ref).hostname.replace(/^www\./, ''); } catch (e) { return 'referral'; }
    if (host === window.location.hostname) return 'internal';
    if (/google\./.test(host) || /bing\./.test(host) || /yahoo\./.test(host)) return 'organic';
    if (/facebook\.|instagram\.|fb\.com|l\.instagram/.test(host)) return 'social';
    if (/whatsapp\./.test(host)) return 'social';
    return 'referral';
  }

  function currentTouch() {
    var ref = document.referrer || '';
    return {
      source: qs('utm_source') || classifySource(ref),
      medium: qs('utm_medium') || (qs('utm_source') ? 'campaign' : ref ? 'referral' : 'none'),
      campaign: qs('utm_campaign') || '',
      content: qs('utm_content') || '',
      term: qs('utm_term') || '',
      referrer: ref,
      landingPage: window.location.pathname
    };
  }

  /* persist=true keeps a "first touch" record across the visit (only once analytics
     consent has been granted); persist=false just computes a one-off snapshot,
     used for the lead event which is sent regardless of analytics consent since it
     documents the user's own explicit request for a callback. */
  function computeAttribution(persist) {
    var current = currentTouch();
    if (!persist) return { firstTouch: current, currentTouch: current };
    var stored = null;
    try { stored = JSON.parse(localStorage.getItem('da_attribution') || 'null'); } catch (e) { /* ignore */ }
    if (!stored) {
      stored = current;
      try { localStorage.setItem('da_attribution', JSON.stringify(current)); } catch (e) { /* ignore */ }
    }
    return { firstTouch: stored, currentTouch: current };
  }

  function send(type, payload) {
    var isLead = type === 'lead';
    if (!isLead && !hasAnalyticsConsent()) return; // behavioral analytics require consent
    if (isLead) ensureIds();
    var attribution = computeAttribution(hasAnalyticsConsent());
    var body = Object.assign(
      {
        type: type,
        ts: Date.now(),
        path: window.location.pathname,
        visitorId: visitorId,
        sessionId: sessionId,
        isNewVisitor: isNewVisitor,
        attribution: attribution
      },
      payload || {}
    );
    try {
      var text = JSON.stringify(body);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([text], { type: 'application/json' }));
      } else {
        fetch(ENDPOINT, { method: 'POST', body: text, headers: { 'Content-Type': 'application/json' }, keepalive: true });
      }
    } catch (e) { /* never let tracking break the page */ }
  }
  window.daTrack = send;

  /* ---------- behavioral tracking (gated behind analytics consent) ---------- */
  function onDocumentClick(e) {
    var el = e.target && e.target.closest ? e.target.closest('a, button') : null;
    if (el) {
      var href = el.getAttribute('href') || '';
      var label = (el.textContent || '').trim().slice(0, 60);
      var section = el.closest('section[id]');
      var sectionId = section ? section.id : '';

      if (/^https:\/\/wa\.me\//.test(href)) {
        send('whatsapp_click', { label: label, section: sectionId, href: href });
      } else if (/^tel:/.test(href)) {
        send('phone_click', { label: label, section: sectionId, href: href });
      } else if (el.classList.contains('reel-card')) {
        send('reel_click', { label: label, href: href });
      } else if (/^https:\/\/(www\.)?instagram\.com/.test(href) && !el.classList.contains('reel-card')) {
        send('instagram_click', { label: label, section: sectionId, href: href });
      } else if (el.classList.contains('btn') || el.tagName === 'BUTTON') {
        send('button_click', { label: label, section: sectionId, href: href });
      }
    }

    try {
      var docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      var xPct = Math.round((e.pageX / window.innerWidth) * 1000) / 10;
      var yPct = docH > 0 ? Math.round((e.pageY / docH) * 1000) / 10 : 0;
      send('click_point', { xPct: xPct, yPct: yPct, tag: e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '' });
    } catch (e) { /* ignore */ }
  }

  var firedDepths = {};
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight;
      if (docH <= 0) return;
      var pct = Math.min(100, Math.round((scrollTop / docH) * 100));
      [25, 50, 75, 100].forEach(function (d) {
        if (pct >= d && !firedDepths[d]) {
          firedDepths[d] = true;
          send('scroll_depth', { depth: d });
        }
      });
    });
  }

  function startAnalytics() {
    if (window.__daStarted) return;
    if (!hasAnalyticsConsent()) return;
    window.__daStarted = true;
    ensureIds();
    send('pageview', {});
    document.addEventListener('click', onDocumentClick, true);
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  window.daStartAnalytics = startAnalytics;

  // if consent was already granted in a previous visit, start immediately
  if (hasAnalyticsConsent()) startAnalytics();
})();
