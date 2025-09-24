const filterBtn = document.getElementById("filter-toggle");
if (filterBtn) {
	filterBtn.addEventListener("click", toggleFilter);
}

// Filter toggle functionality
function toggleFilter() {
	const filterContainer = document.getElementById("filter-container");
	const filterButton = document.getElementById("filter-toggle");
	const filterContentDiv = filterContainer?.querySelector("div.flex.justify-center");

	if (filterContainer.classList.contains("hidden")) {
		// Show the filter
		filterContainer.classList.remove("hidden");
		filterButton.classList.add("bg-slate-200");

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
		filterContainer.classList.add("hidden");
		filterButton.classList.remove("bg-slate-200");
	}
}

// Export for global access
window.toggleFilter = toggleFilter;

// Close filter when clicking outside
document.addEventListener("click", function (event) {
	const filterContainer = document.getElementById("filter-container");
	const filterButton = document.getElementById("filter-toggle");

	if (
		filterContainer &&
		filterButton &&
		!filterContainer.contains(event.target) &&
		!filterButton.contains(event.target)
	) {
		if (!filterContainer.classList.contains("hidden")) {
			filterContainer.classList.add("hidden");
			filterButton.classList.remove("bg-slate-200");
		}
	}
});

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
        const searchInput = this.querySelector('#person-search');
        const authorsCheckbox = this.querySelector('#authors-only');
        const allPersonsList = this.querySelector('#all-persons');
        const authorsOnlyList = this.querySelector('#authors-only-list');

        if (!searchInput || !authorsCheckbox || !allPersonsList || !authorsOnlyList) {
            return;
        }

        // Search functionality
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            this.filterPersons(query);
        });

        // Checkbox functionality
        authorsCheckbox.addEventListener('change', () => {
            this.togglePersonsList();
            // Clear and re-apply search filter
            const query = searchInput.value.toLowerCase().trim();
            this.filterPersons(query);
        });
    }

    togglePersonsList() {
        const authorsCheckbox = this.querySelector('#authors-only');
        const allPersonsList = this.querySelector('#all-persons');
        const authorsOnlyList = this.querySelector('#authors-only-list');

        if (!authorsCheckbox || !allPersonsList || !authorsOnlyList) {
            return;
        }

        if (authorsCheckbox.checked) {
            allPersonsList.style.display = 'none';
            authorsOnlyList.style.display = 'block';
        } else {
            allPersonsList.style.display = 'block';
            authorsOnlyList.style.display = 'none';
        }
    }

    filterPersons(query) {
        // Filter items in the currently visible list
        const authorsCheckbox = this.querySelector('#authors-only');
        const currentList = authorsCheckbox?.checked ?
            this.querySelector('#authors-only-list') :
            this.querySelector('#all-persons');

        if (!currentList) {
            return;
        }

        const personItems = currentList.querySelectorAll('.person-item');

        personItems.forEach(item => {
            const name = item.querySelector('.person-name')?.textContent || '';
            const life = item.querySelector('.person-life')?.textContent || '';

            const matches = !query ||
                           name.toLowerCase().includes(query) ||
                           life.toLowerCase().includes(query);

            if (matches) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
}

// Register the custom element
customElements.define('person-jump-filter', PersonJumpFilter);

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
                console.error('Failed to parse issues data:', e);
            }
        }
    }

    setupEventListeners() {
        const yearSelect = this.querySelector('#year-select');
        const issueNumberSelect = this.querySelector('#issue-number-select');
        const issueDateSelect = this.querySelector('#issue-date-select');
        const pageInput = this.querySelector('#page-input');
        const pageJumpBtn = this.querySelector('#page-jump-btn');

        if (!yearSelect) {
            return;
        }

        // Year selection change handler
        yearSelect.addEventListener('change', () => {
            this.updateIssueOptions();
            this.updatePageInputState();
            this.clearPageErrors();
        });

        // Issue number selection change handler - jump immediately
        if (issueNumberSelect) {
            issueNumberSelect.addEventListener('change', () => {
                const year = yearSelect.value;
                const issueNum = issueNumberSelect.value;
                if (year && issueNum) {
                    window.location.href = `/${year}/${issueNum}`;
                }
            });
        }

        // Issue date selection change handler - jump immediately
        if (issueDateSelect) {
            issueDateSelect.addEventListener('change', () => {
                const year = yearSelect.value;
                const issueNum = issueDateSelect.value; // value contains issue number
                if (year && issueNum) {
                    window.location.href = `/${year}/${issueNum}`;
                }
            });
        }

        // Page input handlers
        if (pageInput) {
            pageInput.addEventListener('input', () => {
                this.updatePageJumpButton();
                this.clearPageErrors();
            });

            // Handle Enter key in page input
            pageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handlePageJump();
                }
            });
        }

        // Page jump button
        if (pageJumpBtn) {
            pageJumpBtn.addEventListener('click', () => {
                this.handlePageJump();
            });
        }

        // Page jump form submission
        const pageForm = this.querySelector('#page-jump-form');
        if (pageForm) {
            pageForm.addEventListener('submit', (e) => {
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
        const yearSelect = this.querySelector('#year-select');
        const issueNumberSelect = this.querySelector('#issue-number-select');
        const issueDateSelect = this.querySelector('#issue-date-select');

        if (!yearSelect || !issueNumberSelect || !issueDateSelect) {
            return;
        }

        const selectedYear = yearSelect.value;
        const issues = this.issuesByYear[selectedYear] || [];

        // Clear existing options
        issueNumberSelect.innerHTML = '<option value="">Nr.</option>';
        issueDateSelect.innerHTML = '<option value="">Datum</option>';

        // Add options for selected year
        issues.forEach(issue => {
            // Issue number select - just the number
            const numberOption = document.createElement('option');
            numberOption.value = issue.number;
            numberOption.textContent = issue.number;
            issueNumberSelect.appendChild(numberOption);

            // Issue date select - date with issue number as value
            const dateOption = document.createElement('option');
            dateOption.value = issue.number; // value is still issue number for navigation
            dateOption.textContent = `${issue.date} [${issue.number}]`;
            issueDateSelect.appendChild(dateOption);
        });

        const hasIssues = issues.length > 0 && selectedYear;
        issueNumberSelect.disabled = !hasIssues;
        issueDateSelect.disabled = !hasIssues;
    }

    async handlePageJump() {
        const yearSelect = this.querySelector('#year-select');
        const pageInput = this.querySelector('#page-input');
        const errorContainer = this.querySelector('#jump-errors');

        if (!yearSelect || !pageInput) {
            return;
        }

        const year = yearSelect.value;
        const page = pageInput.value;

        if (!year || !page) {
            this.showError('Bitte Jahr und Seite auswählen.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('year', year);
            formData.append('page', page);

            const response = await fetch('/jump', {
                method: 'POST',
                body: formData,
                redirect: 'manual'
            });

            // Check for HTMX redirect header
            const hxRedirect = response.headers.get('HX-Redirect');
            if (hxRedirect) {
                window.location.href = hxRedirect;
                return;
            }

            if (response.status === 302 || response.status === 301) {
                const location = response.headers.get('Location');
                if (location) {
                    window.location.href = location;
                    return;
                }
            }

            if (response.ok) {
                if (errorContainer) {
                    errorContainer.innerHTML = '';
                }
            } else {
                const errorText = await response.text();
                if (errorContainer) {
                    errorContainer.innerHTML = errorText;
                }
            }
        } catch (error) {
            console.error('Page jump failed:', error);
            this.showError('Fehler beim Suchen der Seite.');
        }
    }

    showError(message) {
        const errorContainer = this.querySelector('#jump-errors');
        if (errorContainer) {
            errorContainer.innerHTML = `<div class="text-red-600 text-sm mt-1">${message}</div>`;
        }
    }

    clearPageErrors() {
        const errorContainer = this.querySelector('#jump-errors');
        if (errorContainer) {
            errorContainer.innerHTML = '';
        }
    }

    updatePageInputState() {
        const yearSelect = this.querySelector('#year-select');
        const pageInput = this.querySelector('#page-input');

        if (!yearSelect || !pageInput) {
            return;
        }

        const hasYear = yearSelect.value;
        pageInput.disabled = !hasYear;

        if (!hasYear) {
            pageInput.value = '';
            this.updatePageJumpButton();
        }
    }

    updatePageJumpButton() {
        const yearSelect = this.querySelector('#year-select');
        const pageInput = this.querySelector('#page-input');
        const pageJumpBtn = this.querySelector('#page-jump-btn');

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
customElements.define('year-jump-filter', YearJumpFilter);
