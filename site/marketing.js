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

// Exhibit gallery lightbox: arrows on desktop, swipe on phones, Escape / backdrop / close to leave.
(() => {
  const gallery = document.querySelector("[data-gallery]");
  if (!gallery) return;

  const items = [...gallery.querySelectorAll("[data-gallery-open]")].map((btn, i) => {
    const img = btn.querySelector("img");
    const cap = btn.parentElement?.querySelector("figcaption")?.textContent?.trim() || "";
    const full = (img?.getAttribute("srcset") || "")
      .split(",")
      .map((part) => part.trim().split(/\s+/)[0])
      .filter(Boolean)
      .pop() || img?.currentSrc || img?.src || "";
    return { full, alt: img?.alt || "", cap, opener: btn, index: i };
  });
  if (!items.length) return;

  let index = 0;
  let overlay = null;
  let startX = 0;

  const show = (i) => {
    index = (i + items.length) % items.length;
    const item = items[index];
    const picture = overlay?.querySelector("[data-lightbox-img]");
    const caption = overlay?.querySelector("[data-lightbox-cap]");
    const counter = overlay?.querySelector("[data-lightbox-count]");
    if (picture) {
      picture.src = item.full;
      picture.alt = item.alt;
    }
    if (caption) caption.textContent = item.cap;
    if (counter) counter.textContent = `${index + 1} / ${items.length}`;
  };

  const close = () => {
    if (!overlay) return;
    document.removeEventListener("keydown", onKey);
    overlay.remove();
    overlay = null;
    document.documentElement.classList.remove("lightbox-open");
    items[index]?.opener?.focus();
    window.dispatchEvent(new CustomEvent("lightbox:close"));
  };

  const onKey = (e) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") show(index + 1);
    else if (e.key === "ArrowLeft") show(index - 1);
  };

  const open = (i) => {
    if (overlay) close();
    overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("data-lightbox", "");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Exhibit gallery");
    overlay.innerHTML = `
      <button type="button" class="lightbox-close" data-lightbox-close aria-label="Close">\u00d7</button>
      <button type="button" class="lightbox-nav lightbox-prev" data-lightbox-prev aria-label="Previous exhibit">\u2039</button>
      <div class="lightbox-frame" data-lightbox-track>
        <img data-lightbox-img alt="" width="1280" height="720" decoding="async" />
        <p class="lightbox-cap" data-lightbox-cap></p>
        <p class="lightbox-count" data-lightbox-count></p>
      </div>
      <button type="button" class="lightbox-nav lightbox-next" data-lightbox-next aria-label="Next exhibit">\u203a</button>
    `;
    document.body.append(overlay);
    document.documentElement.classList.add("lightbox-open");
    document.addEventListener("keydown", onKey);
    overlay.querySelector("[data-lightbox-close]")?.addEventListener("click", close);
    overlay.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => show(index - 1));
    overlay.querySelector("[data-lightbox-next]")?.addEventListener("click", () => show(index + 1));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    const track = overlay.querySelector("[data-lightbox-track]");
    track?.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
      track.setPointerCapture?.(e.pointerId);
    });
    track?.addEventListener("pointerup", (e) => {
      const dx = e.clientX - startX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) show(index + 1);
      else show(index - 1);
    });
    show(i);
    overlay.querySelector("[data-lightbox-close]")?.focus();
    window.dispatchEvent(new CustomEvent("lightbox:open", { detail: { index } }));
  };

  gallery.querySelectorAll("[data-gallery-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.index || "0") || 0;
      open(i);
    });
  });
})();

// Cast cards: one in-character line per card, only on tap; exclusive playback; caption while speaking.
(() => {
  const cards = [...document.querySelectorAll(".cast-card[data-cast]")];
  if (!cards.length) return;

  let active = null;

  const stopCard = (card) => {
    if (!card) return;
    const audio = card.querySelector("[data-cast-audio]");
    const caption = card.querySelector("[data-cast-caption]");
    const btn = card.querySelector("[data-cast-play]");
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    card.classList.remove("is-speaking");
    if (caption) {
      caption.textContent = "";
      caption.hidden = true;
    }
    if (btn) btn.setAttribute("aria-pressed", "false");
    if (active === card) active = null;
  };

  const stopAll = () => {
    cards.forEach(stopCard);
  };

  const playCard = async (card) => {
    const audio = card.querySelector("[data-cast-audio]");
    const caption = card.querySelector("[data-cast-caption]");
    const btn = card.querySelector("[data-cast-play]");
    const line = card.getAttribute("data-line") || "";
    if (!audio) return;
    if (active === card && !audio.paused) {
      stopCard(card);
      window.dispatchEvent(new CustomEvent("cast:stop", { detail: { id: card.dataset.cast } }));
      return;
    }
    if (active && active !== card) stopCard(active);
    if (caption) {
      caption.textContent = line;
      caption.hidden = false;
    }
    card.classList.add("is-speaking");
    if (btn) btn.setAttribute("aria-pressed", "true");
    active = card;
    try {
      await audio.play();
      window.dispatchEvent(
        new CustomEvent("cast:play", { detail: { id: card.dataset.cast, line } }),
      );
    } catch (err) {
      stopCard(card);
      window.dispatchEvent(
        new CustomEvent("cast:error", { detail: { id: card.dataset.cast, message: String(err) } }),
      );
    }
  };

  cards.forEach((card) => {
    const art = card.querySelector(".cast-art");
    if (art && !art.querySelector(".cast-wave")) {
      const wave = document.createElement("div");
      wave.className = "cast-wave";
      wave.setAttribute("aria-hidden", "true");
      wave.innerHTML = "<span></span><span></span><span></span><span></span>";
      art.append(wave);
    }
    const audio = card.querySelector("[data-cast-audio]");
    const btn = card.querySelector("[data-cast-play]");
    btn?.setAttribute("aria-pressed", "false");
    audio?.addEventListener("ended", () => {
      stopCard(card);
      window.dispatchEvent(new CustomEvent("cast:ended", { detail: { id: card.dataset.cast } }));
    });
    // Whole card is tappable (lede: "Tap a card"); the play button is the named control.
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      event.preventDefault();
      playCard(card);
    });
  });

  window.__placeCast = {
    stopAll,
    playing: () => (active ? active.dataset.cast : null),
    cards: () => cards.map((c) => c.dataset.cast),
  };
})();

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
