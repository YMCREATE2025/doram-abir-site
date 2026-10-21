(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  fetch('/api/content', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || typeof data !== 'object') return;
      Object.keys(data).forEach(function (cid) {
        var val = data[cid];
        if (val === null || val === undefined || val === '') return;

        document.querySelectorAll('[data-cid="' + cid + '"]').forEach(function (el) {
          if (el.tagName === 'IMG') {
            el.setAttribute('src', val);
          } else if (el.tagName === 'H3' && String(val).indexOf('\n') !== -1) {
            el.innerHTML = String(val).split('\n').map(escapeHtml).join('<br>');
          } else {
            el.textContent = val;
          }
        });

        document.querySelectorAll('[data-cid-href="' + cid + '"]').forEach(function (el) {
          el.setAttribute('href', val);
        });
      });
    })
    .catch(function () { /* offline / API unavailable: static HTML stands as-is */ });
})();
