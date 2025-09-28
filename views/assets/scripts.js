document.body.addEventListener("htmx:configRequest", function(a) {
  let e = a.detail.elt;
  e.id === "search" && e.value === "" && (a.detail.parameters = {}, a.detail.path = window.location.pathname + window.location.search);
});
class A extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.setupEventListeners();
  }
  setupEventListeners() {
    const e = this.querySelector("#person-search"), t = this.querySelector("#authors-only"), i = this.querySelector("#all-persons"), n = this.querySelector("#authors-only-list");
    !e || !t || !i || !n || (e.addEventListener("input", (s) => {
      const o = s.target.value.toLowerCase().trim();
      this.filterPersons(o);
    }), t.addEventListener("change", () => {
      this.togglePersonsList();
      const s = e.value.toLowerCase().trim();
      this.filterPersons(s);
    }));
  }
  togglePersonsList() {
    const e = this.querySelector("#authors-only"), t = this.querySelector("#all-persons"), i = this.querySelector("#authors-only-list");
    !e || !t || !i || (e.checked ? (t.style.display = "none", i.style.display = "block") : (t.style.display = "block", i.style.display = "none"));
  }
  filterPersons(e) {
    const t = this.querySelector("#authors-only"), i = t != null && t.checked ? this.querySelector("#authors-only-list") : this.querySelector("#all-persons");
    if (!i)
      return;
    i.querySelectorAll(".person-item").forEach((s) => {
      var c, d;
      const o = ((c = s.querySelector(".person-name")) == null ? void 0 : c.textContent) || "", r = ((d = s.querySelector(".person-life")) == null ? void 0 : d.textContent) || "";
      !e || o.toLowerCase().includes(e) || r.toLowerCase().includes(e) ? s.style.display = "block" : s.style.display = "none";
    });
  }
}
customElements.define("person-jump-filter", A);
class H extends HTMLElement {
  connectedCallback() {
    const e = this.querySelector("#place-search");
    e && e.addEventListener("input", (t) => {
      const i = t.target.value.toLowerCase().trim();
      this.querySelectorAll(".place-item").forEach((s) => {
        var l;
        const o = ((l = s.querySelector(".place-name")) == null ? void 0 : l.textContent) || "", r = !i || o.toLowerCase().includes(i);
        s.style.display = r ? "block" : "none";
      });
    });
  }
}
customElements.define("place-jump-filter", H);
class B extends HTMLElement {
  connectedCallback() {
    const e = this.querySelector("#category-search");
    e && e.addEventListener("input", (t) => {
      const i = t.target.value.toLowerCase().trim();
      this.querySelectorAll(".category-item").forEach((s) => {
        var l;
        const o = ((l = s.querySelector(".category-name")) == null ? void 0 : l.textContent) || "", r = !i || o.toLowerCase().includes(i);
        s.style.display = r ? "block" : "none";
      });
    });
  }
}
customElements.define("category-jump-filter", B);
class M extends HTMLElement {
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
    const e = this.querySelector("#year-select"), t = this.querySelector("#issue-number-select"), i = this.querySelector("#issue-date-select"), n = this.querySelector("#page-input"), s = this.querySelector("#page-jump-btn");
    if (!e)
      return;
    e.addEventListener("change", () => {
      this.updateIssueOptions(), this.updatePageInputState(), this.clearPageErrors();
    }), t && t.addEventListener("change", () => {
      const r = e.value, l = t.value;
      r && l && (window.location.href = `/${r}/${l}`);
    }), i && i.addEventListener("change", () => {
      const r = e.value, l = i.value;
      r && l && (window.location.href = `/${r}/${l}`);
    }), n && (n.addEventListener("input", () => {
      this.updatePageJumpButton(), this.clearPageErrors();
    }), n.addEventListener("keydown", (r) => {
      r.key === "Enter" && (r.preventDefault(), this.handlePageJump());
    })), s && s.addEventListener("click", () => {
      this.handlePageJump();
    });
    const o = this.querySelector("#page-jump-form");
    o && o.addEventListener("submit", (r) => {
      r.preventDefault(), this.handlePageJump();
    }), this.updateIssueOptions(), this.updatePageInputState(), this.updatePageJumpButton();
  }
  updateIssueOptions() {
    const e = this.querySelector("#year-select"), t = this.querySelector("#issue-number-select"), i = this.querySelector("#issue-date-select");
    if (!e || !t || !i)
      return;
    const n = e.value, s = this.issuesByYear[n] || [];
    t.innerHTML = '<option value="">Nr.</option>', i.innerHTML = '<option value="">Datum</option>', s.forEach((r) => {
      const l = document.createElement("option");
      l.value = r.number, l.textContent = r.number, t.appendChild(l);
      const c = document.createElement("option");
      c.value = r.number, c.textContent = `${r.date} [${r.number}]`, i.appendChild(c);
    });
    const o = s.length > 0 && n;
    t.disabled = !o, i.disabled = !o;
  }
  async handlePageJump() {
    const e = this.querySelector("#year-select"), t = this.querySelector("#page-input"), i = this.querySelector("#jump-errors");
    if (!e || !t)
      return;
    const n = e.value, s = t.value;
    if (!n || !s) {
      this.showError("Bitte Jahr und Seite auswählen.");
      return;
    }
    try {
      const o = new FormData();
      o.append("year", n), o.append("page", s);
      const r = await fetch("/jump", {
        method: "POST",
        body: o,
        redirect: "manual"
      }), l = r.headers.get("HX-Redirect");
      if (l) {
        window.location.href = l;
        return;
      }
      if (r.status === 302 || r.status === 301) {
        const c = r.headers.get("Location");
        if (c) {
          window.location.href = c;
          return;
        }
      }
      if (r.ok)
        i && (i.innerHTML = "");
      else {
        const c = await r.text();
        i && (i.innerHTML = c);
      }
    } catch (o) {
      console.error("Page jump failed:", o), this.showError("Fehler beim Suchen der Seite.");
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
    const i = e.value;
    t.disabled = !i, i || (t.value = "", this.updatePageJumpButton());
  }
  updatePageJumpButton() {
    const e = this.querySelector("#year-select"), t = this.querySelector("#page-input"), i = this.querySelector("#page-jump-btn");
    if (!e || !t || !i)
      return;
    const n = e.value, s = t.value && t.value.trim(), o = n && s;
    i.disabled = !o;
  }
}
customElements.define("year-jump-filter", M);
class N extends HTMLElement {
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
    const i = e.querySelector("div.flex.justify-center");
    if (e.classList.contains("hidden")) {
      e.classList.remove("hidden"), t.classList.add("bg-slate-200");
      const n = this.querySelector("i");
      n && (n.className = "ri-arrow-up-line"), this.isOpen = !0, i && i.querySelector("div, form, h3") || htmx.ajax("GET", "/filter", {
        target: "#filter-container",
        select: "#filter",
        swap: "innerHTML"
      }).then(() => {
        console.log("HTMX request completed"), document.querySelector("#filter-container .flex.justify-center");
      }).catch((o) => {
        console.log("HTMX request failed:", o);
      });
    } else
      this.hideFilter();
  }
  hideFilter() {
    const e = document.getElementById("filter-container"), t = this.querySelector("button");
    if (!e || !t)
      return;
    e.classList.add("hidden"), t.classList.remove("bg-slate-200");
    const i = this.querySelector("i");
    i && (i.className = "ri-filter-2-line"), this.isOpen = !1;
  }
  handleSelectionEvent(e) {
    this.isOpen && this.hideFilter();
  }
  handleOutsideClick(e) {
    const t = document.getElementById("filter-container"), i = this.querySelector("button");
    this.isOpen && t && i && !t.contains(e.target) && !this.contains(e.target) && this.hideFilter();
  }
}
customElements.define("schnellauswahl-button", N);
class $ extends HTMLElement {
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
                            <a href="/akteure/a">Personen &amp; Werke</a>
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
    e && e.addEventListener("click", (i) => {
      i.stopPropagation(), this.toggleMenu();
    }), t && t.addEventListener("click", (i) => {
      const n = i.target.closest("a[href]");
      if (n) {
        const s = new CustomEvent("quickfilter:selection", {
          detail: {
            type: "navigation",
            source: "menu",
            url: n.getAttribute("href"),
            text: n.textContent.trim()
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
customElements.define("navigation-menu", $);
document.addEventListener("DOMContentLoaded", function() {
  document.addEventListener("click", function(a) {
    const e = a.target.closest('a[href^="/akteure/"], a[href^="/ort/"]'), t = document.getElementById("filter-container");
    if (e && t && t.contains(e)) {
      const i = new CustomEvent("quickfilter:selection", {
        detail: {
          type: e.getAttribute("href").startsWith("/akteure/") ? "person" : "place",
          source: "quickfilter",
          id: e.getAttribute("href").split("/").pop(),
          url: e.getAttribute("href")
        },
        bubbles: !0
      });
      document.dispatchEvent(i);
    }
  });
});
const w = [];
document.addEventListener("DOMContentLoaded", () => {
  S();
});
const S = function() {
  for (; w.length > 0; ) {
    const a = w.shift();
    try {
      a();
    } catch (e) {
      console.error("Error executing settle queue function:", e);
    }
  }
};
class O extends HTMLElement {
  constructor() {
    super(), this.scrollTimeout = null, this.clickHandlers = [], this.manualNavigation = !1, this.handleScroll = this.handleScroll.bind(this);
  }
  handleScroll() {
    clearTimeout(this.scrollTimeout), this.scrollTimeout = setTimeout(() => {
      this.updateActiveLink(), this.updateSidebarScrollToTopButton();
    }, 50);
  }
  connectedCallback() {
    setTimeout(() => {
      this.initializeScrollspyAfterDelay();
    }, 50), window.addEventListener("pageshow", (e) => {
      e.persisted && (this.cleanup(), this.initializeScrollspy());
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
    window.addEventListener("scroll", this.handleScroll), this.navLinks.forEach((e) => {
      const t = (i) => {
        i.preventDefault();
        const n = e.getAttribute("data-target"), s = document.getElementById(n);
        s && (this.updateActiveLinkImmediate(n), this.manualNavigation = !0, s.scrollIntoView({
          behavior: "instant",
          block: "start"
        }), setTimeout(() => {
          this.manualNavigation = !1, this.ensureMarkerVisibility();
        }, 1e3));
      };
      this.clickHandlers.push({ link: e, handler: t }), e.addEventListener("click", t);
    }), setTimeout(() => {
      this.updateActiveLink();
    }, 300), this.updateSidebarScrollToTopButton();
  }
  ensureMarkerVisibility() {
    const e = document.getElementById("scrollspy-slider"), t = document.getElementById("scrollspy-nav");
    if (!e || !t || e.style.opacity === "0")
      return;
    const i = t.getBoundingClientRect(), n = parseFloat(e.style.top), s = parseFloat(e.style.height), o = n + s, r = t.scrollTop, l = r + i.height;
    if (o > l) {
      const c = o - i.height + 20;
      t.scrollTo({
        top: c,
        behavior: "smooth"
      });
    } else if (n < r) {
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
        const s = n.getAttribute("id"), o = n.querySelector(".akteur-werke-section"), r = n.querySelector(".akteur-beitraege-section");
        let l = !1;
        if (o) {
          const c = o.getBoundingClientRect(), d = c.top < window.innerHeight, u = c.bottom > 0;
          d && u && (l = !0);
        }
        if (r && !l) {
          const c = r.getBoundingClientRect(), d = c.top < window.innerHeight, u = c.bottom > 0;
          d && u && (l = !0);
        }
        if (!o && !r) {
          const c = n.querySelector("div:first-child");
          if (c) {
            const d = c.getBoundingClientRect(), u = d.top >= 0, h = d.bottom <= window.innerHeight;
            u && h && (l = !0);
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
      let o = 1 / 0, r = -1 / 0;
      t.forEach((c) => {
        const d = c.getBoundingClientRect(), u = d.top - s.top + n.scrollTop, h = u + d.height;
        o = Math.min(o, u), r = Math.max(r, h);
      });
      let l = r - o;
      i.style.top = `${o}px`, i.style.height = `${l}px`, i.style.opacity = "1", setTimeout(() => this.ensureMarkerVisibility(), 100);
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
        const s = n.getBoundingClientRect(), o = i.getBoundingClientRect(), r = o.top - s.top + n.scrollTop;
        t.style.top = `${r}px`, t.style.height = `${o.height}px`, t.style.opacity = "1";
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
    ), s = window.innerHeight, o = n - s, r = o > 0 ? window.scrollY / o : 0, l = t.clientHeight, d = t.scrollHeight - l;
    if (d > 0) {
      const u = r * d, h = i.getBoundingClientRect(), p = t.getBoundingClientRect(), f = h.top - p.top + t.scrollTop, m = l / 2, T = f - m, y = 0.7, I = y * u + (1 - y) * T, v = Math.max(0, Math.min(d, I)), q = t.scrollTop;
      Math.abs(v - q) > 10 && t.scrollTo({
        top: v,
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
    window.removeEventListener("scroll", this.handleScroll), this.scrollTimeout && (clearTimeout(this.scrollTimeout), this.scrollTimeout = null), this.clickHandlers && this.clickHandlers.length > 0 && this.clickHandlers.forEach(({ link: t, handler: i }) => {
      t && i && t.removeEventListener("click", i);
    });
    const e = document.getElementById("scrollspy-slider");
    e && (e.style.opacity = "0", e.style.height = "0"), this.sections = null, this.navLinks = null, this.clickHandlers = [], this.manualNavigation = !1;
  }
}
customElements.define("akteure-scrollspy", O);
class V extends HTMLElement {
  constructor() {
    super(), this.searchInput = null, this.placeCards = [], this.countElement = null, this.debounceTimer = null, this.originalCount = 0;
  }
  connectedCallback() {
    this.render(), this.setupEventListeners(), this.initializePlaceCards();
  }
  disconnectedCallback() {
    this.cleanupEventListeners(), this.debounceTimer && clearTimeout(this.debounceTimer);
  }
  render() {
    this.innerHTML = `
			<div class="mb-6">
				<input
					type="text"
					id="places-search"
					placeholder="Ortsnamen eingeben..."
					autocomplete="off"
					class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
				>
			</div>
		`;
  }
  setupEventListeners() {
    this.searchInput = this.querySelector("#places-search"), this.searchInput && this.searchInput.addEventListener("input", this.handleSearchInput.bind(this));
  }
  cleanupEventListeners() {
    this.searchInput && this.searchInput.removeEventListener("input", this.handleSearchInput.bind(this));
  }
  initializePlaceCards() {
    const e = this.closest(".bg-white") || document;
    this.placeCards = Array.from(e.querySelectorAll("[data-place-name]")), this.countElement = e.querySelector("[data-places-count]"), this.countElement && (this.originalCount = this.placeCards.length);
  }
  handleSearchInput(e) {
    this.debounceTimer && clearTimeout(this.debounceTimer), this.debounceTimer = setTimeout(() => {
      this.filterPlaces(e.target.value.trim());
    }, 150);
  }
  filterPlaces(e) {
    if (!this.placeCards.length) return;
    const t = e.toLowerCase();
    let i = 0;
    this.placeCards.forEach((n) => {
      var l, c;
      const s = ((l = n.getAttribute("data-place-name")) == null ? void 0 : l.toLowerCase()) || "", o = ((c = n.getAttribute("data-modern-name")) == null ? void 0 : c.toLowerCase()) || "";
      e === "" || s.includes(t) || o.includes(t) ? (n.style.display = "", i++) : n.style.display = "none";
    }), this.updateCountDisplay(i, e);
  }
  updateCountDisplay(e, t) {
    this.countElement && (t === "" ? this.countElement.textContent = `Alle Orte (${this.originalCount})` : e === 0 ? this.countElement.textContent = `Keine Orte gefunden für "${t}"` : this.countElement.textContent = `${e} von ${this.originalCount} Orten`);
  }
}
class R extends HTMLElement {
  constructor() {
    super(), this.isExpanded = !1, this.isLoading = !1, this.hasLoaded = !1;
  }
  connectedCallback() {
    this.setupAccordion(), this.setupEventListeners();
  }
  disconnectedCallback() {
    this.cleanupEventListeners();
  }
  setupAccordion() {
    if (!this.querySelector(".accordion-chevron")) {
      const e = document.createElement("i");
      e.className = "ri-chevron-down-line accordion-chevron transition-transform duration-200 text-slate-400";
      const t = this.querySelector('[class*="bg-slate-100"]');
      t && t.parentNode.insertBefore(e, t);
    }
    if (!this.querySelector("[data-content]")) {
      const e = this.getAttribute("data-place-id"), t = document.createElement("div");
      t.setAttribute("data-content", ""), t.className = "accordion-content overflow-hidden transition-all duration-300 max-h-0", t.setAttribute("hx-get", `/ort/fragment/${e}`), t.setAttribute("hx-trigger", "load-content"), t.setAttribute("hx-swap", "innerHTML"), t.setAttribute("hx-target", "this"), t.setAttribute("hx-select", ".place-fragment-content"), t.setAttribute("hx-boost", "false"), this.appendChild(t);
    }
  }
  setupEventListeners() {
    this.addEventListener("click", this.handleClick.bind(this));
  }
  cleanupEventListeners() {
    this.removeEventListener("click", this.handleClick.bind(this));
  }
  handleClick(e) {
    const t = this.querySelector("[data-content]");
    t && t.contains(e.target) || this.toggle();
  }
  toggle() {
    this.isExpanded ? this.collapse() : this.expand();
  }
  expand() {
    if (this.isLoading) return;
    this.isExpanded = !0, this.updateChevron();
    const e = this.querySelector("[data-content]");
    e && (this.hasLoaded ? e.style.maxHeight = e.scrollHeight + "px" : this.loadContent());
  }
  collapse() {
    this.isExpanded = !1, this.updateChevron();
    const e = this.querySelector("[data-content]");
    e && (e.style.maxHeight = "0px");
  }
  loadContent() {
    this.isLoading = !0;
    const e = this.querySelector("[data-content]");
    e.innerHTML = '<div class="p-4 text-center text-slate-500">Lädt...</div>', e.style.maxHeight = e.scrollHeight + "px";
    const t = () => {
      this.hasLoaded = !0, this.isLoading = !1, setTimeout(() => {
        e.style.maxHeight = e.scrollHeight + "px";
      }, 10), e.removeEventListener("htmx:afterRequest", t);
    }, i = () => {
      this.isLoading = !1, e.innerHTML = '<div class="p-4 text-center text-red-500">Fehler beim Laden</div>', e.removeEventListener("htmx:responseError", i);
    };
    e.addEventListener("htmx:afterRequest", t), e.addEventListener("htmx:responseError", i), htmx.trigger(e, "load-content");
  }
  updateChevron() {
    const e = this.querySelector(".accordion-chevron");
    e && (this.isExpanded ? e.style.transform = "rotate(180deg)" : e.style.transform = "rotate(0deg)");
  }
}
customElements.define("places-filter", V);
customElements.define("place-accordion", R);
class z extends HTMLElement {
  constructor() {
    super(), this.searchInput = null, this.itemCards = [], this.countElement = null, this.debounceTimer = null, this.originalCount = 0;
  }
  connectedCallback() {
    this.placeholderText = this.getAttribute("placeholder") || "Suchen...", this.itemSelector = this.getAttribute("item-selector") || "[data-filter-item]", this.searchAttributes = (this.getAttribute("search-attributes") || "data-filter-text").split(","), this.countSelector = this.getAttribute("count-selector") || "[data-filter-count]", this.itemType = this.getAttribute("item-type") || "Einträge", this.itemTypeSingular = this.getAttribute("item-type-singular") || "Eintrag", this.render(), this.setupEventListeners(), this.initializeItems();
  }
  disconnectedCallback() {
    this.cleanupEventListeners(), this.debounceTimer && clearTimeout(this.debounceTimer);
  }
  render() {
    this.innerHTML = `
			<div class="mb-6">
				<input
					type="text"
					id="generic-search"
					placeholder="${this.placeholderText}"
					autocomplete="off"
					class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
				>
			</div>
		`;
  }
  setupEventListeners() {
    this.searchInput = this.querySelector("#generic-search"), this.searchInput && this.searchInput.addEventListener("input", this.handleSearchInput.bind(this));
  }
  cleanupEventListeners() {
    this.searchInput && this.searchInput.removeEventListener("input", this.handleSearchInput.bind(this));
  }
  initializeItems() {
    this.itemCards = Array.from(document.querySelectorAll(this.itemSelector));
    const e = this.closest(".filter-sidebar") || this.closest(".sidebar") || document;
    this.countElement = e.querySelector(this.countSelector), console.log("GenericFilter initialized:", {
      itemSelector: this.itemSelector,
      itemsFound: this.itemCards.length,
      countElement: this.countElement,
      searchAttributes: this.searchAttributes
    }), this.countElement && (this.originalCount = this.itemCards.length);
  }
  handleSearchInput(e) {
    this.debounceTimer && clearTimeout(this.debounceTimer), this.debounceTimer = setTimeout(() => {
      this.filterItems(e.target.value.trim());
    }, 150);
  }
  filterItems(e) {
    if (!this.itemCards.length) return;
    const t = e.toLowerCase();
    let i = 0;
    this.itemCards.forEach((n) => {
      var o;
      let s = e === "";
      if (!s) {
        for (const r of this.searchAttributes)
          if ((((o = n.getAttribute(r.trim())) == null ? void 0 : o.toLowerCase()) || "").includes(t)) {
            s = !0;
            break;
          }
      }
      s ? (n.style.display = "", i++) : n.style.display = "none";
    }), this.updateCountDisplay(i, e);
  }
  updateCountDisplay(e, t) {
    if (this.countElement)
      if (t === "")
        this.countElement.textContent = `Alle ${this.itemType} (${this.originalCount})`;
      else if (e === 0)
        this.countElement.textContent = `Keine ${this.itemType} gefunden für "${t}"`;
      else {
        const i = e === 1 ? this.itemTypeSingular : this.itemType;
        this.countElement.textContent = `${e} von ${this.originalCount} ${i}`;
      }
  }
}
customElements.define("generic-filter", z);
class D extends HTMLElement {
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
  show(e, t, i, n = !1, s = 0, o = null, r = null, l = null) {
    const c = this.querySelector("#single-page-image"), d = this.querySelector("#page-number"), u = this.querySelector("#page-icon");
    this.querySelector("#page-indicator"), c.src = e, c.alt = t, this.currentPageNumber = i, this.currentIsBeilage = n, this.currentPartNumber = o;
    let h;
    if (l)
      h = l;
    else {
      const f = this.getIssueContext(i);
      h = f ? `${f}, ${i}` : `${i}`;
    }
    if (d.innerHTML = h, s && i === s) {
      d.style.position = "relative";
      const f = d.querySelector(".target-page-dot");
      f && f.remove();
      const m = document.createElement("span");
      m.className = "target-page-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10", m.title = "verlinkte Seite", d.appendChild(m);
    }
    r ? r === "part-number" && o !== null ? u.innerHTML = `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${o}. Teil</span>` : u.innerHTML = this.generateIconFromType(r) : u.innerHTML = this.generateFallbackIcon(i, n, o), this.updateNavigationButtons(), this.style.display = "block", this.setAttribute("active", "true");
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
    e = ".newspaper-page-container";
    const t = Array.from(document.querySelectorAll(e));
    console.log(
      "Found containers:",
      t.length,
      "for",
      this.currentIsBeilage ? "beilage" : "main"
    );
    const i = t.map((r) => {
      const l = r.getAttribute("data-page-container"), c = l ? parseInt(l) : null;
      return console.log("Container page:", l, "parsed:", c), c;
    }).filter((r) => r !== null);
    console.log("All pages found:", i), console.log("Current page:", this.currentPageNumber);
    const n = i.indexOf(this.currentPageNumber);
    console.log("Current index:", n);
    let s = null, o = null;
    return n > 0 && (s = i[n - 1]), n < i.length - 1 && (o = i[n + 1]), console.log("Adjacent pages - prev:", s, "next:", o), { prevPage: s, nextPage: o };
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
        let o = null, r = null;
        o = i.getAttribute("data-page-icon-type"), i.querySelector(".part-number") && (o = "part-number");
        const c = i.querySelector(".page-indicator");
        if (c) {
          const d = c.cloneNode(!0);
          d.querySelectorAll("i").forEach((p) => p.remove()), d.querySelectorAll(
            '[class*="target-page-dot"], .target-page-indicator'
          ).forEach((p) => p.remove()), r = d.textContent.trim();
        }
        this.show(
          n.src,
          n.alt,
          e,
          this.currentIsBeilage,
          0,
          s,
          o,
          r
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
      const o = this.detectSidebarWidth();
      e.style.width = o, t.className = "w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", i.className = "ri-sidebar-fold-line text-lg font-bold", t.title = "Inhaltsverzeichnis ausblenden", console.log("Expanding sidebar to:", o);
    } else
      e.style.width = "0px", t.className = "w-10 h-10 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer", i.className = "ri-sidebar-unfold-line text-lg font-bold", t.title = "Inhaltsverzeichnis einblenden", console.log("Collapsing sidebar");
    console.log("New width:", e.style.width);
  }
  // Extract issue context from document title, URL, or page container
  getIssueContext(e) {
    const t = window.location.pathname, i = t.includes("/beitrag/");
    if (i) {
      const o = document.querySelector(`[data-page-container="${e}"]`);
      if (o) {
        const c = o.querySelector(".page-indicator");
        if (c) {
          const d = c.textContent.trim(), u = d.match(/(\d{1,2}\.\d{1,2}\.\d{4}\s+Nr\.\s+\d+)/);
          if (u)
            return u[1];
          const h = d.match(/(\d{4})\s+Nr\.\s+(\d+)/);
          if (h)
            return `${h[1]} Nr. ${h[2]}`;
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
      const r = s.textContent.trim().match(/(\d{4})\s+Nr\.\s+(\d+)/);
      if (r)
        return `${r[1]} Nr. ${r[2]}`;
    }
    return "KGPZ";
  }
}
customElements.define("single-page-viewer", D);
document.body.addEventListener("htmx:beforeRequest", function(a) {
  const e = document.querySelector("single-page-viewer");
  e && e.style.display !== "none" && (console.log("Cleaning up single page viewer before HTMX navigation"), e.close());
});
window.addEventListener("beforeunload", function() {
  const a = document.querySelector("single-page-viewer");
  a && a.close();
});
class j extends HTMLElement {
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
customElements.define("scroll-to-top-button", j);
class F extends HTMLElement {
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
      const i = t.getAttribute("data-page-container"), n = t.hasAttribute("data-beilage"), s = this.findInhaltsEntriesForPage(i, n);
      s.length > 0 && this.pageContainers.set(i, {
        container: t,
        entries: s,
        state: "short",
        // Default state
        isBeilage: n
      });
    }), this.pageObserver = new IntersectionObserver((t) => {
      t.forEach((i) => {
        const n = i.target.getAttribute("data-page-container"), s = this.pageContainers.get(n);
        if (s) {
          const r = i.isIntersecting && i.intersectionRatio >= 0.5 || this.singlePageViewerActive ? "full" : "short";
          s.state !== r ? (s.state = r, this.updateEntriesState(s)) : r === "full" && i.isIntersecting && i.intersectionRatio >= 0.5 && this.scrollPageIntoInhaltsverzeichnis(s);
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
      const s = n.hasAttribute("data-is-continuation");
      n.style.display = s ? "none" : "";
    }), this.highlightPageElements(e, !1));
  }
  highlightPageElements(e, t) {
    var r;
    const i = e.container.getAttribute("data-page-container"), n = this.querySelector(`[data-page-number="${i}"]`);
    (r = n == null ? void 0 : n.closest(".page-entry")) == null || r.querySelector(".icon-container");
    const s = n == null ? void 0 : n.closest(".page-entry");
    s && (t ? (s.classList.add("!border-l-red-500"), s.classList.remove("border-slate-300")) : (s.classList.remove("!border-l-red-500"), s.classList.add("border-slate-300")), t && this.scrollEntryIntoView(s));
    const o = document.querySelector(`[data-page="${i}"].page-indicator`);
    if (o) {
      const l = o.querySelectorAll("i:not(.text-slate-400)");
      t ? (o.classList.add("!bg-red-50", "!text-red-600"), l.forEach((c) => c.classList.add("!text-red-600"))) : (o.classList.remove("!bg-red-50", "!text-red-600"), l.forEach((c) => c.classList.remove("!text-red-600")));
    }
  }
  scrollEntryIntoView(e) {
    const t = document.querySelector(".overflow-y-auto");
    if (!t || !e)
      return;
    const i = t.querySelectorAll(".page-entry"), n = i.length > 0 && i[0] === e, s = i.length > 0 && i[i.length - 1] === e;
    if (n) {
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
    const o = t.getBoundingClientRect(), r = e.getBoundingClientRect();
    if (!(r.top >= o.top && r.bottom <= o.bottom)) {
      const c = t.scrollTop, d = r.top - o.top + c, u = o.height, h = r.height, p = d - (u - h) / 2;
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
      let s;
      this.singlePageViewerActive ? s = n === this.singlePageViewerCurrentPage ? "full" : "short" : s = this.isPageContainerVisible(i.container) ? "full" : "short", i.state !== s && (i.state = s, this.updateEntriesState(i));
    });
  }
  checkSinglePageViewerState() {
    const e = document.querySelector("single-page-viewer[active]");
    this.singlePageViewerActive = e !== null;
  }
  isPageContainerVisible(e) {
    const t = e.getBoundingClientRect(), i = window.innerHeight, n = Math.max(t.top, 0), s = Math.min(t.bottom, i), o = Math.max(0, s - n), r = t.height;
    return o / r >= 0.5;
  }
  cleanup() {
    this.pageObserver && (this.pageObserver.disconnect(), this.pageObserver = null), document.removeEventListener("singlepageviewer:opened", this.boundHandleSinglePageViewer), document.removeEventListener("singlepageviewer:closed", this.boundHandleSinglePageViewer), document.removeEventListener("singlepageviewer:pagechanged", this.boundHandleSinglePageViewer), this.pageContainers.clear();
  }
}
customElements.define("inhaltsverzeichnis-scrollspy", F);
class K extends HTMLElement {
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
customElements.define("error-modal", K);
window.currentPageContainers = window.currentPageContainers || [];
window.currentActiveIndex = window.currentActiveIndex || 0;
window.pageObserver = window.pageObserver || null;
function W(a, e, t, i = null) {
  let n = document.querySelector("single-page-viewer");
  n || (n = document.createElement("single-page-viewer"), document.body.appendChild(n));
  const s = a.closest('[data-beilage="true"]') !== null, o = window.templateData && window.templateData.targetPage ? window.templateData.targetPage : 0, r = a.closest(".newspaper-page-container, .piece-page-container");
  let l = null, c = null;
  if (r) {
    l = r.getAttribute("data-page-icon-type"), r.querySelector(".part-number") && (l = "part-number");
    const u = r.querySelector(".page-indicator");
    if (u) {
      const h = u.cloneNode(!0);
      h.querySelectorAll("i").forEach((m) => m.remove()), h.querySelectorAll('[class*="target-page-dot"], .target-page-indicator').forEach((m) => m.remove()), c = h.textContent.trim();
    }
  }
  n.show(a.src, a.alt, e, s, o, i, l, c);
}
function E() {
  document.getElementById("pageModal").classList.add("hidden");
}
function Z() {
  if (window.pageObserver && (window.pageObserver.disconnect(), window.pageObserver = null), window.currentPageContainers = Array.from(document.querySelectorAll(".newspaper-page-container")), window.currentActiveIndex = 0, b(), document.querySelector(".newspaper-page-container")) {
    let e = /* @__PURE__ */ new Set();
    window.pageObserver = new IntersectionObserver(
      (t) => {
        if (t.forEach((i) => {
          const n = window.currentPageContainers.indexOf(i.target);
          n !== -1 && (i.isIntersecting ? e.add(n) : e.delete(n));
        }), e.size > 0) {
          const n = Array.from(e).sort((s, o) => s - o)[0];
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
function J() {
  if (window.currentActiveIndex > 0) {
    let a = -1;
    const e = [];
    window.currentPageContainers.forEach((i, n) => {
      const s = i.getBoundingClientRect(), o = window.innerHeight, r = Math.max(s.top, 0), l = Math.min(s.bottom, o), c = Math.max(0, l - r), d = s.height;
      c / d >= 0.3 && e.push(n);
    });
    const t = Math.min(...e);
    for (let i = t - 1; i >= 0; i--)
      if (!e.includes(i)) {
        a = i;
        break;
      }
    a === -1 && t > 0 && (a = t - 1), a >= 0 && (window.currentActiveIndex = a, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      block: "start"
    }), setTimeout(() => {
      b();
    }, 100));
  }
}
function G() {
  if (window.currentActiveIndex < window.currentPageContainers.length - 1) {
    let a = -1;
    const e = [];
    window.currentPageContainers.forEach((i, n) => {
      const s = i.getBoundingClientRect(), o = window.innerHeight, r = Math.max(s.top, 0), l = Math.min(s.bottom, o), c = Math.max(0, l - r), d = s.height;
      c / d >= 0.3 && e.push(n);
    });
    const t = Math.max(...e);
    for (let i = t + 1; i < window.currentPageContainers.length; i++)
      if (!e.includes(i)) {
        a = i;
        break;
      }
    a === -1 && t < window.currentPageContainers.length - 1 && (a = t + 1), a >= 0 && a < window.currentPageContainers.length && (window.currentActiveIndex = a, window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
      block: "start"
    }), setTimeout(() => {
      b();
    }, 100));
  }
}
function Y() {
  if (C()) {
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
function C() {
  const a = [];
  window.currentPageContainers.forEach((e, t) => {
    const i = e.getBoundingClientRect(), n = window.innerHeight, s = Math.max(i.top, 0), o = Math.min(i.bottom, n), r = Math.max(0, o - s), l = i.height;
    r / l >= 0.3 && a.push(t);
  });
  for (const e of a) {
    const t = window.currentPageContainers[e];
    if (t && t.id && t.id.includes("beilage-"))
      return !0;
  }
  return !1;
}
function b() {
  const a = document.getElementById("prevPageBtn"), e = document.getElementById("nextPageBtn"), t = document.getElementById("beilageBtn");
  if (a && (a.style.display = "flex", window.currentActiveIndex <= 0 ? (a.disabled = !0, a.classList.add("opacity-50", "cursor-not-allowed"), a.classList.remove("hover:bg-gray-200")) : (a.disabled = !1, a.classList.remove("opacity-50", "cursor-not-allowed"), a.classList.add("hover:bg-gray-200"))), e && (e.style.display = "flex", window.currentActiveIndex >= window.currentPageContainers.length - 1 ? (e.disabled = !0, e.classList.add("opacity-50", "cursor-not-allowed"), e.classList.remove("hover:bg-gray-200")) : (e.disabled = !1, e.classList.remove("opacity-50", "cursor-not-allowed"), e.classList.add("hover:bg-gray-200"))), t) {
    const i = C(), n = t.querySelector("i");
    i ? (t.title = "Zur Hauptausgabe", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", n && (n.className = "ri-file-text-line text-lg lg:text-xl")) : (t.title = "Zu Beilage", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", n && (n.className = "ri-attachment-line text-lg lg:text-xl"));
  }
}
function U() {
  const a = document.getElementById("shareLinkBtn");
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
    x(t, a);
  }) : x(t, a);
}
function x(a, e) {
  if (navigator.clipboard)
    navigator.clipboard.writeText(a).then(() => {
      g(e, "Link kopiert!");
    }).catch((t) => {
      g(e, "Kopieren fehlgeschlagen");
    });
  else {
    const t = document.createElement("textarea");
    t.value = a, document.body.appendChild(t), t.select();
    try {
      const i = document.execCommand("copy");
      g(e, i ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      g(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(t);
    }
  }
}
function X() {
  const a = document.getElementById("citationBtn"), e = document.title || "KGPZ";
  let t = window.location.origin + window.location.pathname;
  t.includes("#") && (t = t.split("#")[0]);
  const i = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), n = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${e}. Digital verfügbar unter: ${t} (Zugriff: ${i}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(n).then(() => {
      g(a, "Zitation kopiert!");
    }).catch((s) => {
      g(a, "Kopieren fehlgeschlagen");
    });
  else {
    const s = document.createElement("textarea");
    s.value = n, document.body.appendChild(s), s.select();
    try {
      const o = document.execCommand("copy");
      g(a, o ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      g(a, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(s);
    }
  }
}
function g(a, e) {
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
  const n = a.getBoundingClientRect(), s = window.innerHeight, o = window.innerWidth;
  let r = n.left - 10, l = n.bottom + 8;
  const c = 120, d = 32;
  r + c > o && (r = n.right - c + 10), l + d > s && (l = n.top - d - 8), i.style.left = Math.max(5, r) + "px", i.style.top = Math.max(5, l) + "px", document.body.appendChild(i), setTimeout(() => {
    i.style.opacity = "1";
  }, 10), setTimeout(() => {
    i.style.opacity = "0", setTimeout(() => {
      i.parentNode && i.remove();
    }, 200);
  }, 2e3);
}
function Q(a, e, t = !1) {
  let i = "";
  if (t)
    i = window.location.origin + window.location.pathname + `#beilage-1-page-${a}`;
  else {
    const s = window.location.pathname.split("/");
    if (s.length >= 3) {
      const o = s[1], r = s[2];
      i = `${window.location.origin}/${o}/${r}/${a}`;
    } else
      i = window.location.origin + window.location.pathname + `/${a}`;
  }
  const n = i;
  if (navigator.clipboard)
    navigator.clipboard.writeText(n).then(() => {
      g(e, "Link kopiert!");
    }).catch((s) => {
      g(e, "Kopieren fehlgeschlagen");
    });
  else {
    const s = document.createElement("textarea");
    s.value = n, document.body.appendChild(s), s.select();
    try {
      const o = document.execCommand("copy");
      g(e, o ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      g(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(s);
    }
  }
}
function _(a, e) {
  const t = document.title || "KGPZ", i = window.location.pathname.split("/");
  let n;
  if (i.length >= 3) {
    const l = i[1], c = i[2];
    n = `${window.location.origin}/${l}/${c}/${a}`;
  } else
    n = `${window.location.origin}${window.location.pathname}/${a}`;
  const s = n, o = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), r = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${t}, Seite ${a}. Digital verfügbar unter: ${s} (Zugriff: ${o}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(r).then(() => {
      g(e, "Zitation kopiert!");
    }).catch((l) => {
      g(e, "Kopieren fehlgeschlagen");
    });
  else {
    const l = document.createElement("textarea");
    l.value = r, document.body.appendChild(l), l.select();
    try {
      const c = document.execCommand("copy");
      g(e, c ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      g(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(l);
    }
  }
}
function L() {
  Z(), window.addEventListener("scroll", function() {
    clearTimeout(window.scrollTimeout), window.scrollTimeout = setTimeout(() => {
      b();
    }, 50);
  }), document.addEventListener("keydown", function(a) {
    a.key === "Escape" && E();
  });
}
function k() {
  const a = window.location.pathname;
  document.querySelectorAll(".citation-link[data-citation-url]").forEach((t) => {
    const i = t.getAttribute("data-citation-url");
    let n = !1;
    if (i === a)
      n = !0;
    else {
      const s = a.match(/^\/(\d{4})\/(\d+)(?:\/(\d+))?$/), o = i.match(/^\/(\d{4})\/(\d+)$/);
      if (s && o) {
        const [, r, l, c] = s, [, d, u] = o;
        r === d && l === u && (n = !0);
      }
    }
    n ? (t.classList.add("text-red-700", "pointer-events-none"), t.setAttribute("aria-current", "page")) : (t.classList.remove("text-red-700", "pointer-events-none"), t.removeAttribute("aria-current"));
  });
}
function P() {
  const a = window.location.pathname, e = document.body;
  e.classList.remove(
    "page-akteure",
    "page-ausgabe",
    "page-search",
    "page-ort",
    "page-kategorie",
    "page-piece",
    "page-edition"
  ), a.includes("/akteure/") || a.includes("/autoren") ? e.classList.add("page-akteure") : a.match(/\/\d{4}\/\d+/) ? e.classList.add("page-ausgabe") : a.includes("/search") || a.includes("/suche") ? e.classList.add("page-search") : a.includes("/ort/") ? e.classList.add("page-ort") : a.includes("/kategorie/") ? e.classList.add("page-kategorie") : a.includes("/beitrag/") ? e.classList.add("page-piece") : a.includes("/edition") && e.classList.add("page-edition");
}
window.enlargePage = W;
window.closeModal = E;
window.scrollToPreviousPage = J;
window.scrollToNextPage = G;
window.scrollToBeilage = Y;
window.shareCurrentPage = U;
window.generateCitation = X;
window.copyPagePermalink = Q;
window.generatePageCitation = _;
P();
k();
document.querySelector(".newspaper-page-container") && L();
let ee = function(a) {
  P(), k(), S(), setTimeout(() => {
    document.querySelector(".newspaper-page-container") && L();
  }, 50);
};
document.body.addEventListener("htmx:afterSettle", ee);
