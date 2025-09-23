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
        const n = e.getAttribute("data-target"), s = document.getElementById(n);
        s && (this.updateActiveLinkImmediate(n), this.manualNavigation = !0, s.scrollIntoView({
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
    const i = t.getBoundingClientRect(), n = parseFloat(e.style.top), s = parseFloat(e.style.height), r = n + s, a = t.scrollTop, l = a + i.height;
    if (r > l) {
      const c = r - i.height + 20;
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
        const s = n.getAttribute("id"), r = n.querySelector(".akteur-werke-section"), a = n.querySelector(".akteur-beitraege-section");
        let l = !1;
        if (r) {
          const c = r.getBoundingClientRect(), d = c.top < window.innerHeight, u = c.bottom > 0;
          d && u && (l = !0);
        }
        if (a && !l) {
          const c = a.getBoundingClientRect(), d = c.top < window.innerHeight, u = c.bottom > 0;
          d && u && (l = !0);
        }
        if (!r && !a) {
          const c = n.querySelector("div:first-child");
          if (c) {
            const d = c.getBoundingClientRect(), u = d.top >= 0, g = d.bottom <= window.innerHeight;
            u && g && (l = !0);
          }
        }
        l && e.push(s);
      });
    } catch {
      return;
    }
    const t = [], i = document.getElementById("scrollspy-slider");
    if (this.navLinks.forEach((n) => {
      n.classList.remove("font-medium");
      const s = n.getAttribute("data-target");
      e.includes(s) && (n.classList.add("font-medium"), t.push(n));
    }), t.length > 0 && i) {
      const n = document.getElementById("scrollspy-nav"), s = n.getBoundingClientRect();
      let r = 1 / 0, a = -1 / 0;
      t.forEach((c) => {
        const d = c.getBoundingClientRect(), u = d.top - s.top + n.scrollTop, g = u + d.height;
        r = Math.min(r, u), a = Math.max(a, g);
      });
      let l = a - r;
      i.style.top = `${r}px`, i.style.height = `${l}px`, i.style.opacity = "1", setTimeout(() => this.ensureMarkerVisibility(), 100);
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
        const s = n.getBoundingClientRect(), r = i.getBoundingClientRect(), a = r.top - s.top + n.scrollTop;
        t.style.top = `${a}px`, t.style.height = `${r.height}px`, t.style.opacity = "1";
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
    ), s = window.innerHeight, r = n - s, a = r > 0 ? window.scrollY / r : 0, l = t.clientHeight, d = t.scrollHeight - l;
    if (d > 0) {
      const u = a * d, g = i.getBoundingClientRect(), p = t.getBoundingClientRect(), f = g.top - p.top + t.scrollTop, m = l / 2, H = f - m, v = 0.7, I = v * u + (1 - v) * H, x = Math.max(0, Math.min(d, I)), T = t.scrollTop;
      Math.abs(x - T) > 10 && t.scrollTo({
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
    super(), this.resizeObserver = null, this.zoomLevel = 1, this.minZoom = 1, this.maxZoom = 3, this.zoomStep = 0.1, this.isPanning = !1, this.panStart = { x: 0, y: 0 }, this.panOffset = { x: 0, y: 0 }, this.dragDistance = 0;
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
						<div class="flex items-center justify-between p-4 bg-slate-50 relative z-10 border-b border-slate-200">
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

								<!-- Zoom indicator and reset -->
								<div class="flex items-center gap-2">
									<span id="zoom-indicator" class="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">100%</span>
									<button
										id="zoom-reset-btn"
										onclick="this.closest('single-page-viewer').resetZoom()"
										class="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer text-xs"
										title="Zoom zurücksetzen (1:1)">
										<i class="ri-zoom-out-line text-sm"></i>
									</button>
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
								class="w-full h-auto rounded-lg shadow-2xl cursor-zoom-in"
								onclick="this.closest('single-page-viewer').handleImageClick()"
								title="Klicken zum Vergrößern oder Schließen"
							/>
						</div>
					</div>
				</div>
			</div>
		`, this.setupResizeObserver(), this.setupKeyboardNavigation(), this.setupZoomAndPan();
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
  show(e, t, i, n = !1, s = 0, r = null, a = null, l = null) {
    const c = this.querySelector("#single-page-image"), d = this.querySelector("#page-number"), u = this.querySelector("#page-icon");
    this.querySelector("#page-indicator"), c.src = e, c.alt = t, this.currentPageNumber = i, this.currentIsBeilage = n, this.currentPartNumber = r;
    let g;
    if (l)
      g = l;
    else {
      const f = this.getIssueContext(i);
      g = f ? `${f}, ${i}` : `${i}`;
    }
    if (d.innerHTML = g, s && i === s) {
      d.style.position = "relative";
      const f = d.querySelector(".target-page-dot");
      f && f.remove();
      const m = document.createElement("span");
      m.className = "target-page-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10", m.title = "verlinkte Seite", d.appendChild(m);
    }
    a ? a === "part-number" && r !== null ? u.innerHTML = `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${r}. Teil</span>` : u.innerHTML = this.generateIconFromType(a) : u.innerHTML = this.generateFallbackIcon(i, n, r), this.updateNavigationButtons(), this.style.display = "block", this.resetZoom();
    const p = this.querySelector(".flex-1.overflow-auto");
    p && (p.scrollTop = 0), document.body.style.overflow = "hidden";
  }
  close() {
    this.style.display = "none", document.body.style.overflow = "";
  }
  disconnectedCallback() {
    this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), this.keyboardHandler && (document.removeEventListener("keydown", this.keyboardHandler), this.keyboardHandler = null);
    const e = this.querySelector(".flex-1.flex.items-center.justify-center"), t = this.querySelector("#single-page-image");
    e && this.wheelHandler && e.removeEventListener("wheel", this.wheelHandler), t && (this.mouseDownHandler && t.removeEventListener("mousedown", this.mouseDownHandler), this.doubleClickHandler && t.removeEventListener("dblclick", this.doubleClickHandler)), this.mouseMoveHandler && document.removeEventListener("mousemove", this.mouseMoveHandler), this.mouseUpHandler && document.removeEventListener("mouseup", this.mouseUpHandler), document.body.style.overflow = "";
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
          case "+":
          case "=":
            e.preventDefault(), this.adjustZoom(this.zoomStep, { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
            break;
          case "-":
            e.preventDefault(), this.adjustZoom(-this.zoomStep, { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
            break;
          case "0":
            e.preventDefault(), this.resetZoom();
            break;
        }
    }, document.addEventListener("keydown", this.keyboardHandler);
  }
  // Set up zoom and pan functionality
  setupZoomAndPan() {
    const e = this.querySelector(".flex-1.flex.items-center.justify-center"), t = this.querySelector("#single-page-image");
    !e || !t || (this.wheelHandler = (i) => {
      if (!i.ctrlKey) return;
      i.preventDefault();
      const n = i.deltaY > 0 ? -this.zoomStep : this.zoomStep;
      this.adjustZoom(n, i);
    }, this.mouseDownHandler = (i) => {
      this.zoomLevel <= 1 || (i.preventDefault(), this.isPanning = !0, this.dragDistance = 0, this.panStart.x = i.clientX - this.panOffset.x, this.panStart.y = i.clientY - this.panOffset.y, t.style.cursor = "grabbing");
    }, this.mouseMoveHandler = (i) => {
      if (!this.isPanning || this.zoomLevel <= 1) return;
      i.preventDefault();
      const n = i.clientX - this.panStart.x, s = i.clientY - this.panStart.y, r = n - this.panOffset.x, a = s - this.panOffset.y;
      this.dragDistance += Math.sqrt(r * r + a * a), this.panOffset.x = n, this.panOffset.y = s, this.updateImageTransform();
    }, this.mouseUpHandler = (i) => {
      this.isPanning && (this.isPanning = !1, this.updateImageCursor());
    }, this.doubleClickHandler = (i) => {
      i.preventDefault(), this.resetZoom();
    }, e.addEventListener("wheel", this.wheelHandler, { passive: !1 }), t.addEventListener("mousedown", this.mouseDownHandler), document.addEventListener("mousemove", this.mouseMoveHandler), document.addEventListener("mouseup", this.mouseUpHandler), t.addEventListener("dblclick", this.doubleClickHandler));
  }
  // Adjust zoom level
  adjustZoom(e, t) {
    const i = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + e));
    if (i === this.zoomLevel) return;
    const s = this.querySelector("#single-page-image").getBoundingClientRect(), r = (t.clientX - s.left) / s.width, a = (t.clientY - s.top) / s.height, l = i / this.zoomLevel;
    this.panOffset.x = r * s.width * (1 - l) + this.panOffset.x * l, this.panOffset.y = a * s.height * (1 - l) + this.panOffset.y * l, this.zoomLevel = i, this.updateImageTransform(), this.updateImageCursor(), this.updateZoomIndicator();
  }
  // Reset zoom to fit
  resetZoom() {
    this.zoomLevel = 1, this.panOffset.x = 0, this.panOffset.y = 0, this.updateImageTransform(), this.updateImageCursor(), this.updateZoomIndicator();
  }
  // Update image transform with boundaries
  updateImageTransform() {
    const e = this.querySelector("#single-page-image");
    e && (this.constrainPanOffset(), this.zoomLevel === 1 && this.panOffset.x === 0 && this.panOffset.y === 0 ? e.style.transform = "" : e.style.transform = `scale(${this.zoomLevel}) translate(${this.panOffset.x / this.zoomLevel}px, ${this.panOffset.y / this.zoomLevel}px)`, e.style.transformOrigin = "center center");
  }
  // Constrain pan offset to keep image within container bounds
  constrainPanOffset() {
    const e = this.querySelector("#single-page-image"), t = this.querySelector(".flex-1.flex.items-center.justify-center");
    if (!e || !t) return;
    const i = e.getBoundingClientRect(), n = t.getBoundingClientRect(), s = i.width * this.zoomLevel, r = i.height * this.zoomLevel, a = Math.max(0, (s - n.width) / 2), l = Math.max(0, (r - n.height) / 2);
    this.panOffset.x = Math.max(-a, Math.min(a, this.panOffset.x)), this.panOffset.y = Math.max(-l, Math.min(l, this.panOffset.y));
  }
  // Update cursor based on zoom state
  updateImageCursor() {
    const e = this.querySelector("#single-page-image");
    e && (this.zoomLevel > 1 ? (e.className = e.className.replace("cursor-zoom-in", "cursor-grab"), e.title = "Ziehen zum Verschieben") : (e.className = e.className.replace("cursor-grab", "cursor-zoom-in"), e.title = "Klicken zum Vergrößern oder Schließen"));
  }
  // Update zoom level indicator
  updateZoomIndicator() {
    const e = this.querySelector("#zoom-indicator"), t = this.querySelector("#zoom-reset-btn");
    if (!(!e || !t))
      if (this.zoomLevel === 1)
        e.textContent = "Strg + Mausrad oder +/- für Zoom", e.className = "text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded", t.style.display = "none";
      else {
        const i = Math.round(this.zoomLevel * 100);
        e.textContent = `${i}%`, e.className = "text-sm font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded", t.style.display = "flex";
      }
  }
  // Handle image click (always close viewer)
  handleImageClick(e) {
    if (this.dragDistance >= 5) {
      this.dragDistance = 0;
      return;
    }
    this.close(), this.dragDistance = 0;
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
    let s = null, r = null;
    return n > 0 && (s = i[n - 1]), n < i.length - 1 && (r = i[n + 1]), console.log("Adjacent pages - prev:", s, "next:", r), { prevPage: s, nextPage: r };
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
        let s = null;
        this.currentPartNumber !== null && (s = this.getPartNumberForPage(e));
        let r = null, a = null;
        r = i.getAttribute("data-page-icon-type"), i.querySelector(".part-number") && (r = "part-number");
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
          s,
          r,
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
    const e = this.querySelector("#sidebar-spacer"), t = this.querySelector("#sidebar-toggle-btn"), i = t.querySelector("i"), n = e.style.width, s = n === "0px" || n === "0";
    if (console.log("Current state - isCollapsed:", s), console.log("Current width:", n), s) {
      const r = this.detectSidebarWidth();
      e.style.width = r, t.className = "w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", i.className = "ri-sidebar-fold-line text-lg font-bold", t.title = "Inhaltsverzeichnis ausblenden", console.log("Expanding sidebar to:", r);
    } else
      e.style.width = "0px", t.className = "w-10 h-10 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", i.className = "ri-sidebar-unfold-line text-lg font-bold", t.title = "Inhaltsverzeichnis einblenden", console.log("Collapsing sidebar");
    console.log("New width:", e.style.width);
  }
  // Extract issue context from document title, URL, or page container
  getIssueContext(e) {
    const t = window.location.pathname, i = t.includes("/beitrag/");
    if (i) {
      const r = document.querySelector(`[data-page-container="${e}"]`);
      if (r) {
        const c = r.querySelector(".page-indicator");
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
    const s = document.querySelector(".page-indicator");
    if (s) {
      const a = s.textContent.trim().match(/(\d{4})\s+Nr\.\s+(\d+)/);
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
function q(o, e, t, i = null) {
  let n = document.querySelector("single-page-viewer");
  n || (n = document.createElement("single-page-viewer"), document.body.appendChild(n));
  const s = o.closest('[data-beilage="true"]') !== null, r = window.templateData && window.templateData.targetPage ? window.templateData.targetPage : 0, a = o.closest(".newspaper-page-container, .piece-page-container");
  let l = null, c = null;
  if (a) {
    l = a.getAttribute("data-page-icon-type"), a.querySelector(".part-number") && (l = "part-number");
    const u = a.querySelector(".page-indicator");
    if (u) {
      const g = u.cloneNode(!0);
      g.querySelectorAll("i").forEach((m) => m.remove()), g.querySelectorAll('[class*="target-page-dot"], .target-page-indicator').forEach((m) => m.remove()), c = g.textContent.trim();
    }
  }
  n.show(o.src, o.alt, e, s, r, i, l, c);
}
function P() {
  document.getElementById("pageModal").classList.add("hidden");
}
function N() {
  if (window.pageObserver && (window.pageObserver.disconnect(), window.pageObserver = null), window.currentPageContainers = Array.from(document.querySelectorAll(".newspaper-page-container")), window.currentActiveIndex = 0, b(), document.querySelector(".newspaper-page-container")) {
    let e = /* @__PURE__ */ new Set();
    window.pageObserver = new IntersectionObserver(
      (t) => {
        if (t.forEach((i) => {
          const n = window.currentPageContainers.indexOf(i.target);
          n !== -1 && (i.isIntersecting ? e.add(n) : e.delete(n));
        }), e.size > 0) {
          const n = Array.from(e).sort((s, r) => s - r)[0];
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
function z() {
  if (window.currentActiveIndex > 0) {
    let o = -1;
    const e = [];
    window.currentPageContainers.forEach((i, n) => {
      const s = i.getBoundingClientRect(), r = window.innerHeight, a = Math.max(s.top, 0), l = Math.min(s.bottom, r), c = Math.max(0, l - a), d = s.height;
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
      const s = i.getBoundingClientRect(), r = window.innerHeight, a = Math.max(s.top, 0), l = Math.min(s.bottom, r), c = Math.max(0, l - a), d = s.height;
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
function $() {
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
  const o = [];
  window.currentPageContainers.forEach((e, t) => {
    const i = e.getBoundingClientRect(), n = window.innerHeight, s = Math.max(i.top, 0), r = Math.min(i.bottom, n), a = Math.max(0, r - s), l = i.height;
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
    const i = L(), n = t.querySelector("i");
    i ? (t.title = "Zur Hauptausgabe", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", n && (n.className = "ri-file-text-line text-lg lg:text-xl")) : (t.title = "Zu Beilage", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", n && (n.className = "ri-attachment-line text-lg lg:text-xl"));
  }
}
function R() {
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
      h(e, "Link kopiert!");
    }).catch((t) => {
      h(e, "Kopieren fehlgeschlagen");
    });
  else {
    const t = document.createElement("textarea");
    t.value = o, document.body.appendChild(t), t.select();
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
  const o = document.getElementById("citationBtn"), e = document.title || "KGPZ";
  let t = window.location.origin + window.location.pathname;
  t.includes("#") && (t = t.split("#")[0]);
  const i = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), n = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${e}. Digital verfügbar unter: ${t} (Zugriff: ${i}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(n).then(() => {
      h(o, "Zitation kopiert!");
    }).catch((s) => {
      h(o, "Kopieren fehlgeschlagen");
    });
  else {
    const s = document.createElement("textarea");
    s.value = n, document.body.appendChild(s), s.select();
    try {
      const r = document.execCommand("copy");
      h(o, r ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(o, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(s);
    }
  }
}
function h(o, e) {
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
  const n = o.getBoundingClientRect(), s = window.innerHeight, r = window.innerWidth;
  let a = n.left - 10, l = n.bottom + 8;
  const c = 120, d = 32;
  a + c > r && (a = n.right - c + 10), l + d > s && (l = n.top - d - 8), i.style.left = Math.max(5, a) + "px", i.style.top = Math.max(5, l) + "px", document.body.appendChild(i), setTimeout(() => {
    i.style.opacity = "1";
  }, 10), setTimeout(() => {
    i.style.opacity = "0", setTimeout(() => {
      i.parentNode && i.remove();
    }, 200);
  }, 2e3);
}
function D(o, e, t = !1) {
  let i = "";
  if (t)
    i = window.location.origin + window.location.pathname + `#beilage-1-page-${o}`;
  else {
    const s = window.location.pathname.split("/");
    if (s.length >= 3) {
      const r = s[1], a = s[2];
      i = `${window.location.origin}/${r}/${a}/${o}`;
    } else
      i = window.location.origin + window.location.pathname + `/${o}`;
  }
  const n = i;
  if (navigator.clipboard)
    navigator.clipboard.writeText(n).then(() => {
      h(e, "Link kopiert!");
    }).catch((s) => {
      h(e, "Kopieren fehlgeschlagen");
    });
  else {
    const s = document.createElement("textarea");
    s.value = n, document.body.appendChild(s), s.select();
    try {
      const r = document.execCommand("copy");
      h(e, r ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(s);
    }
  }
}
function Z(o, e) {
  const t = document.title || "KGPZ", i = window.location.pathname.split("/");
  let n;
  if (i.length >= 3) {
    const l = i[1], c = i[2];
    n = `${window.location.origin}/${l}/${c}/${o}`;
  } else
    n = `${window.location.origin}${window.location.pathname}/${o}`;
  const s = n, r = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), a = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${t}, Seite ${o}. Digital verfügbar unter: ${s} (Zugriff: ${r}).`;
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
function k() {
  N(), window.addEventListener("scroll", function() {
    clearTimeout(window.scrollTimeout), window.scrollTimeout = setTimeout(() => {
      b();
    }, 50);
  }), document.addEventListener("keydown", function(o) {
    o.key === "Escape" && P();
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
      const s = o.match(/^\/(\d{4})\/(\d+)(?:\/(\d+))?$/), r = i.match(/^\/(\d{4})\/(\d+)$/);
      if (s && r) {
        const [, a, l, c] = s, [, d, u] = r;
        a === d && l === u && (n = !0);
      }
    }
    n ? (t.classList.add("text-red-700", "pointer-events-none"), t.setAttribute("aria-current", "page")) : (t.classList.remove("text-red-700", "pointer-events-none"), t.removeAttribute("aria-current"));
  });
}
function C() {
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
function V() {
  for (; y.length > 0; ) {
    const o = y.shift();
    try {
      o();
    } catch (e) {
      console.error("Error executing settle queue function:", e);
    }
  }
}
window.enlargePage = q;
window.closeModal = P;
window.scrollToPreviousPage = z;
window.scrollToNextPage = M;
window.scrollToBeilage = $;
window.shareCurrentPage = R;
window.generateCitation = O;
window.copyPagePermalink = D;
window.generatePageCitation = Z;
function K() {
  C(), w(), document.querySelector(".newspaper-page-container") && k();
  let o = function(t) {
    C(), w(), V(), setTimeout(() => {
      document.querySelector(".newspaper-page-container") && k();
    }, 50);
  }, e = function(t) {
  };
  document.body.addEventListener("htmx:afterSettle", o), document.body.addEventListener("htmx:afterSettle", w), document.body.addEventListener("htmx:beforeRequest", e);
}
export {
  K as setup
};
