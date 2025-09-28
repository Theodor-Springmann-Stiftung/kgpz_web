/**
 * Places Filter Web Component
 * Provides search functionality for filtering place cards in the overview
 */
export class PlacesFilter extends HTMLElement {
	constructor() {
		super();
		this.searchInput = null;
		this.placeCards = [];
		this.countElement = null;
		this.debounceTimer = null;
		this.originalCount = 0;
	}

	connectedCallback() {
		this.render();
		this.setupEventListeners();
		this.initializePlaceCards();
	}

	disconnectedCallback() {
		this.cleanupEventListeners();
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
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
		this.searchInput = this.querySelector('#places-search');
		if (this.searchInput) {
			this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
		}
	}

	cleanupEventListeners() {
		if (this.searchInput) {
			this.searchInput.removeEventListener('input', this.handleSearchInput.bind(this));
		}
	}

	initializePlaceCards() {
		// Find all place cards and the count element
		const container = this.closest('.bg-white') || document;
		this.placeCards = Array.from(container.querySelectorAll('[data-place-name]'));
		this.countElement = container.querySelector('[data-places-count]');

		if (this.countElement) {
			this.originalCount = this.placeCards.length;
		}
	}

	handleSearchInput(event) {
		// Clear previous debounce timer
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		// Debounce the search to avoid excessive filtering
		this.debounceTimer = setTimeout(() => {
			this.filterPlaces(event.target.value.trim());
		}, 150);
	}

	filterPlaces(searchTerm) {
		if (!this.placeCards.length) return;

		const normalizedSearch = searchTerm.toLowerCase();
		let visibleCount = 0;

		this.placeCards.forEach(card => {
			const placeName = card.getAttribute('data-place-name')?.toLowerCase() || '';
			const modernName = card.getAttribute('data-modern-name')?.toLowerCase() || '';

			// Check if search term matches either the place name or modern name
			const isMatch = searchTerm === '' ||
				placeName.includes(normalizedSearch) ||
				modernName.includes(normalizedSearch);

			if (isMatch) {
				card.style.display = '';
				visibleCount++;
			} else {
				card.style.display = 'none';
			}
		});

		// Update the count display
		this.updateCountDisplay(visibleCount, searchTerm);
	}

	updateCountDisplay(visibleCount, searchTerm) {
		if (!this.countElement) return;

		if (searchTerm === '') {
			// Show original count when no search
			this.countElement.textContent = `Alle Orte (${this.originalCount})`;
		} else if (visibleCount === 0) {
			// Show no results message
			this.countElement.textContent = `Keine Orte gefunden für "${searchTerm}"`;
		} else {
			// Show filtered count
			this.countElement.textContent = `${visibleCount} von ${this.originalCount} Orten`;
		}
	}
}

/**
 * Place Accordion Web Component
 * Individual accordion for each place with expand/collapse functionality
 */
export class PlaceAccordion extends HTMLElement {
	constructor() {
		super();
		this.isExpanded = false;
		this.isLoading = false;
		this.hasLoaded = false;
	}

	connectedCallback() {
		this.setupAccordion();
		this.setupEventListeners();
	}

	disconnectedCallback() {
		this.cleanupEventListeners();
	}

	setupAccordion() {
		// Add chevron icon if not already present
		if (!this.querySelector('.accordion-chevron')) {
			const chevron = document.createElement('i');
			chevron.className = 'ri-chevron-down-line accordion-chevron transition-transform duration-200 text-slate-400';

			// Find the badge and insert chevron before it
			const badge = this.querySelector('[class*="bg-slate-100"]');
			if (badge) {
				badge.parentNode.insertBefore(chevron, badge);
			}
		}

		// Create content container if not exists
		if (!this.querySelector('[data-content]')) {
			const placeId = this.getAttribute('data-place-id');
			const contentContainer = document.createElement('div');
			contentContainer.setAttribute('data-content', '');
			contentContainer.className = 'accordion-content overflow-hidden transition-all duration-300 max-h-0';

			// Add HTMX attributes to override body defaults
			contentContainer.setAttribute('hx-get', `/ort/fragment/${placeId}`);
			contentContainer.setAttribute('hx-trigger', 'load-content');
			contentContainer.setAttribute('hx-swap', 'innerHTML');
			contentContainer.setAttribute('hx-target', 'this');
			contentContainer.setAttribute('hx-select', '.place-fragment-content');
			contentContainer.setAttribute('hx-boost', 'false'); // Override body's hx-boost="true"

			this.appendChild(contentContainer);
		}
	}

	setupEventListeners() {
		// Add click listener to the entire component
		this.addEventListener('click', this.handleClick.bind(this));
	}

	cleanupEventListeners() {
		this.removeEventListener('click', this.handleClick.bind(this));
	}

	handleClick(event) {
		// Only handle clicks on the place name area, not on expanded content
		const contentContainer = this.querySelector('[data-content]');
		if (contentContainer && contentContainer.contains(event.target)) {
			return; // Don't toggle if clicking inside expanded content
		}

		this.toggle();
	}

	toggle() {
		if (this.isExpanded) {
			this.collapse();
		} else {
			this.expand();
		}
	}

	expand() {
		if (this.isLoading) return;

		this.isExpanded = true;
		this.updateChevron();

		const contentContainer = this.querySelector('[data-content]');
		if (!contentContainer) return;

		// Load content if not already loaded
		if (!this.hasLoaded) {
			this.loadContent();
		} else {
			// Just show existing content
			contentContainer.style.maxHeight = contentContainer.scrollHeight + 'px';
		}
	}

	collapse() {
		this.isExpanded = false;
		this.updateChevron();

		const contentContainer = this.querySelector('[data-content]');
		if (contentContainer) {
			contentContainer.style.maxHeight = '0px';
		}
	}

	loadContent() {
		this.isLoading = true;
		const contentContainer = this.querySelector('[data-content]');

		// Show loading state
		contentContainer.innerHTML = '<div class="p-4 text-center text-slate-500">Lädt...</div>';
		contentContainer.style.maxHeight = contentContainer.scrollHeight + 'px';

		// Set up event listeners for HTMX events
		const handleAfterRequest = () => {
			this.hasLoaded = true;
			this.isLoading = false;
			// Adjust height after content loads
			setTimeout(() => {
				contentContainer.style.maxHeight = contentContainer.scrollHeight + 'px';
			}, 10);
			contentContainer.removeEventListener('htmx:afterRequest', handleAfterRequest);
		};

		const handleResponseError = () => {
			this.isLoading = false;
			contentContainer.innerHTML = '<div class="p-4 text-center text-red-500">Fehler beim Laden</div>';
			contentContainer.removeEventListener('htmx:responseError', handleResponseError);
		};

		contentContainer.addEventListener('htmx:afterRequest', handleAfterRequest);
		contentContainer.addEventListener('htmx:responseError', handleResponseError);

		// Trigger the HTMX request
		htmx.trigger(contentContainer, 'load-content');
	}

	updateChevron() {
		const chevron = this.querySelector('.accordion-chevron');
		if (chevron) {
			if (this.isExpanded) {
				chevron.style.transform = 'rotate(180deg)';
			} else {
				chevron.style.transform = 'rotate(0deg)';
			}
		}
	}
}

// Register the custom elements
customElements.define('places-filter', PlacesFilter);
customElements.define('place-accordion', PlaceAccordion);