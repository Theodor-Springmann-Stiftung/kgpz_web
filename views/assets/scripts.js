const z = "script[xslt-onload]", C = "xslt-template", D = "xslt-transformed", T = /* @__PURE__ */ new Map();
function E() {
  let o = htmx.findAll(z);
  for (let e of o)
    K(e);
}
function K(o) {
  if (o.getAttribute(D) === "true" || !o.hasAttribute(C))
    return;
  let e = "#" + o.getAttribute(C), t = T.get(e);
  if (!t) {
    let l = htmx.find(e);
    if (l) {
      let s = l.innerHTML ? new DOMParser().parseFromString(l.innerHTML, "application/xml") : l.contentDocument;
      t = new XSLTProcessor(), t.importStylesheet(s), T.set(e, t);
    } else
      throw new Error("Unknown XSLT template: " + e);
  }
  let n = new DOMParser().parseFromString(o.innerHTML, "application/xml"), i = t.transformToFragment(n, document), r = new XMLSerializer().serializeToString(i);
  o.outerHTML = r;
}
function j() {
  document.querySelectorAll("template[simple]").forEach((e) => {
    let t = e.getAttribute("id"), n = e.content;
    customElements.define(
      t,
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
function W() {
  window.highlightObserver && (window.highlightObserver.disconnect(), window.highlightObserver = null);
  const o = document.querySelectorAll(".newspaper-page-container");
  window.highlightObserver = new IntersectionObserver(
    (e) => {
      L();
    },
    {
      rootMargin: "-20% 0px -70% 0px"
    }
  ), o.forEach((e) => {
    window.highlightObserver.observe(e);
  });
}
function L() {
  const o = [];
  document.querySelectorAll(".newspaper-page-container").forEach((t) => {
    const n = t.getBoundingClientRect(), i = window.innerHeight, r = Math.max(n.top, 0), l = Math.min(n.bottom, i), s = Math.max(0, l - r), a = n.height, d = s / a >= 0.5, u = t.querySelector("img[data-page]"), g = u ? u.getAttribute("data-page") : "unknown";
    d && u && g && !o.includes(g) && o.push(g);
  }), Z(o), o.length > 0 && k(o);
}
function Z(o) {
  document.querySelectorAll(".continuation-entry").forEach((e) => {
    e.style.display = "none";
  }), o.forEach((e) => {
    const t = document.querySelector(`[data-page-container="${e}"]`);
    t && t.querySelectorAll(".continuation-entry").forEach((i) => {
      i.style.display = "";
    });
  }), _(o), F();
}
function _(o) {
  document.querySelectorAll(".work-title").forEach((e) => {
    const t = e.getAttribute("data-short-title");
    t && (e.textContent = t);
  }), o.forEach((e) => {
    const t = document.querySelector(`[data-page-container="${e}"]`);
    t && t.querySelectorAll(".work-title").forEach((i) => {
      const r = i.getAttribute("data-full-title");
      r && r !== i.getAttribute("data-short-title") && (i.textContent = r);
    });
  });
}
function F() {
  document.querySelectorAll(".page-entry").forEach((o) => {
    const e = o.querySelectorAll(".inhalts-entry");
    let t = !1;
    e.forEach((n) => {
      window.getComputedStyle(n).display !== "none" && (t = !0);
    }), t ? o.style.display = "" : o.style.display = "none";
  });
}
function A(o) {
  k([o]);
}
function k(o) {
  console.log("markCurrentPagesInInhaltsverzeichnis called with:", o), document.querySelectorAll("[data-page-container]").forEach((t) => {
    t.hasAttribute("data-beilage") ? (t.classList.remove("border-red-500"), t.classList.add("border-amber-400")) : (t.classList.remove("border-red-500"), t.classList.add("border-slate-300"));
  }), document.querySelectorAll(".page-number-inhalts").forEach((t) => {
    t.classList.remove("text-red-600", "font-bold"), t.classList.add("text-slate-700", "font-semibold"), t.style.textDecoration = "", t.style.pointerEvents = "", t.classList.contains("bg-blue-50") ? t.classList.add("hover:bg-blue-100") : t.classList.contains("bg-amber-50") && t.classList.add("hover:bg-amber-100"), !t.classList.contains("bg-amber-50") && !t.classList.contains("bg-blue-50") && t.classList.add("bg-blue-50");
  }), document.querySelectorAll(".inhalts-entry").forEach((t) => {
    t.classList.add("hover:bg-slate-100"), t.style.cursor = "";
  }), document.querySelectorAll('.inhalts-entry a[href*="/"]').forEach((t) => {
    t.classList.remove("no-underline"), t.classList.contains("bg-blue-50") && t.classList.add("hover:bg-blue-100");
  });
  const e = [];
  o.forEach((t) => {
    const n = document.querySelector(
      `.page-number-inhalts[data-page-number="${t}"]`
    );
    if (n) {
      n.classList.remove("text-slate-700", "hover:bg-blue-100", "hover:bg-amber-100"), n.classList.add("text-red-600", "font-bold"), n.style.textDecoration = "none", n.style.pointerEvents = "none", e.push(n);
      const i = document.querySelector(`[data-page-container="${t}"]`);
      i && (i.classList.remove("border-slate-300", "border-amber-400"), i.classList.add("border-red-500"));
      const r = n.closest(".page-entry");
      r && (r.querySelectorAll(".inhalts-entry").forEach((s) => {
        s.classList.remove("hover:bg-slate-100"), s.style.cursor = "default";
      }), r.querySelectorAll('a[href*="/"]').forEach((s) => {
        s.getAttribute("aria-current") === "page" && (s.style.textDecoration = "none", s.style.pointerEvents = "none", s.classList.add("no-underline"), s.classList.remove("hover:bg-blue-100"));
      }));
    }
  }), e.length > 0 && X(e[0]), document.querySelectorAll(".page-indicator").forEach((t) => {
    t.classList.remove("text-red-600", "font-bold"), t.classList.add("text-slate-600", "font-semibold"), t.classList.contains("bg-amber-50") || t.classList.add("bg-blue-50");
  }), o.forEach((t) => {
    const n = document.querySelector(`.page-indicator[data-page="${t}"]`);
    n && (n.classList.remove("text-slate-600"), n.classList.add("text-red-600", "font-bold"));
  });
}
function X(o) {
  const e = o.closest(".lg\\:overflow-y-auto");
  if (e) {
    const t = e.getBoundingClientRect(), n = o.getBoundingClientRect(), i = n.top < t.top, r = n.bottom > t.bottom;
    (i || r) && o.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}
function U(o, e, t, n = null) {
  let i = document.querySelector("single-page-viewer");
  i || (i = document.createElement("single-page-viewer"), document.body.appendChild(i));
  const r = o.closest('[data-beilage="true"]') !== null, l = window.templateData && window.templateData.targetPage ? window.templateData.targetPage : 0;
  i.show(o.src, o.alt, e, r, l, n);
}
function q() {
  document.getElementById("pageModal").classList.add("hidden");
}
function G() {
  if (window.pageObserver && (window.pageObserver.disconnect(), window.pageObserver = null), window.currentPageContainers = Array.from(document.querySelectorAll(".newspaper-page-container")), window.currentActiveIndex = 0, m(), document.querySelector(".newspaper-page-container")) {
    let e = /* @__PURE__ */ new Set();
    window.pageObserver = new IntersectionObserver(
      (t) => {
        if (t.forEach((n) => {
          const i = window.currentPageContainers.indexOf(n.target);
          i !== -1 && (n.isIntersecting ? e.add(i) : e.delete(i));
        }), e.size > 0) {
          const i = Array.from(e).sort((r, l) => r - l)[0];
          i !== window.currentActiveIndex && (window.currentActiveIndex = i, m());
        }
      },
      {
        rootMargin: "-20% 0px -70% 0px"
      }
    ), window.currentPageContainers.forEach((t) => {
      window.pageObserver.observe(t);
    });
  }
}
function Y() {
  if (window.currentActiveIndex > 0) {
    let o = -1;
    const e = [];
    window.currentPageContainers.forEach((n, i) => {
      const r = n.getBoundingClientRect(), l = window.innerHeight, s = Math.max(r.top, 0), a = Math.min(r.bottom, l), c = Math.max(0, a - s), d = r.height;
      c / d >= 0.3 && e.push(i);
    });
    const t = Math.min(...e);
    for (let n = t - 1; n >= 0; n--)
      if (!e.includes(n)) {
        o = n;
        break;
      }
    o === -1 && t > 0 && (o = t - 1), o >= 0 && (window.currentActiveIndex = o, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), setTimeout(() => {
      m();
    }, 100));
  }
}
function J() {
  if (window.currentActiveIndex < window.currentPageContainers.length - 1) {
    let o = -1;
    const e = [];
    window.currentPageContainers.forEach((n, i) => {
      const r = n.getBoundingClientRect(), l = window.innerHeight, s = Math.max(r.top, 0), a = Math.min(r.bottom, l), c = Math.max(0, a - s), d = r.height;
      c / d >= 0.3 && e.push(i);
    });
    const t = Math.max(...e);
    for (let n = t + 1; n < window.currentPageContainers.length; n++)
      if (!e.includes(n)) {
        o = n;
        break;
      }
    o === -1 && t < window.currentPageContainers.length - 1 && (o = t + 1), o >= 0 && o < window.currentPageContainers.length && (window.currentActiveIndex = o, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), setTimeout(() => {
      m();
    }, 100));
  }
}
function Q() {
  if (H()) {
    const e = document.querySelector("#newspaper-content .newspaper-page-container");
    e && e.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } else {
    const e = document.querySelector('[class*="border-t-2 border-amber-200"]');
    e && e.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}
function H() {
  const o = [];
  window.currentPageContainers.forEach((e, t) => {
    const n = e.getBoundingClientRect(), i = window.innerHeight, r = Math.max(n.top, 0), l = Math.min(n.bottom, i), s = Math.max(0, l - r), a = n.height;
    s / a >= 0.3 && o.push(t);
  });
  for (const e of o) {
    const t = window.currentPageContainers[e];
    if (t && t.id && t.id.includes("beilage-"))
      return !0;
  }
  return !1;
}
function m() {
  const o = document.getElementById("prevPageBtn"), e = document.getElementById("nextPageBtn"), t = document.getElementById("beilageBtn");
  if (o && (window.currentActiveIndex <= 0 ? o.style.display = "none" : o.style.display = "flex"), e && (window.currentActiveIndex >= window.currentPageContainers.length - 1 ? e.style.display = "none" : e.style.display = "flex"), t) {
    const n = H(), i = t.querySelector("i");
    n ? (t.title = "Zur Hauptausgabe", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", i && (i.className = "ri-file-text-line text-lg lg:text-xl")) : (t.title = "Zu Beilage", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", i && (i.className = "ri-attachment-line text-lg lg:text-xl"));
  }
}
function ee() {
  const o = document.getElementById("shareLinkBtn");
  let e = "";
  if (window.currentActiveIndex !== void 0 && window.currentPageContainers && window.currentPageContainers[window.currentActiveIndex]) {
    const i = window.currentPageContainers[window.currentActiveIndex].querySelector("[data-page]");
    i && (e = `/${i.getAttribute("data-page")}`);
  }
  const t = window.location.origin + window.location.pathname + e;
  navigator.share ? navigator.share({
    title: document.title,
    url: t
  }).catch((n) => {
    I(t, o);
  }) : I(t, o);
}
function I(o, e) {
  if (navigator.clipboard)
    navigator.clipboard.writeText(o).then(() => {
      p(e, "Link kopiert!");
    }).catch((t) => {
      p(e, "Kopieren fehlgeschlagen");
    });
  else {
    const t = document.createElement("textarea");
    t.value = o, document.body.appendChild(t), t.select();
    try {
      const n = document.execCommand("copy");
      p(e, n ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      p(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(t);
    }
  }
}
function te() {
  const o = document.getElementById("citationBtn"), e = document.title || "KGPZ";
  let t = window.location.origin + window.location.pathname;
  t.includes("#") && (t = t.split("#")[0]);
  const n = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), i = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${e}. Digital verfügbar unter: ${t} (Zugriff: ${n}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(i).then(() => {
      p(o, "Zitation kopiert!");
    }).catch((r) => {
      p(o, "Kopieren fehlgeschlagen");
    });
  else {
    const r = document.createElement("textarea");
    r.value = i, document.body.appendChild(r), r.select();
    try {
      const l = document.execCommand("copy");
      p(o, l ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      p(o, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(r);
    }
  }
}
function p(o, e) {
  const t = document.querySelector(".simple-popup");
  t && t.remove();
  const n = document.createElement("div");
  n.className = "simple-popup", n.textContent = e, n.style.cssText = `
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
function ne() {
  let o = "", e = null;
  const t = window.location.pathname.split("/");
  if (t.length >= 4 && !isNaN(t[t.length - 1])) {
    if (o = t[t.length - 1], e = document.getElementById(`page-${o}`), !e) {
      const n = document.querySelectorAll(".newspaper-page-container[data-pages]");
      for (const i of n) {
        const r = i.getAttribute("data-pages");
        if (r && r.split(",").includes(o)) {
          e = i;
          break;
        }
      }
    }
    e || (e = document.getElementById(`beilage-1-page-${o}`) || document.getElementById(`beilage-2-page-${o}`) || document.querySelector(`[id*="beilage"][id*="page-${o}"]`));
  }
  e && o && setTimeout(() => {
    e.scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), A(o);
  }, 300);
}
function v(o, e, t = !1) {
  let n = "";
  if (t)
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
      p(e, "Link kopiert!");
    }).catch((r) => {
      p(e, "Kopieren fehlgeschlagen");
    });
  else {
    const r = document.createElement("textarea");
    r.value = i, document.body.appendChild(r), r.select();
    try {
      const l = document.execCommand("copy");
      p(e, l ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      p(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(r);
    }
  }
}
function x(o, e) {
  const t = document.title || "KGPZ", n = window.location.pathname.split("/");
  let i;
  if (n.length >= 3) {
    const a = n[1], c = n[2];
    i = `${window.location.origin}/${a}/${c}/${o}`;
  } else
    i = `${window.location.origin}${window.location.pathname}/${o}`;
  const r = i, l = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), s = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${t}, Seite ${o}. Digital verfügbar unter: ${r} (Zugriff: ${l}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(s).then(() => {
      p(e, "Zitation kopiert!");
    }).catch((a) => {
      p(e, "Kopieren fehlgeschlagen");
    });
  else {
    const a = document.createElement("textarea");
    a.value = s, document.body.appendChild(a), a.select();
    try {
      const c = document.execCommand("copy");
      p(e, c ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      p(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(a);
    }
  }
}
function w() {
  B();
  const o = document.querySelectorAll(".author-section"), e = document.querySelectorAll(".scrollspy-link");
  if (o.length === 0 || e.length === 0)
    return;
  function t() {
    const i = [];
    o.forEach((s) => {
      const a = s.getAttribute("id"), c = s.querySelector(".akteur-werke-section"), d = s.querySelector(".akteur-beitraege-section");
      let u = !1;
      if (c) {
        const g = c.getBoundingClientRect(), h = g.top < window.innerHeight, f = g.bottom > 0;
        h && f && (u = !0);
      }
      if (d && !u) {
        const g = d.getBoundingClientRect(), h = g.top < window.innerHeight, f = g.bottom > 0;
        h && f && (u = !0);
      }
      if (!c && !d) {
        const g = s.querySelector("div:first-child");
        if (g) {
          const h = g.getBoundingClientRect(), f = h.top >= 0, b = h.bottom <= window.innerHeight;
          f && b && (u = !0);
        }
      }
      u && i.push(a);
    });
    const r = [], l = document.getElementById("scrollspy-slider");
    if (e.forEach((s) => {
      s.classList.remove("font-medium");
      const a = s.getAttribute("data-target");
      i.includes(a) && (s.classList.add("font-medium"), r.push(s));
    }), r.length > 0 && l) {
      const s = document.getElementById("scrollspy-nav"), a = s.getBoundingClientRect();
      let c = 1 / 0, d = -1 / 0;
      r.forEach((g) => {
        const h = g.getBoundingClientRect(), f = h.top - a.top + s.scrollTop, b = f + h.height;
        c = Math.min(c, f), d = Math.max(d, b);
      });
      let u = d - c;
      l.style.top = `${c}px`, l.style.height = `${u}px`, l.style.opacity = "1";
    } else l && (l.style.opacity = "0");
    r.length > 0 && n(r);
  }
  function n(i) {
    if (window.scrollspyManualNavigation) return;
    const r = document.getElementById("scrollspy-nav");
    if (!r) return;
    const l = i[0], s = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    ), a = window.innerHeight, c = s - a, d = c > 0 ? window.scrollY / c : 0, u = r.clientHeight, h = r.scrollHeight - u;
    if (h > 0) {
      const f = d * h, b = l.getBoundingClientRect(), $ = r.getBoundingClientRect(), M = b.top - $.top + r.scrollTop, R = u / 2, N = M - R, S = 0.7, O = S * f + (1 - S) * N, P = Math.max(0, Math.min(h, O)), V = r.scrollTop;
      Math.abs(P - V) > 10 && r.scrollTo({
        top: P,
        behavior: "smooth"
      });
    }
  }
  window.scrollspyScrollHandler = function() {
    clearTimeout(window.scrollspyTimeout), window.scrollspyTimeout = setTimeout(t, 50);
  }, window.addEventListener("scroll", window.scrollspyScrollHandler), window.scrollspyClickHandlers = [], e.forEach((i) => {
    const r = function(l) {
      l.preventDefault();
      const s = document.getElementById(this.getAttribute("data-target"));
      s && (window.scrollspyManualNavigation = !0, s.scrollIntoView({
        behavior: "smooth",
        block: "start"
      }), setTimeout(() => {
        window.scrollspyManualNavigation = !1;
      }, 1e3));
    };
    window.scrollspyClickHandlers.push({ link: i, handler: r }), i.addEventListener("click", r);
  }), t();
}
function B() {
  window.scrollspyScrollHandler && (window.removeEventListener("scroll", window.scrollspyScrollHandler), window.scrollspyScrollHandler = null), window.scrollspyTimeout && (clearTimeout(window.scrollspyTimeout), window.scrollspyTimeout = null), window.scrollspyClickHandlers && (window.scrollspyClickHandlers.forEach(({ link: e, handler: t }) => {
    e.removeEventListener("click", t);
  }), window.scrollspyClickHandlers = null);
  const o = document.getElementById("scrollspy-slider");
  o && (o.style.opacity = "0", o.style.height = "0"), window.scrollspyManualNavigation = !1;
}
function y() {
  W(), G(), window.addEventListener("scroll", function() {
    clearTimeout(window.scrollTimeout), window.scrollTimeout = setTimeout(() => {
      L(), m();
    }, 50);
  }), ne(), document.addEventListener("keydown", function(o) {
    o.key === "Escape" && q();
  });
}
window.enlargePage = U;
window.closeModal = q;
window.scrollToPreviousPage = Y;
window.scrollToNextPage = J;
window.scrollToBeilage = Q;
window.shareCurrentPage = ee;
window.generateCitation = te;
window.copyPagePermalink = v;
window.generatePageCitation = x;
function se() {
  E(), j(), document.querySelector(".newspaper-page-container") && y(), document.querySelector(".author-section") && w(), htmx.on("htmx:load", function(o) {
    E();
  }), document.body.addEventListener("htmx:afterSwap", function(o) {
    setTimeout(() => {
      document.querySelector(".newspaper-page-container") && y(), document.querySelector(".author-section") && w();
      const e = document.querySelector("scroll-to-top-button");
      e && e.reassessScrollPosition();
    }, 100);
  }), document.body.addEventListener("htmx:afterSettle", function(o) {
    setTimeout(() => {
      document.querySelector(".newspaper-page-container") && y(), document.querySelector(".author-section") && w();
      const e = document.querySelector("scroll-to-top-button");
      e && e.reassessScrollPosition();
    }, 200);
  }), document.body.addEventListener("htmx:load", function(o) {
    setTimeout(() => {
      document.querySelector(".newspaper-page-container") && y(), document.querySelector(".author-section") && w();
      const e = document.querySelector("scroll-to-top-button");
      e && e.reassessScrollPosition();
    }, 100);
  });
}
class oe extends HTMLElement {
  constructor() {
    super(), this.resizeObserver = null;
  }
  // Dynamically detect sidebar width in pixels
  detectSidebarWidth() {
    const e = document.querySelector('.lg\\:w-1\\/4, .lg\\:w-1\\/3, [class*="lg:w-1/"]');
    if (e) {
      const i = e.getBoundingClientRect().width;
      return console.log("Detected sidebar width:", i, "px"), `${i}px`;
    }
    const t = window.innerWidth;
    return t < 1024 ? "0px" : t < 1280 ? `${Math.floor(t * 0.25)}px` : `${Math.floor(t * 0.2)}px`;
  }
  connectedCallback() {
    const e = this.detectSidebarWidth();
    this.innerHTML = `
			<div class="fixed inset-0 z-50 flex pointer-events-none">
				<!-- Keep Inhaltsverzeichnis area empty/transparent (collapsible) -->
				<div id="sidebar-spacer" style="width: ${e};" class="flex-shrink-0 transition-all duration-300"></div>

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
    const e = this.querySelector("#sidebar-spacer");
    if (e && !e.style.width.includes("0px")) {
      const t = this.detectSidebarWidth();
      e.style.width = t, console.log("Updated sidebar width to:", t);
    }
  }
  show(e, t, n, i = !1, r = 0, l = null) {
    const s = this.querySelector("#single-page-image"), a = this.querySelector("#page-number"), c = this.querySelector("#page-icon");
    this.querySelector("#page-indicator"), s.src = e, s.alt = t, this.currentPageNumber = n, this.currentIsBeilage = i, this.currentPartNumber = l;
    const d = this.getIssueContext(n);
    if (a.innerHTML = d ? `${d}, ${n}` : `${n}`, r && n === r) {
      a.style.position = "relative";
      const u = a.querySelector(".target-page-dot");
      u && u.remove();
      const g = document.createElement("span");
      g.className = "target-page-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10", g.title = "verlinkte Seite", a.appendChild(g);
    }
    if (l !== null)
      c.innerHTML = `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${l}. Teil</span>`;
    else {
      const u = this.determinePageIconType(n, i);
      c.innerHTML = this.getPageIconHTML(u);
    }
    this.updateNavigationButtons(), this.style.display = "block", document.body.style.overflow = "hidden", A(n);
  }
  close() {
    this.style.display = "none", document.body.style.overflow = "";
  }
  // Clean up component completely
  destroy() {
    this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), document.body.style.overflow = "", this.parentNode && this.parentNode.removeChild(this);
  }
  // Determine page icon type based on page position and whether it's beilage
  determinePageIconType(e, t) {
    const n = t ? '.newspaper-page-container[data-beilage="true"]' : ".newspaper-page-container:not([data-beilage])", r = Array.from(document.querySelectorAll(n)).map((a) => {
      const c = a.getAttribute("data-page-container");
      return c ? parseInt(c) : null;
    }).filter((a) => a !== null).sort((a, c) => a - c);
    if (r.length === 0)
      return "first";
    const l = r[0], s = r[r.length - 1];
    return e === l ? "first" : e === s ? "last" : e === l + 1 ? "even" : e === s - 1 ? "odd" : e % 2 === 0 ? "even" : "odd";
  }
  // Generate page icon HTML based on type (same as Go PageIcon function)
  getPageIconHTML(e) {
    const t = "ri-file-text-line text-lg";
    switch (e) {
      case "first":
        return `<i class="${t} text-black"></i>`;
      case "last":
        return `<i class="${t} text-black" style="transform: scaleX(-1); display: inline-block;"></i>`;
      case "even":
        return `<i class="${t} text-black" style="margin-left: 2px; transform: scaleX(-1); display: inline-block;"></i><i class="${t} text-slate-400"></i>`;
      case "odd":
        return `<i class="${t} text-slate-400" style="margin-left: 2px; transform: scaleX(-1); display: inline-block;"></i><i class="${t} text-black"></i>`;
      default:
        return `<i class="${t} text-black"></i>`;
    }
  }
  // Share current page
  shareCurrentPage() {
    if (typeof v == "function") {
      const e = this.querySelector("#share-btn");
      v(this.currentPageNumber, e, this.currentIsBeilage);
    }
  }
  // Generate citation for current page
  generatePageCitation() {
    if (typeof x == "function") {
      const e = this.querySelector("#cite-btn");
      x(this.currentPageNumber, e);
    }
  }
  // Update navigation button visibility based on available pages
  updateNavigationButtons() {
    const e = this.querySelector("#prev-page-btn"), t = this.querySelector("#next-page-btn"), { prevPage: n, nextPage: i } = this.getAdjacentPages();
    n !== null ? (e.disabled = !1, e.className = e.className.replace("opacity-50 cursor-not-allowed", ""), e.className = e.className.replace(
      "bg-gray-50 text-gray-400",
      "bg-gray-100 text-gray-700"
    )) : (e.disabled = !0, e.className.includes("opacity-50") || (e.className += " opacity-50 cursor-not-allowed"), e.className = e.className.replace(
      "bg-gray-100 text-gray-700",
      "bg-gray-50 text-gray-400"
    )), i !== null ? (t.disabled = !1, t.className = t.className.replace("opacity-50 cursor-not-allowed", ""), t.className = t.className.replace(
      "bg-gray-50 text-gray-400",
      "bg-gray-100 text-gray-700"
    )) : (t.disabled = !0, t.className.includes("opacity-50") || (t.className += " opacity-50 cursor-not-allowed"), t.className = t.className.replace(
      "bg-gray-100 text-gray-700",
      "bg-gray-50 text-gray-400"
    ));
  }
  // Get previous and next page numbers
  getAdjacentPages() {
    let e;
    this.currentIsBeilage ? e = '.newspaper-page-container[data-beilage="true"]' : e = ".newspaper-page-container:not([data-beilage])";
    const t = Array.from(document.querySelectorAll(e));
    console.log(
      "Found containers:",
      t.length,
      "for",
      this.currentIsBeilage ? "beilage" : "main"
    );
    const n = t.map((s) => {
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
    const { prevPage: e } = this.getAdjacentPages();
    e !== null && this.navigateToPage(e);
  }
  // Navigate to next page
  goToNextPage() {
    const { nextPage: e } = this.getAdjacentPages();
    e !== null && this.navigateToPage(e);
  }
  // Navigate to a specific page
  navigateToPage(e) {
    const t = this.currentIsBeilage ? '.newspaper-page-container[data-beilage="true"]' : ".newspaper-page-container:not([data-beilage])", n = document.querySelector(
      `${t}[data-page-container="${e}"]`
    );
    if (n) {
      const i = n.querySelector(".newspaper-page-image");
      if (i) {
        let r = null;
        this.currentPartNumber !== null && (r = this.getPartNumberForPage(e)), this.show(
          i.src,
          i.alt,
          e,
          this.currentIsBeilage,
          0,
          r
        );
      }
    }
  }
  // Get part number for a specific page in piece view
  getPartNumberForPage(e) {
    const t = document.querySelector(`[data-page-container="${e}"]`);
    if (t) {
      const n = t.querySelector(".part-number");
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
    const e = this.querySelector("#sidebar-spacer"), t = this.querySelector("#sidebar-toggle-btn"), n = t.querySelector("i"), i = e.style.width, r = i === "0px" || i === "0";
    if (console.log("Current state - isCollapsed:", r), console.log("Current width:", i), r) {
      const l = this.detectSidebarWidth();
      e.style.width = l, t.className = "w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", n.className = "ri-sidebar-fold-line text-lg font-bold", t.title = "Inhaltsverzeichnis ausblenden", console.log("Expanding sidebar to:", l);
    } else
      e.style.width = "0px", t.className = "w-10 h-10 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", n.className = "ri-sidebar-unfold-line text-lg font-bold", t.title = "Inhaltsverzeichnis einblenden", console.log("Collapsing sidebar");
    console.log("New width:", e.style.width);
  }
  // Extract issue context from document title, URL, or page container
  getIssueContext(e) {
    const t = window.location.pathname, n = t.includes("/beitrag/");
    if (n) {
      const l = document.querySelector(`[data-page-container="${e}"]`);
      if (l) {
        const c = l.querySelector(".page-indicator");
        if (c) {
          const d = c.textContent.trim(), u = d.match(/(\d{1,2}\.\d{1,2}\.\d{4}\s+Nr\.\s+\d+)/);
          if (u)
            return u[1];
          const g = d.match(/(\d{4})\s+Nr\.\s+(\d+)/);
          if (g)
            return `${g[1]} Nr. ${g[2]}`;
        }
      }
      const a = document.title.match(/(\d{4}).*Nr\.\s*(\d+)/);
      if (a)
        return `${a[1]} Nr. ${a[2]}`;
    } else
      return "";
    const i = t.match(/\/(\d{4})\/(\d+)/);
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
customElements.define("single-page-viewer", oe);
document.body.addEventListener("htmx:beforeRequest", function(o) {
  const e = document.querySelector("single-page-viewer");
  e && e.style.display !== "none" && (console.log("Cleaning up single page viewer before HTMX navigation"), e.destroy()), B();
});
window.addEventListener("beforeunload", function() {
  const o = document.querySelector("single-page-viewer");
  o && o.destroy();
});
class ie extends HTMLElement {
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
    const e = this.querySelector("#scroll-to-top-btn");
    if (!e) return;
    const t = window.pageYOffset || document.documentElement.scrollTop, n = window.innerHeight, i = t > n;
    i && !this.isVisible ? (this.isVisible = !0, e.classList.remove("opacity-0", "pointer-events-none"), e.classList.add("opacity-100", "pointer-events-auto")) : !i && this.isVisible && (this.isVisible = !1, e.classList.remove("opacity-100", "pointer-events-auto"), e.classList.add("opacity-0", "pointer-events-none"));
  }
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
}
customElements.define("scroll-to-top-button", ie);
export {
  se as setup
};
