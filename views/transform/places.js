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

// Register the custom element
customElements.define('places-filter', PlacesFilter);