const W = "script[xslt-onload]", P = "xslt-template", Z = "xslt-transformed", L = /* @__PURE__ */ new Map();
function I() {
  let n = htmx.findAll(W);
  for (let e of n)
    F(e);
}
function F(n) {
  if (n.getAttribute(Z) === "true" || !n.hasAttribute(P))
    return;
  let e = "#" + n.getAttribute(P), t = L.get(e);
  if (!t) {
    let a = htmx.find(e);
    if (a) {
      let s = a.innerHTML ? new DOMParser().parseFromString(a.innerHTML, "application/xml") : a.contentDocument;
      t = new XSLTProcessor(), t.importStylesheet(s), L.set(e, t);
    } else
      throw new Error("Unknown XSLT template: " + e);
  }
  let o = new DOMParser().parseFromString(n.innerHTML, "application/xml"), i = t.transformToFragment(o, document), r = new XMLSerializer().serializeToString(i);
  n.outerHTML = r;
}
function _() {
  document.querySelectorAll("template[simple]").forEach((e) => {
    let t = e.getAttribute("id"), o = e.content;
    customElements.define(
      t,
      class extends HTMLElement {
        constructor() {
          super(), this.appendChild(o.cloneNode(!0)), this.slots = this.querySelectorAll("slot");
        }
        connectedCallback() {
          let i = [];
          this.slots.forEach((r) => {
            let a = r.getAttribute("name"), s = this.querySelector(`[slot="${a}"]`);
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
function U() {
  window.highlightObserver && (window.highlightObserver.disconnect(), window.highlightObserver = null);
  const n = document.querySelectorAll(".newspaper-page-container");
  window.highlightObserver = new IntersectionObserver(
    (e) => {
      H();
    },
    {
      rootMargin: "-20% 0px -70% 0px"
    }
  ), n.forEach((e) => {
    window.highlightObserver.observe(e);
  });
}
function H() {
  const n = [];
  document.querySelectorAll(".newspaper-page-container").forEach((t) => {
    const o = t.getBoundingClientRect(), i = window.innerHeight, r = Math.max(o.top, 0), a = Math.min(o.bottom, i), s = Math.max(0, a - r), l = o.height, d = s / l >= 0.5, g = t.querySelector("img[data-page]"), u = g ? g.getAttribute("data-page") : "unknown";
    d && g && u && !n.includes(u) && n.push(u);
  }), X(n), n.length > 0 && $(n);
}
function X(n) {
  document.querySelectorAll(".continuation-entry").forEach((e) => {
    e.style.display = "none";
  }), n.forEach((e) => {
    const t = document.querySelector(`[data-page-container="${e}"]`);
    t && t.querySelectorAll(".continuation-entry").forEach((i) => {
      i.style.display = "";
    });
  }), G(n), Y();
}
function G(n) {
  document.querySelectorAll(".work-title").forEach((e) => {
    const t = e.getAttribute("data-short-title");
    t && (e.textContent = t);
  }), n.forEach((e) => {
    const t = document.querySelector(`[data-page-container="${e}"]`);
    t && t.querySelectorAll(".work-title").forEach((i) => {
      const r = i.getAttribute("data-full-title");
      r && r !== i.getAttribute("data-short-title") && (i.textContent = r);
    });
  });
}
function Y() {
  document.querySelectorAll(".page-entry").forEach((n) => {
    const e = n.querySelectorAll(".inhalts-entry");
    let t = !1;
    e.forEach((o) => {
      window.getComputedStyle(o).display !== "none" && (t = !0);
    }), t ? n.style.display = "" : n.style.display = "none";
  });
}
function q(n) {
  $([n]);
}
function $(n) {
  console.log("markCurrentPagesInInhaltsverzeichnis called with:", n), document.querySelectorAll("[data-page-container]").forEach((t) => {
    t.hasAttribute("data-beilage") ? (t.classList.remove("border-red-500"), t.classList.add("border-amber-400")) : (t.classList.remove("border-red-500"), t.classList.add("border-slate-300"));
  }), document.querySelectorAll(".page-number-inhalts").forEach((t) => {
    t.classList.remove("text-red-600", "font-bold"), t.classList.add("text-slate-700", "font-semibold"), t.style.textDecoration = "", t.style.pointerEvents = "", t.classList.contains("bg-blue-50") ? t.classList.add("hover:bg-blue-100") : t.classList.contains("bg-amber-50") && t.classList.add("hover:bg-amber-100"), !t.classList.contains("bg-amber-50") && !t.classList.contains("bg-blue-50") && t.classList.add("bg-blue-50");
  }), document.querySelectorAll(".inhalts-entry").forEach((t) => {
    t.classList.add("hover:bg-slate-100"), t.style.cursor = "";
  }), document.querySelectorAll('.inhalts-entry a[href*="/"]').forEach((t) => {
    t.classList.remove("no-underline"), t.classList.contains("bg-blue-50") && t.classList.add("hover:bg-blue-100");
  });
  const e = [];
  n.forEach((t) => {
    const o = document.querySelector(
      `.page-number-inhalts[data-page-number="${t}"]`
    );
    if (o) {
      o.classList.remove("text-slate-700", "hover:bg-blue-100", "hover:bg-amber-100"), o.classList.add("text-red-600", "font-bold"), o.style.textDecoration = "none", o.style.pointerEvents = "none", e.push(o);
      const i = document.querySelector(`[data-page-container="${t}"]`);
      i && (i.classList.remove("border-slate-300", "border-amber-400"), i.classList.add("border-red-500"));
      const r = o.closest(".page-entry");
      r && (r.querySelectorAll(".inhalts-entry").forEach((s) => {
        s.classList.remove("hover:bg-slate-100"), s.style.cursor = "default";
      }), r.querySelectorAll('a[href*="/"]').forEach((s) => {
        s.getAttribute("aria-current") === "page" && (s.style.textDecoration = "none", s.style.pointerEvents = "none", s.classList.add("no-underline"), s.classList.remove("hover:bg-blue-100"));
      }));
    }
  }), e.length > 0 && J(e[0]), document.querySelectorAll(".page-indicator").forEach((t) => {
    t.classList.remove("text-red-600", "font-bold"), t.classList.add("text-slate-600", "font-semibold"), t.classList.contains("bg-amber-50") || t.classList.add("bg-blue-50");
  }), n.forEach((t) => {
    const o = document.querySelector(`.page-indicator[data-page="${t}"]`);
    o && (o.classList.remove("text-slate-600"), o.classList.add("text-red-600", "font-bold"));
  });
}
function J(n) {
  const e = n.closest(".lg\\:overflow-y-auto");
  if (e) {
    const t = e.getBoundingClientRect(), o = n.getBoundingClientRect(), i = o.top < t.top, r = o.bottom > t.bottom;
    (i || r) && n.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}
function Q(n, e, t, o = null) {
  let i = document.querySelector("single-page-viewer");
  i || (i = document.createElement("single-page-viewer"), document.body.appendChild(i));
  const r = n.closest('[data-beilage="true"]') !== null, a = window.templateData && window.templateData.targetPage ? window.templateData.targetPage : 0;
  i.show(n.src, n.alt, e, r, a, o);
}
function M() {
  document.getElementById("pageModal").classList.add("hidden");
}
function ee() {
  if (window.pageObserver && (window.pageObserver.disconnect(), window.pageObserver = null), window.currentPageContainers = Array.from(document.querySelectorAll(".newspaper-page-container")), window.currentActiveIndex = 0, v(), document.querySelector(".newspaper-page-container")) {
    let e = /* @__PURE__ */ new Set();
    window.pageObserver = new IntersectionObserver(
      (t) => {
        if (t.forEach((o) => {
          const i = window.currentPageContainers.indexOf(o.target);
          i !== -1 && (o.isIntersecting ? e.add(i) : e.delete(i));
        }), e.size > 0) {
          const i = Array.from(e).sort((r, a) => r - a)[0];
          i !== window.currentActiveIndex && (window.currentActiveIndex = i, v());
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
function te() {
  if (window.currentActiveIndex > 0) {
    let n = -1;
    const e = [];
    window.currentPageContainers.forEach((o, i) => {
      const r = o.getBoundingClientRect(), a = window.innerHeight, s = Math.max(r.top, 0), l = Math.min(r.bottom, a), c = Math.max(0, l - s), d = r.height;
      c / d >= 0.3 && e.push(i);
    });
    const t = Math.min(...e);
    for (let o = t - 1; o >= 0; o--)
      if (!e.includes(o)) {
        n = o;
        break;
      }
    n === -1 && t > 0 && (n = t - 1), n >= 0 && (window.currentActiveIndex = n, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), setTimeout(() => {
      v();
    }, 100));
  }
}
function ne() {
  if (window.currentActiveIndex < window.currentPageContainers.length - 1) {
    let n = -1;
    const e = [];
    window.currentPageContainers.forEach((o, i) => {
      const r = o.getBoundingClientRect(), a = window.innerHeight, s = Math.max(r.top, 0), l = Math.min(r.bottom, a), c = Math.max(0, l - s), d = r.height;
      c / d >= 0.3 && e.push(i);
    });
    const t = Math.max(...e);
    for (let o = t + 1; o < window.currentPageContainers.length; o++)
      if (!e.includes(o)) {
        n = o;
        break;
      }
    n === -1 && t < window.currentPageContainers.length - 1 && (n = t + 1), n >= 0 && n < window.currentPageContainers.length && (window.currentActiveIndex = n, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), setTimeout(() => {
      v();
    }, 100));
  }
}
function oe() {
  if (R()) {
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
function R() {
  const n = [];
  window.currentPageContainers.forEach((e, t) => {
    const o = e.getBoundingClientRect(), i = window.innerHeight, r = Math.max(o.top, 0), a = Math.min(o.bottom, i), s = Math.max(0, a - r), l = o.height;
    s / l >= 0.3 && n.push(t);
  });
  for (const e of n) {
    const t = window.currentPageContainers[e];
    if (t && t.id && t.id.includes("beilage-"))
      return !0;
  }
  return !1;
}
function v() {
  const n = document.getElementById("prevPageBtn"), e = document.getElementById("nextPageBtn"), t = document.getElementById("beilageBtn");
  if (n && (window.currentActiveIndex <= 0 ? n.style.display = "none" : n.style.display = "flex"), e && (window.currentActiveIndex >= window.currentPageContainers.length - 1 ? e.style.display = "none" : e.style.display = "flex"), t) {
    const o = R(), i = t.querySelector("i");
    o ? (t.title = "Zur Hauptausgabe", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", i && (i.className = "ri-file-text-line text-lg lg:text-xl")) : (t.title = "Zu Beilage", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", i && (i.className = "ri-attachment-line text-lg lg:text-xl"));
  }
}
function ie() {
  const n = document.getElementById("shareLinkBtn");
  let e = "";
  if (window.currentActiveIndex !== void 0 && window.currentPageContainers && window.currentPageContainers[window.currentActiveIndex]) {
    const i = window.currentPageContainers[window.currentActiveIndex].querySelector("[data-page]");
    i && (e = `/${i.getAttribute("data-page")}`);
  }
  const t = window.location.origin + window.location.pathname + e;
  navigator.share ? navigator.share({
    title: document.title,
    url: t
  }).catch((o) => {
    E(t, n);
  }) : E(t, n);
}
function E(n, e) {
  if (navigator.clipboard)
    navigator.clipboard.writeText(n).then(() => {
      p(e, "Link kopiert!");
    }).catch((t) => {
      p(e, "Kopieren fehlgeschlagen");
    });
  else {
    const t = document.createElement("textarea");
    t.value = n, document.body.appendChild(t), t.select();
    try {
      const o = document.execCommand("copy");
      p(e, o ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      p(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(t);
    }
  }
}
function re() {
  const n = document.getElementById("citationBtn"), e = document.title || "KGPZ";
  let t = window.location.origin + window.location.pathname;
  t.includes("#") && (t = t.split("#")[0]);
  const o = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), i = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${e}. Digital verfügbar unter: ${t} (Zugriff: ${o}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(i).then(() => {
      p(n, "Zitation kopiert!");
    }).catch((r) => {
      p(n, "Kopieren fehlgeschlagen");
    });
  else {
    const r = document.createElement("textarea");
    r.value = i, document.body.appendChild(r), r.select();
    try {
      const a = document.execCommand("copy");
      p(n, a ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      p(n, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(r);
    }
  }
}
function p(n, e) {
  const t = document.querySelector(".simple-popup");
  t && t.remove();
  const o = document.createElement("div");
  o.className = "simple-popup", o.textContent = e, o.style.cssText = `
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
  const i = n.getBoundingClientRect(), r = window.innerHeight, a = window.innerWidth;
  let s = i.left - 10, l = i.bottom + 8;
  const c = 120, d = 32;
  s + c > a && (s = i.right - c + 10), l + d > r && (l = i.top - d - 8), o.style.left = Math.max(5, s) + "px", o.style.top = Math.max(5, l) + "px", document.body.appendChild(o), setTimeout(() => {
    o.style.opacity = "1";
  }, 10), setTimeout(() => {
    o.style.opacity = "0", setTimeout(() => {
      o.parentNode && o.remove();
    }, 200);
  }, 2e3);
}
function se() {
  if (window.htmxNavigating)
    return;
  let n = "", e = null;
  const t = window.location.pathname.split("/");
  if (t.length >= 4 && !isNaN(t[t.length - 1])) {
    if (n = t[t.length - 1], e = document.getElementById(`page-${n}`), !e) {
      const o = document.querySelectorAll(".newspaper-page-container[data-pages]");
      for (const i of o) {
        const r = i.getAttribute("data-pages");
        if (r && r.split(",").includes(n)) {
          e = i;
          break;
        }
      }
    }
    e || (e = document.getElementById(`beilage-1-page-${n}`) || document.getElementById(`beilage-2-page-${n}`) || document.querySelector(`[id*="beilage"][id*="page-${n}"]`));
  }
  e && n && setTimeout(() => {
    e.scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), q(n);
  }, 300);
}
function x(n, e, t = !1) {
  let o = "";
  if (t)
    o = window.location.origin + window.location.pathname + `#beilage-1-page-${n}`;
  else {
    const r = window.location.pathname.split("/");
    if (r.length >= 3) {
      const a = r[1], s = r[2];
      o = `${window.location.origin}/${a}/${s}/${n}`;
    } else
      o = window.location.origin + window.location.pathname + `/${n}`;
  }
  const i = o;
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
      const a = document.execCommand("copy");
      p(e, a ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      p(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(r);
    }
  }
}
function S(n, e) {
  const t = document.title || "KGPZ", o = window.location.pathname.split("/");
  let i;
  if (o.length >= 3) {
    const l = o[1], c = o[2];
    i = `${window.location.origin}/${l}/${c}/${n}`;
  } else
    i = `${window.location.origin}${window.location.pathname}/${n}`;
  const r = i, a = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), s = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${t}, Seite ${n}. Digital verfügbar unter: ${r} (Zugriff: ${a}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(s).then(() => {
      p(e, "Zitation kopiert!");
    }).catch((l) => {
      p(e, "Kopieren fehlgeschlagen");
    });
  else {
    const l = document.createElement("textarea");
    l.value = s, document.body.appendChild(l), l.select();
    try {
      const c = document.execCommand("copy");
      p(e, c ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      p(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(l);
    }
  }
}
function k() {
  N();
  const n = document.querySelectorAll(".author-section"), e = document.querySelectorAll(".scrollspy-link");
  if (n.length === 0 || e.length === 0)
    return;
  function t() {
    const s = document.getElementById("scrollspy-slider"), l = document.getElementById("scrollspy-nav");
    if (!s || !l || s.style.opacity === "0")
      return;
    const c = l.getBoundingClientRect(), d = parseFloat(s.style.top), g = parseFloat(s.style.height), u = d + g, h = l.scrollTop, m = h + c.height;
    if (u > m) {
      const f = u - c.height + 20;
      l.scrollTo({
        top: f,
        behavior: "smooth"
      });
    } else if (d < h) {
      const f = d - 20;
      l.scrollTo({
        top: Math.max(0, f),
        behavior: "smooth"
      });
    }
  }
  function o() {
    const s = [];
    n.forEach((d) => {
      const g = d.getAttribute("id"), u = d.querySelector(".akteur-werke-section"), h = d.querySelector(".akteur-beitraege-section");
      let m = !1;
      if (u) {
        const f = u.getBoundingClientRect(), b = f.top < window.innerHeight, w = f.bottom > 0;
        b && w && (m = !0);
      }
      if (h && !m) {
        const f = h.getBoundingClientRect(), b = f.top < window.innerHeight, w = f.bottom > 0;
        b && w && (m = !0);
      }
      if (!u && !h) {
        const f = d.querySelector("div:first-child");
        if (f) {
          const b = f.getBoundingClientRect(), w = b.top >= 0, y = b.bottom <= window.innerHeight;
          w && y && (m = !0);
        }
      }
      m && s.push(g);
    });
    const l = [], c = document.getElementById("scrollspy-slider");
    if (e.forEach((d) => {
      d.classList.remove("font-medium");
      const g = d.getAttribute("data-target");
      s.includes(g) && (d.classList.add("font-medium"), l.push(d));
    }), l.length > 0 && c) {
      const d = document.getElementById("scrollspy-nav"), g = d.getBoundingClientRect();
      let u = 1 / 0, h = -1 / 0;
      l.forEach((f) => {
        const b = f.getBoundingClientRect(), w = b.top - g.top + d.scrollTop, y = w + b.height;
        u = Math.min(u, w), h = Math.max(h, y);
      });
      let m = h - u;
      c.style.top = `${u}px`, c.style.height = `${m}px`, c.style.opacity = "1", setTimeout(() => t(), 100);
    } else c && (c.style.opacity = "0");
    l.length > 0 && r(l);
  }
  function i(s) {
    const l = document.querySelectorAll(".scrollspy-link"), c = document.getElementById("scrollspy-slider");
    l.forEach((g) => {
      g.classList.remove("font-medium");
    });
    const d = document.querySelector(`[data-target="${s}"]`);
    if (d && (d.classList.add("font-medium"), c)) {
      const g = document.getElementById("scrollspy-nav"), u = g.getBoundingClientRect(), h = d.getBoundingClientRect(), m = h.top - u.top + g.scrollTop;
      c.style.top = `${m}px`, c.style.height = `${h.height}px`, c.style.opacity = "1";
    }
  }
  function r(s) {
    if (window.scrollspyManualNavigation) return;
    const l = document.getElementById("scrollspy-nav");
    if (!l) return;
    const c = s[0], d = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    ), g = window.innerHeight, u = d - g, h = u > 0 ? window.scrollY / u : 0, m = l.clientHeight, b = l.scrollHeight - m;
    if (b > 0) {
      const w = h * b, y = c.getBoundingClientRect(), O = l.getBoundingClientRect(), V = y.top - O.top + l.scrollTop, z = m / 2, D = V - z, T = 0.7, K = T * w + (1 - T) * D, C = Math.max(0, Math.min(b, K)), j = l.scrollTop;
      Math.abs(C - j) > 10 && l.scrollTo({
        top: C,
        behavior: "smooth"
      });
    }
  }
  window.scrollspyScrollHandler = function() {
    clearTimeout(window.scrollspyTimeout), window.scrollspyTimeout = setTimeout(() => {
      o(), a();
    }, 50);
  };
  function a() {
    const s = document.getElementById("sidebar-scroll-to-top");
    if (!s) return;
    const l = window.pageYOffset || document.documentElement.scrollTop, c = window.innerHeight;
    l > c * 0.5 ? (s.classList.remove("opacity-0"), s.classList.add("opacity-100")) : (s.classList.remove("opacity-100"), s.classList.add("opacity-0"));
  }
  window.addEventListener("scroll", window.scrollspyScrollHandler), window.scrollspyClickHandlers = [], e.forEach((s) => {
    const l = function(c) {
      c.preventDefault();
      const d = this.getAttribute("data-target"), g = document.getElementById(d);
      g && (i(d), window.scrollspyManualNavigation = !0, g.scrollIntoView({
        behavior: "smooth",
        block: "start"
      }), setTimeout(() => {
        window.scrollspyManualNavigation = !1, t();
      }, 1e3));
    };
    window.scrollspyClickHandlers.push({ link: s, handler: l }), s.addEventListener("click", l);
  }), o(), a();
}
function N() {
  window.scrollspyScrollHandler && (window.removeEventListener("scroll", window.scrollspyScrollHandler), window.scrollspyScrollHandler = null), window.scrollspyTimeout && (clearTimeout(window.scrollspyTimeout), window.scrollspyTimeout = null), window.scrollspyClickHandlers && (window.scrollspyClickHandlers.forEach(({ link: e, handler: t }) => {
    e.removeEventListener("click", t);
  }), window.scrollspyClickHandlers = null);
  const n = document.getElementById("scrollspy-slider");
  n && (n.style.opacity = "0", n.style.height = "0"), window.scrollspyManualNavigation = !1;
}
function A() {
  U(), ee(), window.addEventListener("scroll", function() {
    clearTimeout(window.scrollTimeout), window.scrollTimeout = setTimeout(() => {
      H(), v();
    }, 50);
  }), se(), document.addEventListener("keydown", function(n) {
    n.key === "Escape" && M();
  });
}
window.enlargePage = Q;
window.closeModal = M;
window.scrollToPreviousPage = te;
window.scrollToNextPage = ne;
window.scrollToBeilage = oe;
window.shareCurrentPage = ie;
window.generateCitation = re;
window.copyPagePermalink = x;
window.generatePageCitation = S;
function B() {
  const n = window.location.pathname, e = document.body;
  e.classList.remove("page-akteure", "page-ausgabe", "page-search", "page-ort", "page-kategorie", "page-piece", "page-edition"), n.includes("/akteure/") || n.includes("/autoren") ? e.classList.add("page-akteure") : n.match(/\/\d{4}\/\d+/) ? e.classList.add("page-ausgabe") : n.includes("/search") || n.includes("/suche") ? e.classList.add("page-search") : n.includes("/ort/") ? e.classList.add("page-ort") : n.includes("/kategorie/") ? e.classList.add("page-kategorie") : n.includes("/beitrag/") ? e.classList.add("page-piece") : n.includes("/edition") && e.classList.add("page-edition");
}
function de() {
  I(), _(), B(), document.querySelector(".newspaper-page-container") && A(), document.querySelector(".author-section") && k(), htmx.on("htmx:load", function(n) {
    I();
  }), document.body.addEventListener("htmx:afterSwap", function(n) {
    B(), window.htmxNavigating = !0;
    const e = window.location.pathname, t = e.match(/\/\d+$/), o = e.includes("/akteure/") || e.includes("/autoren");
    !t && o && setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "instant"
        // Use instant instead of smooth to avoid conflicts
      });
    }, 50), setTimeout(() => {
      document.querySelector(".newspaper-page-container") && A(), document.querySelector(".author-section") && k();
      const i = document.querySelector("scroll-to-top-button");
      i && i.reassessScrollPosition(), setTimeout(() => {
        window.htmxNavigating = !1;
      }, 500);
    }, 100);
  }), document.body.addEventListener("htmx:beforeRequest", function(n) {
    window.htmxNavigating = !0;
  });
}
class le extends HTMLElement {
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
  show(e, t, o, i = !1, r = 0, a = null) {
    const s = this.querySelector("#single-page-image"), l = this.querySelector("#page-number"), c = this.querySelector("#page-icon");
    this.querySelector("#page-indicator"), s.src = e, s.alt = t, this.currentPageNumber = o, this.currentIsBeilage = i, this.currentPartNumber = a;
    const d = this.getIssueContext(o);
    if (l.innerHTML = d ? `${d}, ${o}` : `${o}`, r && o === r) {
      l.style.position = "relative";
      const g = l.querySelector(".target-page-dot");
      g && g.remove();
      const u = document.createElement("span");
      u.className = "target-page-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10", u.title = "verlinkte Seite", l.appendChild(u);
    }
    if (a !== null)
      c.innerHTML = `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${a}. Teil</span>`;
    else {
      const g = this.determinePageIconType(o, i);
      c.innerHTML = this.getPageIconHTML(g);
    }
    this.updateNavigationButtons(), this.style.display = "block", document.body.style.overflow = "hidden", q(o);
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
    const o = t ? '.newspaper-page-container[data-beilage="true"]' : ".newspaper-page-container:not([data-beilage])", r = Array.from(document.querySelectorAll(o)).map((l) => {
      const c = l.getAttribute("data-page-container");
      return c ? parseInt(c) : null;
    }).filter((l) => l !== null).sort((l, c) => l - c);
    if (r.length === 0)
      return "first";
    const a = r[0], s = r[r.length - 1];
    return e === a ? "first" : e === s ? "last" : e === a + 1 ? "even" : e === s - 1 ? "odd" : e % 2 === 0 ? "even" : "odd";
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
    if (typeof x == "function") {
      const e = this.querySelector("#share-btn");
      x(this.currentPageNumber, e, this.currentIsBeilage);
    }
  }
  // Generate citation for current page
  generatePageCitation() {
    if (typeof S == "function") {
      const e = this.querySelector("#cite-btn");
      S(this.currentPageNumber, e);
    }
  }
  // Update navigation button visibility based on available pages
  updateNavigationButtons() {
    const e = this.querySelector("#prev-page-btn"), t = this.querySelector("#next-page-btn"), { prevPage: o, nextPage: i } = this.getAdjacentPages();
    o !== null ? (e.disabled = !1, e.className = e.className.replace("opacity-50 cursor-not-allowed", ""), e.className = e.className.replace(
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
    const o = t.map((s) => {
      const l = s.getAttribute("data-page-container"), c = l ? parseInt(l) : null;
      return console.log("Container page:", l, "parsed:", c), c;
    }).filter((s) => s !== null).sort((s, l) => s - l);
    console.log("All pages found:", o), console.log("Current page:", this.currentPageNumber);
    const i = o.indexOf(this.currentPageNumber);
    console.log("Current index:", i);
    let r = null, a = null;
    return i > 0 && (r = o[i - 1]), i < o.length - 1 && (a = o[i + 1]), console.log("Adjacent pages - prev:", r, "next:", a), { prevPage: r, nextPage: a };
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
    const t = this.currentIsBeilage ? '.newspaper-page-container[data-beilage="true"]' : ".newspaper-page-container:not([data-beilage])", o = document.querySelector(
      `${t}[data-page-container="${e}"]`
    );
    if (o) {
      const i = o.querySelector(".newspaper-page-image");
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
      const o = t.querySelector(".part-number");
      if (o) {
        const i = o.textContent.match(/(\d+)\./);
        if (i)
          return parseInt(i[1]);
      }
    }
    return null;
  }
  // Toggle sidebar visibility
  toggleSidebar() {
    const e = this.querySelector("#sidebar-spacer"), t = this.querySelector("#sidebar-toggle-btn"), o = t.querySelector("i"), i = e.style.width, r = i === "0px" || i === "0";
    if (console.log("Current state - isCollapsed:", r), console.log("Current width:", i), r) {
      const a = this.detectSidebarWidth();
      e.style.width = a, t.className = "w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", o.className = "ri-sidebar-fold-line text-lg font-bold", t.title = "Inhaltsverzeichnis ausblenden", console.log("Expanding sidebar to:", a);
    } else
      e.style.width = "0px", t.className = "w-10 h-10 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", o.className = "ri-sidebar-unfold-line text-lg font-bold", t.title = "Inhaltsverzeichnis einblenden", console.log("Collapsing sidebar");
    console.log("New width:", e.style.width);
  }
  // Extract issue context from document title, URL, or page container
  getIssueContext(e) {
    const t = window.location.pathname, o = t.includes("/beitrag/");
    if (o) {
      const a = document.querySelector(`[data-page-container="${e}"]`);
      if (a) {
        const c = a.querySelector(".page-indicator");
        if (c) {
          const d = c.textContent.trim(), g = d.match(/(\d{1,2}\.\d{1,2}\.\d{4}\s+Nr\.\s+\d+)/);
          if (g)
            return g[1];
          const u = d.match(/(\d{4})\s+Nr\.\s+(\d+)/);
          if (u)
            return `${u[1]} Nr. ${u[2]}`;
        }
      }
      const l = document.title.match(/(\d{4}).*Nr\.\s*(\d+)/);
      if (l)
        return `${l[1]} Nr. ${l[2]}`;
    } else
      return "";
    const i = t.match(/\/(\d{4})\/(\d+)/);
    if (i)
      return o ? `${i[1]} Nr. ${i[2]}` : "";
    const r = document.querySelector(".page-indicator");
    if (r) {
      const s = r.textContent.trim().match(/(\d{4})\s+Nr\.\s+(\d+)/);
      if (s)
        return `${s[1]} Nr. ${s[2]}`;
    }
    return "KGPZ";
  }
}
customElements.define("single-page-viewer", le);
document.body.addEventListener("htmx:beforeRequest", function(n) {
  const e = document.querySelector("single-page-viewer");
  e && e.style.display !== "none" && (console.log("Cleaning up single page viewer before HTMX navigation"), e.destroy()), N();
});
window.addEventListener("beforeunload", function() {
  const n = document.querySelector("single-page-viewer");
  n && n.destroy();
});
class ae extends HTMLElement {
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
    const t = window.pageYOffset || document.documentElement.scrollTop, o = window.innerHeight, i = t > o;
    i && !this.isVisible ? (this.isVisible = !0, e.classList.remove("opacity-0", "pointer-events-none"), e.classList.add("opacity-100", "pointer-events-auto")) : !i && this.isVisible && (this.isVisible = !1, e.classList.remove("opacity-100", "pointer-events-auto"), e.classList.add("opacity-0", "pointer-events-none"));
  }
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
}
customElements.define("scroll-to-top-button", ae);
export {
  de as setup
};
