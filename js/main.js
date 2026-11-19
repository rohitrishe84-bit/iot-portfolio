/* ==========================================================================
   ROHIT RISHE · IoT Portfolio
   main.js — progressive enhancement. The pages are complete, readable HTML
   without this file; each module below adds behaviour only if its markup
   exists on the current page.
   ========================================================================== */
(() => {
  "use strict";

  const q = (s, root = document) => root.querySelector(s);
  const qa = (s, root = document) => [...root.querySelectorAll(s)];
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollBehavior = calm ? "auto" : "smooth";

  const svg = (d, extra = "") =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const ICON = {
    copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>'),
    ok: svg('<path d="M20 6 9 17l-5-5"/>'),
    down: svg('<path d="m6 9 6 6 6-6"/>'),
    zoom: svg('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    prev: svg('<path d="m15 18-6-6 6-6"/>'),
    next: svg('<path d="m9 18 6-6-6-6"/>')
  };

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* ------------------------------------------------------------------
     Scroll-driven chrome: sticky header state, top progress bar,
     back-to-top button with progress ring
     ------------------------------------------------------------------ */
  function chrome() {
    const head = q(".head");
    const bar = q(".progress");
    const top = q(".totop");
    const ring = top && q(".totop__ring circle", top);
    const RING = 145;

    const update = () => {
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      const pct = max > 0 ? Math.min(1, y / max) : 0;
      if (head) head.classList.toggle("is-stuck", y > 6);
      if (bar) bar.style.transform = `scaleX(${pct})`;
      if (top) top.classList.toggle("is-on", y > 640);
      if (ring) ring.style.strokeDashoffset = String(RING * (1 - pct));
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);

    if (top) {
      top.addEventListener("click", () => {
        scrollTo({ top: 0, behavior: scrollBehavior });
        q("#main")?.focus({ preventScroll: true });
      });
    }
  }

  /* ------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------ */
  function mobileMenu() {
    const btn = q(".burger");
    const menu = q("#menu");
    if (!btn || !menu) return;

    const set = (open) => {
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.classList.toggle("is-open", open);
    };
    const isOpen = () => btn.getAttribute("aria-expanded") === "true";

    btn.addEventListener("click", () => set(!isOpen()));
    qa("a", menu).forEach((a) => a.addEventListener("click", () => set(false)));
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) { set(false); btn.focus(); }
    });
    document.addEventListener("click", (e) => {
      if (isOpen() && !e.target.closest(".head")) set(false);
    });
    matchMedia("(min-width: 801px)").addEventListener("change", (e) => { if (e.matches) set(false); });
  }

  /* ------------------------------------------------------------------
     Generic scrollspy: marks the link whose section is under a probe line
     ------------------------------------------------------------------ */
  function spy(links, onChange) {
    const pairs = links
      .map((a) => [a, document.getElementById(decodeURIComponent(a.hash.slice(1)))])
      .filter(([, el]) => el);
    if (!pairs.length) return;
    let current = null;

    const update = () => {
      const probe = innerHeight * 0.32;
      let hit = pairs[0];
      for (const p of pairs) if (p[1].getBoundingClientRect().top <= probe) hit = p;
      // bottom of page: last section wins even if it is short
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) hit = pairs[pairs.length - 1];
      if (hit[0] === current) return;
      current = hit[0];
      pairs.forEach(([a]) => {
        const on = a === current;
        a.classList.toggle("is-on", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
      if (onChange) onChange(current);
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
  }

  function homeSpy() {
    spy(qa(".menu a[data-spy]"));
  }

  /* Detail pages: section tabs. Keeps the active pill visible inside the
     horizontally scrolling track (scrolls the track, never the page). */
  function sectionTabs() {
    const track = q(".tabs__track");
    if (!track) return;
    spy(qa("a", track), (a) => {
      const t = track.getBoundingClientRect();
      const r = a.getBoundingClientRect();
      if (r.left < t.left + 20 || r.right > t.right - 30) {
        track.scrollTo({ left: track.scrollLeft + (r.left - t.left) - t.width / 2 + r.width / 2, behavior: scrollBehavior });
      }
    });
  }

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */
  function reveal() {
    const els = qa(".reveal");
    if (!els.length) return;
    if (calm || !("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    els.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------
     Serial monitor replay (home hero). The lines are the Serial.println
     output written by the assignment sketches, stored in a JSON block.
     ------------------------------------------------------------------ */
  function serialMonitor() {
    const out = q("[data-serial]");
    const data = q("#serial-lines");
    if (!out || !data) return;
    const lines = JSON.parse(data.textContent);
    const replay = q(".serial__replay");
    let timer = null;
    let run = 0;

    const lineHTML = (l) => `<span class="ln"><span class="src">[${esc(l.src)}]</span> <span class="${l.kind || ""}">${esc(l.text)}</span></span>`;
    const cursor = '<span class="serial__cursor" aria-hidden="true"></span>';

    const renderAll = () => { out.innerHTML = lines.map(lineHTML).join("") + cursor; };

    const play = () => {
      clearTimeout(timer);
      const id = ++run;
      if (calm) { renderAll(); return; }
      out.innerHTML = cursor;
      let i = 0, ch = 0;
      const step = () => {
        if (id !== run) return;
        if (i >= lines.length) return;
        const l = lines[i];
        const done = lines.slice(0, i).map(lineHTML).join("");
        // dotted "Connecting..." lines type out character by character; others appear whole
        if (l.type && ch < l.text.length) {
          ch += 1;
          out.innerHTML = done + `<span class="ln"><span class="src">[${esc(l.src)}]</span> <span class="${l.kind || ""}">${esc(l.text.slice(0, ch))}</span>${cursor}</span>`;
          timer = setTimeout(step, l.text[ch - 1] === "." ? 140 : 22);
          return;
        }
        i += 1; ch = 0;
        out.innerHTML = lines.slice(0, i).map(lineHTML).join("") + cursor;
        timer = setTimeout(step, l.pause || 380);
      };
      step();
    };

    if (replay) replay.addEventListener("click", play);
    if ("IntersectionObserver" in window && !calm) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { play(); io.disconnect(); }
      });
      io.observe(out);
    } else {
      renderAll();
    }
  }

  /* ------------------------------------------------------------------
     Code blocks: syntax highlight, line numbers, copy, expand
     ------------------------------------------------------------------ */
  const KW = "if|else|while|for|return|void|const|int|int8_t|char|bool|true|false|String|break|continue";
  const TY = "WiFi|WiFiServer|WiFiClient|Serial|Adafruit_MQTT_Client|Adafruit_MQTT_Subscribe|WL_CONNECTED|HIGH|LOW|OUTPUT|INPUT";
  const CPP = new RegExp(
    [
      "(\\/\\/[^\\n]*)", // 1 comment
      '("(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\])*\')', // 2 string
      "(#\\s*(?:include|define)\\b)", // 3 preprocessor
      "(<[\\w.]+\\.h>)", // 4 system header
      "\\b(" + KW + ")\\b", // 5 keyword
      "\\b(" + TY + ")\\b", // 6 type / constant
      "\\b(\\d+(?:\\.\\d+)?)\\b", // 7 number
      "\\b([A-Za-z_]\\w*)(?=\\s*\\()" // 8 call
    ].join("|"),
    "g"
  );
  const CPP_CLASS = [null, "cm", "st", "pp", "st", "kw", "ty", "nu", "fn"];

  function hlCpp(src) {
    let html = "", last = 0, m;
    CPP.lastIndex = 0;
    while ((m = CPP.exec(src))) {
      html += esc(src.slice(last, m.index));
      const g = m.findIndex((v, i) => i > 0 && v !== undefined);
      html += `<span class="t-${CPP_CLASS[g]}">${esc(m[0])}</span>`;
      last = CPP.lastIndex;
    }
    return html + esc(src.slice(last));
  }
  function hlJson(src) {
    return esc(src)
      .replace(/(&quot;[^&\n]*?&quot;)(\s*:)/g, '<span class="t-fn">$1</span>$2')
      .replace(/(:\s*)(&quot;[^&\n]*?&quot;)/g, '$1<span class="t-st">$2</span>')
      .replace(/(:\s*)(true|false|null)\b/g, '$1<span class="t-kw">$2</span>')
      .replace(/(:\s*)(-?\d+(?:\.\d+)?)/g, '$1<span class="t-nu">$2</span>')
      .replace(/^(\/[^\n{]+)/m, '<span class="t-cm">$1</span>');
  }
  function hlTree(src) {
    return esc(src)
      .replace(/^([|`\- ]+)/gm, '<span class="t-br">$1</span>')
      .replace(/(:\s*)(&quot;[^\n]*?&quot;(?: \| &quot;[^\n]*?&quot;)?)/g, '$1<span class="t-st">$2</span>')
      .replace(/(:\s*)(true \| false|true|false)\b/g, '$1<span class="t-kw">$2</span>')
      .replace(/(:\s*)(\d+(?:\.\d+)?)$/gm, '$1<span class="t-nu">$2</span>');
  }
  const LANG = {
    cpp: { label: "Arduino C++", hl: hlCpp, file: "sketch.ino" },
    json: { label: "JSON", hl: hlJson, file: "record.json" },
    tree: { label: "Structure", hl: hlTree, file: "structure" }
  };
  const detect = (src) => (/#include|void\s+\w+\s*\(/.test(src) ? "cpp" : /^\s*(\/\S+\s*)?\{/.test(src) ? "json" : "tree");

  async function copy(text) {
    try {
      if (navigator.clipboard && isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch (_) { /* fall back below */ }
    const ta = Object.assign(document.createElement("textarea"), { value: text, readOnly: true });
    ta.style.cssText = "position:fixed;top:-999px;opacity:0";
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (_) { ok = false; }
    ta.remove();
    return ok;
  }

  function codeBlocks() {
    qa("pre.code").forEach((pre, n) => {
      const codeEl = q("code", pre);
      const raw = codeEl.textContent.replace(/\n$/, "");
      const lang = detect(raw);
      const spec = LANG[lang];
      const label = pre.previousElementSibling?.classList.contains("code-file") ? pre.previousElementSibling : null;
      const file = label ? label.textContent.trim() : pre.dataset.file || spec.file;
      if (label) label.remove();

      const count = raw.split("\n").length;
      const long = count > 18;
      pre.id = pre.id || `code-${n + 1}`;
      pre.tabIndex = 0;
      pre.setAttribute("aria-label", `${file}, ${count} lines`);
      codeEl.innerHTML = spec.hl(raw);
      const nums = document.createElement("span");
      nums.className = "code__nums";
      nums.setAttribute("aria-hidden", "true");
      nums.textContent = Array.from({ length: count }, (_, i) => i + 1).join("\n");
      pre.prepend(nums);

      const box = document.createElement("div");
      box.className = "codebox" + (long ? " is-long" : "");
      box.innerHTML =
        `<div class="codebox__bar"><span class="codebox__file">${esc(file)}</span><span class="codebox__lang">${spec.label}</span>` +
        `<div class="codebox__tools">` +
        (long ? `<button type="button" class="tool" data-expand aria-expanded="false" aria-controls="${pre.id}">${ICON.down}<span>Show all ${count} lines</span></button>` : "") +
        `<button type="button" class="tool" data-copy aria-label="Copy ${esc(file)}">${ICON.copy}<span>Copy</span></button>` +
        `</div></div>`;
      pre.replaceWith(box);
      box.append(pre);

      const copyBtn = q("[data-copy]", box);
      copyBtn.addEventListener("click", async () => {
        const ok = await copy(raw);
        copyBtn.classList.toggle("is-ok", ok);
        copyBtn.innerHTML = (ok ? ICON.ok : ICON.copy) + `<span>${ok ? "Copied" : "Select + Ctrl+C"}</span>`;
        if (!ok) getSelection().selectAllChildren(codeEl);
        clearTimeout(copyBtn.t);
        copyBtn.t = setTimeout(() => { copyBtn.classList.remove("is-ok"); copyBtn.innerHTML = ICON.copy + "<span>Copy</span>"; }, 1800);
      });

      const exp = q("[data-expand]", box);
      if (exp) exp.addEventListener("click", () => {
        const open = box.classList.toggle("is-open");
        exp.setAttribute("aria-expanded", String(open));
        q("span", exp).textContent = open ? "Collapse" : `Show all ${count} lines`;
        if (!open) box.scrollIntoView({ block: "nearest", behavior: scrollBehavior });
      });
    });
  }

  /* "Record result" placeholders in the original test tables -> status pills */
  function statusPills() {
    qa(".data td").forEach((td) => {
      if (td.textContent.trim() === "Record result") td.innerHTML = '<span class="pill">Record result</span>';
    });
  }

  /* ------------------------------------------------------------------
     Lightbox with thumbnails, keyboard, swipe and focus trap
     ------------------------------------------------------------------ */
  function lightbox() {
    const triggers = qa("[data-zoom]");
    if (!triggers.length) return;

    const items = [];
    const at = new Map();
    triggers.forEach((t) => {
      const img = q("img", t);
      const src = img.getAttribute("src");
      if (!at.has(src)) { at.set(src, items.length); items.push({ src, alt: img.alt, cap: t.dataset.caption || img.alt }); }
      t.insertAdjacentHTML("beforeend", `<span class="zoom__hint" aria-hidden="true">${ICON.zoom}Full size</span>`);
    });

    const lb = document.createElement("div");
    lb.className = "lb";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Image viewer");
    lb.innerHTML =
      `<div class="lb__top"><span class="lb__count" aria-live="polite"></span><button type="button" class="lb__btn lb__close" aria-label="Close image viewer">${ICON.x}</button></div>` +
      `<div class="lb__stage"><button type="button" class="lb__btn lb__prev" aria-label="Previous image">${ICON.prev}</button>` +
      `<img alt="">` +
      `<button type="button" class="lb__btn lb__next" aria-label="Next image">${ICON.next}</button></div>` +
      `<p class="lb__cap"></p><div class="lb__thumbs"></div>`;
    document.body.append(lb);

    const img = q(".lb__stage img", lb);
    const cap = q(".lb__cap", lb);
    const count = q(".lb__count", lb);
    const prev = q(".lb__prev", lb);
    const next = q(".lb__next", lb);
    const close = q(".lb__close", lb);
    const thumbs = q(".lb__thumbs", lb);
    let i = 0;
    let opener = null;

    if (items.length > 1) {
      thumbs.innerHTML = items.map((it, k) => `<button type="button" aria-label="Show image ${k + 1}"><img src="${it.src}" alt=""></button>`).join("");
      qa("button", thumbs).forEach((b, k) => b.addEventListener("click", () => show(k)));
    }
    prev.hidden = next.hidden = items.length < 2;

    function show(k) {
      i = (k + items.length) % items.length;
      const it = items[i];
      img.src = it.src;
      img.alt = it.alt;
      cap.textContent = it.cap;
      count.textContent = `Image ${i + 1} of ${items.length}`;
      qa("button", thumbs).forEach((b, n) => b.setAttribute("aria-current", String(n === i)));
    }
    function open(k, from) {
      opener = from;
      show(k);
      lb.classList.add("is-open");
      document.body.classList.add("is-locked");
      close.focus(); // .is-open switches visibility instantly, so focus lands
    }
    function shut() {
      lb.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      opener?.focus();
    }

    triggers.forEach((t) => t.addEventListener("click", () => open(at.get(q("img", t).getAttribute("src")), t)));
    prev.addEventListener("click", () => show(i - 1));
    next.addEventListener("click", () => show(i + 1));
    close.addEventListener("click", shut);
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb__stage")) shut(); });
    addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") shut();
      else if (e.key === "ArrowLeft") show(i - 1);
      else if (e.key === "ArrowRight") show(i + 1);
      else if (e.key === "Tab") {
        const f = qa("button:not([hidden])", lb);
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    let x0 = null;
    lb.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 48 && items.length > 1) show(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* Only one video plays at a time */
  function videos() {
    const vids = qa("video");
    vids.forEach((v) => v.addEventListener("play", () => vids.forEach((o) => { if (o !== v) o.pause(); })));
  }

  function year() {
    qa("[data-year]").forEach((el) => { el.textContent = String(new Date().getFullYear()); });
  }

  const start = () => {
    chrome();
    mobileMenu();
    homeSpy();
    sectionTabs();
    reveal();
    serialMonitor();
    statusPills();
    codeBlocks();
    lightbox();
    videos();
    year();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
