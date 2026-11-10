const page = document.body.dataset.page;
document.querySelectorAll("[data-nav]").forEach((link) => {
  if (link.getAttribute("data-nav") === page) {
    link.setAttribute("aria-current", "page");
  }
});

const nav = document.querySelector(".nav");
const navLinks = document.getElementById("nav-links");
const navToggle = document.getElementById("navToggle");

const setMenu = (open) => {
  if (!navLinks || !navToggle) return;
  navLinks.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  navToggle.textContent = open ? "Close" : "Menu";
};

navToggle?.addEventListener("click", () => {
  setMenu(!navLinks.classList.contains("is-open"));
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

const onScroll = () => {
  nav?.classList.toggle("is-scrolled", window.scrollY > 8);
};

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const shotA = document.getElementById("shotA");
const shotB = document.getElementById("shotB");

if (shotA && shotB) {
  const BACKGROUNDS = [
    "./assets/landing/hallway.svg",
    "./assets/landing/apartment.svg",
  ];
  const HOLD_MS = 9000;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let index = 0;
  let showingA = true;

  BACKGROUNDS.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  const setShot = (el, src) => {
    el.style.backgroundImage = `url("${src}")`;
  };

  const show = (el, on) => {
    el.classList.toggle("is-live", on);
    if (on && !reduceMotion) {
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "";
    }
  };

  setShot(shotA, BACKGROUNDS[0]);
  setShot(shotB, BACKGROUNDS[1]);
  show(shotA, true);

  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const cycleOnce = () => {
    index = (index + 1) % BACKGROUNDS.length;
    const incoming = showingA ? shotB : shotA;
    const outgoing = showingA ? shotA : shotB;
    setShot(incoming, BACKGROUNDS[index]);
    show(incoming, true);
    show(outgoing, false);
    showingA = !showingA;
  };

  const runCycle = async () => {
    while (true) {
      await wait(HOLD_MS);
      cycleOnce();
    }
  };

  runCycle();
}

// Share card: copies this page's address on a click (no request is made).
document.querySelectorAll("[data-share-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const status = btn.parentElement?.querySelector(".share-status");
    const url = location.origin + location.pathname;
    try {
      await navigator.clipboard.writeText(url);
      if (status) status.textContent = "Link copied.";
    } catch {
      if (status) status.textContent = url;
    }
  });
});

// Trailer slot: nothing loads until the click. The click opens an overlay player; Escape, the close button or a tap outside closes it.
document.querySelectorAll("[data-trailer]").forEach((slot) => {
  const opener = slot.querySelector("[data-trailer-start]");
  opener?.addEventListener("click", () => {
    const embed = slot.dataset.embed;
    const overlay = document.createElement("div");
    overlay.className = "trailer-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "The Place Department trailer");
    const box = document.createElement("div");
    box.className = "trailer-box";
    let el;
    if (embed && /^https:\/\//.test(embed)) {
      el = document.createElement("iframe");
      el.src = embed;
      el.title = "The Place Department trailer";
      el.allow = "autoplay; fullscreen";
      el.allowFullscreen = true;
    } else {
      el = document.createElement("video");
      el.src = slot.dataset.video;
      el.poster = slot.dataset.poster || "";
      el.controls = true;
      el.autoplay = true;
      el.playsInline = true;
    }
    const close = document.createElement("button");
    close.type = "button";
    close.className = "trailer-close";
    close.setAttribute("aria-label", "Close the trailer");
    close.textContent = "\u00d7";
    box.append(el);
    overlay.append(box, close);
    const done = () => {
      document.removeEventListener("keydown", onKey);
      el.pause?.();
      overlay.remove();
      document.documentElement.classList.remove("trailer-open");
      opener.focus();
    };
    const onKey = (e) => { if (e.key === "Escape") done(); };
    overlay.addEventListener("click", (e) => { if (!box.contains(e.target)) done(); });
    close.addEventListener("click", done);
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("trailer-open");
    document.body.append(overlay);
    close.focus();
    window.dispatchEvent(new CustomEvent("trailer:open"));
  });
});
