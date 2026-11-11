// Menu drawer for the nav. At phone width (CSS, max-width 760px) #nav-links is a slide-in panel opened by #navToggle.
// Closes on Escape, on a tap outside the panel (the backdrop) and on following a link; focus stays inside while open.
(function () {
  var toggle = document.getElementById("navToggle");
  var panel = document.getElementById("nav-links");
  if (!toggle || !panel) return;
  var backdrop = document.createElement("div");
  backdrop.className = "nav-backdrop";
  backdrop.setAttribute("data-nav-backdrop", "");
  (panel.closest(".nav") || document.body).appendChild(backdrop); // inside the nav so it stacks under the panel
  var mq = window.matchMedia("(max-width: 760px)");

  function items() {
    return Array.prototype.slice.call(panel.querySelectorAll("a[href], button")).filter(function (e) { return e.offsetParent !== null; });
  }
  function isOpen() { return panel.classList.contains("is-open"); }
  function setMenu(open, restore) {
    panel.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("nav-locked", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      var first = items().filter(function (e) { return e.tagName === "A"; })[0] || items()[0];
      if (first) first.focus();
    } else if (restore) {
      toggle.focus();
    }
  }
  toggle.addEventListener("click", function () { setMenu(!isOpen(), true); });
  backdrop.addEventListener("click", function () { setMenu(false, true); });
  panel.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("a, [data-nav-close]") : null;
    if (t) setMenu(false, t.tagName !== "A");
  });
  document.addEventListener("keydown", function (e) {
    if (!isOpen()) return;
    if (e.key === "Escape") { setMenu(false, true); return; }
    if (e.key !== "Tab") return;
    var list = items();
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener("focusin", function (e) {
    if (isOpen() && !panel.contains(e.target) && e.target !== toggle) { var l = items(); if (l[0]) l[0].focus(); }
  });
  var onWide = function () { if (!mq.matches && isOpen()) setMenu(false, false); };
  if (mq.addEventListener) mq.addEventListener("change", onWide); else if (mq.addListener) mq.addListener(onWide);
})();
