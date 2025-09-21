const K = "script[xslt-onload]", P = "xslt-template", j = "xslt-transformed", T = /* @__PURE__ */ new Map();
function I() {
  let o = htmx.findAll(K);
  for (let t of o)
    W(t);
}
function W(o) {
  if (o.getAttribute(j) === "true" || !o.hasAttribute(P))
    return;
  let t = "#" + o.getAttribute(P), e = T.get(t);
  if (!e) {
    let l = htmx.find(t);
    if (l) {
      let s = l.innerHTML ? new DOMParser().parseFromString(l.innerHTML, "application/xml") : l.contentDocument;
      e = new XSLTProcessor(), e.importStylesheet(s), T.set(t, e);
    } else
      throw new Error("Unknown XSLT template: " + t);
  }
  let n = new DOMParser().parseFromString(o.innerHTML, "application/xml"), i = e.transformToFragment(n, document), r = new XMLSerializer().serializeToString(i);
  o.outerHTML = r;
}
function Z() {
  document.querySelectorAll("template[simple]").forEach((t) => {
    let e = t.getAttribute("id"), n = t.content;
    customElements.define(
      e,
      class extends HTMLElement {
        constructor() {
          super(), this.appendChild(n.cloneNode(!0)), this.slots = this.querySelectorAll("slot");
        }
        connectedCallback() {
          let i = [];
          this.slots.forEach((r) => {
            let l = r.getAttribute("name"), s = this.querySelector(`[slot="${l}"]`);
            s && (r.replaceWith(s.cloneNode(!0)), i.push(s));
          }), i.forEach((r) => {
            r.remove();
          });
        }
      }
    );
  });
}
window.highlightObserver = window.highlightObserver || null;
window.currentPageContainers = window.currentPageContainers || [];
window.currentActiveIndex = window.currentActiveIndex || 0;
window.pageObserver = window.pageObserver || null;
window.scrollTimeout = window.scrollTimeout || null;
function _() {
  window.highlightObserver && (window.highlightObserver.disconnect(), window.highlightObserver = null);
  const o = document.querySelectorAll(".newspaper-page-container");
  window.highlightObserver = new IntersectionObserver(
    (t) => {
      A();
    },
    {
      rootMargin: "-20% 0px -70% 0px"
    }
  ), o.forEach((t) => {
    window.highlightObserver.observe(t);
  });
}
function A() {
  const o = [];
  document.querySelectorAll(".newspaper-page-container").forEach((e) => {
    const n = e.getBoundingClientRect(), i = window.innerHeight, r = Math.max(n.top, 0), l = Math.min(n.bottom, i), s = Math.max(0, l - r), a = n.height, d = s / a >= 0.5, g = e.querySelector("img[data-page]"), u = g ? g.getAttribute("data-page") : "unknown";
    d && g && u && !o.includes(u) && o.push(u);
  }), F(o), o.length > 0 && B(o);
}
function F(o) {
  document.querySelectorAll(".continuation-entry").forEach((t) => {
    t.style.display = "none";
  }), o.forEach((t) => {
    const e = document.querySelector(`[data-page-container="${t}"]`);
    e && e.querySelectorAll(".continuation-entry").forEach((i) => {
      i.style.display = "";
    });
  }), U(o), X();
}
function U(o) {
  document.querySelectorAll(".work-title").forEach((t) => {
    const e = t.getAttribute("data-short-title");
    e && (t.textContent = e);
  }), o.forEach((t) => {
    const e = document.querySelector(`[data-page-container="${t}"]`);
    e && e.querySelectorAll(".work-title").forEach((i) => {
      const r = i.getAttribute("data-full-title");
      r && r !== i.getAttribute("data-short-title") && (i.textContent = r);
    });
  });
}
function X() {
  document.querySelectorAll(".page-entry").forEach((o) => {
    const t = o.querySelectorAll(".inhalts-entry");
    let e = !1;
    t.forEach((n) => {
      window.getComputedStyle(n).display !== "none" && (e = !0);
    }), e ? o.style.display = "" : o.style.display = "none";
  });
}
function H(o) {
  B([o]);
}
function B(o) {
  console.log("markCurrentPagesInInhaltsverzeichnis called with:", o), document.querySelectorAll("[data-page-container]").forEach((e) => {
    e.hasAttribute("data-beilage") ? (e.classList.remove("border-red-500"), e.classList.add("border-amber-400")) : (e.classList.remove("border-red-500"), e.classList.add("border-slate-300"));
  }), document.querySelectorAll(".page-number-inhalts").forEach((e) => {
    e.classList.remove("text-red-600", "font-bold"), e.classList.add("text-slate-700", "font-semibold"), e.style.textDecoration = "", e.style.pointerEvents = "", e.classList.contains("bg-blue-50") ? e.classList.add("hover:bg-blue-100") : e.classList.contains("bg-amber-50") && e.classList.add("hover:bg-amber-100"), !e.classList.contains("bg-amber-50") && !e.classList.contains("bg-blue-50") && e.classList.add("bg-blue-50");
  }), document.querySelectorAll(".inhalts-entry").forEach((e) => {
    e.classList.add("hover:bg-slate-100"), e.style.cursor = "";
  }), document.querySelectorAll('.inhalts-entry a[href*="/"]').forEach((e) => {
    e.classList.remove("no-underline"), e.classList.contains("bg-blue-50") && e.classList.add("hover:bg-blue-100");
  });
  const t = [];
  o.forEach((e) => {
    const n = document.querySelector(
      `.page-number-inhalts[data-page-number="${e}"]`
    );
    if (n) {
      n.classList.remove("text-slate-700", "hover:bg-blue-100", "hover:bg-amber-100"), n.classList.add("text-red-600", "font-bold"), n.style.textDecoration = "none", n.style.pointerEvents = "none", t.push(n);
      const i = document.querySelector(`[data-page-container="${e}"]`);
      i && (i.classList.remove("border-slate-300", "border-amber-400"), i.classList.add("border-red-500"));
      const r = n.closest(".page-entry");
      r && (r.querySelectorAll(".inhalts-entry").forEach((s) => {
        s.classList.remove("hover:bg-slate-100"), s.style.cursor = "default";
      }), r.querySelectorAll('a[href*="/"]').forEach((s) => {
        s.getAttribute("aria-current") === "page" && (s.style.textDecoration = "none", s.style.pointerEvents = "none", s.classList.add("no-underline"), s.classList.remove("hover:bg-blue-100"));
      }));
    }
  }), t.length > 0 && G(t[0]), document.querySelectorAll(".page-indicator").forEach((e) => {
    e.classList.remove("text-red-600", "font-bold"), e.classList.add("text-slate-600", "font-semibold"), e.classList.contains("bg-amber-50") || e.classList.add("bg-blue-50");
  }), o.forEach((e) => {
    const n = document.querySelector(`.page-indicator[data-page="${e}"]`);
    n && (n.classList.remove("text-slate-600"), n.classList.add("text-red-600", "font-bold"));
  });
}
function G(o) {
  const t = o.closest(".lg\\:overflow-y-auto");
  if (t) {
    const e = t.getBoundingClientRect(), n = o.getBoundingClientRect(), i = n.top < e.top, r = n.bottom > e.bottom;
    (i || r) && o.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}
function Y(o, t, e, n = null) {
  let i = document.querySelector("single-page-viewer");
  i || (i = document.createElement("single-page-viewer"), document.body.appendChild(i));
  const r = o.closest('[data-beilage="true"]') !== null, l = window.templateData && window.templateData.targetPage ? window.templateData.targetPage : 0;
  i.show(o.src, o.alt, t, r, l, n);
}
function q() {
  document.getElementById("pageModal").classList.add("hidden");
}
function J() {
  if (window.pageObserver && (window.pageObserver.disconnect(), window.pageObserver = null), window.currentPageContainers = Array.from(document.querySelectorAll(".newspaper-page-container")), window.currentActiveIndex = 0, y(), document.querySelector(".newspaper-page-container")) {
    let t = /* @__PURE__ */ new Set();
    window.pageObserver = new IntersectionObserver(
      (e) => {
        if (e.forEach((n) => {
          const i = window.currentPageContainers.indexOf(n.target);
          i !== -1 && (n.isIntersecting ? t.add(i) : t.delete(i));
        }), t.size > 0) {
          const i = Array.from(t).sort((r, l) => r - l)[0];
          i !== window.currentActiveIndex && (window.currentActiveIndex = i, y());
        }
      },
      {
        rootMargin: "-20% 0px -70% 0px"
      }
    ), window.currentPageContainers.forEach((e) => {
      window.pageObserver.observe(e);
    });
  }
}
function Q() {
  if (window.currentActiveIndex > 0) {
    let o = -1;
    const t = [];
    window.currentPageContainers.forEach((n, i) => {
      const r = n.getBoundingClientRect(), l = window.innerHeight, s = Math.max(r.top, 0), a = Math.min(r.bottom, l), c = Math.max(0, a - s), d = r.height;
      c / d >= 0.3 && t.push(i);
    });
    const e = Math.min(...t);
    for (let n = e - 1; n >= 0; n--)
      if (!t.includes(n)) {
        o = n;
        break;
      }
    o === -1 && e > 0 && (o = e - 1), o >= 0 && (window.currentActiveIndex = o, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), setTimeout(() => {
      y();
    }, 100));
  }
}
function ee() {
  if (window.currentActiveIndex < window.currentPageContainers.length - 1) {
    let o = -1;
    const t = [];
    window.currentPageContainers.forEach((n, i) => {
      const r = n.getBoundingClientRect(), l = window.innerHeight, s = Math.max(r.top, 0), a = Math.min(r.bottom, l), c = Math.max(0, a - s), d = r.height;
      c / d >= 0.3 && t.push(i);
    });
    const e = Math.max(...t);
    for (let n = e + 1; n < window.currentPageContainers.length; n++)
      if (!t.includes(n)) {
        o = n;
        break;
      }
    o === -1 && e < window.currentPageContainers.length - 1 && (o = e + 1), o >= 0 && o < window.currentPageContainers.length && (window.currentActiveIndex = o, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), setTimeout(() => {
      y();
    }, 100));
  }
}
function te() {
  if ($()) {
    const t = document.querySelector("#newspaper-content .newspaper-page-container");
    t && t.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } else {
    const t = document.querySelector('[class*="border-t-2 border-amber-200"]');
    t && t.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}
function $() {
  const o = [];
  window.currentPageContainers.forEach((t, e) => {
    const n = t.getBoundingClientRect(), i = window.innerHeight, r = Math.max(n.top, 0), l = Math.min(n.bottom, i), s = Math.max(0, l - r), a = n.height;
    s / a >= 0.3 && o.push(e);
  });
  for (const t of o) {
    const e = window.currentPageContainers[t];
    if (e && e.id && e.id.includes("beilage-"))
      return !0;
  }
  return !1;
}
function y() {
  const o = document.getElementById("prevPageBtn"), t = document.getElementById("nextPageBtn"), e = document.getElementById("beilageBtn");
  if (o && (window.currentActiveIndex <= 0 ? o.style.display = "none" : o.style.display = "flex"), t && (window.currentActiveIndex >= window.currentPageContainers.length - 1 ? t.style.display = "none" : t.style.display = "flex"), e) {
    const n = $(), i = e.querySelector("i");
    n ? (e.title = "Zur Hauptausgabe", e.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", i && (i.className = "ri-file-text-line text-lg lg:text-xl")) : (e.title = "Zu Beilage", e.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", i && (i.className = "ri-attachment-line text-lg lg:text-xl"));
  }
}
function ne() {
  const o = document.getElementById("shareLinkBtn");
  let t = "";
  if (window.currentActiveIndex !== void 0 && window.currentPageContainers && window.currentPageContainers[window.currentActiveIndex]) {
    const i = window.currentPageContainers[window.currentActiveIndex].querySelector("[data-page]");
    i && (t = `/${i.getAttribute("data-page")}`);
  }
  const e = window.location.origin + window.location.pathname + t;
  navigator.share ? navigator.share({
    title: document.title,
    url: e
  }).catch((n) => {
    E(e, o);
  }) : E(e, o);
}
function E(o, t) {
  if (navigator.clipboard)
    navigator.clipboard.writeText(o).then(() => {
      h(t, "Link kopiert!");
    }).catch((e) => {
      h(t, "Kopieren fehlgeschlagen");
    });
  else {
    const e = document.createElement("textarea");
    e.value = o, document.body.appendChild(e), e.select();
    try {
      const n = document.execCommand("copy");
      h(t, n ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(t, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(e);
    }
  }
}
function oe() {
  const o = document.getElementById("citationBtn"), t = document.title || "KGPZ";
  let e = window.location.origin + window.location.pathname;
  e.includes("#") && (e = e.split("#")[0]);
  const n = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), i = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${t}. Digital verfügbar unter: ${e} (Zugriff: ${n}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(i).then(() => {
      h(o, "Zitation kopiert!");
    }).catch((r) => {
      h(o, "Kopieren fehlgeschlagen");
    });
  else {
    const r = document.createElement("textarea");
    r.value = i, document.body.appendChild(r), r.select();
    try {
      const l = document.execCommand("copy");
      h(o, l ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(o, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(r);
    }
  }
}
function h(o, t) {
  const e = document.querySelector(".simple-popup");
  e && e.remove();
  const n = document.createElement("div");
  n.className = "simple-popup", n.textContent = t, n.style.cssText = `
		position: fixed;
		background: #374151;
		color: white;
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 500;
		z-index: 1000;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.2s ease;
		white-space: nowrap;
	`;
  const i = o.getBoundingClientRect(), r = window.innerHeight, l = window.innerWidth;
  let s = i.left - 10, a = i.bottom + 8;
  const c = 120, d = 32;
  s + c > l && (s = i.right - c + 10), a + d > r && (a = i.top - d - 8), n.style.left = Math.max(5, s) + "px", n.style.top = Math.max(5, a) + "px", document.body.appendChild(n), setTimeout(() => {
    n.style.opacity = "1";
  }, 10), setTimeout(() => {
    n.style.opacity = "0", setTimeout(() => {
      n.parentNode && n.remove();
    }, 200);
  }, 2e3);
}
function ie() {
  if (window.htmxNavigating)
    return;
  let o = "", t = null;
  const e = window.location.pathname.split("/");
  if (e.length >= 4 && !isNaN(e[e.length - 1])) {
    if (o = e[e.length - 1], t = document.getElementById(`page-${o}`), !t) {
      const n = document.querySelectorAll(".newspaper-page-container[data-pages]");
      for (const i of n) {
        const r = i.getAttribute("data-pages");
        if (r && r.split(",").includes(o)) {
          t = i;
          break;
        }
      }
    }
    t || (t = document.getElementById(`beilage-1-page-${o}`) || document.getElementById(`beilage-2-page-${o}`) || document.querySelector(`[id*="beilage"][id*="page-${o}"]`));
  }
  t && o && setTimeout(() => {
    t.scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), H(o);
  }, 300);
}
function v(o, t, e = !1) {
  let n = "";
  if (e)
    n = window.location.origin + window.location.pathname + `#beilage-1-page-${o}`;
  else {
    const r = window.location.pathname.split("/");
    if (r.length >= 3) {
      const l = r[1], s = r[2];
      n = `${window.location.origin}/${l}/${s}/${o}`;
    } else
      n = window.location.origin + window.location.pathname + `/${o}`;
  }
  const i = n;
  if (navigator.clipboard)
    navigator.clipboard.writeText(i).then(() => {
      h(t, "Link kopiert!");
    }).catch((r) => {
      h(t, "Kopieren fehlgeschlagen");
    });
  else {
    const r = document.createElement("textarea");
    r.value = i, document.body.appendChild(r), r.select();
    try {
      const l = document.execCommand("copy");
      h(t, l ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(t, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(r);
    }
  }
}
function x(o, t) {
  const e = document.title || "KGPZ", n = window.location.pathname.split("/");
  let i;
  if (n.length >= 3) {
    const a = n[1], c = n[2];
    i = `${window.location.origin}/${a}/${c}/${o}`;
  } else
    i = `${window.location.origin}${window.location.pathname}/${o}`;
  const r = i, l = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), s = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${e}, Seite ${o}. Digital verfügbar unter: ${r} (Zugriff: ${l}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(s).then(() => {
      h(t, "Zitation kopiert!");
    }).catch((a) => {
      h(t, "Kopieren fehlgeschlagen");
    });
  else {
    const a = document.createElement("textarea");
    a.value = s, document.body.appendChild(a), a.select();
    try {
      const c = document.execCommand("copy");
      h(t, c ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(t, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(a);
    }
  }
}
function L() {
  M();
  const o = document.querySelectorAll(".author-section"), t = document.querySelectorAll(".scrollspy-link");
  if (o.length === 0 || t.length === 0)
    return;
  function e() {
    const l = [];
    o.forEach((c) => {
      const d = c.getAttribute("id"), g = c.querySelector(".akteur-werke-section"), u = c.querySelector(".akteur-beitraege-section");
      let f = !1;
      if (g) {
        const m = g.getBoundingClientRect(), p = m.top < window.innerHeight, b = m.bottom > 0;
        p && b && (f = !0);
      }
      if (u && !f) {
        const m = u.getBoundingClientRect(), p = m.top < window.innerHeight, b = m.bottom > 0;
        p && b && (f = !0);
      }
      if (!g && !u) {
        const m = c.querySelector("div:first-child");
        if (m) {
          const p = m.getBoundingClientRect(), b = p.top >= 0, w = p.bottom <= window.innerHeight;
          b && w && (f = !0);
        }
      }
      f && l.push(d);
    });
    const s = [], a = document.getElementById("scrollspy-slider");
    if (t.forEach((c) => {
      c.classList.remove("font-medium");
      const d = c.getAttribute("data-target");
      l.includes(d) && (c.classList.add("font-medium"), s.push(c));
    }), s.length > 0 && a) {
      const c = document.getElementById("scrollspy-nav"), d = c.getBoundingClientRect();
      let g = 1 / 0, u = -1 / 0;
      s.forEach((m) => {
        const p = m.getBoundingClientRect(), b = p.top - d.top + c.scrollTop, w = b + p.height;
        g = Math.min(g, b), u = Math.max(u, w);
      });
      let f = u - g;
      a.style.top = `${g}px`, a.style.height = `${f}px`, a.style.opacity = "1";
    } else a && (a.style.opacity = "0");
    s.length > 0 && i(s);
  }
  function n(l) {
    const s = document.querySelectorAll(".scrollspy-link"), a = document.getElementById("scrollspy-slider");
    s.forEach((d) => {
      d.classList.remove("font-medium");
    });
    const c = document.querySelector(`[data-target="${l}"]`);
    if (c && (c.classList.add("font-medium"), a)) {
      const d = document.getElementById("scrollspy-nav"), g = d.getBoundingClientRect(), u = c.getBoundingClientRect(), f = u.top - g.top + d.scrollTop;
      a.style.top = `${f}px`, a.style.height = `${u.height}px`, a.style.opacity = "1";
    }
  }
  function i(l) {
    if (window.scrollspyManualNavigation) return;
    const s = document.getElementById("scrollspy-nav");
    if (!s) return;
    const a = l[0], c = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    ), d = window.innerHeight, g = c - d, u = g > 0 ? window.scrollY / g : 0, f = s.clientHeight, p = s.scrollHeight - f;
    if (p > 0) {
      const b = u * p, w = a.getBoundingClientRect(), R = s.getBoundingClientRect(), N = w.top - R.top + s.scrollTop, O = f / 2, V = N - O, S = 0.7, z = S * b + (1 - S) * V, C = Math.max(0, Math.min(p, z)), D = s.scrollTop;
      Math.abs(C - D) > 10 && s.scrollTo({
        top: C,
        behavior: "smooth"
      });
    }
  }
  window.scrollspyScrollHandler = function() {
    clearTimeout(window.scrollspyTimeout), window.scrollspyTimeout = setTimeout(() => {
      e(), r();
    }, 50);
  };
  function r() {
    const l = document.getElementById("sidebar-scroll-to-top");
    if (!l) return;
    const s = window.pageYOffset || document.documentElement.scrollTop, a = window.innerHeight;
    s > a * 0.5 ? (l.classList.remove("opacity-0"), l.classList.add("opacity-100")) : (l.classList.remove("opacity-100"), l.classList.add("opacity-0"));
  }
  window.addEventListener("scroll", window.scrollspyScrollHandler), window.scrollspyClickHandlers = [], t.forEach((l) => {
    const s = function(a) {
      a.preventDefault();
      const c = this.getAttribute("data-target"), d = document.getElementById(c);
      d && (n(c), window.scrollspyManualNavigation = !0, d.scrollIntoView({
        behavior: "smooth",
        block: "start"
      }), setTimeout(() => {
        window.scrollspyManualNavigation = !1;
      }, 1e3));
    };
    window.scrollspyClickHandlers.push({ link: l, handler: s }), l.addEventListener("click", s);
  }), e(), r();
}
function M() {
  window.scrollspyScrollHandler && (window.removeEventListener("scroll", window.scrollspyScrollHandler), window.scrollspyScrollHandler = null), window.scrollspyTimeout && (clearTimeout(window.scrollspyTimeout), window.scrollspyTimeout = null), window.scrollspyClickHandlers && (window.scrollspyClickHandlers.forEach(({ link: t, handler: e }) => {
    t.removeEventListener("click", e);
  }), window.scrollspyClickHandlers = null);
  const o = document.getElementById("scrollspy-slider");
  o && (o.style.opacity = "0", o.style.height = "0"), window.scrollspyManualNavigation = !1;
}
function k() {
  _(), J(), window.addEventListener("scroll", function() {
    clearTimeout(window.scrollTimeout), window.scrollTimeout = setTimeout(() => {
      A(), y();
    }, 50);
  }), ie(), document.addEventListener("keydown", function(o) {
    o.key === "Escape" && q();
  });
}
window.enlargePage = Y;
window.closeModal = q;
window.scrollToPreviousPage = Q;
window.scrollToNextPage = ee;
window.scrollToBeilage = te;
window.shareCurrentPage = ne;
window.generateCitation = oe;
window.copyPagePermalink = v;
window.generatePageCitation = x;
function ae() {
  I(), Z(), document.querySelector(".newspaper-page-container") && k(), document.querySelector(".author-section") && L(), htmx.on("htmx:load", function(o) {
    I();
  }), document.body.addEventListener("htmx:afterSwap", function(o) {
    window.htmxNavigating = !0;
    const t = window.location.pathname, e = t.match(/\/\d+$/), n = t.includes("/akteure/") || t.includes("/autoren");
    !e && n && setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "instant"
        // Use instant instead of smooth to avoid conflicts
      });
    }, 50), setTimeout(() => {
      document.querySelector(".newspaper-page-container") && k(), document.querySelector(".author-section") && L();
      const i = document.querySelector("scroll-to-top-button");
      i && i.reassessScrollPosition(), setTimeout(() => {
        window.htmxNavigating = !1;
      }, 500);
    }, 100);
  }), document.body.addEventListener("htmx:beforeRequest", function(o) {
    window.htmxNavigating = !0;
  });
}
class re extends HTMLElement {
  constructor() {
    super(), this.resizeObserver = null;
  }
  // Dynamically detect sidebar width in pixels
  detectSidebarWidth() {
    const t = document.querySelector('.lg\\:w-1\\/4, .lg\\:w-1\\/3, [class*="lg:w-1/"]');
    if (t) {
      const i = t.getBoundingClientRect().width;
      return console.log("Detected sidebar width:", i, "px"), `${i}px`;
    }
    const e = window.innerWidth;
    return e < 1024 ? "0px" : e < 1280 ? `${Math.floor(e * 0.25)}px` : `${Math.floor(e * 0.2)}px`;
  }
  connectedCallback() {
    const t = this.detectSidebarWidth();
    this.innerHTML = `
			<div class="fixed inset-0 z-50 flex pointer-events-none">
				<!-- Keep Inhaltsverzeichnis area empty/transparent (collapsible) -->
				<div id="sidebar-spacer" style="width: ${t};" class="flex-shrink-0 transition-all duration-300"></div>

				<!-- Cover the right columns with the zoomed view -->
				<div class="flex-1 bg-slate-50 overflow-auto pointer-events-auto">
					<div class="relative min-h-full flex flex-col">
						<!-- Header with page info and buttons -->
						<div class="flex items-center justify-between p-4">
							<!-- Left: Sidebar toggle and page indicator -->
							<div class="flex items-center gap-3">
								<!-- Sidebar toggle button -->
								<button
									id="sidebar-toggle-btn"
									onclick="this.closest('single-page-viewer').toggleSidebar()"
									class="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer"
									title="Inhaltsverzeichnis ein-/ausblenden">
									<i class="ri-sidebar-fold-line text-lg font-bold"></i>
								</button>

								<!-- Page indicator with icon -->
								<div id="page-indicator" class="text-slate-800 flex items-center gap-3">
									<span id="page-icon" class="text-lg"></span>
									<span id="page-number" class="text-lg font-bold bg-blue-50 px-2 py-1 rounded flex items-center gap-1"></span>
								</div>
							</div>

							<!-- Right: Action buttons -->
							<div class="flex items-center gap-3">
								<!-- Previous page button -->
								<button
									id="prev-page-btn"
									onclick="this.closest('single-page-viewer').goToPreviousPage()"
									class="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer"
									title="Vorherige Seite">
									<i class="ri-arrow-left-line text-lg font-bold"></i>
								</button>

								<!-- Next page button -->
								<button
									id="next-page-btn"
									onclick="this.closest('single-page-viewer').goToNextPage()"
									class="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer"
									title="Nächste Seite">
									<i class="ri-arrow-right-line text-lg font-bold"></i>
								</button>

								<!-- Separator -->
								<div class="w-px h-6 bg-gray-300"></div>

								<!-- Share button -->
								<button
									id="share-btn"
									onclick="this.closest('single-page-viewer').shareCurrentPage()"
									class="w-10 h-10 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer"
									title="Link zu dieser Seite kopieren">
									<i class="ri-share-line text-lg font-bold"></i>
								</button>

								<!-- Cite button -->
								<button
									id="cite-btn"
									onclick="this.closest('single-page-viewer').generatePageCitation()"
									class="w-10 h-10 bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer"
									title="Zitation für diese Seite generieren">
									<i class="ri-file-text-line text-lg font-bold"></i>
								</button>

								<!-- Close button -->
								<button
									onclick="this.closest('single-page-viewer').close()"
									class="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer"
									title="Schließen">
									<i class="ri-close-line text-lg font-bold"></i>
								</button>
							</div>
						</div>

						<!-- Image container that can scroll -->
						<div class="flex-1 flex items-center justify-center p-4 pb-8">
							<img
								id="single-page-image"
								src=""
								alt=""
								class="w-full h-auto rounded-lg shadow-2xl cursor-pointer"
								onclick="this.closest('single-page-viewer').close()"
								title="Klicken zum Schließen"
							/>
						</div>
					</div>
				</div>
			</div>
		`, this.setupResizeObserver();
  }
  // Set up resize observer to dynamically update sidebar width
  setupResizeObserver() {
    this.resizeObserver && this.resizeObserver.disconnect(), this.resizeObserver = new ResizeObserver(() => {
      this.updateSidebarWidth();
    }), this.resizeObserver.observe(document.body);
  }
  // Update sidebar width when window is resized
  updateSidebarWidth() {
    const t = this.querySelector("#sidebar-spacer");
    if (t && !t.style.width.includes("0px")) {
      const e = this.detectSidebarWidth();
      t.style.width = e, console.log("Updated sidebar width to:", e);
    }
  }
  show(t, e, n, i = !1, r = 0, l = null) {
    const s = this.querySelector("#single-page-image"), a = this.querySelector("#page-number"), c = this.querySelector("#page-icon");
    this.querySelector("#page-indicator"), s.src = t, s.alt = e, this.currentPageNumber = n, this.currentIsBeilage = i, this.currentPartNumber = l;
    const d = this.getIssueContext(n);
    if (a.innerHTML = d ? `${d}, ${n}` : `${n}`, r && n === r) {
      a.style.position = "relative";
      const g = a.querySelector(".target-page-dot");
      g && g.remove();
      const u = document.createElement("span");
      u.className = "target-page-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10", u.title = "verlinkte Seite", a.appendChild(u);
    }
    if (l !== null)
      c.innerHTML = `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${l}. Teil</span>`;
    else {
      const g = this.determinePageIconType(n, i);
      c.innerHTML = this.getPageIconHTML(g);
    }
    this.updateNavigationButtons(), this.style.display = "block", document.body.style.overflow = "hidden", H(n);
  }
  close() {
    this.style.display = "none", document.body.style.overflow = "";
  }
  // Clean up component completely
  destroy() {
    this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), document.body.style.overflow = "", this.parentNode && this.parentNode.removeChild(this);
  }
  // Determine page icon type based on page position and whether it's beilage
  determinePageIconType(t, e) {
    const n = e ? '.newspaper-page-container[data-beilage="true"]' : ".newspaper-page-container:not([data-beilage])", r = Array.from(document.querySelectorAll(n)).map((a) => {
      const c = a.getAttribute("data-page-container");
      return c ? parseInt(c) : null;
    }).filter((a) => a !== null).sort((a, c) => a - c);
    if (r.length === 0)
      return "first";
    const l = r[0], s = r[r.length - 1];
    return t === l ? "first" : t === s ? "last" : t === l + 1 ? "even" : t === s - 1 ? "odd" : t % 2 === 0 ? "even" : "odd";
  }
  // Generate page icon HTML based on type (same as Go PageIcon function)
  getPageIconHTML(t) {
    const e = "ri-file-text-line text-lg";
    switch (t) {
      case "first":
        return `<i class="${e} text-black"></i>`;
      case "last":
        return `<i class="${e} text-black" style="transform: scaleX(-1); display: inline-block;"></i>`;
      case "even":
        return `<i class="${e} text-black" style="margin-left: 2px; transform: scaleX(-1); display: inline-block;"></i><i class="${e} text-slate-400"></i>`;
      case "odd":
        return `<i class="${e} text-slate-400" style="margin-left: 2px; transform: scaleX(-1); display: inline-block;"></i><i class="${e} text-black"></i>`;
      default:
        return `<i class="${e} text-black"></i>`;
    }
  }
  // Share current page
  shareCurrentPage() {
    if (typeof v == "function") {
      const t = this.querySelector("#share-btn");
      v(this.currentPageNumber, t, this.currentIsBeilage);
    }
  }
  // Generate citation for current page
  generatePageCitation() {
    if (typeof x == "function") {
      const t = this.querySelector("#cite-btn");
      x(this.currentPageNumber, t);
    }
  }
  // Update navigation button visibility based on available pages
  updateNavigationButtons() {
    const t = this.querySelector("#prev-page-btn"), e = this.querySelector("#next-page-btn"), { prevPage: n, nextPage: i } = this.getAdjacentPages();
    n !== null ? (t.disabled = !1, t.className = t.className.replace("opacity-50 cursor-not-allowed", ""), t.className = t.className.replace(
      "bg-gray-50 text-gray-400",
      "bg-gray-100 text-gray-700"
    )) : (t.disabled = !0, t.className.includes("opacity-50") || (t.className += " opacity-50 cursor-not-allowed"), t.className = t.className.replace(
      "bg-gray-100 text-gray-700",
      "bg-gray-50 text-gray-400"
    )), i !== null ? (e.disabled = !1, e.className = e.className.replace("opacity-50 cursor-not-allowed", ""), e.className = e.className.replace(
      "bg-gray-50 text-gray-400",
      "bg-gray-100 text-gray-700"
    )) : (e.disabled = !0, e.className.includes("opacity-50") || (e.className += " opacity-50 cursor-not-allowed"), e.className = e.className.replace(
      "bg-gray-100 text-gray-700",
      "bg-gray-50 text-gray-400"
    ));
  }
  // Get previous and next page numbers
  getAdjacentPages() {
    let t;
    this.currentIsBeilage ? t = '.newspaper-page-container[data-beilage="true"]' : t = ".newspaper-page-container:not([data-beilage])";
    const e = Array.from(document.querySelectorAll(t));
    console.log(
      "Found containers:",
      e.length,
      "for",
      this.currentIsBeilage ? "beilage" : "main"
    );
    const n = e.map((s) => {
      const a = s.getAttribute("data-page-container"), c = a ? parseInt(a) : null;
      return console.log("Container page:", a, "parsed:", c), c;
    }).filter((s) => s !== null).sort((s, a) => s - a);
    console.log("All pages found:", n), console.log("Current page:", this.currentPageNumber);
    const i = n.indexOf(this.currentPageNumber);
    console.log("Current index:", i);
    let r = null, l = null;
    return i > 0 && (r = n[i - 1]), i < n.length - 1 && (l = n[i + 1]), console.log("Adjacent pages - prev:", r, "next:", l), { prevPage: r, nextPage: l };
  }
  // Navigate to previous page
  goToPreviousPage() {
    const { prevPage: t } = this.getAdjacentPages();
    t !== null && this.navigateToPage(t);
  }
  // Navigate to next page
  goToNextPage() {
    const { nextPage: t } = this.getAdjacentPages();
    t !== null && this.navigateToPage(t);
  }
  // Navigate to a specific page
  navigateToPage(t) {
    const e = this.currentIsBeilage ? '.newspaper-page-container[data-beilage="true"]' : ".newspaper-page-container:not([data-beilage])", n = document.querySelector(
      `${e}[data-page-container="${t}"]`
    );
    if (n) {
      const i = n.querySelector(".newspaper-page-image");
      if (i) {
        let r = null;
        this.currentPartNumber !== null && (r = this.getPartNumberForPage(t)), this.show(
          i.src,
          i.alt,
          t,
          this.currentIsBeilage,
          0,
          r
        );
      }
    }
  }
  // Get part number for a specific page in piece view
  getPartNumberForPage(t) {
    const e = document.querySelector(`[data-page-container="${t}"]`);
    if (e) {
      const n = e.querySelector(".part-number");
      if (n) {
        const i = n.textContent.match(/(\d+)\./);
        if (i)
          return parseInt(i[1]);
      }
    }
    return null;
  }
  // Toggle sidebar visibility
  toggleSidebar() {
    const t = this.querySelector("#sidebar-spacer"), e = this.querySelector("#sidebar-toggle-btn"), n = e.querySelector("i"), i = t.style.width, r = i === "0px" || i === "0";
    if (console.log("Current state - isCollapsed:", r), console.log("Current width:", i), r) {
      const l = this.detectSidebarWidth();
      t.style.width = l, e.className = "w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", n.className = "ri-sidebar-fold-line text-lg font-bold", e.title = "Inhaltsverzeichnis ausblenden", console.log("Expanding sidebar to:", l);
    } else
      t.style.width = "0px", e.className = "w-10 h-10 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", n.className = "ri-sidebar-unfold-line text-lg font-bold", e.title = "Inhaltsverzeichnis einblenden", console.log("Collapsing sidebar");
    console.log("New width:", t.style.width);
  }
  // Extract issue context from document title, URL, or page container
  getIssueContext(t) {
    const e = window.location.pathname, n = e.includes("/beitrag/");
    if (n) {
      const l = document.querySelector(`[data-page-container="${t}"]`);
      if (l) {
        const c = l.querySelector(".page-indicator");
        if (c) {
          const d = c.textContent.trim(), g = d.match(/(\d{1,2}\.\d{1,2}\.\d{4}\s+Nr\.\s+\d+)/);
          if (g)
            return g[1];
          const u = d.match(/(\d{4})\s+Nr\.\s+(\d+)/);
          if (u)
            return `${u[1]} Nr. ${u[2]}`;
        }
      }
      const a = document.title.match(/(\d{4}).*Nr\.\s*(\d+)/);
      if (a)
        return `${a[1]} Nr. ${a[2]}`;
    } else
      return "";
    const i = e.match(/\/(\d{4})\/(\d+)/);
    if (i)
      return n ? `${i[1]} Nr. ${i[2]}` : "";
    const r = document.querySelector(".page-indicator");
    if (r) {
      const s = r.textContent.trim().match(/(\d{4})\s+Nr\.\s+(\d+)/);
      if (s)
        return `${s[1]} Nr. ${s[2]}`;
    }
    return "KGPZ";
  }
}
customElements.define("single-page-viewer", re);
document.body.addEventListener("htmx:beforeRequest", function(o) {
  const t = document.querySelector("single-page-viewer");
  t && t.style.display !== "none" && (console.log("Cleaning up single page viewer before HTMX navigation"), t.destroy()), M();
});
window.addEventListener("beforeunload", function() {
  const o = document.querySelector("single-page-viewer");
  o && o.destroy();
});
class se extends HTMLElement {
  constructor() {
    super(), this.isVisible = !1, this.scrollHandler = null;
  }
  connectedCallback() {
    this.innerHTML = `
			<button
				id="scroll-to-top-btn"
				class="fixed bottom-6 right-6 w-12 h-12 bg-gray-700 hover:bg-gray-800 text-gray-100 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center cursor-pointer z-50 opacity-0 pointer-events-none"
				title="Nach oben scrollen"
				onclick="this.closest('scroll-to-top-button').scrollToTop()">
				<i class="ri-arrow-up-line text-xl font-bold"></i>
			</button>
		`, this.scrollHandler = () => {
      this.handleScroll();
    }, window.addEventListener("scroll", this.scrollHandler), this.handleScroll();
  }
  disconnectedCallback() {
    this.scrollHandler && (window.removeEventListener("scroll", this.scrollHandler), this.scrollHandler = null);
  }
  // Method to reassess scroll position (called after HTMX swaps)
  reassessScrollPosition() {
    setTimeout(() => {
      this.handleScroll();
    }, 100);
  }
  handleScroll() {
    const t = this.querySelector("#scroll-to-top-btn");
    if (!t) return;
    const e = window.pageYOffset || document.documentElement.scrollTop, n = window.innerHeight, i = e > n;
    i && !this.isVisible ? (this.isVisible = !0, t.classList.remove("opacity-0", "pointer-events-none"), t.classList.add("opacity-100", "pointer-events-auto")) : !i && this.isVisible && (this.isVisible = !1, t.classList.remove("opacity-100", "pointer-events-auto"), t.classList.add("opacity-0", "pointer-events-none"));
  }
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
}
customElements.define("scroll-to-top-button", se);
export {
  ae as setup
};
