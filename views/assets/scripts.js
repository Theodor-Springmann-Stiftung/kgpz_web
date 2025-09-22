class H extends HTMLElement {
  constructor() {
    super(), this.scrollHandler = null, this.scrollTimeout = null, this.clickHandlers = [], this.manualNavigation = !1;
  }
  connectedCallback() {
    setTimeout(() => {
      this.initializeScrollspyAfterDelay();
    }, 100);
  }
  initializeScrollspyAfterDelay() {
    if (this.sections = document.querySelectorAll(".author-section"), this.navLinks = document.querySelectorAll(".scrollspy-link"), this.sections.length === 0 || this.navLinks.length === 0) {
      setTimeout(() => {
        this.sections = document.querySelectorAll(".author-section"), this.navLinks = document.querySelectorAll(".scrollspy-link"), this.sections.length > 0 && this.navLinks.length > 0 && this.initializeScrollspy();
      }, 500);
      return;
    }
    this.initializeScrollspy();
  }
  disconnectedCallback() {
    this.cleanup();
  }
  initializeScrollspy() {
    this.scrollHandler = () => {
      clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
        this.updateActiveLink(), this.updateSidebarScrollToTopButton();
      }, 50);
    }, window.addEventListener("scroll", this.scrollHandler), this.navLinks.forEach((e) => {
      const t = (n) => {
        n.preventDefault();
        const i = e.getAttribute("data-target"), o = document.getElementById(i);
        o && (this.updateActiveLinkImmediate(i), this.manualNavigation = !0, o.scrollIntoView({
          behavior: "smooth",
          block: "start"
        }), setTimeout(() => {
          this.manualNavigation = !1, this.ensureMarkerVisibility();
        }, 1e3));
      };
      this.clickHandlers.push({ link: e, handler: t }), e.addEventListener("click", t);
    }), this.updateActiveLink(), this.updateSidebarScrollToTopButton();
  }
  ensureMarkerVisibility() {
    const e = document.getElementById("scrollspy-slider"), t = document.getElementById("scrollspy-nav");
    if (!e || !t || e.style.opacity === "0")
      return;
    const n = t.getBoundingClientRect(), i = parseFloat(e.style.top), o = parseFloat(e.style.height), s = i + o, l = t.scrollTop, a = l + n.height;
    if (s > a) {
      const c = s - n.height + 20;
      t.scrollTo({
        top: c,
        behavior: "smooth"
      });
    } else if (i < l) {
      const c = i - 20;
      t.scrollTo({
        top: Math.max(0, c),
        behavior: "smooth"
      });
    }
  }
  updateActiveLink() {
    if (!this.sections || !this.navLinks)
      return;
    const e = [];
    try {
      this.sections.forEach((i) => {
        if (!i || !i.getAttribute) return;
        const o = i.getAttribute("id"), s = i.querySelector(".akteur-werke-section"), l = i.querySelector(".akteur-beitraege-section");
        let a = !1;
        if (s) {
          const c = s.getBoundingClientRect(), d = c.top < window.innerHeight, g = c.bottom > 0;
          d && g && (a = !0);
        }
        if (l && !a) {
          const c = l.getBoundingClientRect(), d = c.top < window.innerHeight, g = c.bottom > 0;
          d && g && (a = !0);
        }
        if (!s && !l) {
          const c = i.querySelector("div:first-child");
          if (c) {
            const d = c.getBoundingClientRect(), g = d.top >= 0, h = d.bottom <= window.innerHeight;
            g && h && (a = !0);
          }
        }
        a && e.push(o);
      });
    } catch {
      return;
    }
    const t = [], n = document.getElementById("scrollspy-slider");
    if (this.navLinks.forEach((i) => {
      i.classList.remove("font-medium");
      const o = i.getAttribute("data-target");
      e.includes(o) && (i.classList.add("font-medium"), t.push(i));
    }), t.length > 0 && n) {
      const i = document.getElementById("scrollspy-nav"), o = i.getBoundingClientRect();
      let s = 1 / 0, l = -1 / 0;
      t.forEach((c) => {
        const d = c.getBoundingClientRect(), g = d.top - o.top + i.scrollTop, h = g + d.height;
        s = Math.min(s, g), l = Math.max(l, h);
      });
      let a = l - s;
      n.style.top = `${s}px`, n.style.height = `${a}px`, n.style.opacity = "1", setTimeout(() => this.ensureMarkerVisibility(), 100);
    } else n && (n.style.opacity = "0");
    t.length > 0 && this.updateSidebarScroll(t);
  }
  updateActiveLinkImmediate(e) {
    if (!this.navLinks) return;
    const t = document.getElementById("scrollspy-slider");
    try {
      this.navLinks.forEach((i) => {
        i && i.classList && i.classList.remove("font-medium");
      });
    } catch {
      return;
    }
    const n = document.querySelector(`[data-target="${e}"]`);
    if (n && (n.classList.add("font-medium"), t)) {
      const i = document.getElementById("scrollspy-nav");
      if (i) {
        const o = i.getBoundingClientRect(), s = n.getBoundingClientRect(), l = s.top - o.top + i.scrollTop;
        t.style.top = `${l}px`, t.style.height = `${s.height}px`, t.style.opacity = "1";
      }
    }
  }
  updateSidebarScroll(e) {
    if (this.manualNavigation) return;
    const t = document.getElementById("scrollspy-nav");
    if (!t) return;
    const n = e[0], i = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    ), o = window.innerHeight, s = i - o, l = s > 0 ? window.scrollY / s : 0, a = t.clientHeight, d = t.scrollHeight - a;
    if (d > 0) {
      const g = l * d, h = n.getBoundingClientRect(), P = t.getBoundingClientRect(), C = h.top - P.top + t.scrollTop, k = a / 2, T = C - k, m = 0.7, I = m * g + (1 - m) * T, b = Math.max(0, Math.min(d, I)), L = t.scrollTop;
      Math.abs(b - L) > 10 && t.scrollTo({
        top: b,
        behavior: "smooth"
      });
    }
  }
  updateSidebarScrollToTopButton() {
    const e = document.getElementById("sidebar-scroll-to-top");
    if (!e) return;
    const t = window.pageYOffset || document.documentElement.scrollTop, n = window.innerHeight;
    t > n * 0.5 ? (e.classList.remove("opacity-0"), e.classList.add("opacity-100")) : (e.classList.remove("opacity-100"), e.classList.add("opacity-0"));
  }
  cleanup() {
    this.scrollHandler && (window.removeEventListener("scroll", this.scrollHandler), this.scrollHandler = null), this.scrollTimeout && (clearTimeout(this.scrollTimeout), this.scrollTimeout = null), this.clickHandlers && this.clickHandlers.length > 0 && this.clickHandlers.forEach(({ link: t, handler: n }) => {
      t && n && t.removeEventListener("click", n);
    });
    const e = document.getElementById("scrollspy-slider");
    e && (e.style.opacity = "0", e.style.height = "0"), this.sections = null, this.navLinks = null, this.clickHandlers = [], this.manualNavigation = !1;
  }
}
customElements.define("akteure-scrollspy", H);
class B extends HTMLElement {
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
  show(e, t, n, i = !1, o = 0, s = null) {
    const l = this.querySelector("#single-page-image"), a = this.querySelector("#page-number"), c = this.querySelector("#page-icon");
    this.querySelector("#page-indicator"), l.src = e, l.alt = t, this.currentPageNumber = n, this.currentIsBeilage = i, this.currentPartNumber = s;
    const d = this.getIssueContext(n);
    if (a.innerHTML = d ? `${d}, ${n}` : `${n}`, o && n === o) {
      a.style.position = "relative";
      const g = a.querySelector(".target-page-dot");
      g && g.remove();
      const h = document.createElement("span");
      h.className = "target-page-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10", h.title = "verlinkte Seite", a.appendChild(h);
    }
    if (s !== null)
      c.innerHTML = `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${s}. Teil</span>`;
    else {
      const g = this.determinePageIconType(n, i);
      c.innerHTML = this.getPageIconHTML(g);
    }
    this.updateNavigationButtons(), this.style.display = "block", document.body.style.overflow = "hidden";
  }
  close() {
    this.style.display = "none", document.body.style.overflow = "";
  }
  disconnectedCallback() {
    this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), document.body.style.overflow = "";
  }
  // Determine page icon type based on page position and whether it's beilage
  determinePageIconType(e, t) {
    const n = t ? '.newspaper-page-container[data-beilage="true"]' : ".newspaper-page-container:not([data-beilage])", o = Array.from(document.querySelectorAll(n)).map((a) => {
      const c = a.getAttribute("data-page-container");
      return c ? parseInt(c) : null;
    }).filter((a) => a !== null).sort((a, c) => a - c);
    if (o.length === 0)
      return "first";
    const s = o[0], l = o[o.length - 1];
    return e === s ? "first" : e === l ? "last" : e === s + 1 ? "even" : e === l - 1 ? "odd" : e % 2 === 0 ? "even" : "odd";
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
    if (typeof copyPagePermalink == "function") {
      const e = this.querySelector("#share-btn");
      copyPagePermalink(this.currentPageNumber, e, this.currentIsBeilage);
    }
  }
  // Generate citation for current page
  generatePageCitation() {
    if (typeof generatePageCitation == "function") {
      const e = this.querySelector("#cite-btn");
      generatePageCitation(this.currentPageNumber, e);
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
    const n = t.map((l) => {
      const a = l.getAttribute("data-page-container"), c = a ? parseInt(a) : null;
      return console.log("Container page:", a, "parsed:", c), c;
    }).filter((l) => l !== null).sort((l, a) => l - a);
    console.log("All pages found:", n), console.log("Current page:", this.currentPageNumber);
    const i = n.indexOf(this.currentPageNumber);
    console.log("Current index:", i);
    let o = null, s = null;
    return i > 0 && (o = n[i - 1]), i < n.length - 1 && (s = n[i + 1]), console.log("Adjacent pages - prev:", o, "next:", s), { prevPage: o, nextPage: s };
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
        let o = null;
        this.currentPartNumber !== null && (o = this.getPartNumberForPage(e)), this.show(
          i.src,
          i.alt,
          e,
          this.currentIsBeilage,
          0,
          o
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
    const e = this.querySelector("#sidebar-spacer"), t = this.querySelector("#sidebar-toggle-btn"), n = t.querySelector("i"), i = e.style.width, o = i === "0px" || i === "0";
    if (console.log("Current state - isCollapsed:", o), console.log("Current width:", i), o) {
      const s = this.detectSidebarWidth();
      e.style.width = s, t.className = "w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", n.className = "ri-sidebar-fold-line text-lg font-bold", t.title = "Inhaltsverzeichnis ausblenden", console.log("Expanding sidebar to:", s);
    } else
      e.style.width = "0px", t.className = "w-10 h-10 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", n.className = "ri-sidebar-unfold-line text-lg font-bold", t.title = "Inhaltsverzeichnis einblenden", console.log("Collapsing sidebar");
    console.log("New width:", e.style.width);
  }
  // Extract issue context from document title, URL, or page container
  getIssueContext(e) {
    const t = window.location.pathname, n = t.includes("/beitrag/");
    if (n) {
      const s = document.querySelector(`[data-page-container="${e}"]`);
      if (s) {
        const c = s.querySelector(".page-indicator");
        if (c) {
          const d = c.textContent.trim(), g = d.match(/(\d{1,2}\.\d{1,2}\.\d{4}\s+Nr\.\s+\d+)/);
          if (g)
            return g[1];
          const h = d.match(/(\d{4})\s+Nr\.\s+(\d+)/);
          if (h)
            return `${h[1]} Nr. ${h[2]}`;
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
    const o = document.querySelector(".page-indicator");
    if (o) {
      const l = o.textContent.trim().match(/(\d{4})\s+Nr\.\s+(\d+)/);
      if (l)
        return `${l[1]} Nr. ${l[2]}`;
    }
    return "KGPZ";
  }
}
customElements.define("single-page-viewer", B);
document.body.addEventListener("htmx:beforeRequest", function(r) {
  const e = document.querySelector("single-page-viewer");
  e && e.style.display !== "none" && (console.log("Cleaning up single page viewer before HTMX navigation"), e.destroy());
});
window.addEventListener("beforeunload", function() {
  const r = document.querySelector("single-page-viewer");
  r && r.destroy();
});
class E extends HTMLElement {
  constructor() {
    super(), this.isVisible = !1, this.scrollHandler = null, this.htmxAfterSwapHandler = null;
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
    }, this.htmxAfterSwapHandler = () => {
      this.reassessScrollPosition();
    }, window.addEventListener("scroll", this.scrollHandler), document.body.addEventListener("htmx:afterSettle", this.htmxAfterSwapHandler), this.handleScroll();
  }
  disconnectedCallback() {
    this.scrollHandler && (window.removeEventListener("scroll", this.scrollHandler), this.scrollHandler = null), this.htmxAfterSwapHandler && (document.body.removeEventListener("htmx:afterSettle", this.htmxAfterSwapHandler), this.htmxAfterSwapHandler = null);
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
customElements.define("scroll-to-top-button", E);
window.currentPageContainers = window.currentPageContainers || [];
window.currentActiveIndex = window.currentActiveIndex || 0;
window.pageObserver = window.pageObserver || null;
function A(r, e, t, n = null) {
  let i = document.querySelector("single-page-viewer");
  i || (i = document.createElement("single-page-viewer"), document.body.appendChild(i));
  const o = r.closest('[data-beilage="true"]') !== null, s = window.templateData && window.templateData.targetPage ? window.templateData.targetPage : 0;
  i.show(r.src, r.alt, e, o, s, n);
}
function x() {
  document.getElementById("pageModal").classList.add("hidden");
}
function $() {
  if (window.pageObserver && (window.pageObserver.disconnect(), window.pageObserver = null), window.currentPageContainers = Array.from(document.querySelectorAll(".newspaper-page-container")), window.currentActiveIndex = 0, p(), document.querySelector(".newspaper-page-container")) {
    let e = /* @__PURE__ */ new Set();
    window.pageObserver = new IntersectionObserver(
      (t) => {
        if (t.forEach((n) => {
          const i = window.currentPageContainers.indexOf(n.target);
          i !== -1 && (n.isIntersecting ? e.add(i) : e.delete(i));
        }), e.size > 0) {
          const i = Array.from(e).sort((o, s) => o - s)[0];
          i !== window.currentActiveIndex && (window.currentActiveIndex = i, p());
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
function N() {
  if (window.currentActiveIndex > 0) {
    let r = -1;
    const e = [];
    window.currentPageContainers.forEach((n, i) => {
      const o = n.getBoundingClientRect(), s = window.innerHeight, l = Math.max(o.top, 0), a = Math.min(o.bottom, s), c = Math.max(0, a - l), d = o.height;
      c / d >= 0.3 && e.push(i);
    });
    const t = Math.min(...e);
    for (let n = t - 1; n >= 0; n--)
      if (!e.includes(n)) {
        r = n;
        break;
      }
    r === -1 && t > 0 && (r = t - 1), r >= 0 && (window.currentActiveIndex = r, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), setTimeout(() => {
      p();
    }, 100));
  }
}
function q() {
  if (window.currentActiveIndex < window.currentPageContainers.length - 1) {
    let r = -1;
    const e = [];
    window.currentPageContainers.forEach((n, i) => {
      const o = n.getBoundingClientRect(), s = window.innerHeight, l = Math.max(o.top, 0), a = Math.min(o.bottom, s), c = Math.max(0, a - l), d = o.height;
      c / d >= 0.3 && e.push(i);
    });
    const t = Math.max(...e);
    for (let n = t + 1; n < window.currentPageContainers.length; n++)
      if (!e.includes(n)) {
        r = n;
        break;
      }
    r === -1 && t < window.currentPageContainers.length - 1 && (r = t + 1), r >= 0 && r < window.currentPageContainers.length && (window.currentActiveIndex = r, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      behavior: "smooth",
      block: "start"
    }), setTimeout(() => {
      p();
    }, 100));
  }
}
function M() {
  if (S()) {
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
function S() {
  const r = [];
  window.currentPageContainers.forEach((e, t) => {
    const n = e.getBoundingClientRect(), i = window.innerHeight, o = Math.max(n.top, 0), s = Math.min(n.bottom, i), l = Math.max(0, s - o), a = n.height;
    l / a >= 0.3 && r.push(t);
  });
  for (const e of r) {
    const t = window.currentPageContainers[e];
    if (t && t.id && t.id.includes("beilage-"))
      return !0;
  }
  return !1;
}
function p() {
  const r = document.getElementById("prevPageBtn"), e = document.getElementById("nextPageBtn"), t = document.getElementById("beilageBtn");
  if (r && (window.currentActiveIndex <= 0 ? r.style.display = "none" : r.style.display = "flex"), e && (window.currentActiveIndex >= window.currentPageContainers.length - 1 ? e.style.display = "none" : e.style.display = "flex"), t) {
    const n = S(), i = t.querySelector("i");
    n ? (t.title = "Zur Hauptausgabe", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", i && (i.className = "ri-file-text-line text-lg lg:text-xl")) : (t.title = "Zu Beilage", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", i && (i.className = "ri-attachment-line text-lg lg:text-xl"));
  }
}
function R() {
  const r = document.getElementById("shareLinkBtn");
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
    w(t, r);
  }) : w(t, r);
}
function w(r, e) {
  if (navigator.clipboard)
    navigator.clipboard.writeText(r).then(() => {
      u(e, "Link kopiert!");
    }).catch((t) => {
      u(e, "Kopieren fehlgeschlagen");
    });
  else {
    const t = document.createElement("textarea");
    t.value = r, document.body.appendChild(t), t.select();
    try {
      const n = document.execCommand("copy");
      u(e, n ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      u(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(t);
    }
  }
}
function z() {
  const r = document.getElementById("citationBtn"), e = document.title || "KGPZ";
  let t = window.location.origin + window.location.pathname;
  t.includes("#") && (t = t.split("#")[0]);
  const n = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), i = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${e}. Digital verfügbar unter: ${t} (Zugriff: ${n}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(i).then(() => {
      u(r, "Zitation kopiert!");
    }).catch((o) => {
      u(r, "Kopieren fehlgeschlagen");
    });
  else {
    const o = document.createElement("textarea");
    o.value = i, document.body.appendChild(o), o.select();
    try {
      const s = document.execCommand("copy");
      u(r, s ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      u(r, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(o);
    }
  }
}
function u(r, e) {
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
  const i = r.getBoundingClientRect(), o = window.innerHeight, s = window.innerWidth;
  let l = i.left - 10, a = i.bottom + 8;
  const c = 120, d = 32;
  l + c > s && (l = i.right - c + 10), a + d > o && (a = i.top - d - 8), n.style.left = Math.max(5, l) + "px", n.style.top = Math.max(5, a) + "px", document.body.appendChild(n), setTimeout(() => {
    n.style.opacity = "1";
  }, 10), setTimeout(() => {
    n.style.opacity = "0", setTimeout(() => {
      n.parentNode && n.remove();
    }, 200);
  }, 2e3);
}
function V(r, e, t = !1) {
  let n = "";
  if (t)
    n = window.location.origin + window.location.pathname + `#beilage-1-page-${r}`;
  else {
    const o = window.location.pathname.split("/");
    if (o.length >= 3) {
      const s = o[1], l = o[2];
      n = `${window.location.origin}/${s}/${l}/${r}`;
    } else
      n = window.location.origin + window.location.pathname + `/${r}`;
  }
  const i = n;
  if (navigator.clipboard)
    navigator.clipboard.writeText(i).then(() => {
      u(e, "Link kopiert!");
    }).catch((o) => {
      u(e, "Kopieren fehlgeschlagen");
    });
  else {
    const o = document.createElement("textarea");
    o.value = i, document.body.appendChild(o), o.select();
    try {
      const s = document.execCommand("copy");
      u(e, s ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      u(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(o);
    }
  }
}
function O(r, e) {
  const t = document.title || "KGPZ", n = window.location.pathname.split("/");
  let i;
  if (n.length >= 3) {
    const a = n[1], c = n[2];
    i = `${window.location.origin}/${a}/${c}/${r}`;
  } else
    i = `${window.location.origin}${window.location.pathname}/${r}`;
  const o = i, s = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), l = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${t}, Seite ${r}. Digital verfügbar unter: ${o} (Zugriff: ${s}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(l).then(() => {
      u(e, "Zitation kopiert!");
    }).catch((a) => {
      u(e, "Kopieren fehlgeschlagen");
    });
  else {
    const a = document.createElement("textarea");
    a.value = l, document.body.appendChild(a), a.select();
    try {
      const c = document.execCommand("copy");
      u(e, c ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      u(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(a);
    }
  }
}
function y() {
  $(), window.addEventListener("scroll", function() {
    clearTimeout(window.scrollTimeout), window.scrollTimeout = setTimeout(() => {
      p();
    }, 50);
  }), document.addEventListener("keydown", function(r) {
    r.key === "Escape" && x();
  });
}
function f() {
  const r = window.location.pathname;
  document.querySelectorAll(".citation-link[data-citation-url]").forEach((t) => {
    const n = t.getAttribute("data-citation-url");
    let i = !1;
    if (n === r)
      i = !0;
    else {
      const o = r.match(/^\/(\d{4})\/(\d+)(?:\/(\d+))?$/), s = n.match(/^\/(\d{4})\/(\d+)$/);
      if (o && s) {
        const [, l, a, c] = o, [, d, g] = s;
        l === d && a === g && (i = !0);
      }
    }
    i ? (t.classList.add("text-red-700", "pointer-events-none"), t.setAttribute("aria-current", "page")) : (t.classList.remove("text-red-700", "pointer-events-none"), t.removeAttribute("aria-current"));
  });
}
function v() {
  const r = window.location.pathname, e = document.body;
  e.classList.remove(
    "page-akteure",
    "page-ausgabe",
    "page-search",
    "page-ort",
    "page-kategorie",
    "page-piece",
    "page-edition"
  ), r.includes("/akteure/") || r.includes("/autoren") ? e.classList.add("page-akteure") : r.match(/\/\d{4}\/\d+/) ? e.classList.add("page-ausgabe") : r.includes("/search") || r.includes("/suche") ? e.classList.add("page-search") : r.includes("/ort/") ? e.classList.add("page-ort") : r.includes("/kategorie/") ? e.classList.add("page-kategorie") : r.includes("/beitrag/") ? e.classList.add("page-piece") : r.includes("/edition") && e.classList.add("page-edition");
}
window.enlargePage = A;
window.closeModal = x;
window.scrollToPreviousPage = N;
window.scrollToNextPage = q;
window.scrollToBeilage = M;
window.shareCurrentPage = R;
window.generateCitation = z;
window.copyPagePermalink = V;
window.generatePageCitation = O;
function K() {
  v(), f(), document.querySelector(".newspaper-page-container") && y();
  let r = function(t) {
    v(), f(), setTimeout(() => {
      document.querySelector(".newspaper-page-container") && y();
    }, 50);
  }, e = function(t) {
  };
  document.body.addEventListener("htmx:afterSettle", r), document.body.addEventListener("htmx:afterSettle", f), document.body.addEventListener("htmx:beforeRequest", e);
}
export {
  K as setup
};
