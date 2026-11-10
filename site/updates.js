// What's new feed: cards from site/updates.json, "New" marks and the nav dot from the visitor's last visit (localStorage).
(function () {
  var KEY = 'tpd.updates.seen';
  var base = document.currentScript.src.replace(/[^/]*$/, '');
  var seen = null;
  try { seen = localStorage.getItem(KEY); } catch (e) {}
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function fmt(d) {
    var t = Date.parse(d + 'T12:00:00Z');
    return isNaN(t) ? d : new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  }
  function isNew(u) { return !!seen && u.date > seen; }
  fetch(base + 'updates.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }).then(function (data) {
    var list = ((data && data.updates) || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    if (!list.length) return;
    var fresh = list.filter(isNew).length;
    document.querySelectorAll('[data-hawkes-whatsnew]').forEach(function (a) {
      if (!a.closest('header') || a.querySelector('.nav-dot')) return;
      if (fresh && !document.body.hasAttribute('data-whatsnew-page')) {
        var d = el('span', 'nav-dot'); d.setAttribute('aria-label', 'New updates'); d.title = fresh + ' new'; a.appendChild(d);
      }
    });
    var box = document.querySelector('[data-updates]');
    if (box) {
      box.textContent = '';
      list.forEach(function (u) {
        var c = el('article', 'update-card' + (isNew(u) ? ' is-new' : ''));
        c.setAttribute('data-update', u.id || '');
        var m;
        if (u.clip) {
          m = el('video', 'update-media'); m.muted = true; m.loop = true; m.autoplay = true; m.playsInline = true; m.preload = 'metadata';
          m.setAttribute('muted', ''); m.setAttribute('playsinline', ''); if (u.image) m.poster = u.image; m.src = u.clip;
          m.setAttribute('aria-label', u.alt || u.title);
          if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) m.removeAttribute('autoplay');
        } else { m = el('img', 'update-media'); m.src = u.image; m.alt = u.alt || ''; m.loading = 'lazy'; }
        c.appendChild(m);
        var b = el('div', 'update-body');
        var h = el('p', 'update-meta');
        var t = el('time', null, fmt(u.date)); t.setAttribute('datetime', u.date); h.appendChild(t);
        if (isNew(u)) h.appendChild(el('span', 'update-new', 'New'));
        b.appendChild(h); b.appendChild(el('h2', null, u.title));
        (u.lines || []).slice(0, 2).forEach(function (l) { b.appendChild(el('p', 'update-line', l)); });
        c.appendChild(b); box.appendChild(c);
      });
    }
    var onPage = document.body.hasAttribute('data-whatsnew-page');
    if (onPage || !seen) { try { localStorage.setItem(KEY, list[0].date); } catch (e) {} }
  });
})();
