const A = "script[xslt-onload]", w = "xslt-template", E = "xslt-transformed", y = /* @__PURE__ */ new Map();
function v() {
  let i = htmx.findAll(A);
  for (let t of i)
    L(t);
}
function L(i) {
  if (i.getAttribute(E) === "true" || !i.hasAttribute(w))
    return;
  let t = "#" + i.getAttribute(w), e = y.get(t);
  if (!e) {
    let s = htmx.find(t);
    if (s) {
      let a = s.innerHTML ? new DOMParser().parseFromString(s.innerHTML, "application/xml") : s.contentDocument;
      e = new XSLTProcessor(), e.importStylesheet(a), y.set(t, e);
    } else
      throw new Error("Unknown XSLT template: " + t);
  }
  let n = new DOMParser().parseFromString(i.innerHTML, "application/xml"), o = e.transformToFragment(n, document), r = new XMLSerializer().serializeToString(o);
  i.outerHTML = r;
}
function q() {
  document.querySelectorAll("template[simple]").forEach((t) => {
    let e = t.getAttribute("id"), n = t.content;
    customElements.define(
      e,
      class extends HTMLElement {
        constructor() {
          super(), this.appendChild(n.cloneNode(!0)), this.slots = this.querySelectorAll("slot");
        }
        connectedCallback() {
          let o = [];
          this.slots.forEach((r) => {
            let s = r.getAttribute("name"), a = this.querySelector(`[slot="${s}"]`);
            a && (r.replaceWith(a.cloneNode(!0)), o.push(a));
          }), o.forEach((r) => {
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
function $() {
  window.highlightObserver && (window.highlightObserver.disconnect(), window.highlightObserver = null);
  const i = document.querySelectorAll(".newspaper-page-container");
  window.highlightObserver = new IntersectionObserver(
    (t) => {
      P();
    },
    {
      rootMargin: "-20% 0px -70% 0px"
    }
  ), i.forEach((t) => {
    window.highlightObserver.observe(t);
  });
}
function P() {
  const i = [];
  document.querySelectorAll(".newspaper-page-container").forEach((e) => {
    const n = e.getBoundingClientRect(), o = window.innerHeight, r = Math.max(n.top, 0), s = Math.min(n.bottom, o), a = Math.max(0, s - r), l = n.height, g = a / l >= 0.5, u = e.querySelector("img[data-page]"), p = u ? u.getAttribute("data-page") : "unknown";
    g && u && p && !i.includes(p) && i.push(p);
  }), k(i), i.length > 0 && C(i);
}
function k(i) {
  document.querySelectorAll(".continuation-entry").forEach((t) => {
    t.style.display = "none";
  }), i.forEach((t) => {
    const e = document.querySelector(`[data-page-container="${t}"]`);
    e && e.querySelectorAll(".continuation-entry").forEach((o) => {
      o.style.display = "";
    });
  }), B(i), M();
}
function B(i) {
  document.querySelectorAll(".work-title").forEach((t) => {
    const e = t.getAttribute("data-short-title");
    e && (t.textContent = e);
  }), i.forEach((t) => {
    const e = document.querySelector(`[data-page-container="${t}"]`);
    e && e.querySelectorAll(".work-title").forEach((o) => {
      const r = o.getAttribute("data-full-title");
      r && r !== o.getAttribute("data-short-title") && (o.textContent = r);
    });
  });
}
function M() {
  document.querySelectorAll(".page-entry").forEach((i) => {
    const t = i.querySelectorAll(".inhalts-entry");
    let e = !1;
    t.forEach((n) => {
      window.getComputedStyle(n).display !== "none" && (e = !0);
    }), e ? i.style.display = "" : i.style.display = "none";
  });
}
function S(i) {
  C([i]);
}
function C(i) {
  console.log("markCurrentPagesInInhaltsverzeichnis called with:", i), document.querySelectorAll("[data-page-container]").forEach((e) => {
    e.hasAttribute("data-beilage") ? (e.classList.remove("border-red-500"), e.classList.add("border-amber-400")) : (e.classList.remove("border-red-500"), e.classList.add("border-slate-300"));
  }), document.querySelectorAll(".page-number-inhalts").forEach((e) => {
    e.classList.remove("text-red-600", "font-bold"), e.classList.add("text-slate-700", "font-semibold"), e.style.textDecoration = "", e.style.pointerEvents = "", e.classList.contains("bg-blue-50") ? e.classList.add("hover:bg-blue-100") : e.classList.contains("bg-amber-50") && e.classList.add("hover:bg-amber-100"), !e.classList.contains("bg-amber-50") && !e.classList.contains("bg-blue-50") && e.classList.add("bg-blue-50");
  }), document.querySelectorAll(".inhalts-entry").forEach((e) => {
    e.classList.add("hover:bg-slate-100"), e.style.cursor = "";
  }), document.querySelectorAll('.inhalts-entry a[href*="/"]').forEach((e) => {
    e.classList.remove("no-underline"), e.classList.contains("bg-blue-50") && e.classList.add("hover:bg-blue-100");
  });
  const t = [];
  i.forEach((e) => {
    const n = document.querySelector(
      `.page-number-inhalts[data-page-number="${e}"]`
    );
    if (n) {
      n.classList.remove("text-slate-700", "hover:bg-blue-100", "hover:bg-amber-100"), n.classList.add("text-red-600", "font-bold"), n.style.textDecoration = "none", n.style.pointerEvents = "none", t.push(n);
      const o = document.querySelector(`[data-page-container="${e}"]`);
      o && (o.classList.remove("border-slate-300", "border-amber-400"), o.classList.add("border-red-500"));
      const r = n.closest(".page-entry");
      r && (r.querySelectorAll(".inhalts-entry").forEach((a) => {
        a.classList.remove("hover:bg-slate-100"), a.style.cursor = "default";
      }), r.querySelectorAll('a[href*="/"]').forEach((a) => {
        a.getAttribute("aria-current") === "page" && (a.style.textDecoration = "none", a.style.pointerEvents = "none", a.classList.add("no-underline"), a.classList.remove("hover:bg-blue-100"));
      }));
    }
  }), t.length > 0 && N(t[0]), document.querySelectorAll(".page-indicator").forEach((e) => {
    e.classList.remove("text-red-600", "font-bold"), e.classList.add("text-slate-600", "font-semibold"), e.classList.contains("bg-amber-50") || e.classList.add("bg-blue-50");
  }), i.forEach((e) => {
    const n = document.querySelector(`.page-indicator[data-page="${e}"]`);
    n && (n.classList.remove("text-slate-600"), n.classList.add("text-red-600", "font-bold"));
  });
}
function N(i) {
  const t = i.closest(".lg\\:overflow-y-auto");
  if (t) {
    const e = t.getBoundingClientRect(), n = i.getBoundingClientRect(), o = n.top < e.top, r = n.bottom > e.bottom;
    (o || r) && i.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}
function H(i, t, e, n = null) {
  let o = document.querySelector("single-page-viewer");
  o || (o = document.createElement("single-page-viewer"), document.body.appendChild(o));
  const r = i.closest('[data-beilage="true"]') !== null, s = window.templateData && window.templateData.targetPage ? window.templateData.targetPage : 0;
  o.show(i.src, i.alt, t, r, s, n);
}
function I() {
  document.getElementById("pageModal").classList.add("hidden");
}
function O() {
  if (window.pageObserver && (window.pageObserver.disconnect(), window.pageObserver = null), window.currentPageContainers = Array.from(document.querySelectorAll(".newspaper-page-container")), window.currentActiveIndex = 0, h(), document.querySelector(".newspaper-page-container")) {
    let t = /* @__PURE__ */ new Set();
    window.pageObserver = new IntersectionObserver(
      (e) => {
        if (e.forEach((n) => {
          const o = window.currentPageContainers.indexOf(n.target);
          o !== -1 && (n.isIntersecting ? t.add(o) : t.delete(o));
        }), t.size > 0) {
          const o = Array.from(t).sort((r, s) => r - s)[0];
          o !== window.currentActiveIndex && (window.currentActiveIndex = o, h());
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
function R() {
  if (window.currentActiveIndex > 0) {
    let i = -1;
    const t = [];
    window.currentPageContainers.forEach((n, o) => {
      const r = n.getBoundingClientRect(), s = window.innerHeight, a = Math.max(r.top, 0), l = Math.min(r.bottom, s), c = Math.max(0, l - a), g = r.height;
      c / g >= 0.3 && t.push(o);
    });
    const e = Math.min(...t);
    for (let n = e - 1; n >= 0; n--)
      if (!t.includes(n)) {
        i = n;
        break;
      }
    i === -1 && e > 0 && (i = e - 1), i >= 0 && (window.currentActiveIndex = i, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), setTimeout(() => {
      h();
    }, 100));
  }
}
function z() {
  if (window.currentActiveIndex < window.currentPageContainers.length - 1) {
    let i = -1;
    const t = [];
    window.currentPageContainers.forEach((n, o) => {
      const r = n.getBoundingClientRect(), s = window.innerHeight, a = Math.max(r.top, 0), l = Math.min(r.bottom, s), c = Math.max(0, l - a), g = r.height;
      c / g >= 0.3 && t.push(o);
    });
    const e = Math.max(...t);
    for (let n = e + 1; n < window.currentPageContainers.length; n++)
      if (!t.includes(n)) {
        i = n;
        break;
      }
    i === -1 && e < window.currentPageContainers.length - 1 && (i = e + 1), i >= 0 && i < window.currentPageContainers.length && (window.currentActiveIndex = i, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), setTimeout(() => {
      h();
    }, 100));
  }
}
function D() {
  if (T()) {
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
function T() {
  const i = [];
  window.currentPageContainers.forEach((t, e) => {
    const n = t.getBoundingClientRect(), o = window.innerHeight, r = Math.max(n.top, 0), s = Math.min(n.bottom, o), a = Math.max(0, s - r), l = n.height;
    a / l >= 0.3 && i.push(e);
  });
  for (const t of i) {
    const e = window.currentPageContainers[t];
    if (e && e.id && e.id.includes("beilage-"))
      return !0;
  }
  return !1;
}
function h() {
  const i = document.getElementById("prevPageBtn"), t = document.getElementById("nextPageBtn"), e = document.getElementById("beilageBtn");
  if (i && (window.currentActiveIndex <= 0 ? i.style.display = "none" : i.style.display = "flex"), t && (window.currentActiveIndex >= window.currentPageContainers.length - 1 ? t.style.display = "none" : t.style.display = "flex"), e) {
    const n = T(), o = e.querySelector("i");
    n ? (e.title = "Zur Hauptausgabe", e.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", o && (o.className = "ri-file-text-line text-lg lg:text-xl")) : (e.title = "Zu Beilage", e.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", o && (o.className = "ri-attachment-line text-lg lg:text-xl"));
  }
}
function K() {
  const i = document.getElementById("shareLinkBtn");
  let t = "";
  if (window.currentActiveIndex !== void 0 && window.currentPageContainers && window.currentPageContainers[window.currentActiveIndex]) {
    const o = window.currentPageContainers[window.currentActiveIndex].querySelector("[data-page]");
    o && (t = `/${o.getAttribute("data-page")}`);
  }
  const e = window.location.origin + window.location.pathname + t;
  navigator.share ? navigator.share({
    title: document.title,
    url: e
  }).catch((n) => {
    x(e, i);
  }) : x(e, i);
}
function x(i, t) {
  if (navigator.clipboard)
    navigator.clipboard.writeText(i).then(() => {
      d(t, "Link kopiert!");
    }).catch((e) => {
      d(t, "Kopieren fehlgeschlagen");
    });
  else {
    const e = document.createElement("textarea");
    e.value = i, document.body.appendChild(e), e.select();
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
function V() {
  const i = document.getElementById("citationBtn"), t = document.title || "KGPZ";
  let e = window.location.origin + window.location.pathname;
  e.includes("#") && (e = e.split("#")[0]);
  const n = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), o = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${t}. Digital verfügbar unter: ${e} (Zugriff: ${n}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(o).then(() => {
      d(i, "Zitation kopiert!");
    }).catch((r) => {
      d(i, "Kopieren fehlgeschlagen");
    });
  else {
    const r = document.createElement("textarea");
    r.value = o, document.body.appendChild(r), r.select();
    try {
      const s = document.execCommand("copy");
      d(i, s ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      d(i, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(r);
    }
  }
}
function d(i, t) {
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
  const o = i.getBoundingClientRect(), r = window.innerHeight, s = window.innerWidth;
  let a = o.left - 10, l = o.bottom + 8;
  const c = 120, g = 32;
  a + c > s && (a = o.right - c + 10), l + g > r && (l = o.top - g - 8), n.style.left = Math.max(5, a) + "px", n.style.top = Math.max(5, l) + "px", document.body.appendChild(n), setTimeout(() => {
    n.style.opacity = "1";
  }, 10), setTimeout(() => {
    n.style.opacity = "0", setTimeout(() => {
      n.parentNode && n.remove();
    }, 200);
  }, 2e3);
}
function j() {
  let i = "", t = null;
  const e = window.location.pathname.split("/");
  if (e.length >= 4 && !isNaN(e[e.length - 1])) {
    if (i = e[e.length - 1], t = document.getElementById(`page-${i}`), !t) {
      const n = document.querySelectorAll(".newspaper-page-container[data-pages]");
      for (const o of n) {
        const r = o.getAttribute("data-pages");
        if (r && r.split(",").includes(i)) {
          t = o;
          break;
        }
      }
    }
    t || (t = document.getElementById(`beilage-1-page-${i}`) || document.getElementById(`beilage-2-page-${i}`) || document.querySelector(`[id*="beilage"][id*="page-${i}"]`));
  }
  t && i && setTimeout(() => {
    t.scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), S(i);
  }, 300);
}
function b(i, t, e = !1) {
  let n = "";
  if (e)
    n = window.location.origin + window.location.pathname + `#beilage-1-page-${i}`;
  else {
    const r = window.location.pathname.split("/");
    if (r.length >= 3) {
      const s = r[1], a = r[2];
      n = `${window.location.origin}/${s}/${a}/${i}`;
    } else
      n = window.location.origin + window.location.pathname + `/${i}`;
  }
  const o = n;
  if (navigator.clipboard)
    navigator.clipboard.writeText(o).then(() => {
      d(t, "Link kopiert!");
    }).catch((r) => {
      d(t, "Kopieren fehlgeschlagen");
    });
  else {
    const r = document.createElement("textarea");
    r.value = o, document.body.appendChild(r), r.select();
    try {
      const s = document.execCommand("copy");
      d(t, s ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      d(t, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(r);
    }
  }
}
function m(i, t) {
  const e = document.title || "KGPZ", n = window.location.pathname.split("/");
  let o;
  if (n.length >= 3) {
    const l = n[1], c = n[2];
    o = `${window.location.origin}/${l}/${c}/${i}`;
  } else
    o = `${window.location.origin}${window.location.pathname}/${i}`;
  const r = o, s = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), a = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${e}, Seite ${i}. Digital verfügbar unter: ${r} (Zugriff: ${s}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(a).then(() => {
      d(t, "Zitation kopiert!");
    }).catch((l) => {
      d(t, "Kopieren fehlgeschlagen");
    });
  else {
    const l = document.createElement("textarea");
    l.value = a, document.body.appendChild(l), l.select();
    try {
      const c = document.execCommand("copy");
      d(t, c ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      d(t, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(l);
    }
  }
}
function f() {
  $(), O(), window.addEventListener("scroll", function() {
    clearTimeout(window.scrollTimeout), window.scrollTimeout = setTimeout(() => {
      P(), h();
    }, 50);
  }), j(), document.addEventListener("keydown", function(i) {
    i.key === "Escape" && I();
  });
}
window.enlargePage = H;
window.closeModal = I;
window.scrollToPreviousPage = R;
window.scrollToNextPage = z;
window.scrollToBeilage = D;
window.shareCurrentPage = K;
window.generateCitation = V;
window.copyPagePermalink = b;
window.generatePageCitation = m;
function Z() {
  v(), q(), document.querySelector(".newspaper-page-container") && f(), htmx.on("htmx:load", function(i) {
    v();
  }), document.body.addEventListener("htmx:afterSwap", function(i) {
    setTimeout(() => {
      document.querySelector(".newspaper-page-container") && f();
    }, 100);
  }), document.body.addEventListener("htmx:afterSettle", function(i) {
    setTimeout(() => {
      document.querySelector(".newspaper-page-container") && f();
    }, 200);
  }), document.body.addEventListener("htmx:load", function(i) {
    setTimeout(() => {
      document.querySelector(".newspaper-page-container") && f();
    }, 100);
  });
}
class W extends HTMLElement {
  constructor() {
    super(), this.resizeObserver = null;
  }
  // Dynamically detect sidebar width in pixels
  detectSidebarWidth() {
    const t = document.querySelector('.lg\\:w-1\\/4, .lg\\:w-1\\/3, [class*="lg:w-1/"]');
    if (t) {
      const o = t.getBoundingClientRect().width;
      return console.log("Detected sidebar width:", o, "px"), `${o}px`;
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
  show(t, e, n, o = !1, r = 0, s = null) {
    const a = this.querySelector("#single-page-image"), l = this.querySelector("#page-number"), c = this.querySelector("#page-icon");
    this.querySelector("#page-indicator"), a.src = t, a.alt = e, this.currentPageNumber = n, this.currentIsBeilage = o, this.currentPartNumber = s;
    const g = this.getIssueContext(n);
    if (l.innerHTML = g ? `${g}, ${n}` : `${n}`, r && n === r) {
      l.style.position = "relative";
      const u = l.querySelector(".target-page-dot");
      u && u.remove();
      const p = document.createElement("span");
      p.className = "target-page-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10", p.title = "verlinkte Seite", l.appendChild(p);
    }
    if (s !== null)
      c.innerHTML = `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${s}. Teil</span>`;
    else {
      const u = this.determinePageIconType(n, o);
      c.innerHTML = this.getPageIconHTML(u);
    }
    this.updateNavigationButtons(), this.style.display = "block", document.body.style.overflow = "hidden", S(n);
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
    const n = e ? '.newspaper-page-container[data-beilage="true"]' : ".newspaper-page-container:not([data-beilage])", r = Array.from(document.querySelectorAll(n)).map((l) => {
      const c = l.getAttribute("data-page-container");
      return c ? parseInt(c) : null;
    }).filter((l) => l !== null).sort((l, c) => l - c);
    if (r.length === 0)
      return "first";
    const s = r[0], a = r[r.length - 1];
    return t === s ? "first" : t === a ? "last" : t === s + 1 ? "even" : t === a - 1 ? "odd" : t % 2 === 0 ? "even" : "odd";
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
    const t = this.querySelector("#prev-page-btn"), e = this.querySelector("#next-page-btn"), { prevPage: n, nextPage: o } = this.getAdjacentPages();
    n !== null ? (t.disabled = !1, t.className = t.className.replace("opacity-50 cursor-not-allowed", ""), t.className = t.className.replace(
      "bg-gray-50 text-gray-400",
      "bg-gray-100 text-gray-700"
    )) : (t.disabled = !0, t.className.includes("opacity-50") || (t.className += " opacity-50 cursor-not-allowed"), t.className = t.className.replace(
      "bg-gray-100 text-gray-700",
      "bg-gray-50 text-gray-400"
    )), o !== null ? (e.disabled = !1, e.className = e.className.replace("opacity-50 cursor-not-allowed", ""), e.className = e.className.replace(
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
    const n = e.map((a) => {
      const l = a.getAttribute("data-page-container"), c = l ? parseInt(l) : null;
      return console.log("Container page:", l, "parsed:", c), c;
    }).filter((a) => a !== null).sort((a, l) => a - l);
    console.log("All pages found:", n), console.log("Current page:", this.currentPageNumber);
    const o = n.indexOf(this.currentPageNumber);
    console.log("Current index:", o);
    let r = null, s = null;
    return o > 0 && (r = n[o - 1]), o < n.length - 1 && (s = n[o + 1]), console.log("Adjacent pages - prev:", r, "next:", s), { prevPage: r, nextPage: s };
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
      const o = n.querySelector(".newspaper-page-image");
      if (o) {
        let r = null;
        this.currentPartNumber !== null && (r = this.getPartNumberForPage(t)), this.show(
          o.src,
          o.alt,
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
        const o = n.textContent.match(/(\d+)\./);
        if (o)
          return parseInt(o[1]);
      }
    }
    return null;
  }
  // Toggle sidebar visibility
  toggleSidebar() {
    const t = this.querySelector("#sidebar-spacer"), e = this.querySelector("#sidebar-toggle-btn"), n = e.querySelector("i"), o = t.style.width, r = o === "0px" || o === "0";
    if (console.log("Current state - isCollapsed:", r), console.log("Current width:", o), r) {
      const s = this.detectSidebarWidth();
      t.style.width = s, e.className = "w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", n.className = "ri-sidebar-fold-line text-lg font-bold", e.title = "Inhaltsverzeichnis ausblenden", console.log("Expanding sidebar to:", s);
    } else
      t.style.width = "0px", e.className = "w-10 h-10 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", n.className = "ri-sidebar-unfold-line text-lg font-bold", e.title = "Inhaltsverzeichnis einblenden", console.log("Collapsing sidebar");
    console.log("New width:", t.style.width);
  }
  // Extract issue context from document title, URL, or page container
  getIssueContext(t) {
    const e = window.location.pathname, n = e.includes("/beitrag/");
    if (n) {
      const s = document.querySelector(`[data-page-container="${t}"]`);
      if (s) {
        const c = s.querySelector(".page-indicator");
        if (c) {
          const g = c.textContent.trim(), u = g.match(/(\d{1,2}\.\d{1,2}\.\d{4}\s+Nr\.\s+\d+)/);
          if (u)
            return u[1];
          const p = g.match(/(\d{4})\s+Nr\.\s+(\d+)/);
          if (p)
            return `${p[1]} Nr. ${p[2]}`;
        }
      }
      const l = document.title.match(/(\d{4}).*Nr\.\s*(\d+)/);
      if (l)
        return `${l[1]} Nr. ${l[2]}`;
    } else
      return "";
    const o = e.match(/\/(\d{4})\/(\d+)/);
    if (o)
      return n ? `${o[1]} Nr. ${o[2]}` : "";
    const r = document.querySelector(".page-indicator");
    if (r) {
      const a = r.textContent.trim().match(/(\d{4})\s+Nr\.\s+(\d+)/);
      if (a)
        return `${a[1]} Nr. ${a[2]}`;
    }
    return "KGPZ";
  }
}
customElements.define("single-page-viewer", W);
document.body.addEventListener("htmx:beforeRequest", function(i) {
  const t = document.querySelector("single-page-viewer");
  t && t.style.display !== "none" && (console.log("Cleaning up single page viewer before HTMX navigation"), t.destroy());
});
window.addEventListener("beforeunload", function() {
  const i = document.querySelector("single-page-viewer");
  i && i.destroy();
});
export {
  Z as setup
};
