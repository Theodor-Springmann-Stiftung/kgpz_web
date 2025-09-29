document.body.addEventListener("htmx:configRequest", function(a) {
  let e = a.detail.elt;
  e.id === "search" && e.value === "" && (a.detail.parameters = {}, a.detail.path = window.location.pathname + window.location.search);
});
class O extends HTMLElement {
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
      var c, u;
      const o = ((c = s.querySelector(".person-name")) == null ? void 0 : c.textContent) || "", r = ((u = s.querySelector(".person-life")) == null ? void 0 : u.textContent) || "";
      !e || o.toLowerCase().includes(e) || r.toLowerCase().includes(e) ? s.style.display = "block" : s.style.display = "none";
    });
  }
}
customElements.define("person-jump-filter", O);
class V extends HTMLElement {
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
customElements.define("place-jump-filter", V);
class D extends HTMLElement {
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
customElements.define("category-jump-filter", D);
class z extends HTMLElement {
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
customElements.define("year-jump-filter", z);
class F extends HTMLElement {
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
                class="mr-2 text-lg border px-4 h-full bg-white hover:bg-slate-200 transition-colors cursor-pointer"
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
customElements.define("schnellauswahl-button", F);
class j extends HTMLElement {
  constructor() {
    super(), this.isOpen = !1;
  }
  static get observedAttributes() {
    return ["git-commit", "git-date", "git-url"];
  }
  get gitCommit() {
    return this.getAttribute("git-commit");
  }
  get gitDate() {
    return this.getAttribute("git-date");
  }
  get gitUrl() {
    return this.getAttribute("git-url");
  }
  formatCommitInfo() {
    if (!this.gitCommit)
      return "Keine Commit-Info";
    const e = this.gitCommit.substring(0, 7);
    if (this.gitDate) {
      const i = new Date(this.gitDate).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
      return `${e} - ${i}`;
    }
    return e;
  }
  connectedCallback() {
    this.createMenu(), this.setupEventListeners();
  }
  disconnectedCallback() {
    document.removeEventListener("click", this.handleOutsideClick), document.removeEventListener("quickfilter:selection", this.handleSelectionEvent);
  }
  createMenu() {
    this.innerHTML = `
            <div class="h-full relative">
                <button
                    class="ml-2 text-2xl border px-4 h-full bg-white hover:bg-slate-200 transition-colors cursor-pointer"
                    id="menu-toggle">
                    <i class="ri-menu-line"></i>
                </button>
                <div id="menu-dropdown" class="hidden absolute bg-white py-2 z-50 top-[115%] right-0 shadow-sm">
                    <div class="px-5">
                        <div class="whitespace-nowrap">Übersicht nach</div>
                        <div class="ml-2 flex flex-col gap-y-2 mt-2 whitespace-nowrap">
                            <a href="/">Jahrgängen</a>
                            <a href="/akteure/a">Personen &amp; Werken</a>
                            <a href="/kategorie/">Betragsarten</a>
                            <a href="/ort/">Orten</a>
                        </div>
                    </div>
                    <div class="border-t border-slate-300 pt-2 mt-2 px-5">
                        <div class="flex flex-col gap-y-2">
                            <a href="/edition/">Geschichte & Edition der KGPZ</a>
                            <a href="/zitation/">Zitation</a>
                            <a href="/kontakt/">Kontakt</a>
                        </div>
                    </div>
										<div class="mt-3 pt-2 border-t border-slate-200 text-xs text-slate-600 px-2 text-centeer vertical-align-middle">
											<i class="ri-git-branch-line"></i>
											<a href="${this.gitUrl || "https://github.com/Theodor-Springmann-Stiftung/KGPZ.git"}" target="_blank" class="hover:text-slate-800">
												<span>Commit ${this.formatCommitInfo()}</span>
											</a>
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
customElements.define("navigation-menu", j);
document.addEventListener("DOMContentLoaded", function() {
  document.addEventListener("click", function(a) {
    const e = a.target.closest(
      'a[href^="/akteure/"], a[href^="/ort/"], a[href^="/kategorie/"]'
    ), t = document.getElementById("filter-container");
    if (e && t && t.contains(e)) {
      let i;
      const n = e.getAttribute("href");
      n.startsWith("/akteure/") ? i = "person" : n.startsWith("/ort/") ? i = "place" : n.startsWith("/kategorie/") && (i = "category");
      const s = new CustomEvent("quickfilter:selection", {
        detail: {
          type: i,
          source: "quickfilter",
          id: n.split("/").pop(),
          url: n
        },
        bubbles: !0
      });
      document.dispatchEvent(s);
    }
  });
});
class _ extends HTMLElement {
  constructor() {
    super(), this.htmxRequestListeners = [], this.htmxAfterSwapListener = null;
  }
  connectedCallback() {
    this.createSearchBar(), this.setupEventListeners();
  }
  disconnectedCallback() {
    this.cleanup();
  }
  createSearchBar() {
    this.innerHTML = `
			<div class="relative">
				<input
					type="search"
					name="q"
					id="search"
					placeholder="Suche"
					autocomplete="off"
					class="px-2.5 py-1.5 border w-full bg-white pr-10"
					hx-get="/suche/?noCache=true"
					hx-trigger="input changed delay:200ms, keyup[key=='Enter']"
					hx-select="main"
					hx-target="main"
					hx-indicator="#search-loading" />
				<div
					id="search-loading"
					class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 p-1 htmx-indicator">
					<i class="ri-loader-4-line text-lg animate-spin"></i>
				</div>
				<button
					id="search-reset"
					type="button"
					class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer hidden hover:bg-gray-100 rounded"
					title="Suche schließen">
					<i class="ri-close-line text-lg"></i>
				</button>
			</div>
		`;
  }
  setupEventListeners() {
    const e = this.querySelector("#search"), t = this.querySelector("#search-reset"), i = this.querySelector("#search-loading");
    if (!e || !t) return;
    this.currentURL = window.location.pathname;
    const n = () => {
      e.value.trim() !== "" ? t.classList.remove("hidden") : t.classList.add("hidden");
    };
    if (n(), e.addEventListener("input", n), t.addEventListener("click", () => {
      e.value = "", t.classList.add("hidden"), e.dispatchEvent(new Event("input", { bubbles: !0 })), e.focus();
    }), i) {
      const s = (r) => {
        r.detail.elt === e && (t.style.display = "none");
      }, o = (r) => {
        r.detail.elt === e && (t.style.display = "", n());
      };
      document.body.addEventListener("htmx:beforeRequest", s), document.body.addEventListener("htmx:afterRequest", o), this.htmxRequestListeners.push(
        { event: "htmx:beforeRequest", handler: s },
        { event: "htmx:afterRequest", handler: o }
      );
    }
    this.linkClickHandler = (s) => {
      const r = s.target.closest("a[href]");
      r && r.getAttribute("href") && e.value.trim() !== "" && (e.value = "", t.classList.add("hidden"));
    }, document.addEventListener("click", this.linkClickHandler);
  }
  cleanup() {
    this.htmxRequestListeners.forEach(({ event: e, handler: t }) => {
      document.body.removeEventListener(e, t);
    }), this.htmxRequestListeners = [], this.linkClickHandler && (document.removeEventListener("click", this.linkClickHandler), this.linkClickHandler = null);
  }
}
customElements.define("search-bar", _);
const T = [];
document.addEventListener("DOMContentLoaded", () => {
  I();
});
const I = function() {
  for (; T.length > 0; ) {
    const a = T.shift();
    try {
      a();
    } catch (e) {
      console.error("Error executing settle queue function:", e);
    }
  }
};
class W extends HTMLElement {
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
          const c = o.getBoundingClientRect(), u = c.top < window.innerHeight, d = c.bottom > 0;
          u && d && (l = !0);
        }
        if (r && !l) {
          const c = r.getBoundingClientRect(), u = c.top < window.innerHeight, d = c.bottom > 0;
          u && d && (l = !0);
        }
        if (!o && !r) {
          const c = n.querySelector("div:first-child");
          if (c) {
            const u = c.getBoundingClientRect(), d = u.top >= 0, h = u.bottom <= window.innerHeight;
            d && h && (l = !0);
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
        const u = c.getBoundingClientRect(), d = u.top - s.top + n.scrollTop, h = d + u.height;
        o = Math.min(o, d), r = Math.max(r, h);
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
    ), s = window.innerHeight, o = n - s, r = o > 0 ? window.scrollY / o : 0, l = t.clientHeight, u = t.scrollHeight - l;
    if (u > 0) {
      const d = r * u, h = i.getBoundingClientRect(), g = t.getBoundingClientRect(), p = h.top - g.top + t.scrollTop, m = l / 2, f = p - m, w = 0.7, b = w * d + (1 - w) * f, x = Math.max(0, Math.min(u, b)), E = t.scrollTop;
      Math.abs(x - E) > 10 && t.scrollTo({
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
    window.removeEventListener("scroll", this.handleScroll), this.scrollTimeout && (clearTimeout(this.scrollTimeout), this.scrollTimeout = null), this.clickHandlers && this.clickHandlers.length > 0 && this.clickHandlers.forEach(({ link: t, handler: i }) => {
      t && i && t.removeEventListener("click", i);
    });
    const e = document.getElementById("scrollspy-slider");
    e && (e.style.opacity = "0", e.style.height = "0"), this.sections = null, this.navLinks = null, this.clickHandlers = [], this.manualNavigation = !1;
  }
}
customElements.define("akteure-scrollspy", W);
class K extends HTMLElement {
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
class G extends HTMLElement {
  constructor() {
    super(), this.isExpanded = !1, this.isLoading = !1, this.hasLoaded = !1, this.boundHandleClick = this.handleClick.bind(this), this.boundHandleMapClick = this.handleMapClick.bind(this), this.boundHandleHeadingHover = this.handleHeadingHover.bind(this), this.boundHandleHeadingLeave = this.handleHeadingLeave.bind(this);
  }
  connectedCallback() {
    this.setupAccordion(), this.setupEventListeners(), this.setupMapEventListeners(), this.setupHoverEvents();
  }
  disconnectedCallback() {
    this.cleanupEventListeners(), this.cleanupMapEventListeners();
  }
  cleanupMapEventListeners() {
    document.removeEventListener("place-map-clicked", this.boundHandleMapClick), this.removeEventListener("mouseenter", this.boundHandleHeadingHover), this.removeEventListener("mouseleave", this.boundHandleHeadingLeave);
  }
  setupAccordion() {
    if (!this.querySelector("[data-content]")) {
      const e = this.getAttribute("data-place-id"), t = document.createElement("div");
      t.setAttribute("data-content", ""), t.className = "accordion-content overflow-hidden transition-all duration-300 max-h-0 border-b border-slate-200", t.setAttribute("hx-get", `/ort/fragment/${e}`), t.setAttribute("hx-trigger", "load-content"), t.setAttribute("hx-swap", "innerHTML"), t.setAttribute("hx-target", "this"), t.setAttribute("hx-select", ".place-fragment-content"), t.setAttribute("hx-boost", "false"), this.appendChild(t);
    }
  }
  setupEventListeners() {
    this.addEventListener("click", this.boundHandleClick);
  }
  cleanupEventListeners() {
    this.removeEventListener("click", this.boundHandleClick);
  }
  setupMapEventListeners() {
    document.addEventListener("place-map-clicked", this.boundHandleMapClick);
  }
  setupHoverEvents() {
    this.addEventListener("mouseenter", this.boundHandleHeadingHover), this.addEventListener("mouseleave", this.boundHandleHeadingLeave);
  }
  handleHeadingHover() {
    const e = this.getAttribute("data-place-id");
    if (e) {
      const t = new CustomEvent("place-heading-hover", {
        detail: { placeId: e, action: "show" },
        bubbles: !0
      });
      document.dispatchEvent(t);
    }
  }
  handleHeadingLeave() {
    const e = this.getAttribute("data-place-id");
    if (e) {
      const t = new CustomEvent("place-heading-hover", {
        detail: { placeId: e, action: "hide" },
        bubbles: !0
      });
      document.dispatchEvent(t);
    }
  }
  handleMapClick(e) {
    const t = e.detail.placeId, i = this.getAttribute("data-place-id");
    t === i && !this.isExpanded && setTimeout(() => {
      this.expand();
    }, 800);
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
    this.isExpanded = !0;
    const e = this.querySelector("[data-content]");
    e && (this.hasLoaded ? e.style.maxHeight = e.scrollHeight + "px" : this.loadContent());
  }
  collapse() {
    this.isExpanded = !1;
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
}
class Y extends HTMLElement {
  constructor() {
    super(), this.places = [], this.mapElement = null, this.pointsContainer = null, this.intersectionObserver = null, this.mapPoints = /* @__PURE__ */ new Map(), this.tooltip = null, this.showTimeout = null, this.hideTimeout = null, this.isTooltipVisible = !1, this.currentHoveredPlaceId = "", this.boundHandleHeadingHoverEvent = this.handleHeadingHoverEvent.bind(this);
  }
  connectedCallback() {
    this.parseData(), this.render(), this.initializeMap(), setTimeout(() => {
      this.initializeScrollspy();
    }, 200), this.setupHeadingHoverListener();
  }
  parseData() {
    try {
      const e = this.dataset.places;
      e && (this.places = JSON.parse(e));
    } catch (e) {
      console.error("Failed to parse places data:", e), this.places = [];
    }
  }
  render() {
    this.innerHTML = `
			<div class="map-container relative w-full aspect-[5/7] overflow-hidden bg-slate-100">
				<div class="transform-wrapper absolute top-0 left-0 w-full h-auto origin-top-left">
					<img src="/assets/Europe.svg" alt="Map of Europe" class="block w-full h-auto">
					<div class="points-container absolute top-0 left-0 w-full h-full"></div>
				</div>
				<div class="absolute bottom-0 right-0 h-auto text-[0.6rem] bg-white px-0.5 bg-opacity-[0.5] border">
					<i class="ri-creative-commons-line"></i>
					<a href="https://commons.wikimedia.org/wiki/File:Europe_laea_topography.svg" target="_blank" class="">
						 Wikimedia Commons
					</a>
				</div>
				<!-- Tooltip -->
				<div class="map-tooltip absolute bg-slate-800 text-white text-sm px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 transition-opacity duration-200 z-30 whitespace-nowrap" style="transform: translate(-50%, -100%); margin-top: -8px;"></div>
			</div>
		`, this.mapElement = this.querySelector(".map-container"), this.pointsContainer = this.querySelector(".points-container"), this.tooltip = this.querySelector(".map-tooltip");
  }
  initializeMap() {
    if (!this.places.length || !this.pointsContainer)
      return;
    const e = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    e.setAttribute("class", "absolute top-0 left-0 w-full h-full"), e.style.pointerEvents = "none", e.style.overflow = "visible", e.setAttribute("viewBox", "0 0 100 100"), e.setAttribute("preserveAspectRatio", "none");
    const t = document.createElementNS("http://www.w3.org/2000/svg", "defs"), i = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
    i.setAttribute("id", "redDotGradient"), i.setAttribute("cx", "30%"), i.setAttribute("cy", "30%"), i.setAttribute("r", "70%");
    const n = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    n.setAttribute("offset", "0%"), n.setAttribute("stop-color", "#f56565");
    const s = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    s.setAttribute("offset", "100%"), s.setAttribute("stop-color", "#e53e3e"), i.appendChild(n), i.appendChild(s), t.appendChild(i), e.appendChild(t), this.pointsContainer.appendChild(e);
    const o = { xmin: 2555e3, ymin: 135e4, xmax: 7405e3, ymax: 55e5 }, r = { lon: 10, lat: 52 }, l = (u, d) => {
      const m = r.lon * Math.PI / 180, f = r.lat * Math.PI / 180, w = d * Math.PI / 180, b = u * Math.PI / 180, x = Math.sqrt(
        2 / (1 + Math.sin(f) * Math.sin(b) + Math.cos(f) * Math.cos(b) * Math.cos(w - m))
      ), E = 6371e3 * x * Math.cos(b) * Math.sin(w - m), S = 6371e3 * x * (Math.cos(f) * Math.sin(b) - Math.sin(f) * Math.cos(b) * Math.cos(w - m)), C = E + 4321e3, k = S + 321e4, L = o.xmax - o.xmin, v = o.ymax - o.ymin, R = (C - o.xmin) / L * 100, $ = (o.ymax - k) / v * 100;
      return { x: R, y: $ };
    }, c = [];
    this.places.forEach((u) => {
      if (u.lat && u.lng) {
        const d = parseFloat(u.lat), h = parseFloat(u.lng), g = l(d, h);
        if (g.x >= 0 && g.x <= 100 && g.y >= 0 && g.y <= 100) {
          c.push(g);
          const p = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          p.setAttribute("cx", g.x.toString()), p.setAttribute("cy", g.y.toString()), p.setAttribute("r", "0.4"), p.setAttribute("fill", "white"), p.setAttribute("opacity", "0.7"), p.setAttribute("filter", "drop-shadow(0 0.05 0.08 rgba(0,0,0,0.15))"), p.style.cursor = "pointer", p.style.pointerEvents = "all", p.style.transition = "r 0.3s ease, fill 0.3s ease, stroke 0.3s ease, opacity 0.3s ease", p.addEventListener("mouseenter", () => {
            p.getAttribute("fill") === "white" && (p.setAttribute("r", "0.6"), p.setAttribute("fill", "#f87171"), p.setAttribute("opacity", "1"));
          }), p.addEventListener("mouseleave", () => {
            p.getAttribute("fill") === "#f87171" && (p.setAttribute("r", "0.4"), p.setAttribute("fill", "white"), p.setAttribute("opacity", "0.7"));
          });
          const m = `${u.name}${u.toponymName && u.toponymName !== u.name ? ` (${u.toponymName})` : ""}`;
          p.dataset.placeId = u.id, p.dataset.tooltipText = m, p.addEventListener("mouseenter", (f) => this.showTooltip(f)), p.addEventListener("mouseleave", () => this.hideTooltip()), p.addEventListener("mousemove", (f) => this.updateTooltipPosition(f)), p.addEventListener("click", (f) => this.scrollToPlace(f)), e.appendChild(p), this.mapPoints.set(u.id, p);
        }
      }
    }), c.length > 0 && this.autoZoomToPoints(c);
  }
  // Calculate bounding box of all points for the auto-zoom
  autoZoomToPoints(e) {
    let t = 100, i = 0, n = 100, s = 0;
    e.forEach((v) => {
      v.x < t && (t = v.x), v.x > i && (i = v.x), v.y < n && (n = v.y), v.y > s && (s = v.y);
    });
    const o = 0.06, r = i - t, l = s - n, c = r * o, u = l * o, d = Math.max(0, t - c), h = Math.min(100, i + c), g = Math.max(0, n - u), p = Math.min(100, s + u), m = h - d, f = p - g, w = 5 / 7, b = m / f;
    let x = { x: d, y: g, width: m, height: f };
    if (b > w) {
      const v = m / w;
      x.y = g - (v - f) / 2, x.height = v;
    } else {
      const v = f * w;
      x.x = d - (v - m) / 2, x.width = v;
    }
    const E = 100 / x.width, S = -x.x, C = -x.y, k = `scale(${E}) translate(${S}%, ${C}%)`, L = this.querySelector(".transform-wrapper");
    L && (L.style.transform = k);
  }
  initializeScrollspy() {
    const e = document.querySelectorAll("place-accordion[data-place-id]");
    e.length && (this.mapPoints.forEach((t) => {
      this.setPointInactive(t);
    }), this.intersectionObserver = new IntersectionObserver(
      (t) => {
        t.forEach((i) => {
          const n = i.target.getAttribute("data-place-id"), s = this.mapPoints.get(n);
          s && (i.isIntersecting ? this.setPointActive(s) : this.setPointInactive(s));
        });
      },
      {
        // Trigger when any part enters viewport - better for small elements
        threshold: 0,
        // Add some margin to trigger slightly before/after entering viewport
        rootMargin: "10px 0px"
      }
    ), e.forEach((t) => {
      this.intersectionObserver.observe(t);
    }));
  }
  setPointActive(e) {
    e.setAttribute("r", "0.8"), e.setAttribute("fill", "#dc2626"), e.setAttribute("stroke", "#b91c1c"), e.setAttribute("stroke-width", "0.12"), e.setAttribute("opacity", "1"), e.setAttribute("filter", "drop-shadow(0 0.05 0.1 rgba(0,0,0,0.2))"), e.parentNode && e.parentNode.appendChild(e);
  }
  setPointInactive(e) {
    e.setAttribute("r", "0.4"), e.setAttribute("fill", "white"), e.setAttribute("stroke", "none"), e.setAttribute("opacity", "0.7"), e.setAttribute("filter", "drop-shadow(0 0.05 0.08 rgba(0,0,0,0.15))");
  }
  showTooltip(e) {
    const t = e.target, i = t.dataset.tooltipText, n = t.dataset.placeId;
    this.isNewPopupBlocked(n) || this.tooltip && i && (this.tooltip.textContent = i, this.updateTooltipPosition(e), this.clearTimeouts(), this.tooltip.classList.remove("opacity-0"), this.tooltip.classList.add("opacity-100"), this.isTooltipVisible = !0);
  }
  hideTooltip() {
    this.clearTimeouts(), this.hideTimeout = setTimeout(() => {
      this.tooltip && (this.tooltip.classList.remove("opacity-100"), this.tooltip.classList.add("opacity-0"), this.isTooltipVisible = !1);
    }, 150);
  }
  updateTooltipPosition(e) {
    if (!this.tooltip) return;
    const t = this.mapElement.getBoundingClientRect(), i = e.clientX - t.left, n = e.clientY - t.top;
    this.tooltip.style.left = `${i}px`, this.tooltip.style.top = `${n}px`;
  }
  scrollToPlace(e) {
    const t = e.target.dataset.placeId;
    if (!t) return;
    const i = new CustomEvent("place-map-clicked", {
      detail: { placeId: t },
      bubbles: !0
    });
    this.dispatchEvent(i);
    const n = document.querySelector(`place-accordion[data-place-id="${t}"]`);
    n && (n.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest"
    }), n.style.transition = "background-color 0.3s ease", n.style.backgroundColor = "rgb(248 250 252)", setTimeout(() => {
      n.style.backgroundColor = "";
    }, 1e3));
  }
  setupHeadingHoverListener() {
    document.addEventListener("place-heading-hover", this.boundHandleHeadingHoverEvent);
  }
  clearTimeouts() {
    this.showTimeout && (clearTimeout(this.showTimeout), this.showTimeout = null), this.hideTimeout && (clearTimeout(this.hideTimeout), this.hideTimeout = null), this.scrollBlockTimeout && (clearTimeout(this.scrollBlockTimeout), this.scrollBlockTimeout = null);
  }
  checkMousePositionAfterScroll() {
    if (this.currentHoveredPlaceId) {
      const e = new CustomEvent("place-heading-hover", {
        detail: { placeId: this.currentHoveredPlaceId, action: "show" },
        bubbles: !0
      });
      document.dispatchEvent(e);
    }
  }
  checkExistingPopupAfterScroll() {
    this.currentHoveredPlaceId !== this.placeIdBeforeScroll && this.tooltip && this.isTooltipVisible && (this.tooltip.classList.remove("opacity-100"), this.tooltip.classList.add("opacity-0"), this.isTooltipVisible = !1);
  }
  isScrollBlocked() {
    return Date.now() - this.lastScrollTime < 300;
  }
  isNewPopupBlocked(e) {
    return Date.now() - this.lastScrollTime < 300 ? e !== this.placeIdBeforeScroll : !1;
  }
  handleHeadingHoverEvent(e) {
    const { placeId: t, action: i } = e.detail, n = this.mapPoints.get(t);
    if (n) {
      if (i === "show") {
        this.currentHoveredPlaceId = t;
        const s = n.getAttribute("r");
        n.setAttribute("data-original-radius", s), n.setAttribute("r", (parseFloat(s) * 1.7).toString()), n.setAttribute("filter", "none"), n.setAttribute("fill", "#dc2626"), n.setAttribute("stroke", "#b91c1c"), n.setAttribute("stroke-width", "0.24"), n.setAttribute("opacity", "1"), n.parentNode && n.parentNode.appendChild(n);
      } else if (i === "hide") {
        this.currentHoveredPlaceId = "";
        const s = n.getAttribute("data-original-radius");
        s && (n.setAttribute("r", s), n.removeAttribute("data-original-radius"), n.getAttribute("fill") === "white" ? (n.setAttribute("filter", "drop-shadow(0 0.05 0.08 rgba(0,0,0,0.15))"), n.setAttribute("stroke", "none")) : (n.setAttribute("filter", "drop-shadow(0 0.05 0.1 rgba(0,0,0,0.2))"), n.setAttribute("fill", "#dc2626"), n.setAttribute("stroke", "#b91c1c"), n.setAttribute("stroke-width", "0.12")));
      }
    }
  }
  disconnectedCallback() {
    this.intersectionObserver && (this.intersectionObserver.disconnect(), this.intersectionObserver = null), this.clearTimeouts(), document.removeEventListener("place-heading-hover", this.boundHandleHeadingHoverEvent), window.removeEventListener("scroll", this.boundHandleScroll), document.removeEventListener("scroll", this.boundHandleScroll);
  }
}
class Z extends HTMLElement {
  constructor() {
    super(), this.place = null, this.mapElement = null, this.pointsContainer = null, this.tooltip = null;
  }
  connectedCallback() {
    this.parseData(), this.render(), this.initializeMap();
  }
  parseData() {
    try {
      const e = this.dataset.place;
      e && (this.place = JSON.parse(e));
    } catch (e) {
      console.error("Failed to parse place data:", e), this.place = null;
    }
  }
  render() {
    this.innerHTML = `
			<div class="map-container relative w-full aspect-[5/7] overflow-hidden bg-slate-100">
				<div class="transform-wrapper absolute top-0 left-0 w-full h-auto origin-top-left">
					<img src="/assets/Europe.svg" alt="Map of Europe" class="block w-full h-auto">
					<div class="points-container absolute top-0 left-0 w-full h-full"></div>
				</div>
				<div class="absolute bottom-0 right-0 h-auto text-[0.6rem] bg-white px-0.5 bg-opacity-[0.5] border">
					<i class="ri-creative-commons-line"></i>
					<a href="https://commons.wikimedia.org/wiki/File:Europe_laea_topography.svg" target="_blank" class="">
						 Wikimedia Commons
					</a>
				</div>
				<!-- Tooltip -->
				<div class="map-tooltip absolute bg-slate-800 text-white text-sm px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 transition-opacity duration-200 z-30 whitespace-nowrap" style="transform: translate(-50%, -100%); margin-top: -8px;"></div>
			</div>
		`, this.mapElement = this.querySelector(".map-container"), this.pointsContainer = this.querySelector(".points-container"), this.tooltip = this.querySelector(".map-tooltip");
  }
  initializeMap() {
    if (!this.place || !this.place.lat || !this.place.lng || !this.pointsContainer)
      return;
    const e = { xmin: 2555e3, ymin: 135e4, xmax: 7405e3, ymax: 55e5 }, t = { lon: 10, lat: 52 }, i = (r, l) => {
      const h = t.lon * Math.PI / 180, g = t.lat * Math.PI / 180, p = l * Math.PI / 180, m = r * Math.PI / 180, f = Math.sqrt(
        2 / (1 + Math.sin(g) * Math.sin(m) + Math.cos(g) * Math.cos(m) * Math.cos(p - h))
      ), w = 6371e3 * f * Math.cos(m) * Math.sin(p - h), b = 6371e3 * f * (Math.cos(g) * Math.sin(m) - Math.sin(g) * Math.cos(m) * Math.cos(p - h)), x = w + 4321e3, E = b + 321e4, S = e.xmax - e.xmin, C = e.ymax - e.ymin, k = (x - e.xmin) / S * 100, L = (e.ymax - E) / C * 100;
      return { x: k, y: L };
    }, n = parseFloat(this.place.lat), s = parseFloat(this.place.lng), o = i(n, s);
    if (o.x >= 0 && o.x <= 100 && o.y >= 0 && o.y <= 100) {
      const r = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      r.setAttribute("class", "absolute top-0 left-0 w-full h-full"), r.style.pointerEvents = "none", r.style.overflow = "visible", r.setAttribute("viewBox", "0 0 100 100"), r.setAttribute("preserveAspectRatio", "none");
      const l = document.createElementNS("http://www.w3.org/2000/svg", "defs"), c = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
      c.setAttribute("id", "redDotGradientSingle"), c.setAttribute("cx", "30%"), c.setAttribute("cy", "30%"), c.setAttribute("r", "70%");
      const u = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      u.setAttribute("offset", "0%"), u.setAttribute("stop-color", "#f56565");
      const d = document.createElementNS("http://www.w3.org/2000/svg", "stop");
      d.setAttribute("offset", "100%"), d.setAttribute("stop-color", "#e53e3e"), c.appendChild(u), c.appendChild(d), l.appendChild(c), r.appendChild(l), this.pointsContainer.appendChild(r);
      const h = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      h.setAttribute("cx", o.x.toString()), h.setAttribute("cy", o.y.toString()), h.setAttribute("r", "0.8"), h.setAttribute("fill", "#dc2626"), h.setAttribute("stroke", "#b91c1c"), h.setAttribute("stroke-width", "0.05"), h.setAttribute("filter", "drop-shadow(0 0.05 0.1 rgba(0,0,0,0.2))"), h.style.cursor = "pointer", h.style.pointerEvents = "all", h.style.transition = "r 0.3s ease, fill 0.3s ease, stroke 0.3s ease, opacity 0.3s ease";
      const g = `${this.place.name}${this.place.toponymName && this.place.toponymName !== this.place.name ? ` (${this.place.toponymName})` : ""}`;
      h.dataset.tooltipText = g, h.addEventListener("mouseenter", (p) => this.showTooltip(p)), h.addEventListener("mouseleave", () => this.hideTooltip()), h.addEventListener("mousemove", (p) => this.updateTooltipPosition(p)), r.appendChild(h), this.autoZoomToPoint(o);
    }
  }
  autoZoomToPoint(e) {
    let i = Math.max(0, e.x - 20), n = Math.min(100, e.x + 20), s = Math.max(0, e.y - 20), o = Math.min(100, e.y + 20), r = n - i, l = o - s;
    const c = 5 / 7, u = r / l;
    let d = { x: i, y: s, width: r, height: l };
    if (u > c) {
      const b = r / c;
      d.y = s - (b - l) / 2, d.height = b;
    } else {
      const b = l * c;
      d.x = i - (b - r) / 2, d.width = b;
    }
    d.x < 0 && (d.width += d.x, d.x = 0), d.y < 0 && (d.height += d.y, d.y = 0), d.x + d.width > 100 && (d.width = 100 - d.x), d.y + d.height > 100 && (d.height = 100 - d.y);
    const h = 30;
    if (d.width < h) {
      const b = (h - d.width) / 2;
      d.x = Math.max(0, d.x - b), d.width = Math.min(h, 100 - d.x);
    }
    if (d.height < h) {
      const b = (h - d.height) / 2;
      d.y = Math.max(0, d.y - b), d.height = Math.min(h, 100 - d.y);
    }
    const g = 100 / d.width, p = -d.x, m = -d.y, f = `scale(${g}) translate(${p}%, ${m}%)`, w = this.querySelector(".transform-wrapper");
    w && (w.style.transform = f);
  }
  showTooltip(e) {
    const i = e.target.dataset.tooltipText;
    this.tooltip && i && (this.tooltip.textContent = i, this.updateTooltipPosition(e), this.tooltip.classList.remove("opacity-0"), this.tooltip.classList.add("opacity-100"));
  }
  hideTooltip() {
    this.tooltip && (this.tooltip.classList.remove("opacity-100"), this.tooltip.classList.add("opacity-0"));
  }
  updateTooltipPosition(e) {
    if (!this.tooltip) return;
    const t = this.mapElement.getBoundingClientRect(), i = e.clientX - t.left, n = e.clientY - t.top;
    this.tooltip.style.left = `${i}px`, this.tooltip.style.top = `${n}px`;
  }
}
customElements.define("places-filter", K);
customElements.define("place-accordion", G);
customElements.define("places-map", Y);
customElements.define("places-map-single", Z);
class X extends HTMLElement {
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
			<input
				type="text"
				id="generic-search"
				placeholder="${this.placeholderText}"
				autocomplete="off"
				class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
			>
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
    }), this.countElement && (this.originalCount = this.itemCards.length, this.countElement.style.display = "none");
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
    this.countElement && (t === "" ? this.countElement.style.display = "none" : (this.countElement.style.display = "", e === 0 ? this.countElement.textContent = "(0)" : this.countElement.textContent = `(${e})`));
  }
}
customElements.define("generic-filter", X);
class J extends HTMLElement {
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
    const c = this.querySelector("#single-page-image"), u = this.querySelector("#page-number"), d = this.querySelector("#page-icon");
    this.querySelector("#page-indicator"), c.src = e, c.alt = t, this.currentPageNumber = i, this.currentIsBeilage = n, this.currentPartNumber = o;
    let h;
    if (l)
      h = l;
    else {
      const p = this.getIssueContext(i);
      h = p ? `${p}, ${i}` : `${i}`;
    }
    if (u.innerHTML = h, s && i === s) {
      u.style.position = "relative";
      const p = u.querySelector(".target-page-dot");
      p && p.remove();
      const m = document.createElement("span");
      m.className = "target-page-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10", m.title = "verlinkte Seite", u.appendChild(m);
    }
    r ? r === "part-number" && o !== null ? d.innerHTML = `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${o}. Teil</span>` : d.innerHTML = this.generateIconFromType(r) : d.innerHTML = this.generateFallbackIcon(i, n, o), this.updateNavigationButtons(), this.style.display = "block", this.setAttribute("active", "true");
    const g = this.querySelector(".flex-1.overflow-auto");
    g && (g.scrollTop = 0), document.body.style.overflow = "hidden", document.dispatchEvent(
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
          const u = c.cloneNode(!0);
          u.querySelectorAll("i").forEach((g) => g.remove()), u.querySelectorAll(
            '[class*="target-page-dot"], .target-page-indicator'
          ).forEach((g) => g.remove()), r = u.textContent.trim();
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
          const u = c.textContent.trim(), d = u.match(/(\d{1,2}\.\d{1,2}\.\d{4}\s+Nr\.\s+\d+)/);
          if (d)
            return d[1];
          const h = u.match(/(\d{4})\s+Nr\.\s+(\d+)/);
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
customElements.define("single-page-viewer", J);
document.body.addEventListener("htmx:beforeRequest", function(a) {
  const e = document.querySelector("single-page-viewer");
  e && e.style.display !== "none" && (console.log("Cleaning up single page viewer before HTMX navigation"), e.close());
});
window.addEventListener("beforeunload", function() {
  const a = document.querySelector("single-page-viewer");
  a && a.close();
});
class U extends HTMLElement {
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
customElements.define("scroll-to-top-button", U);
class Q extends HTMLElement {
  constructor() {
    super(), this.pageObserver = null, this.pageContainers = /* @__PURE__ */ new Map(), this.singlePageViewerActive = !1, this.singlePageViewerCurrentPage = null, this.boundHandleSinglePageViewer = this.handleSinglePageViewer.bind(this), this.eventListenersAttached = !1;
  }
  connectedCallback() {
    requestAnimationFrame(() => {
      this.setupScrollspy(), this.setupSinglePageViewerDetection();
    });
  }
  disconnectedCallback() {
    this.cleanup();
  }
  setupScrollspy() {
    const e = document.querySelectorAll(".newspaper-page-container[data-page-container]");
    if (e.length === 0) {
      setTimeout(() => {
        const t = document.querySelectorAll(".newspaper-page-container[data-page-container]");
        t.length > 0 && this.initializeScrollspy(t);
      }, 100);
      return;
    }
    this.initializeScrollspy(e);
  }
  initializeScrollspy(e) {
    this.pageObserver && this.pageObserver.disconnect(), this.pageContainers.clear(), e.forEach((t) => {
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
    });
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
      const c = t.scrollTop, u = r.top - o.top + c, d = o.height, h = r.height, g = u - (d - h) / 2;
      t.scrollTo({
        top: Math.max(0, g),
        behavior: "smooth"
      });
    }
  }
  scrollPageIntoInhaltsverzeichnis(e) {
    const t = e.container.getAttribute("data-page-container"), i = this.querySelector(`[data-page-number="${t}"]`), n = i == null ? void 0 : i.closest(".page-entry");
    n && this.scrollEntryIntoView(n);
  }
  setupSinglePageViewerDetection() {
    this.eventListenersAttached || (document.addEventListener("singlepageviewer:opened", this.boundHandleSinglePageViewer), document.addEventListener("singlepageviewer:closed", this.boundHandleSinglePageViewer), document.addEventListener("singlepageviewer:pagechanged", this.boundHandleSinglePageViewer), this.eventListenersAttached = !0), this.checkSinglePageViewerState();
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
    this.pageObserver && (this.pageObserver.disconnect(), this.pageObserver = null), this.eventListenersAttached && (document.removeEventListener("singlepageviewer:opened", this.boundHandleSinglePageViewer), document.removeEventListener("singlepageviewer:closed", this.boundHandleSinglePageViewer), document.removeEventListener("singlepageviewer:pagechanged", this.boundHandleSinglePageViewer), this.eventListenersAttached = !1), this.pageContainers.clear();
  }
}
customElements.define("inhaltsverzeichnis-scrollspy", Q);
class ee extends HTMLElement {
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
customElements.define("error-modal", ee);
window.currentPageContainers = window.currentPageContainers || [];
window.currentActiveIndex = window.currentActiveIndex || 0;
window.pageObserver = window.pageObserver || null;
function te(a, e, t, i = null) {
  let n = document.querySelector("single-page-viewer");
  n || (n = document.createElement("single-page-viewer"), document.body.appendChild(n));
  const s = a.closest('[data-beilage="true"]') !== null, o = window.templateData && window.templateData.targetPage ? window.templateData.targetPage : 0, r = a.closest(".newspaper-page-container, .piece-page-container");
  let l = null, c = null;
  if (r) {
    l = r.getAttribute("data-page-icon-type"), r.querySelector(".part-number") && (l = "part-number");
    const d = r.querySelector(".page-indicator");
    if (d) {
      const h = d.cloneNode(!0);
      h.querySelectorAll("i").forEach((m) => m.remove()), h.querySelectorAll('[class*="target-page-dot"], .target-page-indicator').forEach((m) => m.remove()), c = h.textContent.trim();
    }
  }
  n.show(a.src, a.alt, e, s, o, i, l, c);
}
function H() {
  document.getElementById("pageModal").classList.add("hidden");
}
function ie() {
  if (window.pageObserver && (window.pageObserver.disconnect(), window.pageObserver = null), window.currentPageContainers = Array.from(document.querySelectorAll(".newspaper-page-container")), window.currentActiveIndex = 0, P(), document.querySelector(".newspaper-page-container")) {
    let e = /* @__PURE__ */ new Set();
    window.pageObserver = new IntersectionObserver(
      (t) => {
        if (t.forEach((i) => {
          const n = window.currentPageContainers.indexOf(i.target);
          n !== -1 && (i.isIntersecting ? e.add(n) : e.delete(n));
        }), e.size > 0) {
          const n = Array.from(e).sort((s, o) => s - o)[0];
          n !== window.currentActiveIndex && (window.currentActiveIndex = n, P());
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
function ne() {
  if (window.currentActiveIndex > 0) {
    let a = -1;
    const e = [];
    window.currentPageContainers.forEach((i, n) => {
      const s = i.getBoundingClientRect(), o = window.innerHeight, r = Math.max(s.top, 0), l = Math.min(s.bottom, o), c = Math.max(0, l - r), u = s.height;
      c / u >= 0.3 && e.push(n);
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
      P();
    }, 100));
  }
}
function se() {
  if (window.currentActiveIndex < window.currentPageContainers.length - 1) {
    let a = -1;
    const e = [];
    window.currentPageContainers.forEach((i, n) => {
      const s = i.getBoundingClientRect(), o = window.innerHeight, r = Math.max(s.top, 0), l = Math.min(s.bottom, o), c = Math.max(0, l - r), u = s.height;
      c / u >= 0.3 && e.push(n);
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
      P();
    }, 100));
  }
}
function oe() {
  if (M()) {
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
function M() {
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
function P() {
  const a = document.getElementById("prevPageBtn"), e = document.getElementById("nextPageBtn"), t = document.getElementById("beilageBtn");
  if (a && (a.style.display = "flex", window.currentActiveIndex <= 0 ? (a.disabled = !0, a.classList.add("opacity-50", "cursor-not-allowed"), a.classList.remove("hover:bg-gray-200")) : (a.disabled = !1, a.classList.remove("opacity-50", "cursor-not-allowed"), a.classList.add("hover:bg-gray-200"))), e && (e.style.display = "flex", window.currentActiveIndex >= window.currentPageContainers.length - 1 ? (e.disabled = !0, e.classList.add("opacity-50", "cursor-not-allowed"), e.classList.remove("hover:bg-gray-200")) : (e.disabled = !1, e.classList.remove("opacity-50", "cursor-not-allowed"), e.classList.add("hover:bg-gray-200"))), t) {
    const i = M(), n = t.querySelector("i");
    i ? (t.title = "Zur Hauptausgabe", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", n && (n.className = "ri-file-text-line text-lg lg:text-xl")) : (t.title = "Zu Beilage", t.className = "w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer", n && (n.className = "ri-attachment-line text-lg lg:text-xl"));
  }
}
function re() {
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
    A(t, a);
  }) : A(t, a);
}
function A(a, e) {
  if (navigator.clipboard)
    navigator.clipboard.writeText(a).then(() => {
      y(e, "Link kopiert!");
    }).catch((t) => {
      y(e, "Kopieren fehlgeschlagen");
    });
  else {
    const t = document.createElement("textarea");
    t.value = a, document.body.appendChild(t), t.select();
    try {
      const i = document.execCommand("copy");
      y(e, i ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      y(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(t);
    }
  }
}
function ae() {
  const a = document.getElementById("citationBtn"), e = document.title || "KGPZ";
  let t = window.location.origin + window.location.pathname;
  t.includes("#") && (t = t.split("#")[0]);
  const i = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE"), n = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${e}. Digital verfügbar unter: ${t} (Zugriff: ${i}).`;
  if (navigator.clipboard)
    navigator.clipboard.writeText(n).then(() => {
      y(a, "Zitation kopiert!");
    }).catch((s) => {
      y(a, "Kopieren fehlgeschlagen");
    });
  else {
    const s = document.createElement("textarea");
    s.value = n, document.body.appendChild(s), s.select();
    try {
      const o = document.execCommand("copy");
      y(a, o ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      y(a, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(s);
    }
  }
}
function y(a, e) {
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
  const c = 120, u = 32;
  r + c > o && (r = n.right - c + 10), l + u > s && (l = n.top - u - 8), i.style.left = Math.max(5, r) + "px", i.style.top = Math.max(5, l) + "px", document.body.appendChild(i), setTimeout(() => {
    i.style.opacity = "1";
  }, 10), setTimeout(() => {
    i.style.opacity = "0", setTimeout(() => {
      i.parentNode && i.remove();
    }, 200);
  }, 2e3);
}
function le(a, e, t = !1) {
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
      y(e, "Link kopiert!");
    }).catch((s) => {
      y(e, "Kopieren fehlgeschlagen");
    });
  else {
    const s = document.createElement("textarea");
    s.value = n, document.body.appendChild(s), s.select();
    try {
      const o = document.execCommand("copy");
      y(e, o ? "Link kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      y(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(s);
    }
  }
}
function ce(a, e) {
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
      y(e, "Zitation kopiert!");
    }).catch((l) => {
      y(e, "Kopieren fehlgeschlagen");
    });
  else {
    const l = document.createElement("textarea");
    l.value = r, document.body.appendChild(l), l.select();
    try {
      const c = document.execCommand("copy");
      y(e, c ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
    } catch {
      y(e, "Kopieren fehlgeschlagen");
    } finally {
      document.body.removeChild(l);
    }
  }
}
function q() {
  ie(), window.addEventListener("scroll", function() {
    clearTimeout(window.scrollTimeout), window.scrollTimeout = setTimeout(() => {
      P();
    }, 50);
  }), document.addEventListener("keydown", function(a) {
    a.key === "Escape" && H();
  });
}
function B() {
  const a = window.location.pathname, e = document.querySelector("main .grid.grid-cols-1.lg\\:grid-cols-3") !== null, t = document.querySelector("main h3 u") !== null;
  if (a.includes("/search") || a.includes("/suche") || e || t) {
    document.querySelectorAll(".citation-link[data-citation-url]").forEach((o) => {
      o.classList.remove("text-red-700", "pointer-events-none"), o.removeAttribute("aria-current");
    });
    return;
  }
  document.querySelectorAll(".citation-link[data-citation-url]").forEach((s) => {
    const o = s.getAttribute("data-citation-url");
    let r = !1;
    if (o === a)
      r = !0;
    else {
      const l = a.match(/^\/(\d{4})\/(\d+)(?:\/(\d+))?$/), c = o.match(/^\/(\d{4})\/(\d+)$/);
      if (l && c) {
        const [, u, d, h] = l, [, g, p] = c;
        u === g && d === p && (r = !0);
      }
    }
    r ? (s.classList.add("text-red-700", "pointer-events-none"), s.setAttribute("aria-current", "page")) : (s.classList.remove("text-red-700", "pointer-events-none"), s.removeAttribute("aria-current"));
  });
}
function N() {
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
window.enlargePage = te;
window.closeModal = H;
window.scrollToPreviousPage = ne;
window.scrollToNextPage = se;
window.scrollToBeilage = oe;
window.shareCurrentPage = re;
window.generateCitation = ae;
window.copyPagePermalink = le;
window.generatePageCitation = ce;
N();
B();
document.querySelector(".newspaper-page-container") && q();
let de = function(a) {
  N(), B(), I(), setTimeout(() => {
    document.querySelector(".newspaper-page-container") && q();
  }, 50);
};
document.body.addEventListener("htmx:afterSettle", de);
