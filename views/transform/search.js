// Handle search input logic
document.body.addEventListener("htmx:configRequest", function (event) {
	let element = event.detail.elt;

	if (element.id === "search" && element.value === "") {
		event.detail.parameters = {};
		event.detail.path = window.location.pathname + window.location.search;
	}
});

/**
 * PersonJumpFilter - Web component for filtering persons list
 * Works with server-rendered person list and provides client-side filtering
 */
class PersonJumpFilter extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.setupEventListeners();
	}

	setupEventListeners() {
		const searchInput = this.querySelector("#person-search");
		const authorsCheckbox = this.querySelector("#authors-only");
		const allPersonsList = this.querySelector("#all-persons");
		const authorsOnlyList = this.querySelector("#authors-only-list");

		if (!searchInput || !authorsCheckbox || !allPersonsList || !authorsOnlyList) {
			return;
		}

		// Search functionality
		searchInput.addEventListener("input", (e) => {
			const query = e.target.value.toLowerCase().trim();
			this.filterPersons(query);
		});

		// Checkbox functionality
		authorsCheckbox.addEventListener("change", () => {
			this.togglePersonsList();
			// Clear and re-apply search filter
			const query = searchInput.value.toLowerCase().trim();
			this.filterPersons(query);
		});
	}

	togglePersonsList() {
		const authorsCheckbox = this.querySelector("#authors-only");
		const allPersonsList = this.querySelector("#all-persons");
		const authorsOnlyList = this.querySelector("#authors-only-list");

		if (!authorsCheckbox || !allPersonsList || !authorsOnlyList) {
			return;
		}

		if (authorsCheckbox.checked) {
			allPersonsList.style.display = "none";
			authorsOnlyList.style.display = "block";
		} else {
			allPersonsList.style.display = "block";
			authorsOnlyList.style.display = "none";
		}
	}

	filterPersons(query) {
		// Filter items in the currently visible list
		const authorsCheckbox = this.querySelector("#authors-only");
		const currentList = authorsCheckbox?.checked
			? this.querySelector("#authors-only-list")
			: this.querySelector("#all-persons");

		if (!currentList) {
			return;
		}

		const personItems = currentList.querySelectorAll(".person-item");

		personItems.forEach((item) => {
			const name = item.querySelector(".person-name")?.textContent || "";
			const life = item.querySelector(".person-life")?.textContent || "";

			const matches =
				!query || name.toLowerCase().includes(query) || life.toLowerCase().includes(query);

			if (matches) {
				item.style.display = "block";
			} else {
				item.style.display = "none";
			}
		});
	}
}

// Register the custom element
customElements.define("person-jump-filter", PersonJumpFilter);

/**
 * PlaceJumpFilter - Web component for filtering places list
 */
class PlaceJumpFilter extends HTMLElement {
	connectedCallback() {
		const searchInput = this.querySelector("#place-search");
		if (searchInput) {
			searchInput.addEventListener("input", (e) => {
				const query = e.target.value.toLowerCase().trim();
				const placeItems = this.querySelectorAll(".place-item");

				placeItems.forEach((item) => {
					const name = item.querySelector(".place-name")?.textContent || "";
					const matches = !query || name.toLowerCase().includes(query);
					item.style.display = matches ? "block" : "none";
				});
			});
		}
	}
}

customElements.define("place-jump-filter", PlaceJumpFilter);

/**
 * CategoryJumpFilter - Web component for filtering categories list
 */
class CategoryJumpFilter extends HTMLElement {
	connectedCallback() {
		const searchInput = this.querySelector("#category-search");
		if (searchInput) {
			searchInput.addEventListener("input", (e) => {
				const query = e.target.value.toLowerCase().trim();
				const categoryItems = this.querySelectorAll(".category-item");

				categoryItems.forEach((item) => {
					const name = item.querySelector(".category-name")?.textContent || "";
					const matches = !query || name.toLowerCase().includes(query);
					item.style.display = matches ? "block" : "none";
				});
			});
		}
	}
}

customElements.define("category-jump-filter", CategoryJumpFilter);

/**
 * YearJumpFilter - Unified web component for Jahr-based navigation
 * Allows jumping by Jahr/Ausgabe or Jahr/Seite
 */
class YearJumpFilter extends HTMLElement {
	constructor() {
		super();
		this.issuesByYear = {};
	}

	connectedCallback() {
		this.parseIssuesData();
		this.setupEventListeners();
	}

	parseIssuesData() {
		// Parse issues data from data attributes
		const issuesData = this.dataset.issues;
		if (issuesData) {
			try {
				this.issuesByYear = JSON.parse(issuesData);
			} catch (e) {
				console.error("Failed to parse issues data:", e);
			}
		}
	}

	setupEventListeners() {
		const yearSelect = this.querySelector("#year-select");
		const issueNumberSelect = this.querySelector("#issue-number-select");
		const issueDateSelect = this.querySelector("#issue-date-select");
		const pageInput = this.querySelector("#page-input");
		const pageJumpBtn = this.querySelector("#page-jump-btn");

		if (!yearSelect) {
			return;
		}

		// Year selection change handler
		yearSelect.addEventListener("change", () => {
			this.updateIssueOptions();
			this.updatePageInputState();
			this.clearPageErrors();
		});

		// Issue number selection change handler - jump immediately
		if (issueNumberSelect) {
			issueNumberSelect.addEventListener("change", () => {
				const year = yearSelect.value;
				const issueNum = issueNumberSelect.value;
				if (year && issueNum) {
					window.location.href = `/${year}/${issueNum}`;
				}
			});
		}

		// Issue date selection change handler - jump immediately
		if (issueDateSelect) {
			issueDateSelect.addEventListener("change", () => {
				const year = yearSelect.value;
				const issueNum = issueDateSelect.value; // value contains issue number
				if (year && issueNum) {
					window.location.href = `/${year}/${issueNum}`;
				}
			});
		}

		// Page input handlers
		if (pageInput) {
			pageInput.addEventListener("input", () => {
				this.updatePageJumpButton();
				this.clearPageErrors();
			});

			// Handle Enter key in page input
			pageInput.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					e.preventDefault();
					this.handlePageJump();
				}
			});
		}

		// Page jump button
		if (pageJumpBtn) {
			pageJumpBtn.addEventListener("click", () => {
				this.handlePageJump();
			});
		}

		// Page jump form submission
		const pageForm = this.querySelector("#page-jump-form");
		if (pageForm) {
			pageForm.addEventListener("submit", (e) => {
				e.preventDefault();
				this.handlePageJump();
			});
		}

		// Initialize everything
		this.updateIssueOptions();
		this.updatePageInputState();
		this.updatePageJumpButton();
	}

	updateIssueOptions() {
		const yearSelect = this.querySelector("#year-select");
		const issueNumberSelect = this.querySelector("#issue-number-select");
		const issueDateSelect = this.querySelector("#issue-date-select");

		if (!yearSelect || !issueNumberSelect || !issueDateSelect) {
			return;
		}

		const selectedYear = yearSelect.value;
		const issues = this.issuesByYear[selectedYear] || [];

		// Clear existing options
		issueNumberSelect.innerHTML = '<option value="">Nr.</option>';
		issueDateSelect.innerHTML = '<option value="">Datum</option>';

		// Add options for selected year
		issues.forEach((issue) => {
			// Issue number select - just the number
			const numberOption = document.createElement("option");
			numberOption.value = issue.number;
			numberOption.textContent = issue.number;
			issueNumberSelect.appendChild(numberOption);

			// Issue date select - date with issue number as value
			const dateOption = document.createElement("option");
			dateOption.value = issue.number; // value is still issue number for navigation
			dateOption.textContent = `${issue.date} [${issue.number}]`;
			issueDateSelect.appendChild(dateOption);
		});

		const hasIssues = issues.length > 0 && selectedYear;
		issueNumberSelect.disabled = !hasIssues;
		issueDateSelect.disabled = !hasIssues;
	}

	async handlePageJump() {
		const yearSelect = this.querySelector("#year-select");
		const pageInput = this.querySelector("#page-input");
		const errorContainer = this.querySelector("#jump-errors");

		if (!yearSelect || !pageInput) {
			return;
		}

		const year = yearSelect.value;
		const page = pageInput.value;

		if (!year || !page) {
			this.showError("Bitte Jahr und Seite auswählen.");
			return;
		}

		try {
			const formData = new FormData();
			formData.append("year", year);
			formData.append("page", page);

			const response = await fetch("/jump", {
				method: "POST",
				body: formData,
				redirect: "manual",
			});

			// Check for HTMX redirect header
			const hxRedirect = response.headers.get("HX-Redirect");
			if (hxRedirect) {
				window.location.href = hxRedirect;
				return;
			}

			if (response.status === 302 || response.status === 301) {
				const location = response.headers.get("Location");
				if (location) {
					window.location.href = location;
					return;
				}
			}

			if (response.ok) {
				if (errorContainer) {
					errorContainer.innerHTML = "";
				}
			} else {
				const errorText = await response.text();
				if (errorContainer) {
					errorContainer.innerHTML = errorText;
				}
			}
		} catch (error) {
			console.error("Page jump failed:", error);
			this.showError("Fehler beim Suchen der Seite.");
		}
	}

	showError(message) {
		const errorContainer = this.querySelector("#jump-errors");
		if (errorContainer) {
			errorContainer.innerHTML = `<div class="text-red-600 text-sm mt-1">${message}</div>`;
		}
	}

	clearPageErrors() {
		const errorContainer = this.querySelector("#jump-errors");
		if (errorContainer) {
			errorContainer.innerHTML = "";
		}
	}

	updatePageInputState() {
		const yearSelect = this.querySelector("#year-select");
		const pageInput = this.querySelector("#page-input");

		if (!yearSelect || !pageInput) {
			return;
		}

		const hasYear = yearSelect.value;
		pageInput.disabled = !hasYear;

		if (!hasYear) {
			pageInput.value = "";
			this.updatePageJumpButton();
		}
	}

	updatePageJumpButton() {
		const yearSelect = this.querySelector("#year-select");
		const pageInput = this.querySelector("#page-input");
		const pageJumpBtn = this.querySelector("#page-jump-btn");

		if (!yearSelect || !pageInput || !pageJumpBtn) {
			return;
		}

		const hasYear = yearSelect.value;
		const hasPage = pageInput.value && pageInput.value.trim();
		const shouldEnable = hasYear && hasPage;

		pageJumpBtn.disabled = !shouldEnable;
	}
}

// Register the custom element
customElements.define("year-jump-filter", YearJumpFilter);

/**
 * SchnellauswahlButton - Web component for the quick selection/filter button
 * Encapsulates the toggle functionality and HTMX content loading
 */
class SchnellauswahlButton extends HTMLElement {
	constructor() {
		super();
		this.isOpen = false;
	}

	connectedCallback() {
		this.createButton();
		this.setupEventListeners();
	}

	disconnectedCallback() {
		// Clean up event listeners when component is removed
		document.removeEventListener("click", this.handleOutsideClick);
		document.removeEventListener("quickfilter:selection", this.handleSelectionEvent);
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
		const button = this.querySelector("button");
		if (button) {
			button.addEventListener("click", (e) => {
				e.stopPropagation();
				this.toggleFilter();
			});
		}

		// Bind event handlers to maintain 'this' context
		this.handleSelectionEvent = this.handleSelectionEvent.bind(this);
		this.handleOutsideClick = this.handleOutsideClick.bind(this);

		// Listen for person/place selection events
		document.addEventListener("quickfilter:selection", this.handleSelectionEvent);

		// Listen for outside clicks
		document.addEventListener("click", this.handleOutsideClick);
	}

	toggleFilter() {
		const filterContainer = document.getElementById("filter-container");
		const filterButton = this.querySelector("button");

		if (!filterContainer || !filterButton) {
			return;
		}

		const filterContentDiv = filterContainer.querySelector("div.flex.justify-center");

		if (filterContainer.classList.contains("hidden")) {
			// Show the filter
			filterContainer.classList.remove("hidden");
			filterButton.classList.add("bg-slate-200");
			// Change icon to arrow up when open
			const filterIcon = this.querySelector("i");
			if (filterIcon) {
				filterIcon.className = "ri-arrow-up-line";
			}
			this.isOpen = true;

			// Load content only if it doesn't exist - check for actual content
			const hasContent = filterContentDiv && filterContentDiv.querySelector("div, form, h3");
			if (!hasContent) {
				htmx
					.ajax("GET", "/filter", {
						target: "#filter-container",
						select: "#filter",
						swap: "innerHTML",
					})
					.then(() => {
						console.log("HTMX request completed");
						// Re-query the element to see if it changed
						const updatedDiv = document.querySelector("#filter-container .flex.justify-center");
					})
					.catch((error) => {
						console.log("HTMX request failed:", error);
					});
			}
		} else {
			this.hideFilter();
		}
	}

	hideFilter() {
		const filterContainer = document.getElementById("filter-container");
		const filterButton = this.querySelector("button");

		if (!filterContainer || !filterButton) {
			return;
		}

		filterContainer.classList.add("hidden");
		filterButton.classList.remove("bg-slate-200");
		// Change icon back to filter when closed
		const filterIcon = this.querySelector("i");
		if (filterIcon) {
			filterIcon.className = "ri-filter-2-line";
		}
		this.isOpen = false;
	}

	handleSelectionEvent(event) {
		if (this.isOpen) {
			this.hideFilter();
		}
	}

	handleOutsideClick(event) {
		const filterContainer = document.getElementById("filter-container");
		const filterButton = this.querySelector("button");

		if (
			this.isOpen &&
			filterContainer &&
			filterButton &&
			!filterContainer.contains(event.target) &&
			!this.contains(event.target)
		) {
			this.hideFilter();
		}
	}
}

// Register the custom element
customElements.define("schnellauswahl-button", SchnellauswahlButton);

/**
 * NavigationMenu - Web component for the main navigation menu
 * Web component for the main navigation menu with proper event handling
 */
class NavigationMenu extends HTMLElement {
	constructor() {
		super();
		this.isOpen = false;
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
		if (!this.gitCommit) {
			return "Keine Commit-Info";
		}

		const shortCommit = this.gitCommit.substring(0, 7);

		if (this.gitDate) {
			const date = new Date(this.gitDate);
			const formattedDate = date.toLocaleDateString("de-DE", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
			});
			return `${shortCommit} - ${formattedDate}`;
		}

		return shortCommit;
	}

	connectedCallback() {
		this.createMenu();
		this.setupEventListeners();
	}

	disconnectedCallback() {
		document.removeEventListener("click", this.handleOutsideClick);
		document.removeEventListener("quickfilter:selection", this.handleSelectionEvent);
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
		const button = this.querySelector("#menu-toggle");
		const dropdown = this.querySelector("#menu-dropdown");

		if (button) {
			button.addEventListener("click", (e) => {
				e.stopPropagation();
				this.toggleMenu();
			});
		}

		// Listen for link clicks within the menu
		if (dropdown) {
			dropdown.addEventListener("click", (e) => {
				const link = e.target.closest("a[href]");
				if (link) {
					// Dispatch selection event
					const selectionEvent = new CustomEvent("quickfilter:selection", {
						detail: {
							type: "navigation",
							source: "menu",
							url: link.getAttribute("href"),
							text: link.textContent.trim(),
						},
						bubbles: true,
					});

					document.dispatchEvent(selectionEvent);
				}
			});
		}

		// Bind event handlers for cleanup
		this.handleOutsideClick = this.handleOutsideClick.bind(this);
		this.handleSelectionEvent = this.handleSelectionEvent.bind(this);

		// Listen for outside clicks
		document.addEventListener("click", this.handleOutsideClick);

		// Listen for selection events to close menu
		document.addEventListener("quickfilter:selection", this.handleSelectionEvent);
	}

	toggleMenu() {
		const button = this.querySelector("#menu-toggle");
		const dropdown = this.querySelector("#menu-dropdown");

		if (!button || !dropdown) return;

		if (this.isOpen) {
			this.hideMenu();
		} else {
			this.showMenu();
		}
	}

	showMenu() {
		const button = this.querySelector("#menu-toggle");
		const dropdown = this.querySelector("#menu-dropdown");

		if (!button || !dropdown) return;

		dropdown.classList.remove("hidden");
		button.classList.add("bg-slate-200");
		this.isOpen = true;
	}

	hideMenu() {
		const button = this.querySelector("#menu-toggle");
		const dropdown = this.querySelector("#menu-dropdown");

		if (!button || !dropdown) return;

		dropdown.classList.add("hidden");
		button.classList.remove("bg-slate-200");
		this.isOpen = false;
	}

	handleSelectionEvent(event) {
		// Close menu when any selection is made (from quickfilter or menu)
		if (this.isOpen) {
			this.hideMenu();
		}
	}

	handleOutsideClick(event) {
		if (this.isOpen && !this.contains(event.target)) {
			this.hideMenu();
		}
	}
}

// Register the custom element
customElements.define("navigation-menu", NavigationMenu);

/**
 * Global event handler for quickfilter selections
 * Dispatches custom events when users select persons, places, or categories from quickfilter
 */
document.addEventListener("DOMContentLoaded", function () {
	// Add event delegation for person, place, and category links in quickfilter
	document.addEventListener("click", function (event) {
		// Check if the clicked element is a person, place, or category link within the quickfilter
		const quickfilterTarget = event.target.closest(
			'a[href^="/akteure/"], a[href^="/ort/"], a[href^="/kategorie/"]',
		);
		const filterContainer = document.getElementById("filter-container");

		if (quickfilterTarget && filterContainer && filterContainer.contains(quickfilterTarget)) {
			// Determine the type based on the URL
			let type;
			const href = quickfilterTarget.getAttribute("href");
			if (href.startsWith("/akteure/")) {
				type = "person";
			} else if (href.startsWith("/ort/")) {
				type = "place";
			} else if (href.startsWith("/kategorie/")) {
				type = "category";
			}

			// Dispatch custom event to notify components
			const selectionEvent = new CustomEvent("quickfilter:selection", {
				detail: {
					type: type,
					source: "quickfilter",
					id: href.split("/").pop(),
					url: href,
				},
				bubbles: true,
			});

			document.dispatchEvent(selectionEvent);
		}
	});
});

/**
 * SearchBar - Web component for the main search functionality
 * Encapsulates search input, loading indicator, reset button, and all related behavior
 */
class SearchBar extends HTMLElement {
	constructor() {
		super();
		this.htmxRequestListeners = [];
		this.htmxAfterSwapListener = null;
	}

	connectedCallback() {
		this.createSearchBar();
		this.setupEventListeners();
	}

	disconnectedCallback() {
		// Clean up all event listeners
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
		const searchInput = this.querySelector('#search');
		const resetButton = this.querySelector('#search-reset');
		const loadingIndicator = this.querySelector('#search-loading');

		if (!searchInput || !resetButton) return;

		// Store the current URL to detect changes
		this.currentURL = window.location.pathname;

		// Function to toggle reset button visibility
		const toggleResetButton = () => {
			if (searchInput.value.trim() !== '') {
				resetButton.classList.remove('hidden');
			} else {
				resetButton.classList.add('hidden');
			}
		};

		// Check initial state (in case of page refresh with existing search)
		toggleResetButton();

		// Show/hide reset button as user types
		searchInput.addEventListener('input', toggleResetButton);

		// Handle reset button click
		resetButton.addEventListener('click', () => {
			searchInput.value = '';
			resetButton.classList.add('hidden');

			// Trigger the same HTMX behavior that happens when manually clearing the field
			// This will automatically navigate back to the previous page
			searchInput.dispatchEvent(new Event('input', { bubbles: true }));

			// Focus back on search input
			searchInput.focus();
		});

		// Handle HTMX request lifecycle - hide reset button during loading
		if (loadingIndicator) {
			// Hide reset button when loading starts
			const beforeRequestHandler = (event) => {
				if (event.detail.elt === searchInput) {
					resetButton.style.display = 'none';
				}
			};

			// Show reset button when loading ends (if there's still text)
			const afterRequestHandler = (event) => {
				if (event.detail.elt === searchInput) {
					resetButton.style.display = '';
					toggleResetButton();
				}
			};

			document.body.addEventListener('htmx:beforeRequest', beforeRequestHandler);
			document.body.addEventListener('htmx:afterRequest', afterRequestHandler);

			// Store references for cleanup
			this.htmxRequestListeners.push(
				{ event: 'htmx:beforeRequest', handler: beforeRequestHandler },
				{ event: 'htmx:afterRequest', handler: afterRequestHandler }
			);
		}

		// Simple click listener to clear search when any link is clicked
		this.linkClickHandler = (event) => {
			const clickedElement = event.target;
			const link = clickedElement.closest('a[href]');

			// If a link was clicked and it has an href, clear the search
			if (link && link.getAttribute('href') && searchInput.value.trim() !== '') {
				searchInput.value = '';
				resetButton.classList.add('hidden');
			}
		};

		// Listen for clicks on the entire document
		document.addEventListener('click', this.linkClickHandler);
	}

	cleanup() {
		// Remove HTMX request listeners
		this.htmxRequestListeners.forEach(({ event, handler }) => {
			document.body.removeEventListener(event, handler);
		});
		this.htmxRequestListeners = [];

		// Remove link click listener
		if (this.linkClickHandler) {
			document.removeEventListener('click', this.linkClickHandler);
			this.linkClickHandler = null;
		}
	}
}

// Register the custom element
customElements.define("search-bar", SearchBar);
