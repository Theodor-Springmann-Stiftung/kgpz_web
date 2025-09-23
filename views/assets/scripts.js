class T extends HTMLElement {
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
      const i = (t) => {
        t.preventDefault();
        const n = e.getAttribute("data-target"), o = document.getElementById(n);
        o && (this.updateActiveLinkImmediate(n), this.manualNavigation = !0, o.scrollIntoView({
          behavior: "smooth",
          block: "start"
        }), setTimeout(() => {
          this.manualNavigation = !1, this.ensureMarkerVisibility();
        }, 1e3));
      };
      this.clickHandlers.push({ link: e, handler: i }), e.addEventListener("click", i);
    }), this.updateActiveLink(), this.updateSidebarScrollToTopButton();
  }
  ensureMarkerVisibility() {
    const e = document.getElementById("scrollspy-slider"), i = document.getElementById("scrollspy-nav");
    if (!e || !i || e.style.opacity === "0")
      return;
    const t = i.getBoundingClientRect(), n = parseFloat(e.style.top), o = parseFloat(e.style.height), r = n + o, a = i.scrollTop, l = a + t.height;
    if (r > l) {
      const c = r - t.height + 20;
      i.scrollTo({
        top: c,
        behavior: "smooth"
      });
    } else if (n < a) {
      const c = n - 20;
      i.scrollTo({
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
        const o = n.getAttribute("id"), r = n.querySelector(".akteur-werke-section"), a = n.querySelector(".akteur-beitraege-section");
        let l = !1;
        if (r) {
          const c = r.getBoundingClientRect(), d = c.top < window.innerHeight, g = c.bottom > 0;
          d && g && (l = !0);
        }
        if (a && !l) {
          const c = a.getBoundingClientRect(), d = c.top < window.innerHeight, g = c.bottom > 0;
          d && g && (l = !0);
        }
        if (!r && !a) {
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
    const i = [], t = document.getElementById("scrollspy-slider");
    if (this.navLinks.forEach((n) => {
      n.classList.remove("font-medium");
      const o = n.getAttribute("data-target");
      e.includes(o) && (n.classList.add("font-medium"), i.push(n));
    }), i.length > 0 && t) {
      const n = document.getElementById("scrollspy-nav"), o = n.getBoundingClientRect();
      let r = 1 / 0, a = -1 / 0;
      i.forEach((c) => {
        const d = c.getBoundingClientRect(), g = d.top - o.top + n.scrollTop, u = g + d.height;
        r = Math.min(r, g), a = Math.max(a, u);
      });
      let l = a - r;
      t.style.top = `${r}px`, t.style.height = `${l}px`, t.style.opacity = "1", setTimeout(() => this.ensureMarkerVisibility(), 100);
    } else t && (t.style.opacity = "0");
    i.length > 0 && this.updateSidebarScroll(i);
  }
  updateActiveLinkImmediate(e) {
    if (!this.navLinks) return;
    const i = document.getElementById("scrollspy-slider");
    try {
      this.navLinks.forEach((n) => {
        n && n.classList && n.classList.remove("font-medium");
      });
    } catch {
      return;
    }
    const t = document.querySelector(`[data-target="${e}"]`);
    if (t && (t.classList.add("font-medium"), i)) {
      const n = document.getElementById("scrollspy-nav");
      if (n) {
        const o = n.getBoundingClientRect(), r = t.getBoundingClientRect(), a = r.top - o.top + n.scrollTop;
        i.style.top = `${a}px`, i.style.height = `${r.height}px`, i.style.opacity = "1";
      }
    }
  }
  updateSidebarScroll(e) {
    if (this.manualNavigation) return;
    const i = document.getElementById("scrollspy-nav");
    if (!i) return;
    const t = e[0], n = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    ), o = window.innerHeight, r = n - o, a = r > 0 ? window.scrollY / r : 0, l = i.clientHeight, d = i.scrollHeight - l;
    if (d > 0) {
      const g = a * d, u = t.getBoundingClientRect(), p = i.getBoundingClientRect(), f = u.top - p.top + i.scrollTop, m = l / 2, E = f - m, y = 0.7, H = y * g + (1 - y) * E, x = Math.max(0, Math.min(d, H)), I = i.scrollTop;
      Math.abs(x - I) > 10 && i.scrollTo({
        top: x,
        behavior: "smooth"
      });
    }
  }
  updateSidebarScrollToTopButton() {
    const e = document.getElementById("sidebar-scroll-to-top");
    if (!e) return;
    const i = window.pageYOffset || document.documentElement.scrollTop, t = window.innerHeight;
    i > t * 0.5 ? (e.classList.remove("opacity-0"), e.classList.add("opacity-100")) : (e.classList.remove("opacity-100"), e.classList.add("opacity-0"));
  }
  cleanup() {
    this.scrollHandler && (window.removeEventListener("scroll", this.scrollHandler), this.scrollHandler = null), this.scrollTimeout && (clearTimeout(this.scrollTimeout), this.scrollTimeout = null), this.clickHandlers && this.clickHandlers.length > 0 && this.clickHandlers.forEach(({ link: i, handler: t }) => {
      i && t && i.removeEventListener("click", t);
    });
    const e = document.getElementById("scrollspy-slider");
    e && (e.style.opacity = "0", e.style.height = "0"), this.sections = null, this.navLinks = null, this.clickHandlers = [], this.manualNavigation = !1;
  }
}
customElements.define("akteure-scrollspy", T);
class A extends HTMLElement {
  constructor() {
    super(), this.resizeObserver = null, this.zoomLevel = 1, this.minZoom = 1, this.maxZoom = 4, this.panX = 0, this.panY = 0, this.isDragging = !1, this.lastMouseX = 0, this.lastMouseY = 0;
  }
  // Dynamically detect sidebar width in pixels
  detectSidebarWidth() {
    const e = document.querySelector('.lg\\:w-1\\/4, .lg\\:w-1\\/3, [class*="lg:w-1/"]');
    if (e) {
      const n = e.getBoundingClientRect().width;
      return console.log("Detected sidebar width:", n, "px"), `${n}px`;
    }
    const i = window.innerWidth;
    return i < 1024 ? "0px" : i < 1280 ? `${Math.floor(i * 0.25)}px` : `${Math.floor(i * 0.2)}px`;
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

								<!-- Zoom level indicator -->
								<div id="zoom-level-display" class="bg-purple-50 border border-purple-200 rounded px-3 py-2 text-purple-700 text-sm font-medium whitespace-nowrap">
									Strg + Mausrad oder +/- für Zoom
								</div>

								<!-- Reset zoom button -->
								<button
									id="zoom-reset-btn"
									onclick="this.closest('single-page-viewer').resetZoom()"
									class="w-10 h-10 bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer"
									title="Zoom zurücksetzen (100%)">
									<i class="ri-fullscreen-exit-line text-lg font-bold"></i>
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
						<div id="image-scroll-container" class="flex-1 flex items-center justify-center p-4 pb-8 overflow-auto relative">
							<div id="image-container" class="relative">
								<img
									id="single-page-image"
									src=""
									alt=""
									class="rounded-lg shadow-2xl cursor-zoom-in select-none"
									style="transform: scale(1) translate3d(0px, 0px, 0); transform-origin: center center; will-change: transform;"
									title="Zoom mit Strg + Mausrad oder +/- Tasten"
									draggable="false"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		`, this.setupResizeObserver(), this.setupKeyboardNavigation(), this.setupZoomEvents();
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
      const i = this.detectSidebarWidth();
      e.style.width = i, console.log("Updated sidebar width to:", i);
    }
  }
  show(e, i, t, n = !1, o = 0, r = null, a = null, l = null) {
    const c = this.querySelector("#single-page-image"), d = this.querySelector("#page-number"), g = this.querySelector("#page-icon");
    this.querySelector("#page-indicator"), c.src = e, c.alt = i, this.currentPageNumber = t, this.currentIsBeilage = n, this.currentPartNumber = r;
    let u;
    if (l)
      u = l;
    else {
      const f = this.getIssueContext(t);
      u = f ? `${f}, ${t}` : `${t}`;
    }
    if (d.innerHTML = u, o && t === o) {
      d.style.position = "relative";
      const f = d.querySelector(".target-page-dot");
      f && f.remove();
      const m = document.createElement("span");
      m.className = "target-page-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10", m.title = "verlinkte Seite", d.appendChild(m);
    }
    a ? a === "part-number" && r !== null ? g.innerHTML = `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${r}. Teil</span>` : g.innerHTML = this.generateIconFromType(a) : g.innerHTML = this.generateFallbackIcon(t, n, r), this.updateNavigationButtons(), this.style.display = "block", this.setAttribute("active", "true"), this.resetZoom();
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
    this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), this.keyboardHandler && (document.removeEventListener("keydown", this.keyboardHandler), this.keyboardHandler = null), this.cleanupZoomEvents(), document.body.style.overflow = "";
  }
  // Clean up zoom event listeners
  cleanupZoomEvents() {
    const e = this.querySelector("#image-scroll-container"), i = this.querySelector("#single-page-image");
    this.wheelHandler && e && (e.removeEventListener("wheel", this.wheelHandler), this.wheelHandler = null), this.mouseDownHandler && i && (i.removeEventListener("mousedown", this.mouseDownHandler), this.mouseDownHandler = null), this.mouseMoveHandler && (document.removeEventListener("mousemove", this.mouseMoveHandler), this.mouseMoveHandler = null), this.mouseUpHandler && (document.removeEventListener("mouseup", this.mouseUpHandler), this.mouseUpHandler = null), this.animationFrameId && (cancelAnimationFrame(this.animationFrameId), this.animationFrameId = null);
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
  // Set up zoom event listeners
  setupZoomEvents() {
    const e = this.querySelector("#single-page-image"), i = this.querySelector("#image-scroll-container");
    this.wheelHandler = (t) => {
      if (this.style.display === "none" || !t.ctrlKey) return;
      t.preventDefault();
      const n = t.deltaY > 0 ? -1 : 1, o = 0.1, r = e.getBoundingClientRect(), a = t.clientX - r.left, l = t.clientY - r.top;
      this.zoom(n * o, a, l);
    }, this.keyboardHandler, this.keyboardHandler = (t) => {
      if (this.style.display !== "none") {
        if (t.key === "+" || t.key === "=") {
          t.preventDefault(), this.zoom(0.1);
          return;
        } else if (t.key === "-") {
          t.preventDefault(), this.zoom(-0.1);
          return;
        }
        switch (t.key) {
          case "ArrowLeft":
            t.preventDefault(), this.goToPreviousPage();
            break;
          case "ArrowRight":
            t.preventDefault(), this.goToNextPage();
            break;
          case "Escape":
            t.preventDefault(), this.close();
            break;
        }
      }
    }, this.mouseDownHandler = (t) => {
      this.style.display === "none" || this.zoomLevel <= 1 || t.button === 0 && (t.preventDefault(), this.isDragging = !0, this.lastMouseX = t.clientX, this.lastMouseY = t.clientY, this.updateCursor());
    }, this.mouseMoveHandler = (t) => {
      if (this.style.display !== "none" && this.isDragging && this.zoomLevel > 1) {
        t.preventDefault();
        const n = t.clientX - this.lastMouseX, o = t.clientY - this.lastMouseY;
        this.panX += n, this.panY += o, this.lastMouseX = t.clientX, this.lastMouseY = t.clientY, this.animationFrameId || (this.animationFrameId = requestAnimationFrame(() => {
          this.updateImageTransform(), this.animationFrameId = null;
        }));
      }
    }, this.mouseUpHandler = (t) => {
      this.isDragging && (this.isDragging = !1, this.updateCursor());
    }, i.addEventListener("wheel", this.wheelHandler, { passive: !1 }), e.addEventListener("mousedown", this.mouseDownHandler), document.addEventListener("mousemove", this.mouseMoveHandler), document.addEventListener("mouseup", this.mouseUpHandler), e.addEventListener("contextmenu", (t) => t.preventDefault());
  }
  // Zoom function
  zoom(e, i = null, t = null) {
    const n = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + e));
    if (n === this.zoomLevel) return;
    const r = this.querySelector("#single-page-image").getBoundingClientRect();
    if (i !== null && t !== null) {
      const a = r.width / 2, l = r.height / 2, c = i - a, d = t - l, g = n / this.zoomLevel;
      this.panX = this.panX * g - c * (g - 1), this.panY = this.panY * g - d * (g - 1);
    } else {
      const a = n / this.zoomLevel;
      this.panX *= a, this.panY *= a;
    }
    this.zoomLevel = n, this.zoomLevel <= 1 && (this.panX = 0, this.panY = 0), this.updateImageTransform(), this.updateCursor(), this.updateZoomDisplay();
  }
  // Update image transform based on zoom and pan
  updateImageTransform() {
    const e = this.querySelector("#single-page-image");
    e.style.transform = `scale(${this.zoomLevel}) translate3d(${this.panX / this.zoomLevel}px, ${this.panY / this.zoomLevel}px, 0)`;
  }
  // Update cursor based on zoom state
  updateCursor() {
    const e = this.querySelector("#single-page-image");
    this.isDragging ? e.style.cursor = "grabbing" : this.zoomLevel > 1 ? this.zoomLevel >= this.maxZoom ? e.style.cursor = "zoom-out" : e.style.cursor = "grab" : e.style.cursor = "zoom-in";
  }
  // Update zoom level display and reset button
  updateZoomDisplay() {
    const e = this.querySelector("#zoom-level-display"), i = this.querySelector("#zoom-reset-btn");
    e && (this.zoomLevel <= this.minZoom ? (e.textContent = "Strg + Mausrad oder +/- für Zoom", i && (i.style.display = "none")) : (e.textContent = `${Math.round(this.zoomLevel * 100)}%`, i && (i.style.display = "flex")));
  }
  // Reset zoom state when showing new image
  resetZoom() {
    this.zoomLevel = 1, this.panX = 0, this.panY = 0, this.isDragging = !1, this.updateImageTransform(), this.updateCursor(), this.updateZoomDisplay();
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
    const e = this.querySelector("#prev-page-btn"), i = this.querySelector("#next-page-btn"), { prevPage: t, nextPage: n } = this.getAdjacentPages();
    t !== null ? (e.disabled = !1, e.className = e.className.replace("opacity-50 cursor-not-allowed", ""), e.className = e.className.replace(
      "bg-gray-50 text-gray-400",
      "bg-gray-100 text-gray-700"
    )) : (e.disabled = !0, e.className.includes("opacity-50") || (e.className += " opacity-50 cursor-not-allowed"), e.className = e.className.replace(
      "bg-gray-100 text-gray-700",
      "bg-gray-50 text-gray-400"
    )), n !== null ? (i.disabled = !1, i.className = i.className.replace("opacity-50 cursor-not-allowed", ""), i.className = i.className.replace(
      "bg-gray-50 text-gray-400",
      "bg-gray-100 text-gray-700"
    )) : (i.disabled = !0, i.className.includes("opacity-50") || (i.className += " opacity-50 cursor-not-allowed"), i.className = i.className.replace(
      "bg-gray-100 text-gray-700",
      "bg-gray-50 text-gray-400"
    ));
  }
  // Get previous and next page numbers
  getAdjacentPages() {
    let e;
    this.currentIsBeilage ? e = '.newspaper-page-container[data-beilage="true"]' : e = ".newspaper-page-container:not([data-beilage])";
    const i = Array.from(document.querySelectorAll(e));
    console.log(
      "Found containers:",
      i.length,
      "for",
      this.currentIsBeilage ? "beilage" : "main"
    );
    const t = i.map((a) => {
      const l = a.getAttribute("data-page-container"), c = l ? parseInt(l) : null;
      return console.log("Container page:", l, "parsed:", c), c;
    }).filter((a) => a !== null).sort((a, l) => a - l);
    console.log("All pages found:", t), console.log("Current page:", this.currentPageNumber);
    const n = t.indexOf(this.currentPageNumber);
    console.log("Current index:", n);
    let o = null, r = null;
    return n > 0 && (o = t[n - 1]), n < t.length - 1 && (r = t[n + 1]), console.log("Adjacent pages - prev:", o, "next:", r), { prevPage: o, nextPage: r };
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
    const i = this.currentIsBeilage ? '.newspaper-page-container[data-beilage="true"]' : ".newspaper-page-container:not([data-beilage])", t = document.querySelector(
      `${i}[data-page-container="${e}"]`
    );
    if (t) {
      const n = t.querySelector(".newspaper-page-image, .piece-page-image");
      if (n) {
        let o = null;
        this.currentPartNumber !== null && (o = this.getPartNumberForPage(e));
        let r = null, a = null;
        r = t.getAttribute("data-page-icon-type"), t.querySelector(".part-number") && (r = "part-number");
        const c = t.querySelector(".page-indicator");
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
          r,
          a
        ), document.dispatchEvent(new CustomEvent("singlepageviewer:pagechanged", {
          detail: { pageNumber: this.currentPageNumber, isBeilage: this.currentIsBeilage }
        }));
      }
    }
  }
  // Get part number for a specific page in piece view
  getPartNumberForPage(e) {
    const i = document.querySelector(`[data-page-container="${e}"]`);
    if (i) {
      const t = i.querySelector(".part-number");
      if (t) {
        const n = t.textContent.match(/(\d+)\./);
        if (n)
          return parseInt(n[1]);
      }
    }
    return null;
  }
  // Legacy fallback icon generation (only used when extraction fails)
  generateFallbackIcon(e, i, t) {
    return t !== null ? `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${t}. Teil</span>` : `<i class="ri-file-text-line text-lg ${i ? "text-amber-600" : "text-black"}"></i>`;
  }
  // Toggle sidebar visibility
  toggleSidebar() {
    const e = this.querySelector("#sidebar-spacer"), i = this.querySelector("#sidebar-toggle-btn"), t = i.querySelector("i"), n = e.style.width, o = n === "0px" || n === "0";
    if (console.log("Current state - isCollapsed:", o), console.log("Current width:", n), o) {
      const r = this.detectSidebarWidth();
      e.style.width = r, i.className = "w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", t.className = "ri-sidebar-fold-line text-lg font-bold", i.title = "Inhaltsverzeichnis ausblenden", console.log("Expanding sidebar to:", r);
    } else
      e.style.width = "0px", i.className = "w-10 h-10 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", t.className = "ri-sidebar-unfold-line text-lg font-bold", i.title = "Inhaltsverzeichnis einblenden", console.log("Collapsing sidebar");
    console.log("New width:", e.style.width);
  }
  // Extract issue context from document title, URL, or page container
  getIssueContext(e) {
    const i = window.location.pathname, t = i.includes("/beitrag/");
    if (t) {
      const r = document.querySelector(`[data-page-container="${e}"]`);
      if (r) {
        const c = r.querySelector(".page-indicator");
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
    const n = i.match(/\/(\d{4})\/(\d+)/);
    if (n)
      return t ? `${n[1]} Nr. ${n[2]}` : "";
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
document.body.addEventListener("htmx:beforeRequest", function(s) {
  const e = document.querySelector("single-page-viewer");
  e && e.style.display !== "none" && (console.log("Cleaning up single page viewer before HTMX navigation"), e.close());
});
window.addEventListener("beforeunload", function() {
  const s = document.querySelector("single-page-viewer");
  s && s.close();
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
    const i = window.pageYOffset || document.documentElement.scrollTop, t = window.innerHeight, n = i > t;
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
class q extends HTMLElement {
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
    e.length !== 0 && (e.forEach((i) => {
      const t = i.getAttribute("data-page-container"), n = i.hasAttribute("data-beilage"), o = this.findInhaltsEntriesForPage(t, n);
      o.length > 0 && this.pageContainers.set(t, {
        container: i,
        entries: o,
        state: "short",
        // Default state
        isBeilage: n
      });
    }), this.pageObserver = new IntersectionObserver((i) => {
      i.forEach((t) => {
        const n = t.target.getAttribute("data-page-container"), o = this.pageContainers.get(n);
        if (o) {
          const a = t.isIntersecting && t.intersectionRatio >= 0.5 || this.singlePageViewerActive ? "full" : "short";
          o.state !== a && (o.state = a, this.updateEntriesState(o));
        }
      });
    }, {
      threshold: [0, 0.5, 1],
      // Watch for 50% threshold
      rootMargin: "0px"
    }), this.pageContainers.forEach(({ container: i }) => {
      this.pageObserver.observe(i);
    }), this.pageContainers.forEach((i) => {
      this.updateEntriesState(i);
    }));
  }
  findInhaltsEntriesForPage(e, i = !1) {
    const t = i ? `[data-page-container="${e}"][data-beilage="true"]` : `[data-page-container="${e}"]:not([data-beilage])`, n = this.querySelector(t);
    return n ? Array.from(n.querySelectorAll(".inhalts-entry")) : [];
  }
  updateEntriesState(e) {
    const { entries: i, state: t } = e;
    t === "full" ? (i.forEach((n) => {
      n.style.display = "";
    }), this.highlightPageElements(e, !0)) : (i.forEach((n) => {
      const o = n.hasAttribute("data-is-continuation");
      n.style.display = o ? "none" : "";
    }), this.highlightPageElements(e, !1));
  }
  highlightPageElements(e, i) {
    var a;
    const t = e.container.getAttribute("data-page-container"), n = this.querySelector(`[data-page-number="${t}"]`);
    (a = n == null ? void 0 : n.closest(".page-entry")) == null || a.querySelector(".icon-container");
    const o = n == null ? void 0 : n.closest(".page-entry");
    o && (i ? (o.classList.add("!border-l-red-500"), o.classList.remove("border-slate-300")) : (o.classList.remove("!border-l-red-500"), o.classList.add("border-slate-300")));
    const r = document.querySelector(`[data-page="${t}"].page-indicator`);
    if (r) {
      const l = r.querySelectorAll("i:not(.text-slate-400)");
      i ? (r.classList.add("!bg-red-50", "!text-red-600"), l.forEach((c) => c.classList.add("!text-red-600"))) : (r.classList.remove("!bg-red-50", "!text-red-600"), l.forEach((c) => c.classList.remove("!text-red-600")));
    }
  }
  setupSinglePageViewerDetection() {
    document.addEventListener("singlepageviewer:opened", this.boundHandleSinglePageViewer), document.addEventListener("singlepageviewer:closed", this.boundHandleSinglePageViewer), document.addEventListener("singlepageviewer:pagechanged", this.boundHandleSinglePageViewer), this.checkSinglePageViewerState();
  }
  handleSinglePageViewer(e) {
    var i;
    this.singlePageViewerActive, this.singlePageViewerActive = e.type === "singlepageviewer:opened" || e.type === "singlepageviewer:pagechanged" && this.singlePageViewerActive, (this.singlePageViewerActive || e.type === "singlepageviewer:pagechanged") && ((i = e.detail) != null && i.pageNumber) ? this.singlePageViewerCurrentPage = e.detail.pageNumber.toString() : e.type === "singlepageviewer:closed" && (this.singlePageViewerCurrentPage = null, this.singlePageViewerActive = !1), this.pageContainers.forEach((t) => {
      const n = t.container.getAttribute("data-page-container");
      let o;
      this.singlePageViewerActive ? o = n === this.singlePageViewerCurrentPage ? "full" : "short" : o = this.isPageContainerVisible(t.container) ? "full" : "short", t.state !== o && (t.state = o, this.updateEntriesState(t));
    });
  }
  checkSinglePageViewerState() {
    const e = document.querySelector("single-page-viewer[active]");
    this.singlePageViewerActive = e !== null;
  }
  isPageContainerVisible(e) {
    const i = e.getBoundingClientRect(), t = window.innerHeight, n = Math.max(i.top, 0), o = Math.min(i.bottom, t), r = Math.max(0, o - n), a = i.height;
    return r / a >= 0.5;
  }
  cleanup() {
    this.pageObserver && (this.pageObserver.disconnect(), this.pageObserver = null), document.removeEventListener("singlepageviewer:opened", this.boundHandleSinglePageViewer), document.removeEventListener("singlepageviewer:closed", this.boundHandleSinglePageViewer), document.removeEventListener("singlepageviewer:pagechanged", this.boundHandleSinglePageViewer), this.pageContainers.clear();
  }
}
customElements.define("inhaltsverzeichnis-scrollspy", q);
window.currentPageContainers = window.currentPageContainers || [];
window.currentActiveIndex = window.currentActiveIndex || 0;
window.pageObserver = window.pageObserver || null;
function N(s, e, i, t = null) {
  let n = document.querySelector("single-page-viewer");
  n || (n = document.createElement("single-page-viewer"), document.body.appendChild(n));
  const o = s.closest('[data-beilage="true"]') !== null, r = window.templateData && window.templateData.targetPage ? window.templateData.targetPage : 0, a = s.closest(".newspaper-page-container, .piece-page-container");
  let l = null, c = null;
  if (a) {
    l = a.getAttribute("data-page-icon-type"), a.querySelector(".part-number") && (l = "part-number");
    const g = a.querySelector(".page-indicator");
    if (g) {
      const u = g.cloneNode(!0);
      u.querySelectorAll("i").forEach((m) => m.remove()), u.querySelectorAll('[class*="target-page-dot"], .target-page-indicator').forEach((m) => m.remove()), c = u.textContent.trim();
    }
  }
  n.show(s.src, s.alt, e, o, r, t, l, c);
}
function k() {
  document.getElementById("pageModal").classList.add("hidden");
}
function M() {
  if (window.pageObserver && (window.pageObserver.disconnect(), window.pageObserver = null), window.currentPageContainers = Array.from(document.querySelectorAll(".newspaper-page-container")), window.currentActiveIndex = 0, b(), document.querySelector(".newspaper-page-container")) {
    let e = /* @__PURE__ */ new Set();
    window.pageObserver = new IntersectionObserver(
      (i) => {
        if (i.forEach((t) => {
          const n = window.currentPageContainers.indexOf(t.target);
          n !== -1 && (t.isIntersecting ? e.add(n) : e.delete(n));
        }), e.size > 0) {
          const n = Array.from(e).sort((o, r) => o - r)[0];
          n !== window.currentActiveIndex && (window.currentActiveIndex = n, b());
        }
      },
      {
        rootMargin: "-20% 0px -70% 0px"
      }
    ), window.currentPageContainers.forEach((i) => {
      window.pageObserver.observe(i);
    });
  }
}
function z() {
  if (window.currentActiveIndex > 0) {
    let s = -1;
    const e = [];
    window.currentPageContainers.forEach((t, n) => {
      const o = t.getBoundingClientRect(), r = window.innerHeight, a = Math.max(o.top, 0), l = Math.min(o.bottom, r), c = Math.max(0, l - a), d = o.height;
      c / d >= 0.3 && e.push(n);
    });
    const i = Math.min(...e);
    for (let t = i - 1; t >= 0; t--)
      if (!e.includes(t)) {
        s = t;
        break;
      }
    s === -1 && i > 0 && (s = i - 1), s >= 0 && (window.currentActiveIndex = s, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      block: "start"
    }), setTimeout(() => {
      b();
    }, 100));
  }
}
function $() {
  if (window.currentActiveIndex < window.currentPageContainers.length - 1) {
    let s = -1;
    const e = [];
    window.currentPageContainers.forEach((t, n) => {
      const o = t.getBoundingClientRect(), r = window.innerHeight, a = Math.max(o.top, 0), l = Math.min(o.bottom, r), c = Math.max(0, l - a), d = o.height;
      c / d >= 0.3 && e.push(n);
    });
    const i = Math.max(...e);
    for (let t = i + 1; t < window.currentPageContainers.length; t++)
      if (!e.includes(t)) {
        s = t;
        break;
      }
    s === -1 && i < window.currentPageContainers.length - 1 && (s = i + 1), s >= 0 && s < window.currentPageContainers.length && (window.currentActiveIndex = s, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      block: "start"
    }), setTimeout(() => {
      b();
    }, 100));
  }
}
function V() {
  if (L()) {
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
function L() {
  const s = [];
  window.currentPageContainers.forEach((e, i) => {
    const t = e.getBoundingClientRect(), n = window.innerHeight, o = Math.max(t.top, 0), r = Math.min(t.bottom, n), a = Math.max(0, r - o), l = t.height;
    a / l >= 0.3 && s.push(i);
  });
  for (const e of s) {
    const i = window.currentPageContainers[e];
    if (i && i.id && i.id.includes("beilage-"))
      return !0;
  }
  return !1;
}
function b() {
  const s = document.getElementById("prevPageBtn"), e = document.getElementById("nextPageBtn"), i = document.getElementById("beilageBtn");
  if (s && (s.style.display = "flex", window.currentActiveIndex <= 0 ? (s.disabled = !0, s.classList.add("opacity-50", "cursor-not-allowed"), s.classList.remove("hover:bg-gray-200")) : (s.disabled = !1, s.classList.remove("opacity-50", "cursor-not-allowed"), s.classList.add("hover:bg-gray-200"))), e && (e.style.display = "flex", window.currentActiveIndex >= window.currentPageContainers.length - 1 ? (e.disabled = !0, e.classList.add("opacity-50", "cursor-not-allowed"), e.classList.remove("hover:bg-gray-200")) : (e.disabled = !1, e.classList.remove("opacity-50", "cursor-not-allowed"), e.classList.add("hover:bg-gray-200"))), i) {
    const t = L(), n = i.querySelector("i");
    t ? (i.title = "Zur Hauptausgabe", i.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", n && (n.className = "ri-file-text-line text-lg lg:text-xl")) : (i.title = "Zu Beilage", i.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", n && (n.className = "ri-attachment-line text-lg lg:text-xl"));
  }
}
function R() {
  const s = document.getElementById("shareLinkBtn");
  let e = "";
  if (window.currentActiveIndex !== void 0 && window.currentPageContainers && window.currentPageContainers[window.currentActiveIndex]) {
    const n = window.currentPageContainers[window.currentActiveIndex].querySelector("[data-page]");
    n && (e = `/${n.getAttribute("data-page")}`);
  }
  const i = window.location.origin + window.location.pathname + e;
  navigator.share ? navigator.share({
    title: document.title,
    url: i
  }).catch((t) => {
    S(i, s);
  }) : S(i, s);
}
function S(s, e) {
  if (navigator.clipboard)
    navigator.clipboard.writeText(s).then(() => {
      h(e, "Link kopiert!");
    }).catch((i) => {
      h(e, "Kopieren fehlgeschlagen");
    });
  else {
    const i = document.createElement("textarea");
    i.value = s, document.body.appendChild(i), i.select();
    try {
      const t = document.execCommand("copy");
      h(e, t ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(i);
    }
  }
}
function D() {
  const s = document.getElementById("citationBtn"), e = document.title || "KGPZ";
  let i = window.location.origin + window.location.pathname;
  i.includes("#") && (i = i.split("#")[0]);
  const t = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), n = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${e}. Digital verfügbar unter: ${i} (Zugriff: ${t}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(n).then(() => {
      h(s, "Zitation kopiert!");
    }).catch((o) => {
      h(s, "Kopieren fehlgeschlagen");
    });
  else {
    const o = document.createElement("textarea");
    o.value = n, document.body.appendChild(o), o.select();
    try {
      const r = document.execCommand("copy");
      h(s, r ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(s, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(o);
    }
  }
}
function h(s, e) {
  const i = document.querySelector(".simple-popup");
  i && i.remove();
  const t = document.createElement("div");
  t.className = "simple-popup", t.textContent = e, t.style.cssText = `
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
  const n = s.getBoundingClientRect(), o = window.innerHeight, r = window.innerWidth;
  let a = n.left - 10, l = n.bottom + 8;
  const c = 120, d = 32;
  a + c > r && (a = n.right - c + 10), l + d > o && (l = n.top - d - 8), t.style.left = Math.max(5, a) + "px", t.style.top = Math.max(5, l) + "px", document.body.appendChild(t), setTimeout(() => {
    t.style.opacity = "1";
  }, 10), setTimeout(() => {
    t.style.opacity = "0", setTimeout(() => {
      t.parentNode && t.remove();
    }, 200);
  }, 2e3);
}
function Z(s, e, i = !1) {
  let t = "";
  if (i)
    t = window.location.origin + window.location.pathname + `#beilage-1-page-${s}`;
  else {
    const o = window.location.pathname.split("/");
    if (o.length >= 3) {
      const r = o[1], a = o[2];
      t = `${window.location.origin}/${r}/${a}/${s}`;
    } else
      t = window.location.origin + window.location.pathname + `/${s}`;
  }
  const n = t;
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
      const r = document.execCommand("copy");
      h(e, r ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(o);
    }
  }
}
function O(s, e) {
  const i = document.title || "KGPZ", t = window.location.pathname.split("/");
  let n;
  if (t.length >= 3) {
    const l = t[1], c = t[2];
    n = `${window.location.origin}/${l}/${c}/${s}`;
  } else
    n = `${window.location.origin}${window.location.pathname}/${s}`;
  const o = n, r = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), a = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${i}, Seite ${s}. Digital verfügbar unter: ${o} (Zugriff: ${r}).`;
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
  M(), window.addEventListener("scroll", function() {
    clearTimeout(window.scrollTimeout), window.scrollTimeout = setTimeout(() => {
      b();
    }, 50);
  }), document.addEventListener("keydown", function(s) {
    s.key === "Escape" && k();
  });
}
function w() {
  const s = window.location.pathname;
  document.querySelectorAll(".citation-link[data-citation-url]").forEach((i) => {
    const t = i.getAttribute("data-citation-url");
    let n = !1;
    if (t === s)
      n = !0;
    else {
      const o = s.match(/^\/(\d{4})\/(\d+)(?:\/(\d+))?$/), r = t.match(/^\/(\d{4})\/(\d+)$/);
      if (o && r) {
        const [, a, l, c] = o, [, d, g] = r;
        a === d && l === g && (n = !0);
      }
    }
    n ? (i.classList.add("text-red-700", "pointer-events-none"), i.setAttribute("aria-current", "page")) : (i.classList.remove("text-red-700", "pointer-events-none"), i.removeAttribute("aria-current"));
  });
}
function C() {
  const s = window.location.pathname, e = document.body;
  e.classList.remove(
    "page-akteure",
    "page-ausgabe",
    "page-search",
    "page-ort",
    "page-kategorie",
    "page-piece",
    "page-edition"
  ), s.includes("/akteure/") || s.includes("/autoren") ? e.classList.add("page-akteure") : s.match(/\/\d{4}\/\d+/) ? e.classList.add("page-ausgabe") : s.includes("/search") || s.includes("/suche") ? e.classList.add("page-search") : s.includes("/ort/") ? e.classList.add("page-ort") : s.includes("/kategorie/") ? e.classList.add("page-kategorie") : s.includes("/beitrag/") ? e.classList.add("page-piece") : s.includes("/edition") && e.classList.add("page-edition");
}
let v = [];
window.ExecuteNextSettle = function(s) {
  typeof s == "function" && v.push(s);
};
function Y() {
  for (; v.length > 0; ) {
    const s = v.shift();
    try {
      s();
    } catch (e) {
      console.error("Error executing settle queue function:", e);
    }
  }
}
window.enlargePage = N;
window.closeModal = k;
window.scrollToPreviousPage = z;
window.scrollToNextPage = $;
window.scrollToBeilage = V;
window.shareCurrentPage = R;
window.generateCitation = D;
window.copyPagePermalink = Z;
window.generatePageCitation = O;
function K() {
  C(), w(), document.querySelector(".newspaper-page-container") && P();
  let s = function(i) {
    C(), w(), Y(), setTimeout(() => {
      document.querySelector(".newspaper-page-container") && P();
    }, 50);
  }, e = function(i) {
  };
  document.body.addEventListener("htmx:afterSettle", s), document.body.addEventListener("htmx:afterSettle", w), document.body.addEventListener("htmx:beforeRequest", e);
}
export {
  K as setup
};
