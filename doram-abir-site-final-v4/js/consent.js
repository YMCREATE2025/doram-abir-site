(function () {
  'use strict';

  var KEY = 'da_cookie_consent';

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }
  function setConsent(analytics) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ essential: true, analytics: !!analytics, ts: Date.now() }));
    } catch (e) { /* ignore */ }
  }

  var banner = document.getElementById('cookie-banner');
  var prefsBox = document.getElementById('cookie-prefs');
  var analyticsCheckbox = document.getElementById('cookie-pref-analytics');

  function openBanner(showPrefs) {
    if (!banner) return;
    banner.hidden = false;
    if (showPrefs && prefsBox) {
      prefsBox.hidden = false;
      var existing = getConsent();
      if (analyticsCheckbox) analyticsCheckbox.checked = existing ? !!existing.analytics : false;
    }
  }
  function closeBanner() {
    if (banner) banner.hidden = true;
  }

  if (!getConsent()) {
    openBanner(false);
  }

  var acceptAllBtn = document.getElementById('cookie-accept-all');
  var essentialBtn = document.getElementById('cookie-essential-only');
  var customizeBtn = document.getElementById('cookie-customize');
  var savePrefsBtn = document.getElementById('cookie-save-prefs');

  if (acceptAllBtn) {
    acceptAllBtn.addEventListener('click', function () {
      setConsent(true);
      closeBanner();
      if (window.daStartAnalytics) window.daStartAnalytics();
    });
  }
  if (essentialBtn) {
    essentialBtn.addEventListener('click', function () {
      setConsent(false);
      closeBanner();
    });
  }
  if (customizeBtn) {
    customizeBtn.addEventListener('click', function () {
      if (!prefsBox) return;
      prefsBox.hidden = !prefsBox.hidden;
      if (!prefsBox.hidden) {
        var existing = getConsent();
        if (analyticsCheckbox) analyticsCheckbox.checked = existing ? !!existing.analytics : false;
      }
    });
  }
  if (savePrefsBtn) {
    savePrefsBtn.addEventListener('click', function () {
      var wantsAnalytics = !!(analyticsCheckbox && analyticsCheckbox.checked);
      setConsent(wantsAnalytics);
      closeBanner();
      if (wantsAnalytics && window.daStartAnalytics) window.daStartAnalytics();
    });
  }

  document.querySelectorAll('.cookie-settings-link').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openBanner(true);
    });
  });
})();
