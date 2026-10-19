// Hawkes Analytics on the site's pages (Hawkes Gen's docs/analytics.md): the only statistics this site keeps.
// Each page loads Gen's SDK with a <script data-hawkes-analytics defer> tag and then this file, without defer, right
// after it. Running before the deferred SDK lets it turn on the SDK's debug mode for Studio's playtest browsers (the
// SDK reads data-debug when it starts), so page_view and play_click show in the console and on
// hawkesAnalytics.debugLog. The SDK does page views, outbound links and the rest by itself; this adds play_click.
(function () {
  var sdk = document.querySelector("script[data-hawkes-analytics]");
  var debug = navigator.webdriver || /[?&](playtest|hawkesPlaytest|hawkes-analytics-debug=1)\b/.test(location.search);
  if (sdk && debug) sdk.setAttribute("data-debug", "1");

  // A call before the SDK has started waits in hawkesAnalyticsQ, which the SDK plays back.
  function send(method, args) {
    var a = window.hawkesAnalytics;
    if (a && typeof a[method] === "function") a[method].apply(null, args);
    else (window.hawkesAnalyticsQ = window.hawkesAnalyticsQ || []).push([method].concat(args));
  }
  window.placeAnalytics = send;

  // The play buttons: the nav's (left as the deploy expects it: its What's new link goes before it), the hero's and
  // any other with data-play="<where>". Leaving the page sends the batch (the SDK beacons on pagehide).
  document.addEventListener("click", function (event) {
    var button = event.target && event.target.closest && event.target.closest("[data-play], .nav-play, .play-btn");
    if (button) send("track", ["play_click", { where: button.getAttribute("data-play") || (button.classList.contains("nav-play") ? "nav" : "hero") }]);
  }, true);

  // The privacy page's switch: hawkesAnalytics.optOut() / optIn(), remembered by the SDK.
  document.addEventListener("click", function (event) {
    var toggle = event.target && event.target.closest && event.target.closest("[data-analytics-toggle]");
    var a = window.hawkesAnalytics;
    if (!toggle || !a || !a.config) return;
    send(a.config().optedOut ? "optIn" : "optOut", []);
    showToggles();
  });
  function showToggles() {
    var a = window.hawkesAnalytics;
    var out = !!(a && a.config && a.config().optedOut);
    document.querySelectorAll("[data-analytics-toggle]").forEach(function (toggle) {
      toggle.hidden = !a;
      toggle.textContent = out ? "Count my visits again" : "Stop counting my visits";
      toggle.setAttribute("aria-pressed", out ? "true" : "false");
    });
    document.querySelectorAll("[data-analytics-state]").forEach(function (state) {
      state.textContent = !a ? "" : out ? "This browser is not being counted." : "This browser is counted, anonymously.";
    });
  }

  // For the playtest's console: what goes out, and where it is filed (env beta on the beta site).
  document.addEventListener("DOMContentLoaded", function () {
    showToggles();
    var a = window.hawkesAnalytics;
    if (!debug) return;
    if (!a || !a.config) {
      console.warn("[hawkes-analytics] the SDK did not load on " + location.pathname);
      return;
    }
    var c = a.config();
    console.log("[hawkes-analytics] product " + c.product + ", env " + c.env + ", build " + (c.build ? c.build.version : "none") + ", page " + location.pathname);
  });
})();
