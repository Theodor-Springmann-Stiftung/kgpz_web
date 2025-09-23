class E extends HTMLElement {
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
        const n = e.getAttribute("data-target"), r = document.getElementById(n);
        r && (this.updateActiveLinkImmediate(n), this.manualNavigation = !0, r.scrollIntoView({
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
    const i = t.getBoundingClientRect(), n = parseFloat(e.style.top), r = parseFloat(e.style.height), s = n + r, a = t.scrollTop, l = a + i.height;
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
        const r = n.getAttribute("id"), s = n.querySelector(".akteur-werke-section"), a = n.querySelector(".akteur-beitraege-section");
        let l = !1;
        if (s) {
          const c = s.getBoundingClientRect(), d = c.top < window.innerHeight, u = c.bottom > 0;
          d && u && (l = !0);
        }
        if (a && !l) {
          const c = a.getBoundingClientRect(), d = c.top < window.innerHeight, u = c.bottom > 0;
          d && u && (l = !0);
        }
        if (!s && !a) {
          const c = n.querySelector("div:first-child");
          if (c) {
            const d = c.getBoundingClientRect(), u = d.top >= 0, g = d.bottom <= window.innerHeight;
            u && g && (l = !0);
          }
        }
        l && e.push(r);
      });
    } catch {
      return;
    }
    const t = [], i = document.getElementById("scrollspy-slider");
    if (this.navLinks.forEach((n) => {
      n.classList.remove("font-medium");
      const r = n.getAttribute("data-target");
      e.includes(r) && (n.classList.add("font-medium"), t.push(n));
    }), t.length > 0 && i) {
      const n = document.getElementById("scrollspy-nav"), r = n.getBoundingClientRect();
      let s = 1 / 0, a = -1 / 0;
      t.forEach((c) => {
        const d = c.getBoundingClientRect(), u = d.top - r.top + n.scrollTop, g = u + d.height;
        s = Math.min(s, u), a = Math.max(a, g);
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
        const r = n.getBoundingClientRect(), s = i.getBoundingClientRect(), a = s.top - r.top + n.scrollTop;
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
    ), r = window.innerHeight, s = n - r, a = s > 0 ? window.scrollY / s : 0, l = t.clientHeight, d = t.scrollHeight - l;
    if (d > 0) {
      const u = a * d, g = i.getBoundingClientRect(), h = t.getBoundingClientRect(), m = g.top - h.top + t.scrollTop, f = l / 2, I = m - f, v = 0.7, L = v * u + (1 - v) * I, x = Math.max(0, Math.min(d, L)), H = t.scrollTop;
      Math.abs(x - H) > 10 && t.scrollTo({
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
customElements.define("akteure-scrollspy", E);
class B extends HTMLElement {
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
								class="w-full h-auto rounded-lg shadow-2xl cursor-zoom-out"
								onclick="this.closest('single-page-viewer').close()"
								title="Klicken zum Schließen"
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
  show(e, t, i, n = !1, r = 0, s = null, a = null, l = null) {
    const c = this.querySelector("#single-page-image"), d = this.querySelector("#page-number"), u = this.querySelector("#page-icon");
    this.querySelector("#page-indicator"), c.src = e, c.alt = t, this.currentPageNumber = i, this.currentIsBeilage = n, this.currentPartNumber = s;
    let g;
    if (l)
      g = l;
    else {
      const m = this.getIssueContext(i);
      g = m ? `${m}, ${i}` : `${i}`;
    }
    if (d.innerHTML = g, r && i === r) {
      d.style.position = "relative";
      const m = d.querySelector(".target-page-dot");
      m && m.remove();
      const f = document.createElement("span");
      f.className = "target-page-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10", f.title = "verlinkte Seite", d.appendChild(f);
    }
    a ? a === "part-number" && s !== null ? u.innerHTML = `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${s}. Teil</span>` : u.innerHTML = this.generateIconFromType(a) : u.innerHTML = this.generateFallbackIcon(i, n, s), this.updateNavigationButtons(), this.style.display = "block";
    const h = this.querySelector(".flex-1.overflow-auto");
    h && (h.scrollTop = 0), document.body.style.overflow = "hidden";
  }
  close() {
    this.style.display = "none", document.body.style.overflow = "";
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
    let r = null, s = null;
    return n > 0 && (r = i[n - 1]), n < i.length - 1 && (s = i[n + 1]), console.log("Adjacent pages - prev:", r, "next:", s), { prevPage: r, nextPage: s };
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
        let r = null;
        this.currentPartNumber !== null && (r = this.getPartNumberForPage(e));
        let s = null, a = null;
        s = i.getAttribute("data-page-icon-type"), i.querySelector(".part-number") && (s = "part-number");
        const c = i.querySelector(".page-indicator");
        if (c) {
          const d = c.cloneNode(!0);
          d.querySelectorAll("i").forEach((h) => h.remove()), d.querySelectorAll(
            '[class*="target-page-dot"], .target-page-indicator'
          ).forEach((h) => h.remove()), a = d.textContent.trim();
        }
        this.show(
          n.src,
          n.alt,
          e,
          this.currentIsBeilage,
          0,
          r,
          s,
          a
        );
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
    const e = this.querySelector("#sidebar-spacer"), t = this.querySelector("#sidebar-toggle-btn"), i = t.querySelector("i"), n = e.style.width, r = n === "0px" || n === "0";
    if (console.log("Current state - isCollapsed:", r), console.log("Current width:", n), r) {
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
          const d = c.textContent.trim(), u = d.match(/(\d{1,2}\.\d{1,2}\.\d{4}\s+Nr\.\s+\d+)/);
          if (u)
            return u[1];
          const g = d.match(/(\d{4})\s+Nr\.\s+(\d+)/);
          if (g)
            return `${g[1]} Nr. ${g[2]}`;
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
    const r = document.querySelector(".page-indicator");
    if (r) {
      const a = r.textContent.trim().match(/(\d{4})\s+Nr\.\s+(\d+)/);
      if (a)
        return `${a[1]} Nr. ${a[2]}`;
    }
    return "KGPZ";
  }
}
customElements.define("single-page-viewer", B);
document.body.addEventListener("htmx:beforeRequest", function(o) {
  const e = document.querySelector("single-page-viewer");
  e && e.style.display !== "none" && (console.log("Cleaning up single page viewer before HTMX navigation"), e.close());
});
window.addEventListener("beforeunload", function() {
  const o = document.querySelector("single-page-viewer");
  o && o.close();
});
class A extends HTMLElement {
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
customElements.define("scroll-to-top-button", A);
window.currentPageContainers = window.currentPageContainers || [];
window.currentActiveIndex = window.currentActiveIndex || 0;
window.pageObserver = window.pageObserver || null;
function N(o, e, t, i = null) {
  let n = document.querySelector("single-page-viewer");
  n || (n = document.createElement("single-page-viewer"), document.body.appendChild(n));
  const r = o.closest('[data-beilage="true"]') !== null, s = window.templateData && window.templateData.targetPage ? window.templateData.targetPage : 0, a = o.closest(".newspaper-page-container, .piece-page-container");
  let l = null, c = null;
  if (a) {
    l = a.getAttribute("data-page-icon-type"), a.querySelector(".part-number") && (l = "part-number");
    const u = a.querySelector(".page-indicator");
    if (u) {
      const g = u.cloneNode(!0);
      g.querySelectorAll("i").forEach((f) => f.remove()), g.querySelectorAll('[class*="target-page-dot"], .target-page-indicator').forEach((f) => f.remove()), c = g.textContent.trim();
    }
  }
  n.show(o.src, o.alt, e, r, s, i, l, c);
}
function C() {
  document.getElementById("pageModal").classList.add("hidden");
}
function q() {
  if (window.pageObserver && (window.pageObserver.disconnect(), window.pageObserver = null), window.currentPageContainers = Array.from(document.querySelectorAll(".newspaper-page-container")), window.currentActiveIndex = 0, b(), document.querySelector(".newspaper-page-container")) {
    let e = /* @__PURE__ */ new Set();
    window.pageObserver = new IntersectionObserver(
      (t) => {
        if (t.forEach((i) => {
          const n = window.currentPageContainers.indexOf(i.target);
          n !== -1 && (i.isIntersecting ? e.add(n) : e.delete(n));
        }), e.size > 0) {
          const n = Array.from(e).sort((r, s) => r - s)[0];
          n !== window.currentActiveIndex && (window.currentActiveIndex = n, b());
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
    let o = -1;
    const e = [];
    window.currentPageContainers.forEach((i, n) => {
      const r = i.getBoundingClientRect(), s = window.innerHeight, a = Math.max(r.top, 0), l = Math.min(r.bottom, s), c = Math.max(0, l - a), d = r.height;
      c / d >= 0.3 && e.push(n);
    });
    const t = Math.min(...e);
    for (let i = t - 1; i >= 0; i--)
      if (!e.includes(i)) {
        o = i;
        break;
      }
    o === -1 && t > 0 && (o = t - 1), o >= 0 && (window.currentActiveIndex = o, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      block: "start"
    }), setTimeout(() => {
      b();
    }, 100));
  }
}
function M() {
  if (window.currentActiveIndex < window.currentPageContainers.length - 1) {
    let o = -1;
    const e = [];
    window.currentPageContainers.forEach((i, n) => {
      const r = i.getBoundingClientRect(), s = window.innerHeight, a = Math.max(r.top, 0), l = Math.min(r.bottom, s), c = Math.max(0, l - a), d = r.height;
      c / d >= 0.3 && e.push(n);
    });
    const t = Math.max(...e);
    for (let i = t + 1; i < window.currentPageContainers.length; i++)
      if (!e.includes(i)) {
        o = i;
        break;
      }
    o === -1 && t < window.currentPageContainers.length - 1 && (o = t + 1), o >= 0 && o < window.currentPageContainers.length && (window.currentActiveIndex = o, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      block: "start"
    }), setTimeout(() => {
      b();
    }, 100));
  }
}
function R() {
  if (T()) {
    const e = document.querySelector("#newspaper-content .newspaper-page-container");
    e && e.scrollIntoView({
      block: "start"
    });
  } else {
    const e = document.querySelector('[class*="border-t-2 border-amber-200"]');
    e && e.scrollIntoView({
      block: "start"
    });
  }
}
function T() {
  const o = [];
  window.currentPageContainers.forEach((e, t) => {
    const i = e.getBoundingClientRect(), n = window.innerHeight, r = Math.max(i.top, 0), s = Math.min(i.bottom, n), a = Math.max(0, s - r), l = i.height;
    a / l >= 0.3 && o.push(t);
  });
  for (const e of o) {
    const t = window.currentPageContainers[e];
    if (t && t.id && t.id.includes("beilage-"))
      return !0;
  }
  return !1;
}
function b() {
  const o = document.getElementById("prevPageBtn"), e = document.getElementById("nextPageBtn"), t = document.getElementById("beilageBtn");
  if (o && (o.style.display = "flex", window.currentActiveIndex <= 0 ? (o.disabled = !0, o.classList.add("opacity-50", "cursor-not-allowed"), o.classList.remove("hover:bg-gray-200")) : (o.disabled = !1, o.classList.remove("opacity-50", "cursor-not-allowed"), o.classList.add("hover:bg-gray-200"))), e && (e.style.display = "flex", window.currentActiveIndex >= window.currentPageContainers.length - 1 ? (e.disabled = !0, e.classList.add("opacity-50", "cursor-not-allowed"), e.classList.remove("hover:bg-gray-200")) : (e.disabled = !1, e.classList.remove("opacity-50", "cursor-not-allowed"), e.classList.add("hover:bg-gray-200"))), t) {
    const i = T(), n = t.querySelector("i");
    i ? (t.title = "Zur Hauptausgabe", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", n && (n.className = "ri-file-text-line text-lg lg:text-xl")) : (t.title = "Zu Beilage", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", n && (n.className = "ri-attachment-line text-lg lg:text-xl"));
  }
}
function z() {
  const o = document.getElementById("shareLinkBtn");
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
    S(t, o);
  }) : S(t, o);
}
function S(o, e) {
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
      const i = document.execCommand("copy");
      p(e, i ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      p(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(t);
    }
  }
}
function V() {
  const o = document.getElementById("citationBtn"), e = document.title || "KGPZ";
  let t = window.location.origin + window.location.pathname;
  t.includes("#") && (t = t.split("#")[0]);
  const i = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), n = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${e}. Digital verfügbar unter: ${t} (Zugriff: ${i}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(n).then(() => {
      p(o, "Zitation kopiert!");
    }).catch((r) => {
      p(o, "Kopieren fehlgeschlagen");
    });
  else {
    const r = document.createElement("textarea");
    r.value = n, document.body.appendChild(r), r.select();
    try {
      const s = document.execCommand("copy");
      p(o, s ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
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
  const n = o.getBoundingClientRect(), r = window.innerHeight, s = window.innerWidth;
  let a = n.left - 10, l = n.bottom + 8;
  const c = 120, d = 32;
  a + c > s && (a = n.right - c + 10), l + d > r && (l = n.top - d - 8), i.style.left = Math.max(5, a) + "px", i.style.top = Math.max(5, l) + "px", document.body.appendChild(i), setTimeout(() => {
    i.style.opacity = "1";
  }, 10), setTimeout(() => {
    i.style.opacity = "0", setTimeout(() => {
      i.parentNode && i.remove();
    }, 200);
  }, 2e3);
}
function O(o, e, t = !1) {
  let i = "";
  if (t)
    i = window.location.origin + window.location.pathname + `#beilage-1-page-${o}`;
  else {
    const r = window.location.pathname.split("/");
    if (r.length >= 3) {
      const s = r[1], a = r[2];
      i = `${window.location.origin}/${s}/${a}/${o}`;
    } else
      i = window.location.origin + window.location.pathname + `/${o}`;
  }
  const n = i;
  if (navigator.clipboard)
    navigator.clipboard.writeText(n).then(() => {
      p(e, "Link kopiert!");
    }).catch((r) => {
      p(e, "Kopieren fehlgeschlagen");
    });
  else {
    const r = document.createElement("textarea");
    r.value = n, document.body.appendChild(r), r.select();
    try {
      const s = document.execCommand("copy");
      p(e, s ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      p(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(r);
    }
  }
}
function D(o, e) {
  const t = document.title || "KGPZ", i = window.location.pathname.split("/");
  let n;
  if (i.length >= 3) {
    const l = i[1], c = i[2];
    n = `${window.location.origin}/${l}/${c}/${o}`;
  } else
    n = `${window.location.origin}${window.location.pathname}/${o}`;
  const r = n, s = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), a = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${t}, Seite ${o}. Digital verfügbar unter: ${r} (Zugriff: ${s}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(a).then(() => {
      p(e, "Zitation kopiert!");
    }).catch((l) => {
      p(e, "Kopieren fehlgeschlagen");
    });
  else {
    const l = document.createElement("textarea");
    l.value = a, document.body.appendChild(l), l.select();
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
  q(), window.addEventListener("scroll", function() {
    clearTimeout(window.scrollTimeout), window.scrollTimeout = setTimeout(() => {
      b();
    }, 50);
  }), document.addEventListener("keydown", function(o) {
    o.key === "Escape" && C();
  });
}
function w() {
  const o = window.location.pathname;
  document.querySelectorAll(".citation-link[data-citation-url]").forEach((t) => {
    const i = t.getAttribute("data-citation-url");
    let n = !1;
    if (i === o)
      n = !0;
    else {
      const r = o.match(/^\/(\d{4})\/(\d+)(?:\/(\d+))?$/), s = i.match(/^\/(\d{4})\/(\d+)$/);
      if (r && s) {
        const [, a, l, c] = r, [, d, u] = s;
        a === d && l === u && (n = !0);
      }
    }
    n ? (t.classList.add("text-red-700", "pointer-events-none"), t.setAttribute("aria-current", "page")) : (t.classList.remove("text-red-700", "pointer-events-none"), t.removeAttribute("aria-current"));
  });
}
function P() {
  const o = window.location.pathname, e = document.body;
  e.classList.remove(
    "page-akteure",
    "page-ausgabe",
    "page-search",
    "page-ort",
    "page-kategorie",
    "page-piece",
    "page-edition"
  ), o.includes("/akteure/") || o.includes("/autoren") ? e.classList.add("page-akteure") : o.match(/\/\d{4}\/\d+/) ? e.classList.add("page-ausgabe") : o.includes("/search") || o.includes("/suche") ? e.classList.add("page-search") : o.includes("/ort/") ? e.classList.add("page-ort") : o.includes("/kategorie/") ? e.classList.add("page-kategorie") : o.includes("/beitrag/") ? e.classList.add("page-piece") : o.includes("/edition") && e.classList.add("page-edition");
}
let y = [];
window.ExecuteNextSettle = function(o) {
  typeof o == "function" && y.push(o);
};
function K() {
  for (; y.length > 0; ) {
    const o = y.shift();
    try {
      o();
    } catch (e) {
      console.error("Error executing settle queue function:", e);
    }
  }
}
window.enlargePage = N;
window.closeModal = C;
window.scrollToPreviousPage = $;
window.scrollToNextPage = M;
window.scrollToBeilage = R;
window.shareCurrentPage = z;
window.generateCitation = V;
window.copyPagePermalink = O;
window.generatePageCitation = D;
function W() {
  P(), w(), document.querySelector(".newspaper-page-container") && k();
  let o = function(t) {
    P(), w(), K(), setTimeout(() => {
      document.querySelector(".newspaper-page-container") && k();
    }, 50);
  }, e = function(t) {
  };
  document.body.addEventListener("htmx:afterSettle", o), document.body.addEventListener("htmx:afterSettle", w), document.body.addEventListener("htmx:beforeRequest", e);
}
export {
  W as setup
};
