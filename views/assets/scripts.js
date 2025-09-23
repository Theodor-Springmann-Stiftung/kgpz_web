class H extends HTMLElement {
  constructor() {
    super(), this.scrollHandler = null, this.scrollTimeout = null, this.clickHandlers = [], this.manualNavigation = !1;
  }
  connectedCallback() {
    window.ExecuteNextSettle(() => {
      this.initializeScrollspyAfterDelay();
    });
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
      const t = (i) => {
        i.preventDefault();
        const n = e.getAttribute("data-target"), o = document.getElementById(n);
        o && (this.updateActiveLinkImmediate(n), this.manualNavigation = !0, o.scrollIntoView({
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
    const i = t.getBoundingClientRect(), n = parseFloat(e.style.top), o = parseFloat(e.style.height), s = n + o, a = t.scrollTop, l = a + i.height;
    if (s > l) {
      const c = s - i.height + 20;
      t.scrollTo({
        top: c,
        behavior: "smooth"
      });
    } else if (n < a) {
      const c = n - 20;
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
      this.sections.forEach((n) => {
        if (!n || !n.getAttribute) return;
        const o = n.getAttribute("id"), s = n.querySelector(".akteur-werke-section"), a = n.querySelector(".akteur-beitraege-section");
        let l = !1;
        if (s) {
          const c = s.getBoundingClientRect(), d = c.top < window.innerHeight, g = c.bottom > 0;
          d && g && (l = !0);
        }
        if (a && !l) {
          const c = a.getBoundingClientRect(), d = c.top < window.innerHeight, g = c.bottom > 0;
          d && g && (l = !0);
        }
        if (!s && !a) {
          const c = n.querySelector("div:first-child");
          if (c) {
            const d = c.getBoundingClientRect(), g = d.top >= 0, u = d.bottom <= window.innerHeight;
            g && u && (l = !0);
          }
        }
        l && e.push(o);
      });
    } catch {
      return;
    }
    const t = [], i = document.getElementById("scrollspy-slider");
    if (this.navLinks.forEach((n) => {
      n.classList.remove("font-medium");
      const o = n.getAttribute("data-target");
      e.includes(o) && (n.classList.add("font-medium"), t.push(n));
    }), t.length > 0 && i) {
      const n = document.getElementById("scrollspy-nav"), o = n.getBoundingClientRect();
      let s = 1 / 0, a = -1 / 0;
      t.forEach((c) => {
        const d = c.getBoundingClientRect(), g = d.top - o.top + n.scrollTop, u = g + d.height;
        s = Math.min(s, g), a = Math.max(a, u);
      });
      let l = a - s;
      i.style.top = `${s}px`, i.style.height = `${l}px`, i.style.opacity = "1", setTimeout(() => this.ensureMarkerVisibility(), 100);
    } else i && (i.style.opacity = "0");
    t.length > 0 && this.updateSidebarScroll(t);
  }
  updateActiveLinkImmediate(e) {
    if (!this.navLinks) return;
    const t = document.getElementById("scrollspy-slider");
    try {
      this.navLinks.forEach((n) => {
        n && n.classList && n.classList.remove("font-medium");
      });
    } catch {
      return;
    }
    const i = document.querySelector(`[data-target="${e}"]`);
    if (i && (i.classList.add("font-medium"), t)) {
      const n = document.getElementById("scrollspy-nav");
      if (n) {
        const o = n.getBoundingClientRect(), s = i.getBoundingClientRect(), a = s.top - o.top + n.scrollTop;
        t.style.top = `${a}px`, t.style.height = `${s.height}px`, t.style.opacity = "1";
      }
    }
  }
  updateSidebarScroll(e) {
    if (this.manualNavigation) return;
    const t = document.getElementById("scrollspy-nav");
    if (!t) return;
    const i = e[0], n = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    ), o = window.innerHeight, s = n - o, a = s > 0 ? window.scrollY / s : 0, l = t.clientHeight, d = t.scrollHeight - l;
    if (d > 0) {
      const g = a * d, u = i.getBoundingClientRect(), p = t.getBoundingClientRect(), b = u.top - p.top + t.scrollTop, m = l / 2, I = b - m, y = 0.7, T = y * g + (1 - y) * I, x = Math.max(0, Math.min(d, T)), L = t.scrollTop;
      Math.abs(x - L) > 10 && t.scrollTo({
        top: x,
        behavior: "smooth"
      });
    }
  }
  updateSidebarScrollToTopButton() {
    const e = document.getElementById("sidebar-scroll-to-top");
    if (!e) return;
    const t = window.pageYOffset || document.documentElement.scrollTop, i = window.innerHeight;
    t > i * 0.5 ? (e.classList.remove("opacity-0"), e.classList.add("opacity-100")) : (e.classList.remove("opacity-100"), e.classList.add("opacity-0"));
  }
  cleanup() {
    this.scrollHandler && (window.removeEventListener("scroll", this.scrollHandler), this.scrollHandler = null), this.scrollTimeout && (clearTimeout(this.scrollTimeout), this.scrollTimeout = null), this.clickHandlers && this.clickHandlers.length > 0 && this.clickHandlers.forEach(({ link: t, handler: i }) => {
      t && i && t.removeEventListener("click", i);
    });
    const e = document.getElementById("scrollspy-slider");
    e && (e.style.opacity = "0", e.style.height = "0"), this.sections = null, this.navLinks = null, this.clickHandlers = [], this.manualNavigation = !1;
  }
}
customElements.define("akteure-scrollspy", H);
class A extends HTMLElement {
  constructor() {
    super(), this.resizeObserver = null;
  }
  // Dynamically detect sidebar width in pixels
  detectSidebarWidth() {
    const e = document.querySelector('.lg\\:w-1\\/4, .lg\\:w-1\\/3, [class*="lg:w-1/"]');
    if (e) {
      const n = e.getBoundingClientRect().width;
      return console.log("Detected sidebar width:", n, "px"), `${n}px`;
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
						<div class="sticky top-0 z-30 bg-slate-50 flex items-center justify-between p-4">
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

						<!-- Image display container -->
						<div id="image-container" class="flex-1 flex items-center justify-center p-4 pb-8 overflow-auto">
							<img
								id="single-page-image"
								src=""
								alt=""
								class="rounded-lg shadow-2xl cursor-pointer select-none max-w-full max-h-full"
								title="Klicken zum Schließen"
								draggable="false"
								onclick="this.closest('single-page-viewer').close()"
							/>
						</div>
					</div>
				</div>
			</div>
		`, this.setupResizeObserver(), this.setupKeyboardNavigation();
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
  show(e, t, i, n = !1, o = 0, s = null, a = null, l = null) {
    const c = this.querySelector("#single-page-image"), d = this.querySelector("#page-number"), g = this.querySelector("#page-icon");
    this.querySelector("#page-indicator"), c.src = e, c.alt = t, this.currentPageNumber = i, this.currentIsBeilage = n, this.currentPartNumber = s;
    let u;
    if (l)
      u = l;
    else {
      const b = this.getIssueContext(i);
      u = b ? `${b}, ${i}` : `${i}`;
    }
    if (d.innerHTML = u, o && i === o) {
      d.style.position = "relative";
      const b = d.querySelector(".target-page-dot");
      b && b.remove();
      const m = document.createElement("span");
      m.className = "target-page-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10", m.title = "verlinkte Seite", d.appendChild(m);
    }
    a ? a === "part-number" && s !== null ? g.innerHTML = `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${s}. Teil</span>` : g.innerHTML = this.generateIconFromType(a) : g.innerHTML = this.generateFallbackIcon(i, n, s), this.updateNavigationButtons(), this.style.display = "block", this.setAttribute("active", "true");
    const p = this.querySelector(".flex-1.overflow-auto");
    p && (p.scrollTop = 0), document.body.style.overflow = "hidden", document.dispatchEvent(new CustomEvent("singlepageviewer:opened", {
      detail: { pageNumber: this.currentPageNumber, isBeilage: this.currentIsBeilage }
    }));
  }
  close() {
    this.style.display = "none", this.removeAttribute("active"), document.body.style.overflow = "", document.dispatchEvent(new CustomEvent("singlepageviewer:closed", {
      detail: { pageNumber: this.currentPageNumber, isBeilage: this.currentIsBeilage }
    }));
  }
  disconnectedCallback() {
    this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), this.keyboardHandler && (document.removeEventListener("keydown", this.keyboardHandler), this.keyboardHandler = null), document.body.style.overflow = "";
  }
  // Generate icon HTML from Go icon type - matches templating/engine.go PageIcon function
  generateIconFromType(e) {
    switch (e) {
      case "first":
        return '<i class="ri-file-text-line text-black text-lg" display: inline-block;"></i>';
      case "last":
        return '<i class="ri-file-text-line text-black text-lg" style="transform: scaleX(-1); display: inline-block;"></i>';
      case "even":
        return '<i class="ri-file-text-line text-black text-lg" style="margin-left: 1px; transform: scaleX(-1); display: inline-block;"></i><i class="ri-file-text-line text-slate-400 text-lg"></i>';
      case "odd":
        return '<i class="ri-file-text-line text-slate-400 text-lg" style="margin-left: 1px; transform: scaleX(-1); display: inline-block;"></i><i class="ri-file-text-line text-black text-lg"></i>';
      case "single":
        return '<i class="ri-file-text-line text-black text-lg"></i>';
      default:
        return '<i class="ri-file-text-line text-black text-lg"></i>';
    }
  }
  // Set up keyboard navigation
  setupKeyboardNavigation() {
    this.keyboardHandler && document.removeEventListener("keydown", this.keyboardHandler), this.keyboardHandler = (e) => {
      if (this.style.display !== "none")
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault(), this.goToPreviousPage();
            break;
          case "ArrowRight":
            e.preventDefault(), this.goToNextPage();
            break;
          case "Escape":
            e.preventDefault(), this.close();
            break;
        }
    }, document.addEventListener("keydown", this.keyboardHandler);
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
    const e = this.querySelector("#prev-page-btn"), t = this.querySelector("#next-page-btn"), { prevPage: i, nextPage: n } = this.getAdjacentPages();
    i !== null ? (e.disabled = !1, e.className = e.className.replace("opacity-50 cursor-not-allowed", ""), e.className = e.className.replace(
      "bg-gray-50 text-gray-400",
      "bg-gray-100 text-gray-700"
    )) : (e.disabled = !0, e.className.includes("opacity-50") || (e.className += " opacity-50 cursor-not-allowed"), e.className = e.className.replace(
      "bg-gray-100 text-gray-700",
      "bg-gray-50 text-gray-400"
    )), n !== null ? (t.disabled = !1, t.className = t.className.replace("opacity-50 cursor-not-allowed", ""), t.className = t.className.replace(
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
    const i = t.map((a) => {
      const l = a.getAttribute("data-page-container"), c = l ? parseInt(l) : null;
      return console.log("Container page:", l, "parsed:", c), c;
    }).filter((a) => a !== null).sort((a, l) => a - l);
    console.log("All pages found:", i), console.log("Current page:", this.currentPageNumber);
    const n = i.indexOf(this.currentPageNumber);
    console.log("Current index:", n);
    let o = null, s = null;
    return n > 0 && (o = i[n - 1]), n < i.length - 1 && (s = i[n + 1]), console.log("Adjacent pages - prev:", o, "next:", s), { prevPage: o, nextPage: s };
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
    const t = this.currentIsBeilage ? '.newspaper-page-container[data-beilage="true"]' : ".newspaper-page-container:not([data-beilage])", i = document.querySelector(
      `${t}[data-page-container="${e}"]`
    );
    if (i) {
      const n = i.querySelector(".newspaper-page-image, .piece-page-image");
      if (n) {
        let o = null;
        this.currentPartNumber !== null && (o = this.getPartNumberForPage(e));
        let s = null, a = null;
        s = i.getAttribute("data-page-icon-type"), i.querySelector(".part-number") && (s = "part-number");
        const c = i.querySelector(".page-indicator");
        if (c) {
          const d = c.cloneNode(!0);
          d.querySelectorAll("i").forEach((p) => p.remove()), d.querySelectorAll(
            '[class*="target-page-dot"], .target-page-indicator'
          ).forEach((p) => p.remove()), a = d.textContent.trim();
        }
        this.show(
          n.src,
          n.alt,
          e,
          this.currentIsBeilage,
          0,
          o,
          s,
          a
        ), document.dispatchEvent(new CustomEvent("singlepageviewer:pagechanged", {
          detail: { pageNumber: this.currentPageNumber, isBeilage: this.currentIsBeilage }
        }));
      }
    }
  }
  // Get part number for a specific page in piece view
  getPartNumberForPage(e) {
    const t = document.querySelector(`[data-page-container="${e}"]`);
    if (t) {
      const i = t.querySelector(".part-number");
      if (i) {
        const n = i.textContent.match(/(\d+)\./);
        if (n)
          return parseInt(n[1]);
      }
    }
    return null;
  }
  // Legacy fallback icon generation (only used when extraction fails)
  generateFallbackIcon(e, t, i) {
    return i !== null ? `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${i}. Teil</span>` : `<i class="ri-file-text-line text-lg ${t ? "text-amber-600" : "text-black"}"></i>`;
  }
  // Toggle sidebar visibility
  toggleSidebar() {
    const e = this.querySelector("#sidebar-spacer"), t = this.querySelector("#sidebar-toggle-btn"), i = t.querySelector("i"), n = e.style.width, o = n === "0px" || n === "0";
    if (console.log("Current state - isCollapsed:", o), console.log("Current width:", n), o) {
      const s = this.detectSidebarWidth();
      e.style.width = s, t.className = "w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", i.className = "ri-sidebar-fold-line text-lg font-bold", t.title = "Inhaltsverzeichnis ausblenden", console.log("Expanding sidebar to:", s);
    } else
      e.style.width = "0px", t.className = "w-10 h-10 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", i.className = "ri-sidebar-unfold-line text-lg font-bold", t.title = "Inhaltsverzeichnis einblenden", console.log("Collapsing sidebar");
    console.log("New width:", e.style.width);
  }
  // Extract issue context from document title, URL, or page container
  getIssueContext(e) {
    const t = window.location.pathname, i = t.includes("/beitrag/");
    if (i) {
      const s = document.querySelector(`[data-page-container="${e}"]`);
      if (s) {
        const c = s.querySelector(".page-indicator");
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
    const n = t.match(/\/(\d{4})\/(\d+)/);
    if (n)
      return i ? `${n[1]} Nr. ${n[2]}` : "";
    const o = document.querySelector(".page-indicator");
    if (o) {
      const a = o.textContent.trim().match(/(\d{4})\s+Nr\.\s+(\d+)/);
      if (a)
        return `${a[1]} Nr. ${a[2]}`;
    }
    return "KGPZ";
  }
}
customElements.define("single-page-viewer", A);
document.body.addEventListener("htmx:beforeRequest", function(r) {
  const e = document.querySelector("single-page-viewer");
  e && e.style.display !== "none" && (console.log("Cleaning up single page viewer before HTMX navigation"), e.close());
});
window.addEventListener("beforeunload", function() {
  const r = document.querySelector("single-page-viewer");
  r && r.close();
});
class B extends HTMLElement {
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
    const t = window.pageYOffset || document.documentElement.scrollTop, i = window.innerHeight, n = t > i;
    n && !this.isVisible ? (this.isVisible = !0, e.classList.remove("opacity-0", "pointer-events-none"), e.classList.add("opacity-100", "pointer-events-auto")) : !n && this.isVisible && (this.isVisible = !1, e.classList.remove("opacity-100", "pointer-events-auto"), e.classList.add("opacity-0", "pointer-events-none"));
  }
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
}
customElements.define("scroll-to-top-button", B);
class N extends HTMLElement {
  constructor() {
    super(), this.pageObserver = null, this.pageContainers = /* @__PURE__ */ new Map(), this.singlePageViewerActive = !1, this.singlePageViewerCurrentPage = null, this.boundHandleSinglePageViewer = this.handleSinglePageViewer.bind(this);
  }
  connectedCallback() {
    this.setupScrollspy(), this.setupSinglePageViewerDetection();
  }
  disconnectedCallback() {
    this.cleanup();
  }
  setupScrollspy() {
    const e = document.querySelectorAll(".newspaper-page-container[data-page-container]");
    e.length !== 0 && (e.forEach((t) => {
      const i = t.getAttribute("data-page-container"), n = t.hasAttribute("data-beilage"), o = this.findInhaltsEntriesForPage(i, n);
      o.length > 0 && this.pageContainers.set(i, {
        container: t,
        entries: o,
        state: "short",
        // Default state
        isBeilage: n
      });
    }), this.pageObserver = new IntersectionObserver((t) => {
      t.forEach((i) => {
        const n = i.target.getAttribute("data-page-container"), o = this.pageContainers.get(n);
        if (o) {
          const a = i.isIntersecting && i.intersectionRatio >= 0.5 || this.singlePageViewerActive ? "full" : "short";
          o.state !== a ? (o.state = a, this.updateEntriesState(o)) : a === "full" && i.isIntersecting && i.intersectionRatio >= 0.5 && this.scrollPageIntoInhaltsverzeichnis(o);
        }
      });
    }, {
      threshold: [0, 0.5, 1],
      // Watch for 50% threshold
      rootMargin: "0px"
    }), this.pageContainers.forEach(({ container: t }) => {
      this.pageObserver.observe(t);
    }), this.pageContainers.forEach((t) => {
      this.updateEntriesState(t);
    }));
  }
  findInhaltsEntriesForPage(e, t = !1) {
    const i = t ? `[data-page-container="${e}"][data-beilage="true"]` : `[data-page-container="${e}"]:not([data-beilage])`, n = this.querySelector(i);
    return n ? Array.from(n.querySelectorAll(".inhalts-entry")) : [];
  }
  updateEntriesState(e) {
    const { entries: t, state: i } = e;
    i === "full" ? (t.forEach((n) => {
      n.style.display = "";
    }), this.highlightPageElements(e, !0)) : (t.forEach((n) => {
      const o = n.hasAttribute("data-is-continuation");
      n.style.display = o ? "none" : "";
    }), this.highlightPageElements(e, !1));
  }
  highlightPageElements(e, t) {
    var a;
    const i = e.container.getAttribute("data-page-container"), n = this.querySelector(`[data-page-number="${i}"]`);
    (a = n == null ? void 0 : n.closest(".page-entry")) == null || a.querySelector(".icon-container");
    const o = n == null ? void 0 : n.closest(".page-entry");
    o && (t ? (o.classList.add("!border-l-red-500"), o.classList.remove("border-slate-300")) : (o.classList.remove("!border-l-red-500"), o.classList.add("border-slate-300")), t && this.scrollEntryIntoView(o));
    const s = document.querySelector(`[data-page="${i}"].page-indicator`);
    if (s) {
      const l = s.querySelectorAll("i:not(.text-slate-400)");
      t ? (s.classList.add("!bg-red-50", "!text-red-600"), l.forEach((c) => c.classList.add("!text-red-600"))) : (s.classList.remove("!bg-red-50", "!text-red-600"), l.forEach((c) => c.classList.remove("!text-red-600")));
    }
  }
  scrollEntryIntoView(e) {
    const t = document.querySelector(".overflow-y-auto");
    if (!t || !e)
      return;
    const i = t.querySelectorAll(".page-entry"), n = i.length > 0 && i[0] === e, o = i.length > 0 && i[i.length - 1] === e;
    if (n) {
      t.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      return;
    }
    if (o) {
      t.scrollTo({
        top: t.scrollHeight,
        behavior: "smooth"
      });
      return;
    }
    const s = t.getBoundingClientRect(), a = e.getBoundingClientRect();
    if (!(a.top >= s.top && a.bottom <= s.bottom)) {
      const c = t.scrollTop, d = a.top - s.top + c, g = s.height, u = a.height, p = d - (g - u) / 2;
      t.scrollTo({
        top: Math.max(0, p),
        behavior: "smooth"
      });
    }
  }
  scrollPageIntoInhaltsverzeichnis(e) {
    const t = e.container.getAttribute("data-page-container"), i = this.querySelector(`[data-page-number="${t}"]`), n = i == null ? void 0 : i.closest(".page-entry");
    n && this.scrollEntryIntoView(n);
  }
  setupSinglePageViewerDetection() {
    document.addEventListener("singlepageviewer:opened", this.boundHandleSinglePageViewer), document.addEventListener("singlepageviewer:closed", this.boundHandleSinglePageViewer), document.addEventListener("singlepageviewer:pagechanged", this.boundHandleSinglePageViewer), this.checkSinglePageViewerState();
  }
  handleSinglePageViewer(e) {
    var t;
    this.singlePageViewerActive, this.singlePageViewerActive = e.type === "singlepageviewer:opened" || e.type === "singlepageviewer:pagechanged" && this.singlePageViewerActive, (this.singlePageViewerActive || e.type === "singlepageviewer:pagechanged") && ((t = e.detail) != null && t.pageNumber) ? this.singlePageViewerCurrentPage = e.detail.pageNumber.toString() : e.type === "singlepageviewer:closed" && (this.singlePageViewerCurrentPage = null, this.singlePageViewerActive = !1), this.pageContainers.forEach((i) => {
      const n = i.container.getAttribute("data-page-container");
      let o;
      this.singlePageViewerActive ? o = n === this.singlePageViewerCurrentPage ? "full" : "short" : o = this.isPageContainerVisible(i.container) ? "full" : "short", i.state !== o && (i.state = o, this.updateEntriesState(i));
    });
  }
  checkSinglePageViewerState() {
    const e = document.querySelector("single-page-viewer[active]");
    this.singlePageViewerActive = e !== null;
  }
  isPageContainerVisible(e) {
    const t = e.getBoundingClientRect(), i = window.innerHeight, n = Math.max(t.top, 0), o = Math.min(t.bottom, i), s = Math.max(0, o - n), a = t.height;
    return s / a >= 0.5;
  }
  cleanup() {
    this.pageObserver && (this.pageObserver.disconnect(), this.pageObserver = null), document.removeEventListener("singlepageviewer:opened", this.boundHandleSinglePageViewer), document.removeEventListener("singlepageviewer:closed", this.boundHandleSinglePageViewer), document.removeEventListener("singlepageviewer:pagechanged", this.boundHandleSinglePageViewer), this.pageContainers.clear();
  }
}
customElements.define("inhaltsverzeichnis-scrollspy", N);
window.currentPageContainers = window.currentPageContainers || [];
window.currentActiveIndex = window.currentActiveIndex || 0;
window.pageObserver = window.pageObserver || null;
function q(r, e, t, i = null) {
  let n = document.querySelector("single-page-viewer");
  n || (n = document.createElement("single-page-viewer"), document.body.appendChild(n));
  const o = r.closest('[data-beilage="true"]') !== null, s = window.templateData && window.templateData.targetPage ? window.templateData.targetPage : 0, a = r.closest(".newspaper-page-container, .piece-page-container");
  let l = null, c = null;
  if (a) {
    l = a.getAttribute("data-page-icon-type"), a.querySelector(".part-number") && (l = "part-number");
    const g = a.querySelector(".page-indicator");
    if (g) {
      const u = g.cloneNode(!0);
      u.querySelectorAll("i").forEach((m) => m.remove()), u.querySelectorAll('[class*="target-page-dot"], .target-page-indicator').forEach((m) => m.remove()), c = u.textContent.trim();
    }
  }
  n.show(r.src, r.alt, e, o, s, i, l, c);
}
function k() {
  document.getElementById("pageModal").classList.add("hidden");
}
function V() {
  if (window.pageObserver && (window.pageObserver.disconnect(), window.pageObserver = null), window.currentPageContainers = Array.from(document.querySelectorAll(".newspaper-page-container")), window.currentActiveIndex = 0, f(), document.querySelector(".newspaper-page-container")) {
    let e = /* @__PURE__ */ new Set();
    window.pageObserver = new IntersectionObserver(
      (t) => {
        if (t.forEach((i) => {
          const n = window.currentPageContainers.indexOf(i.target);
          n !== -1 && (i.isIntersecting ? e.add(n) : e.delete(n));
        }), e.size > 0) {
          const n = Array.from(e).sort((o, s) => o - s)[0];
          n !== window.currentActiveIndex && (window.currentActiveIndex = n, f());
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
function $() {
  if (window.currentActiveIndex > 0) {
    let r = -1;
    const e = [];
    window.currentPageContainers.forEach((i, n) => {
      const o = i.getBoundingClientRect(), s = window.innerHeight, a = Math.max(o.top, 0), l = Math.min(o.bottom, s), c = Math.max(0, l - a), d = o.height;
      c / d >= 0.3 && e.push(n);
    });
    const t = Math.min(...e);
    for (let i = t - 1; i >= 0; i--)
      if (!e.includes(i)) {
        r = i;
        break;
      }
    r === -1 && t > 0 && (r = t - 1), r >= 0 && (window.currentActiveIndex = r, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      block: "start"
    }), setTimeout(() => {
      f();
    }, 100));
  }
}
function M() {
  if (window.currentActiveIndex < window.currentPageContainers.length - 1) {
    let r = -1;
    const e = [];
    window.currentPageContainers.forEach((i, n) => {
      const o = i.getBoundingClientRect(), s = window.innerHeight, a = Math.max(o.top, 0), l = Math.min(o.bottom, s), c = Math.max(0, l - a), d = o.height;
      c / d >= 0.3 && e.push(n);
    });
    const t = Math.max(...e);
    for (let i = t + 1; i < window.currentPageContainers.length; i++)
      if (!e.includes(i)) {
        r = i;
        break;
      }
    r === -1 && t < window.currentPageContainers.length - 1 && (r = t + 1), r >= 0 && r < window.currentPageContainers.length && (window.currentActiveIndex = r, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      block: "start"
    }), setTimeout(() => {
      f();
    }, 100));
  }
}
function R() {
  if (E()) {
    const e = document.querySelector("#newspaper-content .newspaper-page-container");
    e && e.scrollIntoView({
      block: "start"
    });
  } else {
    const e = document.querySelector('[data-beilage="true"]');
    if (e)
      e.scrollIntoView({
        block: "start"
      });
    else {
      const t = document.querySelector(".bg-amber-50");
      t && t.scrollIntoView({
        block: "start"
      });
    }
  }
}
function E() {
  const r = [];
  window.currentPageContainers.forEach((e, t) => {
    const i = e.getBoundingClientRect(), n = window.innerHeight, o = Math.max(i.top, 0), s = Math.min(i.bottom, n), a = Math.max(0, s - o), l = i.height;
    a / l >= 0.3 && r.push(t);
  });
  for (const e of r) {
    const t = window.currentPageContainers[e];
    if (t && t.id && t.id.includes("beilage-"))
      return !0;
  }
  return !1;
}
function f() {
  const r = document.getElementById("prevPageBtn"), e = document.getElementById("nextPageBtn"), t = document.getElementById("beilageBtn");
  if (r && (r.style.display = "flex", window.currentActiveIndex <= 0 ? (r.disabled = !0, r.classList.add("opacity-50", "cursor-not-allowed"), r.classList.remove("hover:bg-gray-200")) : (r.disabled = !1, r.classList.remove("opacity-50", "cursor-not-allowed"), r.classList.add("hover:bg-gray-200"))), e && (e.style.display = "flex", window.currentActiveIndex >= window.currentPageContainers.length - 1 ? (e.disabled = !0, e.classList.add("opacity-50", "cursor-not-allowed"), e.classList.remove("hover:bg-gray-200")) : (e.disabled = !1, e.classList.remove("opacity-50", "cursor-not-allowed"), e.classList.add("hover:bg-gray-200"))), t) {
    const i = E(), n = t.querySelector("i");
    i ? (t.title = "Zur Hauptausgabe", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", n && (n.className = "ri-file-text-line text-lg lg:text-xl")) : (t.title = "Zu Beilage", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", n && (n.className = "ri-attachment-line text-lg lg:text-xl"));
  }
}
function z() {
  const r = document.getElementById("shareLinkBtn");
  let e = "";
  if (window.currentActiveIndex !== void 0 && window.currentPageContainers && window.currentPageContainers[window.currentActiveIndex]) {
    const n = window.currentPageContainers[window.currentActiveIndex].querySelector("[data-page]");
    n && (e = `/${n.getAttribute("data-page")}`);
  }
  const t = window.location.origin + window.location.pathname + e;
  navigator.share ? navigator.share({
    title: document.title,
    url: t
  }).catch((i) => {
    S(t, r);
  }) : S(t, r);
}
function S(r, e) {
  if (navigator.clipboard)
    navigator.clipboard.writeText(r).then(() => {
      h(e, "Link kopiert!");
    }).catch((t) => {
      h(e, "Kopieren fehlgeschlagen");
    });
  else {
    const t = document.createElement("textarea");
    t.value = r, document.body.appendChild(t), t.select();
    try {
      const i = document.execCommand("copy");
      h(e, i ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(t);
    }
  }
}
function O() {
  const r = document.getElementById("citationBtn"), e = document.title || "KGPZ";
  let t = window.location.origin + window.location.pathname;
  t.includes("#") && (t = t.split("#")[0]);
  const i = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), n = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${e}. Digital verfügbar unter: ${t} (Zugriff: ${i}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(n).then(() => {
      h(r, "Zitation kopiert!");
    }).catch((o) => {
      h(r, "Kopieren fehlgeschlagen");
    });
  else {
    const o = document.createElement("textarea");
    o.value = n, document.body.appendChild(o), o.select();
    try {
      const s = document.execCommand("copy");
      h(r, s ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(r, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(o);
    }
  }
}
function h(r, e) {
  const t = document.querySelector(".simple-popup");
  t && t.remove();
  const i = document.createElement("div");
  i.className = "simple-popup", i.textContent = e, i.style.cssText = `
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
  const n = r.getBoundingClientRect(), o = window.innerHeight, s = window.innerWidth;
  let a = n.left - 10, l = n.bottom + 8;
  const c = 120, d = 32;
  a + c > s && (a = n.right - c + 10), l + d > o && (l = n.top - d - 8), i.style.left = Math.max(5, a) + "px", i.style.top = Math.max(5, l) + "px", document.body.appendChild(i), setTimeout(() => {
    i.style.opacity = "1";
  }, 10), setTimeout(() => {
    i.style.opacity = "0", setTimeout(() => {
      i.parentNode && i.remove();
    }, 200);
  }, 2e3);
}
function K(r, e, t = !1) {
  let i = "";
  if (t)
    i = window.location.origin + window.location.pathname + `#beilage-1-page-${r}`;
  else {
    const o = window.location.pathname.split("/");
    if (o.length >= 3) {
      const s = o[1], a = o[2];
      i = `${window.location.origin}/${s}/${a}/${r}`;
    } else
      i = window.location.origin + window.location.pathname + `/${r}`;
  }
  const n = i;
  if (navigator.clipboard)
    navigator.clipboard.writeText(n).then(() => {
      h(e, "Link kopiert!");
    }).catch((o) => {
      h(e, "Kopieren fehlgeschlagen");
    });
  else {
    const o = document.createElement("textarea");
    o.value = n, document.body.appendChild(o), o.select();
    try {
      const s = document.execCommand("copy");
      h(e, s ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(o);
    }
  }
}
function D(r, e) {
  const t = document.title || "KGPZ", i = window.location.pathname.split("/");
  let n;
  if (i.length >= 3) {
    const l = i[1], c = i[2];
    n = `${window.location.origin}/${l}/${c}/${r}`;
  } else
    n = `${window.location.origin}${window.location.pathname}/${r}`;
  const o = n, s = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), a = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${t}, Seite ${r}. Digital verfügbar unter: ${o} (Zugriff: ${s}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(a).then(() => {
      h(e, "Zitation kopiert!");
    }).catch((l) => {
      h(e, "Kopieren fehlgeschlagen");
    });
  else {
    const l = document.createElement("textarea");
    l.value = a, document.body.appendChild(l), l.select();
    try {
      const c = document.execCommand("copy");
      h(e, c ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(l);
    }
  }
}
function P() {
  V(), window.addEventListener("scroll", function() {
    clearTimeout(window.scrollTimeout), window.scrollTimeout = setTimeout(() => {
      f();
    }, 50);
  }), document.addEventListener("keydown", function(r) {
    r.key === "Escape" && k();
  });
}
function w() {
  const r = window.location.pathname;
  document.querySelectorAll(".citation-link[data-citation-url]").forEach((t) => {
    const i = t.getAttribute("data-citation-url");
    let n = !1;
    if (i === r)
      n = !0;
    else {
      const o = r.match(/^\/(\d{4})\/(\d+)(?:\/(\d+))?$/), s = i.match(/^\/(\d{4})\/(\d+)$/);
      if (o && s) {
        const [, a, l, c] = o, [, d, g] = s;
        a === d && l === g && (n = !0);
      }
    }
    n ? (t.classList.add("text-red-700", "pointer-events-none"), t.setAttribute("aria-current", "page")) : (t.classList.remove("text-red-700", "pointer-events-none"), t.removeAttribute("aria-current"));
  });
}
function C() {
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
let v = [];
window.ExecuteNextSettle = function(r) {
  typeof r == "function" && v.push(r);
};
function j() {
  for (; v.length > 0; ) {
    const r = v.shift();
    try {
      r();
    } catch (e) {
      console.error("Error executing settle queue function:", e);
    }
  }
}
window.enlargePage = q;
window.closeModal = k;
window.scrollToPreviousPage = $;
window.scrollToNextPage = M;
window.scrollToBeilage = R;
window.shareCurrentPage = z;
window.generateCitation = O;
window.copyPagePermalink = K;
window.generatePageCitation = D;
function W() {
  C(), w(), document.querySelector(".newspaper-page-container") && P();
  let r = function(t) {
    C(), w(), j(), setTimeout(() => {
      document.querySelector(".newspaper-page-container") && P();
    }, 50);
  }, e = function(t) {
  };
  document.body.addEventListener("htmx:afterSettle", r), document.body.addEventListener("htmx:afterSettle", w), document.body.addEventListener("htmx:beforeRequest", e);
}
export {
  W as setup
};
