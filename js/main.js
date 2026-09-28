(() => {
  "use strict";

  const EVENT = {
    name: "Haven Canberra",
    slug: "canberra",
    lat: -35.2802,
    lng: 149.131,
    // Local (AEDT, UTC+11) start and end of the jam
    start: new Date("2026-11-14T09:00:00+11:00"),
    end: new Date("2026-11-15T18:00:00+11:00"),
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Nav background once the page scrolls ─────────────────────────── */
  const onScroll = () => {
    document.documentElement.toggleAttribute("data-scrolled", scrollY > 40);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ── Scroll-in reveals ─────────────────────────────────────────────── */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ── Countdown ─────────────────────────────────────────────────────── */
  const countdown = $("[data-countdown]");
  if (countdown) {
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    let text = "";
    if (now < EVENT.start) {
      const days = Math.ceil((EVENT.start - now) / day);
      text = days === 1 ? "Starts tomorrow!" : `${days} days to go!`;
    } else if (now <= EVENT.end) {
      text = "Happening right now!";
    }
    if (text) {
      countdown.textContent = text;
      countdown.hidden = false;
    }
  }

  /* ── Add to calendar (.ics download) ───────────────────────────────── */
  const icsLink = $("[data-ics]");
  if (icsLink) {
    icsLink.addEventListener("click", (e) => {
      e.preventDefault();
      const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Hack Club//Haven Canberra//EN",
        "BEGIN:VEVENT",
        `UID:haven-canberra-2026@hackclub.com`,
        `DTSTAMP:${stamp}`,
        "DTSTART;VALUE=DATE:20261114",
        "DTEND;VALUE=DATE:20261116",
        "SUMMARY:Haven Canberra — teen game jam",
        "LOCATION:Canberra ACT",
        "DESCRIPTION:A free weekend game jam for teens 13-18 by Hack Club. Sign up at https://haven.hackclub.com/canberra",
        "URL:https://haven.hackclub.com/canberra",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");
      const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: "haven-canberra.ics" });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  /* ── Sticky mobile CTA: visible when neither sign-up form is on screen ── */
  const sticky = $("[data-sticky-cta]");
  const forms = $$(".signup");
  if (sticky && forms.length && "IntersectionObserver" in window) {
    const visible = new Set();
    let pastHero = false;
    const update = () => {
      const show = pastHero && visible.size === 0;
      sticky.classList.toggle("is-visible", show);
      sticky.setAttribute("aria-hidden", String(!show));
      sticky.tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
        if (e.target === forms[0]) pastHero = !e.isIntersecting && e.boundingClientRect.top < 0;
      }
      update();
    }).observe(forms[0]);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      update();
    });
    forms.slice(1).forEach((f) => io.observe(f));
    sticky.addEventListener("click", (e) => {
      e.preventDefault();
      $("#signup").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      setTimeout(() => $("#signup-email").focus({ preventScroll: true }), reducedMotion ? 0 : 500);
    });
  }

  /* ── Nav "Sign up" focuses the email field ─────────────────────────── */
  $$('a[href="#signup"]').forEach((a) => {
    if (a === sticky) return;
    a.addEventListener("click", () => {
      setTimeout(() => $("#signup-email").focus({ preventScroll: true }), reducedMotion ? 0 : 600);
    });
  });

  /* ── Video lightbox ─────────────────────────────────────────────────── */
  const dialog = $("[data-lightbox]");
  const frame = $("[data-lightbox-frame]");
  if (dialog && frame && typeof dialog.showModal === "function") {
    const close = () => dialog.close();
    dialog.addEventListener("close", () => (frame.innerHTML = ""));
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) close();
    });
    $("[data-lightbox-close]").addEventListener("click", close);

    $$("[data-video]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.video;
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
        iframe.title = btn.dataset.videoTitle || "Video";
        iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        iframe.allowFullscreen = true;
        frame.replaceChildren(iframe);
        dialog.setAttribute("aria-label", iframe.title);
        dialog.showModal();
      });
    });
  } else {
    // No <dialog> support: fall back to opening YouTube directly
    $$("[data-video]").forEach((btn) =>
      btn.addEventListener("click", () => open(`https://www.youtube.com/watch?v=${btn.dataset.video}`, "_blank", "noopener"))
    );
  }

  /* ── Map of Haven events (Leaflet, lazy-initialised) ────────────────── */
  const mapEl = $("[data-map]");
  const mapCard = $("[data-map-card]");
  const expandBtn = $("[data-map-expand]");
  let map = null;

  const initMap = async () => {
    if (map || !window.L || !mapEl) return;
    const L = window.L;
    const coarse = matchMedia("(pointer: coarse)").matches;

    map = L.map(mapEl, {
      center: [-31, 146],
      zoom: 4,
      minZoom: 2,
      maxZoom: 12,
      worldCopyJump: true,
      scrollWheelZoom: false,
      dragging: !coarse,
      tap: false,
      zoomControl: true,
      attributionControl: true,
    });
    map.attributionControl.setPrefix(false);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const flag = L.icon({ iconUrl: "images/map-flag.png", iconSize: [22, 22], iconAnchor: [5, 21], popupAnchor: [6, -18] });

    try {
      const events = await (await fetch("events.json")).json();
      const count = $("[data-event-count]");
      if (count) count.textContent = String(events.length);
      for (const [name, lat, lng, slug] of events) {
        if (slug === EVENT.slug) continue;
        L.marker([lat, lng], { icon: flag, title: `Haven ${name}`, alt: `Haven ${name}` })
          .bindPopup(`<a href="https://haven.hackclub.com/${slug}" target="_blank" rel="noopener">Haven ${name} →</a>`)
          .addTo(map);
      }
    } catch (err) {
      console.warn("Could not load Haven events", err);
    }

    const home = L.divIcon({ className: "home-marker", iconSize: [16, 16] });
    L.marker([EVENT.lat, EVENT.lng], { icon: home, zIndexOffset: 1000, title: EVENT.name, keyboard: false })
      .bindTooltip("You’re here!", { permanent: true, direction: "left", offset: [-6, 0], className: "home-tooltip" })
      .addTo(map);

    // Enable scroll-zoom only after the user interacts with the map
    mapEl.addEventListener("click", () => map.scrollWheelZoom.enable(), { once: true });
  };

  if (mapEl) {
    const tryInit = () => {
      if (window.L) initMap();
      else addEventListener("load", initMap, { once: true });
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io.disconnect();
            tryInit();
          }
        },
        { rootMargin: "200px" }
      );
      io.observe(mapEl);
    } else {
      tryInit();
    }
  }

  if (expandBtn && mapCard) {
    const setExpanded = (on) => {
      mapCard.classList.toggle("is-expanded", on);
      expandBtn.setAttribute("aria-label", on ? "Close full-screen map" : "Expand map");
      document.documentElement.classList.toggle("map-open", on);
      document.body.style.overflow = on ? "hidden" : "";
      if (map) {
        on ? map.dragging.enable() : matchMedia("(pointer: coarse)").matches && map.dragging.disable();
        on ? map.scrollWheelZoom.enable() : map.scrollWheelZoom.disable();
        requestAnimationFrame(() => map.invalidateSize());
      }
    };
    expandBtn.addEventListener("click", () => {
      if (!map) initMap();
      setExpanded(!mapCard.classList.contains("is-expanded"));
    });
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mapCard.classList.contains("is-expanded")) setExpanded(false);
    });
  }
})();
