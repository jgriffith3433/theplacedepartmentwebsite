/* Add-to-home-screen hint + service worker registration for The Place Department.
   Phones only, after the second visit, dismissible (localStorage). iOS gets Share steps
   when beforeinstallprompt is missing. Never polls the network. */
(function () {
  if (window.__placeA2HS) return;
  var VISITS_KEY = "placeA2HS.visits";
  var DISMISS_KEY = "placeA2HS.dismissed";
  var SESSION_MARK = "placeA2HS.sessionCounted";
  var STYLE_ID = "place-a2hs-style";
  var HINT_ID = "place-a2hs-hint";

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }
  function sessionGet(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function sessionSet(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {}
  }

  function isPhone() {
    if (window.matchMedia && window.matchMedia("(max-width: 820px) and (hover: none)").matches) return true;
    if (window.matchMedia && window.matchMedia("(max-width: 820px) and (pointer: coarse)").matches) return true;
    var ua = navigator.userAgent || "";
    return /iPhone|iPod|Android.+Mobile|Mobile.+Android/i.test(ua);
  }

  function isStandalone() {
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.matchMedia && window.matchMedia("(display-mode: fullscreen)").matches) return true;
    return !!navigator.standalone;
  }

  function isIos() {
    var ua = navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function baseHref(path) {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || "";
      if (/\/site\/a2hs\.js(\?|$)/.test(src)) {
        return new URL("../" + path.replace(/^\.\//, ""), src).href;
      }
    }
    return new URL(path, location.href).href;
  }

  function registerWorker() {
    if (!("serviceWorker" in navigator)) return Promise.resolve(null);
    var swUrl = baseHref("sw.js");
    return navigator.serviceWorker.register(swUrl, { scope: new URL("./", swUrl).href }).catch(function () {
      return null;
    });
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "#" + HINT_ID + "{position:fixed;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:60;",
      "max-width:420px;margin:0 auto;padding:14px 14px 12px;background:#1c1814;color:#f6f1e8;",
      "border:1px solid rgba(231,211,176,.28);border-top:4px solid #e7d3b0;border-radius:2px 10px 3px 3px;",
      "box-shadow:0 16px 40px rgba(0,0,0,.55);font-family:Outfit,Arial,Helvetica,sans-serif;}",
      "#" + HINT_ID + " .a2hs-kicker{margin:0 0 6px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#cbbdaa;}",
      "#" + HINT_ID + " .a2hs-title{margin:0 0 8px;font-family:\"Special Elite\",\"Courier New\",Courier,monospace;",
      "font-weight:400;font-size:1.05rem;line-height:1.2;color:#e7d3b0;}",
      "#" + HINT_ID + " .a2hs-body{margin:0 0 12px;font-size:13px;line-height:1.45;color:#cbbdaa;}",
      "#" + HINT_ID + " .a2hs-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}",
      "#" + HINT_ID + " button{appearance:none;border:1px solid rgba(231,211,176,.28);background:transparent;",
      "color:#e7d3b0;font:inherit;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;",
      "padding:10px 12px;cursor:pointer;}",
      "#" + HINT_ID + " button.a2hs-primary{background:#f0b36a;border-color:#f0b36a;color:#1c140c;}",
      "#" + HINT_ID + " button.a2hs-dismiss{margin-left:auto;}"
    ].join("");
    document.head.appendChild(style);
  }

  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent("place-a2hs-prompt", { detail: { available: true } }));
  });

  function hideHint() {
    var el = document.getElementById(HINT_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function dismiss() {
    storageSet(DISMISS_KEY, "1");
    hideHint();
    window.dispatchEvent(new CustomEvent("place-a2hs-dismissed"));
  }

  function showHint(opts) {
    opts = opts || {};
    if (document.getElementById(HINT_ID)) return document.getElementById(HINT_ID);
    ensureStyle();
    var el = document.createElement("aside");
    el.id = HINT_ID;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Add The Place to your home screen");
    var ios = isIos() && !deferredPrompt;
    var body = ios
      ? "On iPhone: tap Share, then Add to Home Screen. The filed icon opens the game full screen, without browser chrome."
      : "File this desk on your home screen. The icon opens the game full screen — landscape, dossier dark.";
    el.innerHTML =
      '<p class="a2hs-kicker">The Place Department</p>' +
      '<p class="a2hs-title">Keep this address</p>' +
      '<p class="a2hs-body">' + body + "</p>" +
      '<div class="a2hs-actions"></div>';
    var actions = el.querySelector(".a2hs-actions");
    if (!ios && deferredPrompt) {
      var installBtn = document.createElement("button");
      installBtn.type = "button";
      installBtn.className = "a2hs-primary";
      installBtn.textContent = "Install";
      installBtn.addEventListener("click", function () {
        var prompt = deferredPrompt;
        deferredPrompt = null;
        if (!prompt) return;
        prompt.prompt();
        Promise.resolve(prompt.userChoice).then(function () {
          dismiss();
        });
      });
      actions.appendChild(installBtn);
    }
    var dismissBtn = document.createElement("button");
    dismissBtn.type = "button";
    dismissBtn.className = "a2hs-dismiss";
    dismissBtn.textContent = "Not now";
    dismissBtn.addEventListener("click", dismiss);
    actions.appendChild(dismissBtn);
    document.body.appendChild(el);
    window.dispatchEvent(new CustomEvent("place-a2hs-shown", { detail: { ios: ios } }));
    return el;
  }

  function bumpVisit() {
    // One count per browser session (home → Play must not look like a second visit).
    if (sessionGet(SESSION_MARK) === "1") {
      return parseInt(storageGet(VISITS_KEY) || "0", 10) || 0;
    }
    var n = parseInt(storageGet(VISITS_KEY) || "0", 10);
    if (!isFinite(n) || n < 0) n = 0;
    n += 1;
    storageSet(VISITS_KEY, String(n));
    sessionSet(SESSION_MARK, "1");
    return n;
  }

  function maybeShow() {
    if (storageGet(DISMISS_KEY) === "1") return null;
    if (isStandalone()) return null;
    if (!isPhone()) return null;
    var visits = parseInt(storageGet(VISITS_KEY) || "0", 10);
    if (!(visits >= 2)) return null;
    return showHint();
  }

  function boot() {
    registerWorker();
    var force = false;
    try {
      force = new URLSearchParams(location.search).get("a2hs") === "1";
    } catch (e) {}
    if (force) {
      showHint({ force: true });
      return;
    }
    bumpVisit();
    maybeShow();
  }

  window.__placeA2HS = {
    show: showHint,
    hide: hideHint,
    dismiss: dismiss,
    maybeShow: maybeShow,
    bumpVisit: bumpVisit,
    isPhone: isPhone,
    isIos: isIos,
    isStandalone: isStandalone,
    keys: { visits: VISITS_KEY, dismissed: DISMISS_KEY, session: SESSION_MARK },
    registerWorker: registerWorker
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
