const L = "script[xslt-onload]", w = "xslt-template", E = "xslt-transformed", y = /* @__PURE__ */ new Map();
function v() {
  let o = htmx.findAll(L);
  for (let t of o)
    q(t);
}
function q(o) {
  if (o.getAttribute(E) === "true" || !o.hasAttribute(w))
    return;
  let t = "#" + o.getAttribute(w), e = y.get(t);
  if (!e) {
    let a = htmx.find(t);
    if (a) {
      let s = a.innerHTML ? new DOMParser().parseFromString(a.innerHTML, "application/xml") : a.contentDocument;
      e = new XSLTProcessor(), e.importStylesheet(s), y.set(t, e);
    } else
      throw new Error("Unknown XSLT template: " + t);
  }
  let n = new DOMParser().parseFromString(o.innerHTML, "application/xml"), i = e.transformToFragment(n, document), r = new XMLSerializer().serializeToString(i);
  o.outerHTML = r;
}
function k() {
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
  const o = document.querySelectorAll(".newspaper-page-container");
  window.highlightObserver = new IntersectionObserver(
    (t) => {
      C();
    },
    {
      rootMargin: "-20% 0px -70% 0px"
    }
  ), o.forEach((t) => {
    window.highlightObserver.observe(t);
  });
}
function C() {
  const o = [];
  document.querySelectorAll(".newspaper-page-container").forEach((e) => {
    const n = e.getBoundingClientRect(), i = window.innerHeight, r = Math.max(n.top, 0), a = Math.min(n.bottom, i), s = Math.max(0, a - r), l = n.height, g = s / l >= 0.5, u = e.querySelector("img[data-page]"), f = u ? u.getAttribute("data-page") : "unknown";
    g && u && f && !o.includes(f) && o.push(f);
  }), M(o), o.length > 0 && I(o);
}
function M(o) {
  document.querySelectorAll(".continuation-entry").forEach((t) => {
    t.style.display = "none";
  }), o.forEach((t) => {
    const e = document.querySelector(`[data-page-container="${t}"]`);
    e && e.querySelectorAll(".continuation-entry").forEach((i) => {
      i.style.display = "";
    });
  }), H(o), N();
}
function H(o) {
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
function N() {
  document.querySelectorAll(".page-entry").forEach((o) => {
    const t = o.querySelectorAll(".inhalts-entry");
    let e = !1;
    t.forEach((n) => {
      window.getComputedStyle(n).display !== "none" && (e = !0);
    }), e ? o.style.display = "" : o.style.display = "none";
  });
}
function S(o) {
  I([o]);
}
function I(o) {
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
      n.classList.remove(
        "text-slate-700",
        "hover:bg-blue-100",
        "hover:bg-amber-100"
      ), n.classList.add("text-red-600", "font-bold"), n.style.textDecoration = "none", n.style.pointerEvents = "none", t.push(n);
      const i = document.querySelector(`[data-page-container="${e}"]`);
      i && (i.classList.remove("border-slate-300", "border-amber-400"), i.classList.add("border-red-500"));
      const r = n.closest(".page-entry");
      r && (r.querySelectorAll(".inhalts-entry").forEach((s) => {
        s.classList.remove("hover:bg-slate-100"), s.style.cursor = "default";
      }), r.querySelectorAll('a[href*="/"]').forEach((s) => {
        s.getAttribute("aria-current") === "page" && (s.style.textDecoration = "none", s.style.pointerEvents = "none", s.classList.add("no-underline"), s.classList.remove("hover:bg-blue-100"));
      }));
    }
  }), t.length > 0 && $(t[0]), document.querySelectorAll(".page-indicator").forEach((e) => {
    e.classList.remove("text-red-600", "font-bold"), e.classList.add("text-slate-600", "font-semibold"), e.classList.contains("bg-amber-50") || e.classList.add("bg-blue-50");
  }), o.forEach((e) => {
    const n = document.querySelector(`.page-indicator[data-page="${e}"]`);
    n && (n.classList.remove("text-slate-600"), n.classList.add("text-red-600", "font-bold"));
  });
}
function $(o) {
  const t = o.closest(".lg\\:overflow-y-auto");
  if (t) {
    const e = t.getBoundingClientRect(), n = o.getBoundingClientRect(), i = n.top < e.top, r = n.bottom > e.bottom;
    (i || r) && o.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}
function R(o, t, e) {
  let n = document.querySelector("single-page-viewer");
  n || (n = document.createElement("single-page-viewer"), document.body.appendChild(n));
  const i = o.closest('[data-beilage="true"]') !== null;
  n.show(o.src, o.alt, t, i);
}
function T() {
  document.getElementById("pageModal").classList.add("hidden");
}
function O() {
  if (window.pageObserver && (window.pageObserver.disconnect(), window.pageObserver = null), window.currentPageContainers = Array.from(
    document.querySelectorAll(".newspaper-page-container")
  ), window.currentActiveIndex = 0, p(), document.querySelector(".newspaper-page-container")) {
    let t = /* @__PURE__ */ new Set();
    window.pageObserver = new IntersectionObserver(
      (e) => {
        if (e.forEach((n) => {
          const i = window.currentPageContainers.indexOf(n.target);
          i !== -1 && (n.isIntersecting ? t.add(i) : t.delete(i));
        }), t.size > 0) {
          const i = Array.from(t).sort((r, a) => r - a)[0];
          i !== window.currentActiveIndex && (window.currentActiveIndex = i, p());
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
function K() {
  if (window.currentActiveIndex > 0) {
    let o = -1;
    const t = [];
    window.currentPageContainers.forEach((n, i) => {
      const r = n.getBoundingClientRect(), a = window.innerHeight, s = Math.max(r.top, 0), l = Math.min(r.bottom, a), c = Math.max(0, l - s), g = r.height;
      c / g >= 0.3 && t.push(i);
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
      p();
    }, 100));
  }
}
function V() {
  if (window.currentActiveIndex < window.currentPageContainers.length - 1) {
    let o = -1;
    const t = [];
    window.currentPageContainers.forEach((n, i) => {
      const r = n.getBoundingClientRect(), a = window.innerHeight, s = Math.max(r.top, 0), l = Math.min(r.bottom, a), c = Math.max(0, l - s), g = r.height;
      c / g >= 0.3 && t.push(i);
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
      p();
    }, 100));
  }
}
function z() {
  if (A()) {
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
function A() {
  const o = [];
  window.currentPageContainers.forEach((t, e) => {
    const n = t.getBoundingClientRect(), i = window.innerHeight, r = Math.max(n.top, 0), a = Math.min(n.bottom, i), s = Math.max(0, a - r), l = n.height;
    s / l >= 0.3 && o.push(e);
  });
  for (const t of o) {
    const e = window.currentPageContainers[t];
    if (e && e.id && e.id.includes("beilage-"))
      return !0;
  }
  return !1;
}
function p() {
  const o = document.getElementById("prevPageBtn"), t = document.getElementById("nextPageBtn"), e = document.getElementById("beilageBtn");
  if (o && (window.currentActiveIndex <= 0 ? o.style.display = "none" : o.style.display = "flex"), t && (window.currentActiveIndex >= window.currentPageContainers.length - 1 ? t.style.display = "none" : t.style.display = "flex"), e) {
    const n = A(), i = e.querySelector("i");
    n ? (e.title = "Zur Hauptausgabe", e.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", i && (i.className = "ri-file-text-line text-lg lg:text-xl")) : (e.title = "Zu Beilage", e.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", i && (i.className = "ri-attachment-line text-lg lg:text-xl"));
  }
}
function j() {
  const o = document.getElementById("shareLinkBtn");
  let t = "";
  if (window.currentActiveIndex !== void 0 && window.currentPageContainers && window.currentPageContainers[window.currentActiveIndex]) {
    const i = window.currentPageContainers[window.currentActiveIndex].querySelector("[data-page]");
    i && (t = `#page-${i.getAttribute("data-page")}`);
  }
  const e = window.location.origin + window.location.pathname + t;
  navigator.share ? navigator.share({
    title: document.title,
    url: e
  }).catch((n) => {
    x(e, o);
  }) : x(e, o);
}
function x(o, t) {
  if (navigator.clipboard)
    navigator.clipboard.writeText(o).then(() => {
      d(t, "Link kopiert!");
    }).catch((e) => {
      d(t, "Kopieren fehlgeschlagen");
    });
  else {
    const e = document.createElement("textarea");
    e.value = o, document.body.appendChild(e), e.select();
    try {
      const n = document.execCommand("copy");
      d(t, n ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      d(t, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(e);
    }
  }
}
function D() {
  const o = document.getElementById("citationBtn"), t = document.title || "KGPZ", e = window.location.href, n = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), i = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${t}. Digital verfügbar unter: ${e} (Zugriff: ${n}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(i).then(() => {
      d(o, "Zitation kopiert!");
    }).catch((r) => {
      d(o, "Kopieren fehlgeschlagen");
    });
  else {
    const r = document.createElement("textarea");
    r.value = i, document.body.appendChild(r), r.select();
    try {
      const a = document.execCommand("copy");
      d(o, a ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      d(o, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(r);
    }
  }
}
function d(o, t) {
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
  const i = o.getBoundingClientRect(), r = window.innerHeight, a = window.innerWidth;
  let s = i.left - 10, l = i.bottom + 8;
  const c = 120, g = 32;
  s + c > a && (s = i.right - c + 10), l + g > r && (l = i.top - g - 8), n.style.left = Math.max(5, s) + "px", n.style.top = Math.max(5, l) + "px", document.body.appendChild(n), setTimeout(() => {
    n.style.opacity = "1";
  }, 10), setTimeout(() => {
    n.style.opacity = "0", setTimeout(() => {
      n.parentNode && n.remove();
    }, 200);
  }, 2e3);
}
function P() {
  const o = window.location.hash;
  let t = "", e = null;
  if (o.startsWith("#page-")) {
    if (t = o.replace("#page-", ""), e = document.getElementById(`page-${t}`), !e) {
      const n = document.querySelectorAll(".newspaper-page-container[data-pages]");
      for (const i of n) {
        const r = i.getAttribute("data-pages");
        if (r && r.split(",").includes(t)) {
          e = i;
          break;
        }
      }
    }
    e || (e = document.getElementById(`beilage-1-page-${t}`) || document.getElementById(`beilage-2-page-${t}`) || document.querySelector(`[id*="beilage"][id*="page-${t}"]`));
  } else if (o.startsWith("#beilage-")) {
    const n = o.match(/#beilage-(\d+)-page-(\d+)/);
    if (n) {
      const i = n[1];
      t = n[2], e = document.getElementById(`beilage-${i}-page-${t}`);
    }
  }
  e && t && setTimeout(() => {
    e.scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), S(t);
  }, 300);
}
function b(o, t, e = !1) {
  let n = "";
  e ? n = `#beilage-1-page-${o}` : n = `#page-${o}`;
  const i = window.location.origin + window.location.pathname + n;
  if (navigator.clipboard)
    navigator.clipboard.writeText(i).then(() => {
      d(t, "Link kopiert!");
    }).catch((r) => {
      d(t, "Kopieren fehlgeschlagen");
    });
  else {
    const r = document.createElement("textarea");
    r.value = i, document.body.appendChild(r), r.select();
    try {
      const a = document.execCommand("copy");
      d(t, a ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      d(t, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(r);
    }
  }
}
function m(o, t) {
  const e = document.title || "KGPZ", n = `${window.location.origin}${window.location.pathname}#page-${o}`, i = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), r = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${e}, Seite ${o}. Digital verfügbar unter: ${n} (Zugriff: ${i}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(r).then(() => {
      d(t, "Zitation kopiert!");
    }).catch((a) => {
      d(t, "Kopieren fehlgeschlagen");
    });
  else {
    const a = document.createElement("textarea");
    a.value = r, document.body.appendChild(a), a.select();
    try {
      const s = document.execCommand("copy");
      d(t, s ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      d(t, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(a);
    }
  }
}
function h() {
  B(), O(), window.addEventListener("scroll", function() {
    clearTimeout(window.scrollTimeout), window.scrollTimeout = setTimeout(() => {
      C(), p();
    }, 50);
  }), P(), window.addEventListener("hashchange", P), document.addEventListener("keydown", function(o) {
    o.key === "Escape" && T();
  });
}
window.enlargePage = R;
window.closeModal = T;
window.scrollToPreviousPage = K;
window.scrollToNextPage = V;
window.scrollToBeilage = z;
window.shareCurrentPage = j;
window.generateCitation = D;
window.copyPagePermalink = b;
window.generatePageCitation = m;
function _() {
  v(), k(), document.querySelector(".newspaper-page-container") && h(), htmx.on("htmx:load", function(o) {
    v();
  }), document.body.addEventListener("htmx:afterSwap", function(o) {
    setTimeout(() => {
      document.querySelector(".newspaper-page-container") && h();
    }, 100);
  }), document.body.addEventListener("htmx:afterSettle", function(o) {
    setTimeout(() => {
      document.querySelector(".newspaper-page-container") && h();
    }, 200);
  }), document.body.addEventListener("htmx:load", function(o) {
    setTimeout(() => {
      document.querySelector(".newspaper-page-container") && h();
    }, 100);
  });
}
class Z extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.innerHTML = `
			<div class="fixed inset-0 z-50 flex pointer-events-none">
				<!-- Keep Inhaltsverzeichnis area empty/transparent (collapsible) -->
				<div id="sidebar-spacer" class="lg:w-1/4 xl:w-1/5 flex-shrink-0 transition-all duration-300"></div>

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
									<i class="ri-sidebar-unfold-line text-lg font-bold"></i>
								</button>

								<!-- Page indicator with icon -->
								<div id="page-indicator" class="text-slate-800 flex items-center gap-3">
									<span id="page-icon" class="text-lg"></span>
									<span id="page-number" class="text-2xl font-serif font-bold"></span>
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
		`;
  }
  show(t, e, n, i = !1) {
    const r = this.querySelector("#single-page-image"), a = this.querySelector("#page-number"), s = this.querySelector("#page-icon");
    this.querySelector("#page-indicator"), r.src = t, r.alt = e, this.currentPageNumber = n, this.currentIsBeilage = i, a.textContent = n;
    const l = this.determinePageIconType(n, i);
    s.innerHTML = this.getPageIconHTML(l), this.updateNavigationButtons(), this.style.display = "block", document.body.style.overflow = "hidden", S(n);
  }
  close() {
    this.style.display = "none", document.body.style.overflow = "";
  }
  // Clean up component completely
  destroy() {
    document.body.style.overflow = "", this.parentNode && this.parentNode.removeChild(this);
  }
  // Determine page icon type based on page position and whether it's beilage
  determinePageIconType(t, e) {
    const n = e ? '.newspaper-page-container[data-beilage="true"]' : ".newspaper-page-container:not([data-beilage])", r = Array.from(document.querySelectorAll(n)).map((l) => {
      const c = l.getAttribute("data-page-container");
      return c ? parseInt(c) : null;
    }).filter((l) => l !== null).sort((l, c) => l - c);
    if (r.length === 0)
      return "first";
    const a = r[0], s = r[r.length - 1];
    return t === a ? "first" : t === s ? "last" : t === a + 1 ? "even" : t === s - 1 ? "odd" : t % 2 === 0 ? "even" : "odd";
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
    if (typeof b == "function") {
      const t = this.querySelector("#share-btn");
      b(this.currentPageNumber, t, this.currentIsBeilage);
    }
  }
  // Generate citation for current page
  generatePageCitation() {
    if (typeof m == "function") {
      const t = this.querySelector("#cite-btn");
      m(this.currentPageNumber, t);
    }
  }
  // Update navigation button visibility based on available pages
  updateNavigationButtons() {
    const t = this.querySelector("#prev-page-btn"), e = this.querySelector("#next-page-btn"), { prevPage: n, nextPage: i } = this.getAdjacentPages();
    n !== null ? (t.disabled = !1, t.className = t.className.replace("opacity-50 cursor-not-allowed", ""), t.className = t.className.replace("bg-gray-50 text-gray-400", "bg-gray-100 text-gray-700")) : (t.disabled = !0, t.className.includes("opacity-50") || (t.className += " opacity-50 cursor-not-allowed"), t.className = t.className.replace("bg-gray-100 text-gray-700", "bg-gray-50 text-gray-400")), i !== null ? (e.disabled = !1, e.className = e.className.replace("opacity-50 cursor-not-allowed", ""), e.className = e.className.replace("bg-gray-50 text-gray-400", "bg-gray-100 text-gray-700")) : (e.disabled = !0, e.className.includes("opacity-50") || (e.className += " opacity-50 cursor-not-allowed"), e.className = e.className.replace("bg-gray-100 text-gray-700", "bg-gray-50 text-gray-400"));
  }
  // Get previous and next page numbers
  getAdjacentPages() {
    let t;
    this.currentIsBeilage ? t = '.newspaper-page-container[data-beilage="true"]' : t = ".newspaper-page-container:not([data-beilage])";
    const e = Array.from(document.querySelectorAll(t));
    console.log("Found containers:", e.length, "for", this.currentIsBeilage ? "beilage" : "main");
    const n = e.map((s) => {
      const l = s.getAttribute("data-page-container"), c = l ? parseInt(l) : null;
      return console.log("Container page:", l, "parsed:", c), c;
    }).filter((s) => s !== null).sort((s, l) => s - l);
    console.log("All pages found:", n), console.log("Current page:", this.currentPageNumber);
    const i = n.indexOf(this.currentPageNumber);
    console.log("Current index:", i);
    let r = null, a = null;
    return i > 0 && (r = n[i - 1]), i < n.length - 1 && (a = n[i + 1]), console.log("Adjacent pages - prev:", r, "next:", a), { prevPage: r, nextPage: a };
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
    const e = this.currentIsBeilage ? '.newspaper-page-container[data-beilage="true"]' : ".newspaper-page-container:not([data-beilage])", n = document.querySelector(`${e}[data-page-container="${t}"]`);
    if (n) {
      const i = n.querySelector(".newspaper-page-image");
      i && this.show(i.src, i.alt, t, this.currentIsBeilage);
    }
  }
  // Toggle sidebar visibility
  toggleSidebar() {
    const t = this.querySelector("#sidebar-spacer"), e = this.querySelector("#sidebar-toggle-btn"), n = e.querySelector("i"), i = t.classList.contains("w-0");
    console.log("Current state - isCollapsed:", i), console.log("Current classes:", t.className), i ? (t.classList.remove("w-0"), t.classList.add("lg:w-1/4", "xl:w-1/5"), e.className = "w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", n.className = "ri-sidebar-unfold-line text-lg font-bold", e.title = "Inhaltsverzeichnis ausblenden", console.log("Expanding sidebar")) : (t.classList.remove("lg:w-1/4", "xl:w-1/5"), t.classList.add("w-0"), e.className = "w-10 h-10 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", n.className = "ri-sidebar-fold-line text-lg font-bold", e.title = "Inhaltsverzeichnis einblenden", console.log("Collapsing sidebar")), console.log("New classes:", t.className);
  }
}
customElements.define("single-page-viewer", Z);
document.body.addEventListener("htmx:beforeRequest", function(o) {
  const t = document.querySelector("single-page-viewer");
  t && t.style.display !== "none" && (console.log("Cleaning up single page viewer before HTMX navigation"), t.destroy());
});
window.addEventListener("beforeunload", function() {
  const o = document.querySelector("single-page-viewer");
  o && o.destroy();
});
export {
  _ as setup
};
