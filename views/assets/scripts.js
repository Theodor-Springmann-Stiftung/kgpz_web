document.body.addEventListener("htmx:configRequest", function(r) {
  let e = r.detail.elt;
  e.id === "search" && e.value === "" && (r.detail.parameters = {}, r.detail.path = window.location.pathname + window.location.search);
});
class H extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.setupEventListeners();
  }
  setupEventListeners() {
    const e = this.querySelector("#person-search"), t = this.querySelector("#authors-only"), n = this.querySelector("#all-persons"), i = this.querySelector("#authors-only-list");
    !e || !t || !n || !i || (e.addEventListener("input", (s) => {
      const a = s.target.value.toLowerCase().trim();
      this.filterPersons(a);
    }), t.addEventListener("change", () => {
      this.togglePersonsList();
      const s = e.value.toLowerCase().trim();
      this.filterPersons(s);
    }));
  }
  togglePersonsList() {
    const e = this.querySelector("#authors-only"), t = this.querySelector("#all-persons"), n = this.querySelector("#authors-only-list");
    !e || !t || !n || (e.checked ? (t.style.display = "none", n.style.display = "block") : (t.style.display = "block", n.style.display = "none"));
  }
  filterPersons(e) {
    const t = this.querySelector("#authors-only"), n = t != null && t.checked ? this.querySelector("#authors-only-list") : this.querySelector("#all-persons");
    if (!n)
      return;
    n.querySelectorAll(".person-item").forEach((s) => {
      var c, d;
      const a = ((c = s.querySelector(".person-name")) == null ? void 0 : c.textContent) || "", o = ((d = s.querySelector(".person-life")) == null ? void 0 : d.textContent) || "";
      !e || a.toLowerCase().includes(e) || o.toLowerCase().includes(e) ? s.style.display = "block" : s.style.display = "none";
    });
  }
}
customElements.define("person-jump-filter", H);
class B extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.setupEventListeners();
  }
  setupEventListeners() {
    const e = this.querySelector("#place-search"), t = this.querySelector("#all-places");
    !e || !t || e.addEventListener("input", (n) => {
      const i = n.target.value.toLowerCase().trim();
      this.filterPlaces(i);
    });
  }
  filterPlaces(e) {
    const t = this.querySelector("#all-places");
    if (!t)
      return;
    t.querySelectorAll(".place-item").forEach((i) => {
      var o;
      const s = ((o = i.querySelector(".place-name")) == null ? void 0 : o.textContent) || "";
      !e || s.toLowerCase().includes(e) ? i.style.display = "block" : i.style.display = "none";
    });
  }
}
customElements.define("place-jump-filter", B);
class A extends HTMLElement {
  constructor() {
    super(), this.issuesByYear = {};
  }
  connectedCallback() {
    this.parseIssuesData(), this.setupEventListeners();
  }
  parseIssuesData() {
    const e = this.dataset.issues;
    if (e)
      try {
        this.issuesByYear = JSON.parse(e);
      } catch (t) {
        console.error("Failed to parse issues data:", t);
      }
  }
  setupEventListeners() {
    const e = this.querySelector("#year-select"), t = this.querySelector("#issue-number-select"), n = this.querySelector("#issue-date-select"), i = this.querySelector("#page-input"), s = this.querySelector("#page-jump-btn");
    if (!e)
      return;
    e.addEventListener("change", () => {
      this.updateIssueOptions(), this.updatePageInputState(), this.clearPageErrors();
    }), t && t.addEventListener("change", () => {
      const o = e.value, l = t.value;
      o && l && (window.location.href = `/${o}/${l}`);
    }), n && n.addEventListener("change", () => {
      const o = e.value, l = n.value;
      o && l && (window.location.href = `/${o}/${l}`);
    }), i && (i.addEventListener("input", () => {
      this.updatePageJumpButton(), this.clearPageErrors();
    }), i.addEventListener("keydown", (o) => {
      o.key === "Enter" && (o.preventDefault(), this.handlePageJump());
    })), s && s.addEventListener("click", () => {
      this.handlePageJump();
    });
    const a = this.querySelector("#page-jump-form");
    a && a.addEventListener("submit", (o) => {
      o.preventDefault(), this.handlePageJump();
    }), this.updateIssueOptions(), this.updatePageInputState(), this.updatePageJumpButton();
  }
  updateIssueOptions() {
    const e = this.querySelector("#year-select"), t = this.querySelector("#issue-number-select"), n = this.querySelector("#issue-date-select");
    if (!e || !t || !n)
      return;
    const i = e.value, s = this.issuesByYear[i] || [];
    t.innerHTML = '<option value="">Nr.</option>', n.innerHTML = '<option value="">Datum</option>', s.forEach((o) => {
      const l = document.createElement("option");
      l.value = o.number, l.textContent = o.number, t.appendChild(l);
      const c = document.createElement("option");
      c.value = o.number, c.textContent = `${o.date} [${o.number}]`, n.appendChild(c);
    });
    const a = s.length > 0 && i;
    t.disabled = !a, n.disabled = !a;
  }
  async handlePageJump() {
    const e = this.querySelector("#year-select"), t = this.querySelector("#page-input"), n = this.querySelector("#jump-errors");
    if (!e || !t)
      return;
    const i = e.value, s = t.value;
    if (!i || !s) {
      this.showError("Bitte Jahr und Seite auswählen.");
      return;
    }
    try {
      const a = new FormData();
      a.append("year", i), a.append("page", s);
      const o = await fetch("/jump", {
        method: "POST",
        body: a,
        redirect: "manual"
      }), l = o.headers.get("HX-Redirect");
      if (l) {
        window.location.href = l;
        return;
      }
      if (o.status === 302 || o.status === 301) {
        const c = o.headers.get("Location");
        if (c) {
          window.location.href = c;
          return;
        }
      }
      if (o.ok)
        n && (n.innerHTML = "");
      else {
        const c = await o.text();
        n && (n.innerHTML = c);
      }
    } catch (a) {
      console.error("Page jump failed:", a), this.showError("Fehler beim Suchen der Seite.");
    }
  }
  showError(e) {
    const t = this.querySelector("#jump-errors");
    t && (t.innerHTML = `<div class="text-red-600 text-sm mt-1">${e}</div>`);
  }
  clearPageErrors() {
    const e = this.querySelector("#jump-errors");
    e && (e.innerHTML = "");
  }
  updatePageInputState() {
    const e = this.querySelector("#year-select"), t = this.querySelector("#page-input");
    if (!e || !t)
      return;
    const n = e.value;
    t.disabled = !n, n || (t.value = "", this.updatePageJumpButton());
  }
  updatePageJumpButton() {
    const e = this.querySelector("#year-select"), t = this.querySelector("#page-input"), n = this.querySelector("#page-jump-btn");
    if (!e || !t || !n)
      return;
    const i = e.value, s = t.value && t.value.trim(), a = i && s;
    n.disabled = !a;
  }
}
customElements.define("year-jump-filter", A);
class M extends HTMLElement {
  constructor() {
    super(), this.isOpen = !1;
  }
  connectedCallback() {
    this.createButton(), this.setupEventListeners();
  }
  disconnectedCallback() {
    document.removeEventListener("click", this.handleOutsideClick), document.removeEventListener("quickfilter:selection", this.handleSelectionEvent);
  }
  createButton() {
    this.innerHTML = `
            <button
                id="filter-toggle"
                class="mr-2 text-lg border px-4 h-full hover:bg-slate-200 transition-colors cursor-pointer"
                title="Schnellfilter öffnen/schließen">
                <i class="ri-filter-2-line"></i> <div class="inline-block text-lg">Schnellauswahl</div>
            </button>
        `;
  }
  setupEventListeners() {
    const e = this.querySelector("button");
    e && e.addEventListener("click", (t) => {
      t.stopPropagation(), this.toggleFilter();
    }), this.handleSelectionEvent = this.handleSelectionEvent.bind(this), this.handleOutsideClick = this.handleOutsideClick.bind(this), document.addEventListener("quickfilter:selection", this.handleSelectionEvent), document.addEventListener("click", this.handleOutsideClick);
  }
  toggleFilter() {
    const e = document.getElementById("filter-container"), t = this.querySelector("button");
    if (!e || !t)
      return;
    const n = e.querySelector("div.flex.justify-center");
    e.classList.contains("hidden") ? (e.classList.remove("hidden"), t.classList.add("bg-slate-200"), this.isOpen = !0, n && n.querySelector("div, form, h3") || htmx.ajax("GET", "/filter", {
      target: "#filter-container",
      select: "#filter",
      swap: "innerHTML"
    }).then(() => {
      console.log("HTMX request completed"), document.querySelector("#filter-container .flex.justify-center");
    }).catch((s) => {
      console.log("HTMX request failed:", s);
    })) : this.hideFilter();
  }
  hideFilter() {
    const e = document.getElementById("filter-container"), t = this.querySelector("button");
    !e || !t || (e.classList.add("hidden"), t.classList.remove("bg-slate-200"), this.isOpen = !1);
  }
  handleSelectionEvent(e) {
    this.isOpen && this.hideFilter();
  }
  handleOutsideClick(e) {
    const t = document.getElementById("filter-container"), n = this.querySelector("button");
    this.isOpen && t && n && !t.contains(e.target) && !this.contains(e.target) && this.hideFilter();
  }
}
customElements.define("schnellauswahl-button", M);
class N extends HTMLElement {
  constructor() {
    super(), this.isOpen = !1;
  }
  connectedCallback() {
    this.createMenu(), this.setupEventListeners();
  }
  disconnectedCallback() {
    document.removeEventListener("click", this.handleOutsideClick), document.removeEventListener("quickfilter:selection", this.handleSelectionEvent);
  }
  createMenu() {
    this.innerHTML = `
            <div>
                <button
                    class="ml-2 text-2xl border px-4 h-full hover:bg-slate-200 transition-colors cursor-pointer"
                    id="menu-toggle">
                    <i class="ri-menu-line"></i>
                </button>
                <div id="menu-dropdown" class="hidden absolute bg-slate-50 px-5 py-3 z-50">
                    <div>
                        <div>Übersicht nach</div>
                        <div class="ml-2 flex flex-col gap-y-2 mt-2">
                            <a href="/">Jahrgängen</a>
                            <a href="/akteure/a">Personen</a>
                            <a href="/kategorie/">Betragsarten</a>
                            <a href="/ort/">Orten</a>
                        </div>
                    </div>
                    <div class="flex flex-col gap-y-2 mt-2">
                        <a href="/edition/">Geschichte & Edition der KGPZ</a>
                        <a href="/zitation/">Zitation</a>
                        <a href="/kontakt/">Kontakt</a>
                    </div>
                </div>
            </div>
        `;
  }
  setupEventListeners() {
    const e = this.querySelector("#menu-toggle"), t = this.querySelector("#menu-dropdown");
    e && e.addEventListener("click", (n) => {
      n.stopPropagation(), this.toggleMenu();
    }), t && t.addEventListener("click", (n) => {
      const i = n.target.closest("a[href]");
      if (i) {
        const s = new CustomEvent("quickfilter:selection", {
          detail: {
            type: "navigation",
            source: "menu",
            url: i.getAttribute("href"),
            text: i.textContent.trim()
          },
          bubbles: !0
        });
        document.dispatchEvent(s);
      }
    }), this.handleOutsideClick = this.handleOutsideClick.bind(this), this.handleSelectionEvent = this.handleSelectionEvent.bind(this), document.addEventListener("click", this.handleOutsideClick), document.addEventListener("quickfilter:selection", this.handleSelectionEvent);
  }
  toggleMenu() {
    const e = this.querySelector("#menu-toggle"), t = this.querySelector("#menu-dropdown");
    !e || !t || (this.isOpen ? this.hideMenu() : this.showMenu());
  }
  showMenu() {
    const e = this.querySelector("#menu-toggle"), t = this.querySelector("#menu-dropdown");
    !e || !t || (t.classList.remove("hidden"), e.classList.add("bg-slate-200"), this.isOpen = !0);
  }
  hideMenu() {
    const e = this.querySelector("#menu-toggle"), t = this.querySelector("#menu-dropdown");
    !e || !t || (t.classList.add("hidden"), e.classList.remove("bg-slate-200"), this.isOpen = !1);
  }
  handleSelectionEvent(e) {
    this.isOpen && this.hideMenu();
  }
  handleOutsideClick(e) {
    this.isOpen && !this.contains(e.target) && this.hideMenu();
  }
}
customElements.define("navigation-menu", N);
document.addEventListener("DOMContentLoaded", function() {
  document.addEventListener("click", function(r) {
    const e = r.target.closest('a[href^="/akteure/"], a[href^="/ort/"]'), t = document.getElementById("filter-container");
    if (e && t && t.contains(e)) {
      const n = new CustomEvent("quickfilter:selection", {
        detail: {
          type: e.getAttribute("href").startsWith("/akteure/") ? "person" : "place",
          source: "quickfilter",
          id: e.getAttribute("href").split("/").pop(),
          url: e.getAttribute("href")
        },
        bubbles: !0
      });
      document.dispatchEvent(n);
    }
  });
});
const v = [];
document.addEventListener("DOMContentLoaded", () => {
  S();
});
const O = function(r) {
  typeof r == "function" && v.push(r);
}, S = function() {
  for (; v.length > 0; ) {
    const r = v.shift();
    try {
      r();
    } catch (e) {
      console.error("Error executing settle queue function:", e);
    }
  }
};
class V extends HTMLElement {
  constructor() {
    super(), this.scrollHandler = null, this.scrollTimeout = null, this.clickHandlers = [], this.manualNavigation = !1;
  }
  connectedCallback() {
    O(() => {
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
      const t = (n) => {
        n.preventDefault();
        const i = e.getAttribute("data-target"), s = document.getElementById(i);
        s && (this.updateActiveLinkImmediate(i), this.manualNavigation = !0, s.scrollIntoView({
          behavior: "instant",
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
    const n = t.getBoundingClientRect(), i = parseFloat(e.style.top), s = parseFloat(e.style.height), a = i + s, o = t.scrollTop, l = o + n.height;
    if (a > l) {
      const c = a - n.height + 20;
      t.scrollTo({
        top: c,
        behavior: "smooth"
      });
    } else if (i < o) {
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
        const s = i.getAttribute("id"), a = i.querySelector(".akteur-werke-section"), o = i.querySelector(".akteur-beitraege-section");
        let l = !1;
        if (a) {
          const c = a.getBoundingClientRect(), d = c.top < window.innerHeight, u = c.bottom > 0;
          d && u && (l = !0);
        }
        if (o && !l) {
          const c = o.getBoundingClientRect(), d = c.top < window.innerHeight, u = c.bottom > 0;
          d && u && (l = !0);
        }
        if (!a && !o) {
          const c = i.querySelector("div:first-child");
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
    const t = [], n = document.getElementById("scrollspy-slider");
    if (this.navLinks.forEach((i) => {
      i.classList.remove("font-medium");
      const s = i.getAttribute("data-target");
      e.includes(s) && (i.classList.add("font-medium"), t.push(i));
    }), t.length > 0 && n) {
      const i = document.getElementById("scrollspy-nav"), s = i.getBoundingClientRect();
      let a = 1 / 0, o = -1 / 0;
      t.forEach((c) => {
        const d = c.getBoundingClientRect(), u = d.top - s.top + i.scrollTop, g = u + d.height;
        a = Math.min(a, u), o = Math.max(o, g);
      });
      let l = o - a;
      n.style.top = `${a}px`, n.style.height = `${l}px`, n.style.opacity = "1", setTimeout(() => this.ensureMarkerVisibility(), 100);
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
        const s = i.getBoundingClientRect(), a = n.getBoundingClientRect(), o = a.top - s.top + i.scrollTop;
        t.style.top = `${o}px`, t.style.height = `${a.height}px`, t.style.opacity = "1";
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
    ), s = window.innerHeight, a = i - s, o = a > 0 ? window.scrollY / a : 0, l = t.clientHeight, d = t.scrollHeight - l;
    if (d > 0) {
      const u = o * d, g = n.getBoundingClientRect(), p = t.getBoundingClientRect(), f = g.top - p.top + t.scrollTop, m = l / 2, q = f - m, y = 0.7, I = y * u + (1 - y) * q, w = Math.max(0, Math.min(d, I)), T = t.scrollTop;
      Math.abs(w - T) > 10 && t.scrollTo({
        top: w,
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
customElements.define("akteure-scrollspy", V);
class $ extends HTMLElement {
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
  show(e, t, n, i = !1, s = 0, a = null, o = null, l = null) {
    const c = this.querySelector("#single-page-image"), d = this.querySelector("#page-number"), u = this.querySelector("#page-icon");
    this.querySelector("#page-indicator"), c.src = e, c.alt = t, this.currentPageNumber = n, this.currentIsBeilage = i, this.currentPartNumber = a;
    let g;
    if (l)
      g = l;
    else {
      const f = this.getIssueContext(n);
      g = f ? `${f}, ${n}` : `${n}`;
    }
    if (d.innerHTML = g, s && n === s) {
      d.style.position = "relative";
      const f = d.querySelector(".target-page-dot");
      f && f.remove();
      const m = document.createElement("span");
      m.className = "target-page-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10", m.title = "verlinkte Seite", d.appendChild(m);
    }
    o ? o === "part-number" && a !== null ? u.innerHTML = `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${a}. Teil</span>` : u.innerHTML = this.generateIconFromType(o) : u.innerHTML = this.generateFallbackIcon(n, i, a), this.updateNavigationButtons(), this.style.display = "block", this.setAttribute("active", "true");
    const p = this.querySelector(".flex-1.overflow-auto");
    p && (p.scrollTop = 0), document.body.style.overflow = "hidden", document.dispatchEvent(
      new CustomEvent("singlepageviewer:opened", {
        detail: { pageNumber: this.currentPageNumber, isBeilage: this.currentIsBeilage }
      })
    );
  }
  close() {
    this.style.display = "none", this.removeAttribute("active"), document.body.style.overflow = "", document.dispatchEvent(
      new CustomEvent("singlepageviewer:closed", {
        detail: { pageNumber: this.currentPageNumber, isBeilage: this.currentIsBeilage }
      })
    );
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
    e = ".newspaper-page-container";
    const t = Array.from(document.querySelectorAll(e));
    console.log(
      "Found containers:",
      t.length,
      "for",
      this.currentIsBeilage ? "beilage" : "main"
    );
    const n = t.map((o) => {
      const l = o.getAttribute("data-page-container"), c = l ? parseInt(l) : null;
      return console.log("Container page:", l, "parsed:", c), c;
    }).filter((o) => o !== null);
    console.log("All pages found:", n), console.log("Current page:", this.currentPageNumber);
    const i = n.indexOf(this.currentPageNumber);
    console.log("Current index:", i);
    let s = null, a = null;
    return i > 0 && (s = n[i - 1]), i < n.length - 1 && (a = n[i + 1]), console.log("Adjacent pages - prev:", s, "next:", a), { prevPage: s, nextPage: a };
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
      const i = n.querySelector(".newspaper-page-image, .piece-page-image");
      if (i) {
        let s = null;
        this.currentPartNumber !== null && (s = this.getPartNumberForPage(e));
        let a = null, o = null;
        a = n.getAttribute("data-page-icon-type"), n.querySelector(".part-number") && (a = "part-number");
        const c = n.querySelector(".page-indicator");
        if (c) {
          const d = c.cloneNode(!0);
          d.querySelectorAll("i").forEach((p) => p.remove()), d.querySelectorAll(
            '[class*="target-page-dot"], .target-page-indicator'
          ).forEach((p) => p.remove()), o = d.textContent.trim();
        }
        this.show(
          i.src,
          i.alt,
          e,
          this.currentIsBeilage,
          0,
          s,
          a,
          o
        ), document.dispatchEvent(
          new CustomEvent("singlepageviewer:pagechanged", {
            detail: { pageNumber: this.currentPageNumber, isBeilage: this.currentIsBeilage }
          })
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
  // Legacy fallback icon generation (only used when extraction fails)
  generateFallbackIcon(e, t, n) {
    return n !== null ? `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${n}. Teil</span>` : `<i class="ri-file-text-line text-lg ${t ? "text-amber-600" : "text-black"}"></i>`;
  }
  // Toggle sidebar visibility
  toggleSidebar() {
    const e = this.querySelector("#sidebar-spacer"), t = this.querySelector("#sidebar-toggle-btn"), n = t.querySelector("i"), i = e.style.width, s = i === "0px" || i === "0";
    if (console.log("Current state - isCollapsed:", s), console.log("Current width:", i), s) {
      const a = this.detectSidebarWidth();
      e.style.width = a, t.className = "w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", n.className = "ri-sidebar-fold-line text-lg font-bold", t.title = "Inhaltsverzeichnis ausblenden", console.log("Expanding sidebar to:", a);
    } else
      e.style.width = "0px", t.className = "w-10 h-10 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", n.className = "ri-sidebar-unfold-line text-lg font-bold", t.title = "Inhaltsverzeichnis einblenden", console.log("Collapsing sidebar");
    console.log("New width:", e.style.width);
  }
  // Extract issue context from document title, URL, or page container
  getIssueContext(e) {
    const t = window.location.pathname, n = t.includes("/beitrag/");
    if (n) {
      const a = document.querySelector(`[data-page-container="${e}"]`);
      if (a) {
        const c = a.querySelector(".page-indicator");
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
    const i = t.match(/\/(\d{4})\/(\d+)/);
    if (i)
      return n ? `${i[1]} Nr. ${i[2]}` : "";
    const s = document.querySelector(".page-indicator");
    if (s) {
      const o = s.textContent.trim().match(/(\d{4})\s+Nr\.\s+(\d+)/);
      if (o)
        return `${o[1]} Nr. ${o[2]}`;
    }
    return "KGPZ";
  }
}
customElements.define("single-page-viewer", $);
document.body.addEventListener("htmx:beforeRequest", function(r) {
  const e = document.querySelector("single-page-viewer");
  e && e.style.display !== "none" && (console.log("Cleaning up single page viewer before HTMX navigation"), e.close());
});
window.addEventListener("beforeunload", function() {
  const r = document.querySelector("single-page-viewer");
  r && r.close();
});
class R extends HTMLElement {
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
customElements.define("scroll-to-top-button", R);
class z extends HTMLElement {
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
      const n = t.getAttribute("data-page-container"), i = t.hasAttribute("data-beilage"), s = this.findInhaltsEntriesForPage(n, i);
      s.length > 0 && this.pageContainers.set(n, {
        container: t,
        entries: s,
        state: "short",
        // Default state
        isBeilage: i
      });
    }), this.pageObserver = new IntersectionObserver((t) => {
      t.forEach((n) => {
        const i = n.target.getAttribute("data-page-container"), s = this.pageContainers.get(i);
        if (s) {
          const o = n.isIntersecting && n.intersectionRatio >= 0.5 || this.singlePageViewerActive ? "full" : "short";
          s.state !== o ? (s.state = o, this.updateEntriesState(s)) : o === "full" && n.isIntersecting && n.intersectionRatio >= 0.5 && this.scrollPageIntoInhaltsverzeichnis(s);
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
    const n = t ? `[data-page-container="${e}"][data-beilage="true"]` : `[data-page-container="${e}"]:not([data-beilage])`, i = this.querySelector(n);
    return i ? Array.from(i.querySelectorAll(".inhalts-entry")) : [];
  }
  updateEntriesState(e) {
    const { entries: t, state: n } = e;
    n === "full" ? (t.forEach((i) => {
      i.style.display = "";
    }), this.highlightPageElements(e, !0)) : (t.forEach((i) => {
      const s = i.hasAttribute("data-is-continuation");
      i.style.display = s ? "none" : "";
    }), this.highlightPageElements(e, !1));
  }
  highlightPageElements(e, t) {
    var o;
    const n = e.container.getAttribute("data-page-container"), i = this.querySelector(`[data-page-number="${n}"]`);
    (o = i == null ? void 0 : i.closest(".page-entry")) == null || o.querySelector(".icon-container");
    const s = i == null ? void 0 : i.closest(".page-entry");
    s && (t ? (s.classList.add("!border-l-red-500"), s.classList.remove("border-slate-300")) : (s.classList.remove("!border-l-red-500"), s.classList.add("border-slate-300")), t && this.scrollEntryIntoView(s));
    const a = document.querySelector(`[data-page="${n}"].page-indicator`);
    if (a) {
      const l = a.querySelectorAll("i:not(.text-slate-400)");
      t ? (a.classList.add("!bg-red-50", "!text-red-600"), l.forEach((c) => c.classList.add("!text-red-600"))) : (a.classList.remove("!bg-red-50", "!text-red-600"), l.forEach((c) => c.classList.remove("!text-red-600")));
    }
  }
  scrollEntryIntoView(e) {
    const t = document.querySelector(".overflow-y-auto");
    if (!t || !e)
      return;
    const n = t.querySelectorAll(".page-entry"), i = n.length > 0 && n[0] === e, s = n.length > 0 && n[n.length - 1] === e;
    if (i) {
      t.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      return;
    }
    if (s) {
      t.scrollTo({
        top: t.scrollHeight,
        behavior: "smooth"
      });
      return;
    }
    const a = t.getBoundingClientRect(), o = e.getBoundingClientRect();
    if (!(o.top >= a.top && o.bottom <= a.bottom)) {
      const c = t.scrollTop, d = o.top - a.top + c, u = a.height, g = o.height, p = d - (u - g) / 2;
      t.scrollTo({
        top: Math.max(0, p),
        behavior: "smooth"
      });
    }
  }
  scrollPageIntoInhaltsverzeichnis(e) {
    const t = e.container.getAttribute("data-page-container"), n = this.querySelector(`[data-page-number="${t}"]`), i = n == null ? void 0 : n.closest(".page-entry");
    i && this.scrollEntryIntoView(i);
  }
  setupSinglePageViewerDetection() {
    document.addEventListener("singlepageviewer:opened", this.boundHandleSinglePageViewer), document.addEventListener("singlepageviewer:closed", this.boundHandleSinglePageViewer), document.addEventListener("singlepageviewer:pagechanged", this.boundHandleSinglePageViewer), this.checkSinglePageViewerState();
  }
  handleSinglePageViewer(e) {
    var t;
    this.singlePageViewerActive, this.singlePageViewerActive = e.type === "singlepageviewer:opened" || e.type === "singlepageviewer:pagechanged" && this.singlePageViewerActive, (this.singlePageViewerActive || e.type === "singlepageviewer:pagechanged") && ((t = e.detail) != null && t.pageNumber) ? this.singlePageViewerCurrentPage = e.detail.pageNumber.toString() : e.type === "singlepageviewer:closed" && (this.singlePageViewerCurrentPage = null, this.singlePageViewerActive = !1), this.pageContainers.forEach((n) => {
      const i = n.container.getAttribute("data-page-container");
      let s;
      this.singlePageViewerActive ? s = i === this.singlePageViewerCurrentPage ? "full" : "short" : s = this.isPageContainerVisible(n.container) ? "full" : "short", n.state !== s && (n.state = s, this.updateEntriesState(n));
    });
  }
  checkSinglePageViewerState() {
    const e = document.querySelector("single-page-viewer[active]");
    this.singlePageViewerActive = e !== null;
  }
  isPageContainerVisible(e) {
    const t = e.getBoundingClientRect(), n = window.innerHeight, i = Math.max(t.top, 0), s = Math.min(t.bottom, n), a = Math.max(0, s - i), o = t.height;
    return a / o >= 0.5;
  }
  cleanup() {
    this.pageObserver && (this.pageObserver.disconnect(), this.pageObserver = null), document.removeEventListener("singlepageviewer:opened", this.boundHandleSinglePageViewer), document.removeEventListener("singlepageviewer:closed", this.boundHandleSinglePageViewer), document.removeEventListener("singlepageviewer:pagechanged", this.boundHandleSinglePageViewer), this.pageContainers.clear();
  }
}
customElements.define("inhaltsverzeichnis-scrollspy", z);
class j extends HTMLElement {
  constructor() {
    super(), this.innerHTML = `
            <div id="error-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center backdrop-blur-sm">
                <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-red-600 flex items-center gap-2">
                                <i class="ri-error-warning-line text-xl"></i>
                                Fehler
                            </h3>
                            <button class="close-btn text-gray-400 hover:text-gray-600 transition-colors">
                                <i class="ri-close-line text-xl"></i>
                            </button>
                        </div>
                        <div class="error-content text-slate-700">
                            <!-- Error content will be loaded here -->
                        </div>
                        <div class="mt-6 flex justify-end">
                            <button class="close-btn px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors">
                                Schließen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `, this.modal = this.querySelector("#error-modal"), this.errorContent = this.querySelector(".error-content"), this.closeButtons = this.querySelectorAll(".close-btn"), this.setupEventListeners();
  }
  setupEventListeners() {
    this.closeButtons.forEach((e) => {
      e.addEventListener("click", () => this.close());
    }), document.addEventListener("keydown", (e) => {
      e.key === "Escape" && !this.modal.classList.contains("hidden") && this.close();
    }), this.modal.addEventListener("click", (e) => {
      e.target === this.modal && this.close();
    });
  }
  show(e) {
    this.errorContent.innerHTML = e, this.modal.classList.remove("hidden");
  }
  close() {
    this.modal.classList.add("hidden");
  }
  // Global helper functions for backward compatibility
  connectedCallback() {
    window.showErrorModal = (e) => this.show(e), window.closeErrorModal = () => this.close();
  }
}
customElements.define("error-modal", j);
window.currentPageContainers = window.currentPageContainers || [];
window.currentActiveIndex = window.currentActiveIndex || 0;
window.pageObserver = window.pageObserver || null;
function D(r, e, t, n = null) {
  let i = document.querySelector("single-page-viewer");
  i || (i = document.createElement("single-page-viewer"), document.body.appendChild(i));
  const s = r.closest('[data-beilage="true"]') !== null, a = window.templateData && window.templateData.targetPage ? window.templateData.targetPage : 0, o = r.closest(".newspaper-page-container, .piece-page-container");
  let l = null, c = null;
  if (o) {
    l = o.getAttribute("data-page-icon-type"), o.querySelector(".part-number") && (l = "part-number");
    const u = o.querySelector(".page-indicator");
    if (u) {
      const g = u.cloneNode(!0);
      g.querySelectorAll("i").forEach((m) => m.remove()), g.querySelectorAll('[class*="target-page-dot"], .target-page-indicator').forEach((m) => m.remove()), c = g.textContent.trim();
    }
  }
  i.show(r.src, r.alt, e, s, a, n, l, c);
}
function E() {
  document.getElementById("pageModal").classList.add("hidden");
}
function F() {
  if (window.pageObserver && (window.pageObserver.disconnect(), window.pageObserver = null), window.currentPageContainers = Array.from(document.querySelectorAll(".newspaper-page-container")), window.currentActiveIndex = 0, b(), document.querySelector(".newspaper-page-container")) {
    let e = /* @__PURE__ */ new Set();
    window.pageObserver = new IntersectionObserver(
      (t) => {
        if (t.forEach((n) => {
          const i = window.currentPageContainers.indexOf(n.target);
          i !== -1 && (n.isIntersecting ? e.add(i) : e.delete(i));
        }), e.size > 0) {
          const i = Array.from(e).sort((s, a) => s - a)[0];
          i !== window.currentActiveIndex && (window.currentActiveIndex = i, b());
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
function K() {
  if (window.currentActiveIndex > 0) {
    let r = -1;
    const e = [];
    window.currentPageContainers.forEach((n, i) => {
      const s = n.getBoundingClientRect(), a = window.innerHeight, o = Math.max(s.top, 0), l = Math.min(s.bottom, a), c = Math.max(0, l - o), d = s.height;
      c / d >= 0.3 && e.push(i);
    });
    const t = Math.min(...e);
    for (let n = t - 1; n >= 0; n--)
      if (!e.includes(n)) {
        r = n;
        break;
      }
    r === -1 && t > 0 && (r = t - 1), r >= 0 && (window.currentActiveIndex = r, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      block: "start"
    }), setTimeout(() => {
      b();
    }, 100));
  }
}
function Z() {
  if (window.currentActiveIndex < window.currentPageContainers.length - 1) {
    let r = -1;
    const e = [];
    window.currentPageContainers.forEach((n, i) => {
      const s = n.getBoundingClientRect(), a = window.innerHeight, o = Math.max(s.top, 0), l = Math.min(s.bottom, a), c = Math.max(0, l - o), d = s.height;
      c / d >= 0.3 && e.push(i);
    });
    const t = Math.max(...e);
    for (let n = t + 1; n < window.currentPageContainers.length; n++)
      if (!e.includes(n)) {
        r = n;
        break;
      }
    r === -1 && t < window.currentPageContainers.length - 1 && (r = t + 1), r >= 0 && r < window.currentPageContainers.length && (window.currentActiveIndex = r, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      block: "start"
    }), setTimeout(() => {
      b();
    }, 100));
  }
}
function W() {
  if (P()) {
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
function P() {
  const r = [];
  window.currentPageContainers.forEach((e, t) => {
    const n = e.getBoundingClientRect(), i = window.innerHeight, s = Math.max(n.top, 0), a = Math.min(n.bottom, i), o = Math.max(0, a - s), l = n.height;
    o / l >= 0.3 && r.push(t);
  });
  for (const e of r) {
    const t = window.currentPageContainers[e];
    if (t && t.id && t.id.includes("beilage-"))
      return !0;
  }
  return !1;
}
function b() {
  const r = document.getElementById("prevPageBtn"), e = document.getElementById("nextPageBtn"), t = document.getElementById("beilageBtn");
  if (r && (r.style.display = "flex", window.currentActiveIndex <= 0 ? (r.disabled = !0, r.classList.add("opacity-50", "cursor-not-allowed"), r.classList.remove("hover:bg-gray-200")) : (r.disabled = !1, r.classList.remove("opacity-50", "cursor-not-allowed"), r.classList.add("hover:bg-gray-200"))), e && (e.style.display = "flex", window.currentActiveIndex >= window.currentPageContainers.length - 1 ? (e.disabled = !0, e.classList.add("opacity-50", "cursor-not-allowed"), e.classList.remove("hover:bg-gray-200")) : (e.disabled = !1, e.classList.remove("opacity-50", "cursor-not-allowed"), e.classList.add("hover:bg-gray-200"))), t) {
    const n = P(), i = t.querySelector("i");
    n ? (t.title = "Zur Hauptausgabe", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", i && (i.className = "ri-file-text-line text-lg lg:text-xl")) : (t.title = "Zu Beilage", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", i && (i.className = "ri-attachment-line text-lg lg:text-xl"));
  }
}
function J() {
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
    x(t, r);
  }) : x(t, r);
}
function x(r, e) {
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
      const n = document.execCommand("copy");
      h(e, n ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(t);
    }
  }
}
function Y() {
  const r = document.getElementById("citationBtn"), e = document.title || "KGPZ";
  let t = window.location.origin + window.location.pathname;
  t.includes("#") && (t = t.split("#")[0]);
  const n = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), i = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${e}. Digital verfügbar unter: ${t} (Zugriff: ${n}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(i).then(() => {
      h(r, "Zitation kopiert!");
    }).catch((s) => {
      h(r, "Kopieren fehlgeschlagen");
    });
  else {
    const s = document.createElement("textarea");
    s.value = i, document.body.appendChild(s), s.select();
    try {
      const a = document.execCommand("copy");
      h(r, a ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(r, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(s);
    }
  }
}
function h(r, e) {
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
  const i = r.getBoundingClientRect(), s = window.innerHeight, a = window.innerWidth;
  let o = i.left - 10, l = i.bottom + 8;
  const c = 120, d = 32;
  o + c > a && (o = i.right - c + 10), l + d > s && (l = i.top - d - 8), n.style.left = Math.max(5, o) + "px", n.style.top = Math.max(5, l) + "px", document.body.appendChild(n), setTimeout(() => {
    n.style.opacity = "1";
  }, 10), setTimeout(() => {
    n.style.opacity = "0", setTimeout(() => {
      n.parentNode && n.remove();
    }, 200);
  }, 2e3);
}
function G(r, e, t = !1) {
  let n = "";
  if (t)
    n = window.location.origin + window.location.pathname + `#beilage-1-page-${r}`;
  else {
    const s = window.location.pathname.split("/");
    if (s.length >= 3) {
      const a = s[1], o = s[2];
      n = `${window.location.origin}/${a}/${o}/${r}`;
    } else
      n = window.location.origin + window.location.pathname + `/${r}`;
  }
  const i = n;
  if (navigator.clipboard)
    navigator.clipboard.writeText(i).then(() => {
      h(e, "Link kopiert!");
    }).catch((s) => {
      h(e, "Kopieren fehlgeschlagen");
    });
  else {
    const s = document.createElement("textarea");
    s.value = i, document.body.appendChild(s), s.select();
    try {
      const a = document.execCommand("copy");
      h(e, a ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      h(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(s);
    }
  }
}
function U(r, e) {
  const t = document.title || "KGPZ", n = window.location.pathname.split("/");
  let i;
  if (n.length >= 3) {
    const l = n[1], c = n[2];
    i = `${window.location.origin}/${l}/${c}/${r}`;
  } else
    i = `${window.location.origin}${window.location.pathname}/${r}`;
  const s = i, a = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), o = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${t}, Seite ${r}. Digital verfügbar unter: ${s} (Zugriff: ${a}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(o).then(() => {
      h(e, "Zitation kopiert!");
    }).catch((l) => {
      h(e, "Kopieren fehlgeschlagen");
    });
  else {
    const l = document.createElement("textarea");
    l.value = o, document.body.appendChild(l), l.select();
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
function L() {
  F(), window.addEventListener("scroll", function() {
    clearTimeout(window.scrollTimeout), window.scrollTimeout = setTimeout(() => {
      b();
    }, 50);
  }), document.addEventListener("keydown", function(r) {
    r.key === "Escape" && E();
  });
}
function k() {
  const r = window.location.pathname;
  document.querySelectorAll(".citation-link[data-citation-url]").forEach((t) => {
    const n = t.getAttribute("data-citation-url");
    let i = !1;
    if (n === r)
      i = !0;
    else {
      const s = r.match(/^\/(\d{4})\/(\d+)(?:\/(\d+))?$/), a = n.match(/^\/(\d{4})\/(\d+)$/);
      if (s && a) {
        const [, o, l, c] = s, [, d, u] = a;
        o === d && l === u && (i = !0);
      }
    }
    i ? (t.classList.add("text-red-700", "pointer-events-none"), t.setAttribute("aria-current", "page")) : (t.classList.remove("text-red-700", "pointer-events-none"), t.removeAttribute("aria-current"));
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
window.enlargePage = D;
window.closeModal = E;
window.scrollToPreviousPage = K;
window.scrollToNextPage = Z;
window.scrollToBeilage = W;
window.shareCurrentPage = J;
window.generateCitation = Y;
window.copyPagePermalink = G;
window.generatePageCitation = U;
C();
k();
document.querySelector(".newspaper-page-container") && L();
let X = function(r) {
  C(), k(), S(), setTimeout(() => {
    document.querySelector(".newspaper-page-container") && L();
  }, 50);
};
document.body.addEventListener("htmx:afterSettle", X);
