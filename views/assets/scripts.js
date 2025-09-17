const S = "script[xslt-onload]", w = "xslt-template", T = "xslt-transformed", f = /* @__PURE__ */ new Map();
function b() {
  let n = htmx.findAll(S);
  for (let t of n)
    A(t);
}
function A(n) {
  if (n.getAttribute(T) === "true" || !n.hasAttribute(w))
    return;
  let t = "#" + n.getAttribute(w), e = f.get(t);
  if (!e) {
    let a = htmx.find(t);
    if (a) {
      let s = a.innerHTML ? new DOMParser().parseFromString(a.innerHTML, "application/xml") : a.contentDocument;
      e = new XSLTProcessor(), e.importStylesheet(s), f.set(t, e);
    } else
      throw new Error("Unknown XSLT template: " + t);
  }
  let o = new DOMParser().parseFromString(n.innerHTML, "application/xml"), i = e.transformToFragment(o, document), r = new XMLSerializer().serializeToString(i);
  n.outerHTML = r;
}
function L() {
  document.querySelectorAll("template[simple]").forEach((t) => {
    let e = t.getAttribute("id"), o = t.content;
    customElements.define(
      e,
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
function B() {
  window.highlightObserver && (window.highlightObserver.disconnect(), window.highlightObserver = null);
  const n = document.querySelectorAll(".newspaper-page-container");
  window.highlightObserver = new IntersectionObserver(
    (t) => {
      x();
    },
    {
      rootMargin: "-20% 0px -70% 0px"
    }
  ), n.forEach((t) => {
    window.highlightObserver.observe(t);
  });
}
function x() {
  const n = [];
  document.querySelectorAll(".newspaper-page-container").forEach((e) => {
    const o = e.getBoundingClientRect(), i = window.innerHeight, r = Math.max(o.top, 0), a = Math.min(o.bottom, i), s = Math.max(0, a - r), l = o.height, g = s / l >= 0.5, u = e.querySelector("img[data-page]"), m = u ? u.getAttribute("data-page") : "unknown";
    g && u && m && !n.includes(m) && n.push(m);
  }), q(n), n.length > 0 && E(n);
}
function q(n) {
  document.querySelectorAll(".continuation-entry").forEach((t) => {
    t.style.display = "none";
  }), n.forEach((t) => {
    const e = document.querySelector(`[data-page-container="${t}"]`);
    e && e.querySelectorAll(".continuation-entry").forEach((i) => {
      i.style.display = "";
    });
  }), k(n), M();
}
function k(n) {
  document.querySelectorAll(".work-title").forEach((t) => {
    const e = t.getAttribute("data-short-title");
    e && (t.textContent = e);
  }), n.forEach((t) => {
    const e = document.querySelector(`[data-page-container="${t}"]`);
    e && e.querySelectorAll(".work-title").forEach((i) => {
      const r = i.getAttribute("data-full-title");
      r && r !== i.getAttribute("data-short-title") && (i.textContent = r);
    });
  });
}
function M() {
  document.querySelectorAll(".page-entry").forEach((n) => {
    const t = n.querySelectorAll(".inhalts-entry");
    let e = !1;
    t.forEach((o) => {
      window.getComputedStyle(o).display !== "none" && (e = !0);
    }), e ? n.style.display = "" : n.style.display = "none";
  });
}
function C(n) {
  E([n]);
}
function E(n) {
  console.log("markCurrentPagesInInhaltsverzeichnis called with:", n), document.querySelectorAll("[data-page-container]").forEach((e) => {
    e.hasAttribute("data-beilage") ? (e.classList.remove("border-red-500"), e.classList.add("border-amber-400")) : (e.classList.remove("border-red-500"), e.classList.add("border-slate-300"));
  }), document.querySelectorAll(".page-number-inhalts").forEach((e) => {
    e.classList.remove("text-red-600", "font-bold"), e.classList.add("text-slate-700", "font-semibold"), e.style.textDecoration = "", e.style.pointerEvents = "", e.classList.contains("bg-blue-50") ? e.classList.add("hover:bg-blue-100") : e.classList.contains("bg-amber-50") && e.classList.add("hover:bg-amber-100"), !e.classList.contains("bg-amber-50") && !e.classList.contains("bg-blue-50") && e.classList.add("bg-blue-50");
  }), document.querySelectorAll(".inhalts-entry").forEach((e) => {
    e.classList.add("hover:bg-slate-100"), e.style.cursor = "";
  }), document.querySelectorAll('.inhalts-entry a[href*="/"]').forEach((e) => {
    e.classList.remove("no-underline"), e.classList.contains("bg-blue-50") && e.classList.add("hover:bg-blue-100");
  });
  const t = [];
  n.forEach((e) => {
    const o = document.querySelector(
      `.page-number-inhalts[data-page-number="${e}"]`
    );
    if (o) {
      o.classList.remove(
        "text-slate-700",
        "hover:bg-blue-100",
        "hover:bg-amber-100"
      ), o.classList.add("text-red-600", "font-bold"), o.style.textDecoration = "none", o.style.pointerEvents = "none", t.push(o);
      const i = document.querySelector(`[data-page-container="${e}"]`);
      i && (i.classList.remove("border-slate-300", "border-amber-400"), i.classList.add("border-red-500"));
      const r = o.closest(".page-entry");
      r && (r.querySelectorAll(".inhalts-entry").forEach((s) => {
        s.classList.remove("hover:bg-slate-100"), s.style.cursor = "default";
      }), r.querySelectorAll('a[href*="/"]').forEach((s) => {
        s.getAttribute("aria-current") === "page" && (s.style.textDecoration = "none", s.style.pointerEvents = "none", s.classList.add("no-underline"), s.classList.remove("hover:bg-blue-100"));
      }));
    }
  }), t.length > 0 && H(t[0]), document.querySelectorAll(".page-indicator").forEach((e) => {
    e.classList.remove("text-red-600", "font-bold"), e.classList.add("text-slate-600", "font-semibold"), e.classList.contains("bg-amber-50") || e.classList.add("bg-blue-50");
  }), n.forEach((e) => {
    const o = document.querySelector(`.page-indicator[data-page="${e}"]`);
    o && (o.classList.remove("text-slate-600"), o.classList.add("text-red-600", "font-bold"));
  });
}
function H(n) {
  const t = n.closest(".lg\\:overflow-y-auto");
  if (t) {
    const e = t.getBoundingClientRect(), o = n.getBoundingClientRect(), i = o.top < e.top, r = o.bottom > e.bottom;
    (i || r) && n.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}
function R(n, t, e) {
  const o = document.getElementById("pageModal"), i = document.getElementById("modalImage");
  i.src = n.src, i.alt = n.alt, o.classList.remove("hidden"), C(t);
}
function I() {
  document.getElementById("pageModal").classList.add("hidden");
}
function $() {
  if (window.pageObserver && (window.pageObserver.disconnect(), window.pageObserver = null), window.currentPageContainers = Array.from(
    document.querySelectorAll(".newspaper-page-container")
  ), window.currentActiveIndex = 0, h(), document.querySelector(".newspaper-page-container")) {
    let t = /* @__PURE__ */ new Set();
    window.pageObserver = new IntersectionObserver(
      (e) => {
        if (e.forEach((o) => {
          const i = window.currentPageContainers.indexOf(o.target);
          i !== -1 && (o.isIntersecting ? t.add(i) : t.delete(i));
        }), t.size > 0) {
          const i = Array.from(t).sort((r, a) => r - a)[0];
          i !== window.currentActiveIndex && (window.currentActiveIndex = i, h());
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
function O() {
  if (window.currentActiveIndex > 0) {
    let n = -1;
    const t = [];
    window.currentPageContainers.forEach((o, i) => {
      const r = o.getBoundingClientRect(), a = window.innerHeight, s = Math.max(r.top, 0), l = Math.min(r.bottom, a), d = Math.max(0, l - s), g = r.height;
      d / g >= 0.3 && t.push(i);
    });
    const e = Math.min(...t);
    for (let o = e - 1; o >= 0; o--)
      if (!t.includes(o)) {
        n = o;
        break;
      }
    n === -1 && e > 0 && (n = e - 1), n >= 0 && (window.currentActiveIndex = n, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), setTimeout(() => {
      h();
    }, 100));
  }
}
function K() {
  if (window.currentActiveIndex < window.currentPageContainers.length - 1) {
    let n = -1;
    const t = [];
    window.currentPageContainers.forEach((o, i) => {
      const r = o.getBoundingClientRect(), a = window.innerHeight, s = Math.max(r.top, 0), l = Math.min(r.bottom, a), d = Math.max(0, l - s), g = r.height;
      d / g >= 0.3 && t.push(i);
    });
    const e = Math.max(...t);
    for (let o = e + 1; o < window.currentPageContainers.length; o++)
      if (!t.includes(o)) {
        n = o;
        break;
      }
    n === -1 && e < window.currentPageContainers.length - 1 && (n = e + 1), n >= 0 && n < window.currentPageContainers.length && (window.currentActiveIndex = n, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), setTimeout(() => {
      h();
    }, 100));
  }
}
function V() {
  if (P()) {
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
function P() {
  const n = [];
  window.currentPageContainers.forEach((t, e) => {
    const o = t.getBoundingClientRect(), i = window.innerHeight, r = Math.max(o.top, 0), a = Math.min(o.bottom, i), s = Math.max(0, a - r), l = o.height;
    s / l >= 0.3 && n.push(e);
  });
  for (const t of n) {
    const e = window.currentPageContainers[t];
    if (e && e.id && e.id.includes("beilage-"))
      return !0;
  }
  return !1;
}
function h() {
  const n = document.getElementById("prevPageBtn"), t = document.getElementById("nextPageBtn"), e = document.getElementById("beilageBtn");
  if (n && (window.currentActiveIndex <= 0 ? n.style.display = "none" : n.style.display = "flex"), t && (window.currentActiveIndex >= window.currentPageContainers.length - 1 ? t.style.display = "none" : t.style.display = "flex"), e) {
    const o = P(), i = e.querySelector("i");
    o ? (e.title = "Zur Hauptausgabe", e.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", i && (i.className = "ri-file-text-line text-lg lg:text-xl")) : (e.title = "Zu Beilage", e.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", i && (i.className = "ri-attachment-line text-lg lg:text-xl"));
  }
}
function D() {
  const n = document.getElementById("shareLinkBtn");
  let t = "";
  if (window.currentActiveIndex !== void 0 && window.currentPageContainers && window.currentPageContainers[window.currentActiveIndex]) {
    const i = window.currentPageContainers[window.currentActiveIndex].querySelector("[data-page]");
    i && (t = `#page-${i.getAttribute("data-page")}`);
  }
  const e = window.location.origin + window.location.pathname + t;
  navigator.share ? navigator.share({
    title: document.title,
    url: e
  }).catch((o) => {
    y(e, n);
  }) : y(e, n);
}
function y(n, t) {
  if (navigator.clipboard)
    navigator.clipboard.writeText(n).then(() => {
      c(t, "Link kopiert!");
    }).catch((e) => {
      c(t, "Kopieren fehlgeschlagen");
    });
  else {
    const e = document.createElement("textarea");
    e.value = n, document.body.appendChild(e), e.select();
    try {
      const o = document.execCommand("copy");
      c(t, o ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      c(t, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(e);
    }
  }
}
function Z() {
  const n = document.getElementById("citationBtn"), t = document.title || "KGPZ", e = window.location.href, o = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), i = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${t}. Digital verfügbar unter: ${e} (Zugriff: ${o}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(i).then(() => {
      c(n, "Zitation kopiert!");
    }).catch((r) => {
      c(n, "Kopieren fehlgeschlagen");
    });
  else {
    const r = document.createElement("textarea");
    r.value = i, document.body.appendChild(r), r.select();
    try {
      const a = document.execCommand("copy");
      c(n, a ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      c(n, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(r);
    }
  }
}
function c(n, t) {
  const e = document.querySelector(".simple-popup");
  e && e.remove();
  const o = document.createElement("div");
  o.className = "simple-popup", o.textContent = t, o.style.cssText = `
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
  const d = 120, g = 32;
  s + d > a && (s = i.right - d + 10), l + g > r && (l = i.top - g - 8), o.style.left = Math.max(5, s) + "px", o.style.top = Math.max(5, l) + "px", document.body.appendChild(o), setTimeout(() => {
    o.style.opacity = "1";
  }, 10), setTimeout(() => {
    o.style.opacity = "0", setTimeout(() => {
      o.parentNode && o.remove();
    }, 200);
  }, 2e3);
}
function v() {
  const n = window.location.hash;
  let t = "", e = null;
  if (n.startsWith("#page-")) {
    if (t = n.replace("#page-", ""), e = document.getElementById(`page-${t}`), !e) {
      const o = document.querySelectorAll(".newspaper-page-container[data-pages]");
      for (const i of o) {
        const r = i.getAttribute("data-pages");
        if (r && r.split(",").includes(t)) {
          e = i;
          break;
        }
      }
    }
    e || (e = document.getElementById(`beilage-1-page-${t}`) || document.getElementById(`beilage-2-page-${t}`) || document.querySelector(`[id*="beilage"][id*="page-${t}"]`));
  } else if (n.startsWith("#beilage-")) {
    const o = n.match(/#beilage-(\d+)-page-(\d+)/);
    if (o) {
      const i = o[1];
      t = o[2], e = document.getElementById(`beilage-${i}-page-${t}`);
    }
  }
  e && t && setTimeout(() => {
    e.scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), C(t);
  }, 300);
}
function z(n, t, e = !1) {
  let o = "";
  e ? o = `#beilage-1-page-${n}` : o = `#page-${n}`;
  const i = window.location.origin + window.location.pathname + o;
  if (navigator.clipboard)
    navigator.clipboard.writeText(i).then(() => {
      c(t, "Link kopiert!");
    }).catch((r) => {
      c(t, "Kopieren fehlgeschlagen");
    });
  else {
    const r = document.createElement("textarea");
    r.value = i, document.body.appendChild(r), r.select();
    try {
      const a = document.execCommand("copy");
      c(t, a ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      c(t, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(r);
    }
  }
}
function _(n, t) {
  const e = document.title || "KGPZ", o = `${window.location.origin}${window.location.pathname}#page-${n}`, i = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), r = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${e}, Seite ${n}. Digital verfügbar unter: ${o} (Zugriff: ${i}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(r).then(() => {
      c(t, "Zitation kopiert!");
    }).catch((a) => {
      c(t, "Kopieren fehlgeschlagen");
    });
  else {
    const a = document.createElement("textarea");
    a.value = r, document.body.appendChild(a), a.select();
    try {
      const s = document.execCommand("copy");
      c(t, s ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      c(t, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(a);
    }
  }
}
function p() {
  B(), $(), window.addEventListener("scroll", function() {
    clearTimeout(window.scrollTimeout), window.scrollTimeout = setTimeout(() => {
      x(), h();
    }, 50);
  }), v(), window.addEventListener("hashchange", v), document.addEventListener("keydown", function(n) {
    n.key === "Escape" && I();
  });
}
window.enlargePage = R;
window.closeModal = I;
window.scrollToPreviousPage = O;
window.scrollToNextPage = K;
window.scrollToBeilage = V;
window.shareCurrentPage = D;
window.generateCitation = Z;
window.copyPagePermalink = z;
window.generatePageCitation = _;
function F() {
  b(), L(), document.querySelector(".newspaper-page-container") && p(), htmx.on("htmx:load", function(n) {
    b();
  }), document.body.addEventListener("htmx:afterSwap", function(n) {
    setTimeout(() => {
      document.querySelector(".newspaper-page-container") && p();
    }, 100);
  }), document.body.addEventListener("htmx:afterSettle", function(n) {
    setTimeout(() => {
      document.querySelector(".newspaper-page-container") && p();
    }, 200);
  }), document.body.addEventListener("htmx:load", function(n) {
    setTimeout(() => {
      document.querySelector(".newspaper-page-container") && p();
    }, 100);
  });
}
export {
  F as setup
};
