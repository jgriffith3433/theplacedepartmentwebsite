/* The Place Department — shell-only service worker.
   Caches the marketing shell + offline card. Never the Unity build.
   HTML navigations are network-first so a new deploy is never stale. */
(function () {
  var CACHE = "place-shell-v1";
  var SHELL = [
    "./offline.html",
    "./favicon.svg",
    "./manifest.webmanifest",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png",
    "./assets/icons/apple-touch-icon.png",
    "./site/a2hs.js",
    "./site/dossier.css",
    "./site/marketing.css"
  ];

  function sameOrigin(url) {
    try {
      return new URL(url, self.location.href).origin === self.location.origin;
    } catch (e) {
      return false;
    }
  }

  function isUnityBuild(url) {
    var u = String(url);
    return (
      /\.unityweb(\?|$)/i.test(u) ||
      /\/builds\//i.test(u) ||
      /\/Game\/v\d+\//i.test(u) ||
      /framework\.js/i.test(u) ||
      /Build\/.*\.(data|wasm|framework)/i.test(u)
    );
  }

  function isHtmlRequest(request) {
    if (request.mode === "navigate") return true;
    var accept = request.headers.get("accept") || "";
    if (accept.indexOf("text/html") >= 0) return true;
    try {
      var path = new URL(request.url).pathname;
      return /\/$|\.html?$/i.test(path);
    } catch (e) {
      return false;
    }
  }

  self.addEventListener("install", function (event) {
    event.waitUntil(
      caches.open(CACHE).then(function (cache) {
        return cache.addAll(
          SHELL.map(function (p) {
            return new Request(new URL(p, self.location.href).href, { cache: "reload" });
          })
        );
      }).then(function () {
        return self.skipWaiting();
      })
    );
  });

  self.addEventListener("activate", function (event) {
    event.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key !== CACHE) return caches.delete(key);
          })
        );
      }).then(function () {
        return self.clients.claim();
      })
    );
  });

  self.addEventListener("fetch", function (event) {
    var request = event.request;
    if (request.method !== "GET") return;
    if (!sameOrigin(request.url)) return;
    if (isUnityBuild(request.url)) return;

    if (isHtmlRequest(request)) {
      event.respondWith(
        fetch(request, { cache: "no-store" })
          .then(function (response) {
            return response;
          })
          .catch(function () {
            return caches.match(new URL("./offline.html", self.location.href).href).then(function (cached) {
              return cached || new Response("Offline", { status: 503, statusText: "Offline" });
            });
          })
      );
      return;
    }

    var path;
    try {
      path = new URL(request.url).pathname;
    } catch (e) {
      return;
    }
    var shellPaths = SHELL.map(function (p) {
      return new URL(p, self.location.href).pathname;
    });
    if (shellPaths.indexOf(path) === -1) return;

    event.respondWith(
      caches.open(CACHE).then(function (cache) {
        return cache.match(request).then(function (cached) {
          var network = fetch(request).then(function (response) {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          }).catch(function () {
            return cached;
          });
          return cached || network;
        });
      })
    );
  });
})();
