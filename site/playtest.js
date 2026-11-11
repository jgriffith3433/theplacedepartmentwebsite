// window.hawkesPlaytest for the marketing pages (Hawkes Studio's docs/playtest.md). Scenarios: smoke, pages, phone-nav.
// Game/index.html has its own Unity contract surface; this file stands down when one exists, and it does nothing until
// a scenario is started (?playtest=<id> or start()). A run keeps its state in sessionStorage so "pages" can follow real
// links across page loads. Nothing here polls the network or changes what a visitor sees.
(function () {
  if (window.hawkesPlaytest) return;
  var KEY = "placePlaytest";
  var errors = [];
  var failedResources = [];
  window.addEventListener("error", function (e) {
    if (e.target && e.target !== window && (e.target.src || e.target.href)) failedResources.push(e.target.src || e.target.href);
    else errors.push(String(e.message || "error"));
  }, true);
  window.addEventListener("unhandledrejection", function (e) { errors.push("rejection: " + String(e.reason)); });
  var origError = console.error;
  console.error = function () {
    errors.push(Array.prototype.slice.call(arguments).join(" ").slice(0, 200));
    return origError.apply(console, arguments);
  };

  var SCENARIOS = [
    { id: "smoke", title: "Home loads, hero video plays, PLAY reaches Game", seconds: 15, tags: ["smoke"] },
    { id: "pages", title: "Visit every nav page through its link: status, console errors, sideways scroll, broken images", seconds: 30, tags: ["full"] },
    { id: "phone-nav", title: "Open and close the menu (at 390px)", seconds: 10, tags: ["menus"] },
    { id: "install-hint", title: "PWA: manifest, icons, shell worker, second-visit A2HS hint at 390px", seconds: 45, tags: ["full", "phone", "pwa"] }
  ];

  var run = null;
  try { run = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { run = null; }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(run)); } catch (e) {} }
  function elapsed() { return run ? Math.round((Date.now() - run.t0) / 100) / 10 : 0; }
  function event(type, detail) { run.events.push({ t: elapsed(), type: type, detail: detail }); run.moved = Date.now(); save(); }
  function problem(severity, message) { run.problems.push({ severity: severity, message: message }); save(); }
  function finish(outcome) {
    if (run.done) return;
    run.done = true;
    run.outcome = outcome;
    run.seconds = elapsed();
    run.status = outcome;
    save();
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function until(test, ms) {
    var end = Date.now() + ms;
    return new Promise(function (resolve) {
      (function check() {
        var v = test();
        if (v || Date.now() > end) resolve(v);
        else setTimeout(check, 100);
      })();
    });
  }
  function loaded() {
    return document.readyState === "complete" ? Promise.resolve() : new Promise(function (r) { window.addEventListener("load", r, { once: true }); });
  }
  function pathOf(href) { return new URL(href, location.href).pathname; }
  function navLinks() {
    var seen = {}, out = [];
    document.querySelectorAll(".nav a[href]").forEach(function (a) {
      var p = pathOf(a.href);
      if (/\/Game\//.test(p) || seen[p] || a.hasAttribute("download")) return;
      seen[p] = 1;
      out.push(p);
    });
    return out;
  }
  function findLink(path) {
    var found = null;
    document.querySelectorAll(".nav a[href]").forEach(function (a) { if (!found && pathOf(a.href) === path) found = a; });
    return found;
  }
  function samePage(path) { return path === location.pathname || (path.replace(/index\.html$/, "") === location.pathname.replace(/index\.html$/, "")); }

  function inspectPage() {
    var nav = performance.getEntriesByType("navigation")[0];
    var images = Array.prototype.slice.call(document.images);
    var broken = images.filter(function (i) { return i.complete && i.naturalWidth === 0 && (i.currentSrc || i.src); }).map(function (i) { return i.currentSrc || i.src; });
    var root = document.documentElement;
    return {
      path: location.pathname,
      status: nav && nav.responseStatus ? nav.responseStatus : 0,
      errors: errors.concat(failedResources.map(function (u) { return "failed to load " + u; })),
      overflow: Math.max(root.scrollWidth, document.body.scrollWidth) - window.innerWidth,
      width: window.innerWidth,
      brokenImages: broken
    };
  }

  function openMenu() { return document.getElementById("navToggle"); }

  async function stepPages() {
    await loaded();
    await wait(400);
    var r = inspectPage();
    var first = !run.queue;
    if (first) { run.queue = navLinks().filter(function (p) { return !samePage(p); }); run.visited = []; }
    run.visited.push(r.path);
    run.metrics.pagesVisited = run.visited.length;
    event("page", r.path + " status " + r.status + " errors " + r.errors.length + " overflow " + r.overflow + "px images-broken " + r.brokenImages.length);
    if (r.status >= 400 || r.status === 0) problem("bug", r.path + " answered " + (r.status || "no status"));
    if (r.overflow > 1) { problem("bug", r.path + " scrolls sideways by " + r.overflow + "px at " + r.width + "px wide"); run.metrics.overflowPages = (run.metrics.overflowPages || 0) + 1; }
    r.errors.forEach(function (m) { problem("bug", r.path + " console error: " + m); });
    r.brokenImages.forEach(function (u) { problem("bug", r.path + " image failed: " + u); });
    run.metrics.consoleErrors = (run.metrics.consoleErrors || 0) + r.errors.length;
    run.metrics.brokenImages = (run.metrics.brokenImages || 0) + r.brokenImages.length;
    run.metrics["status:" + r.path] = r.status;
    run.metrics.width = r.width;
    // The Play link goes to Game/, which has its own contract: only its status is read (no second page load).
    if (first) {
      var play = document.querySelector(".nav-play");
      if (play) {
        try {
          var res = await fetch(play.href, { method: "HEAD" });
          run.metrics["status:/Game/"] = res.status;
          event("page", "/Game/ status " + res.status + " (nav Play link)");
          if (res.status >= 400) problem("bug", "Play link answered " + res.status);
        } catch (e) { problem("bug", "Play link unreachable"); }
      }
    }
    save();
    var next = run.queue.shift();
    if (!next) { run.progress = 1; finish("done"); return; }
    run.progress = run.visited.length / (run.visited.length + run.queue.length + 1);
    save();
    var link = findLink(next);
    if (!link) {
      // A page without the link back: follow the nav of another page by going to the home link.
      problem("warning", "no nav link to " + next + " on " + r.path);
      location.href = next;
      return;
    }
    link.click();
  }

  async function runSmoke() {
    await loaded();
    var video = document.querySelector("[data-hero-loop]");
    if (!video) { problem("bug", "no hero video on the home page"); }
    else {
      var playing = await until(function () { return !video.paused && video.currentTime > 0; }, 6000);
      run.metrics.heroPlaying = playing ? 1 : 0;
      event("hero-video", playing ? "playing at " + video.currentTime.toFixed(1) + "s" : "not playing");
      if (!playing) problem("warning", "hero video did not start (reduced motion or autoplay blocked)");
    }
    var play = document.querySelector(".nav-play");
    if (!play) { problem("bug", "no PLAY link in the nav"); finish("error"); return; }
    var target = new URL(play.href, location.href);
    var res;
    try { res = await fetch(target.href, { method: "HEAD" }); } catch (e) { res = { status: 0 }; }
    run.metrics.gameStatus = res.status;
    run.metrics.errors = errors.length;
    errors.forEach(function (m) { problem("bug", "console error: " + m); });
    var ok = res.status >= 200 && res.status < 400 && /\/Game\/(index\.html)?$/.test(target.pathname);
    event("play", "PLAY -> " + target.pathname + " status " + res.status);
    if (!ok) problem("bug", "PLAY does not reach Game/ (" + target.pathname + ", " + res.status + ")");
    run.progress = 1;
    finish(ok ? "done" : "error");
    play.click();
  }

  async function runPhoneNav() {
    await loaded();
    run.metrics.width = window.innerWidth;
    var toggle = openMenu();
    if (!toggle) {
      var root = document.documentElement;
      var over = root.scrollWidth - window.innerWidth;
      run.metrics.hasMenu = 0;
      run.metrics.overflow = over;
      event("no-menu", "this site's nav has no menu button; links shown inline");
      if (over > 1) problem("bug", "page scrolls sideways by " + over + "px");
      var visible = Array.prototype.filter.call(document.querySelectorAll(".nav a"), function (a) { var b = a.getBoundingClientRect(); return b.width > 0 && b.right <= window.innerWidth + 1; });
      run.metrics.navLinksInView = visible.length;
      run.progress = 1;
      finish("done");
      return;
    }
    run.metrics.hasMenu = 1;
    toggle.click();
    await wait(300);
    var opened = toggle.getAttribute("aria-expanded") === "true";
    event("menu-open", opened ? "open" : "did not open");
    if (!opened) problem("bug", "menu did not open");
    toggle.click();
    await wait(300);
    var closed = toggle.getAttribute("aria-expanded") !== "true";
    event("menu-close", closed ? "closed" : "did not close");
    if (!closed) problem("bug", "menu did not close");
    run.progress = 1;
    finish(opened && closed ? "done" : "error");
  }

  async function runInstallHint() {
    await loaded();
    run.metrics.width = window.innerWidth;
    event("viewport", window.innerWidth + "x" + window.innerHeight);

    var manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) { problem("bug", "no manifest link"); finish("error"); return; }
    var manifestUrl = new URL(manifestLink.href, location.href);
    var manifest;
    try {
      var res = await fetch(manifestUrl.href, { cache: "no-store" });
      run.metrics.manifestStatus = res.status;
      manifest = await res.json();
    } catch (e) {
      problem("bug", "manifest fetch failed");
      finish("error");
      return;
    }
    event("manifest", (manifest.name || "") + " start_url=" + (manifest.start_url || ""));
    if (manifest.name !== "The Place Department") problem("bug", "manifest name wrong");
    if (manifest.short_name !== "The Place") problem("bug", "manifest short_name wrong");
    if (!/Game\/?$/.test(String(manifest.start_url || "").replace(/^\.\//, ""))) problem("bug", "start_url should point at Game/");
    if (manifest.display !== "fullscreen" && !(manifest.display_override || []).includes("fullscreen")) problem("bug", "display should be fullscreen");
    if (manifest.orientation !== "landscape") problem("bug", "orientation should be landscape");
    if (manifest.theme_color !== "#12100e" || manifest.background_color !== "#12100e") problem("bug", "theme/background should be dossier #12100e");
    var icons = manifest.icons || [];
    var has192 = icons.some(function (i) { return String(i.sizes || "").indexOf("192") >= 0; });
    var has512 = icons.some(function (i) { return String(i.sizes || "").indexOf("512") >= 0; });
    var hasMaskable = icons.some(function (i) { return String(i.purpose || "").indexOf("maskable") >= 0; });
    run.metrics.icon192 = has192 ? 1 : 0;
    run.metrics.icon512 = has512 ? 1 : 0;
    run.metrics.maskable = hasMaskable ? 1 : 0;
    if (!has192 || !has512) problem("bug", "manifest needs 192 and 512 icons");
    if (!hasMaskable) problem("bug", "manifest needs maskable icons");
    run.progress = 0.25;

    var apple = document.querySelector('link[rel="apple-touch-icon"]');
    if (!apple) problem("bug", "missing apple-touch-icon");
    else {
      try {
        var ares = await fetch(apple.href, { method: "HEAD", cache: "no-store" });
        run.metrics.appleTouchStatus = ares.status;
        event("apple-touch-icon", ares.status + " " + apple.href.split("/").pop());
        if (ares.status >= 400) problem("bug", "apple-touch-icon failed");
      } catch (e) { problem("bug", "apple-touch-icon unreachable"); }
    }
    var splash = document.querySelectorAll('link[rel="apple-touch-startup-image"]');
    run.metrics.iosSplash = splash.length;
    event("ios-splash", splash.length + " startup image meta tags");
    if (splash.length < 1) problem("bug", "missing iOS splash meta");
    run.progress = 0.4;

    if (!("serviceWorker" in navigator)) {
      problem("warning", "serviceWorker API missing in this browser");
    } else {
      var ready = await until(function () { return navigator.serviceWorker.controller || (window.__placeA2HS && document.querySelector('script[src*="a2hs"]')); }, 4000);
      var regs = await navigator.serviceWorker.getRegistrations();
      run.metrics.swRegistrations = regs.length;
      event("service-worker", regs.length ? ("registered " + regs.map(function (r) { return r.scope; }).join(", ")) : "none yet");
      // Confirm the worker script exists and never claims Unity builds in its source text.
      try {
        var swRes = await fetch(new URL("sw.js", location.href).href, { cache: "no-store" });
        var swText = await swRes.text();
        run.metrics.swStatus = swRes.status;
        if (swRes.status >= 400) problem("bug", "sw.js missing");
        if (!/unityweb/i.test(swText) || !/no-store/i.test(swText)) problem("bug", "sw.js should refuse Unity builds and network-first HTML");
        else event("sw-policy", "shell-only + network-first HTML");
      } catch (e) { problem("bug", "sw.js fetch failed"); }
    }
    run.progress = 0.55;

    // Setup shortcut: simulate sessions with localStorage visit count (sessionStorage marks one bump per tab).
    event("start-at", "second-visit");
    await until(function () { return window.__placeA2HS; }, 3000);
    if (!window.__placeA2HS) {
      problem("bug", "a2hs.js did not install window.__placeA2HS");
      finish("error");
      return;
    }
    try {
      localStorage.removeItem("placeA2HS.dismissed");
      localStorage.setItem("placeA2HS.visits", "1");
      sessionStorage.removeItem("placeA2HS.sessionCounted");
    } catch (e) {}
    window.__placeA2HS.hide();
    var first = window.__placeA2HS.maybeShow();
    run.metrics.firstVisitHint = first ? 1 : 0;
    if (first) problem("bug", "hint appeared on first visit/session");
    else event("hint-first-visit", "hidden");
    // Same session, navigating pages must not bump again.
    var before = parseInt(localStorage.getItem("placeA2HS.visits") || "0", 10);
    sessionStorage.setItem("placeA2HS.sessionCounted", "1");
    window.__placeA2HS.bumpVisit();
    var after = parseInt(localStorage.getItem("placeA2HS.visits") || "0", 10);
    run.metrics.sameSessionBump = after === before ? 0 : 1;
    if (after !== before) problem("bug", "visit count rose twice in one session");
    else event("hint-same-session", "no second bump");
    // Second session: visits >= 2.
    try {
      localStorage.setItem("placeA2HS.visits", "2");
      sessionStorage.setItem("placeA2HS.sessionCounted", "1");
    } catch (e) {}
    var hint = window.__placeA2HS.maybeShow();
    if (!hint) {
      // Desktop playtest bots may not count as phones: force the same UI so footage still shows it.
      if (!window.__placeA2HS.isPhone()) {
        event("phone-check", "not a phone viewport; forcing hint for review shot");
        hint = window.__placeA2HS.show({ force: true });
        run.metrics.forcedHint = 1;
      }
    }
    await wait(400);
    hint = document.getElementById("place-a2hs-hint");
    run.metrics.hintVisible = hint ? 1 : 0;
    if (!hint) { problem("bug", "A2HS hint not visible after second visit"); finish("error"); return; }
    event("hint-shown", hint.innerText.replace(/\s+/g, " ").slice(0, 120));
    run.progress = 0.8;

    var dismissBtn = hint.querySelector(".a2hs-dismiss") || hint.querySelector("button");
    if (!dismissBtn) { problem("bug", "hint has no dismiss control"); finish("error"); return; }
    dismissBtn.click();
    await wait(200);
    var gone = !document.getElementById("place-a2hs-hint");
    var stayed = false;
    try { stayed = localStorage.getItem("placeA2HS.dismissed") === "1"; } catch (e) {}
    run.metrics.hintDismissed = gone && stayed ? 1 : 0;
    event("hint-dismissed", gone && stayed ? "gone and remembered" : "failed");
    if (!(gone && stayed)) problem("bug", "dismiss did not hide and remember");
    // Stays dismissed on another maybeShow
    var again = window.__placeA2HS.maybeShow();
    if (again) problem("bug", "hint returned after dismiss");
    else event("hint-stays-dismissed", "ok");

    // Desktop should not show for a normal visitor path (criterion: phones only).
    run.metrics.isPhone = window.__placeA2HS.isPhone() ? 1 : 0;
    event("phone-only", window.__placeA2HS.isPhone() ? "phone" : "desktop (hint only via force in this run)");

    run.progress = 1;
    var bugs = (run.problems || []).filter(function (p) { return p.severity === "bug"; });
    finish(bugs.length ? "error" : "done");
  }

  function begin(id, options) {
    run = { id: id, t0: Date.now(), moved: Date.now(), status: "running", progress: 0, done: false, events: [], problems: [], metrics: {}, options: options || {}, log: [] };
    save();
    return resume();
  }
  function resume() {
    if (!run || run.done) return Promise.resolve();
    var fn = run.id === "pages" ? stepPages : run.id === "smoke" ? runSmoke : run.id === "phone-nav" ? runPhoneNav : run.id === "install-hint" ? runInstallHint : null;
    if (!fn) { problem("bug", "unknown scenario " + run.id); finish("error"); return Promise.resolve(); }
    return fn().catch(function (e) { problem("bug", "scenario threw: " + e); finish("error"); });
  }

  window.hawkesPlaytest = {
    version: 1,
    product: "theplacedepartment",
    scenarios: function () { return SCENARIOS.slice(); },
    start: function (id, options) { return begin(id, options); },
    state: function () {
      if (!run) return { ready: true, status: "idle" };
      return { ready: true, status: run.status, scene: location.pathname, progress: run.progress, metrics: Object.assign({}, run.metrics), note: run.done ? "finished" : "running" };
    },
    report: function () {
      if (!run) return null;
      return { scenario: run.id, outcome: run.done ? run.outcome : "stuck", seconds: run.seconds != null ? run.seconds : elapsed(), metrics: Object.assign({}, run.metrics), events: run.events.slice(), problems: run.problems.slice(), log: run.log.slice() };
    },
    stop: function () { if (run && !run.done) finish("done"); }
  };

  var q = new URLSearchParams(location.search).get("playtest");
  if (q && !(run && !run.done && run.id === q)) begin(q);
  else if (run && !run.done && Date.now() - run.moved < 60000) resume();
})();
