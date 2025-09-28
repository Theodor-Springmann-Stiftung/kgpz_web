/**
 * Generic Filter Web Component
 * Provides search functionality for filtering cards/items in lists
 * Can be configured for different types of content (places, categories, etc.)
 */
export class GenericFilter extends HTMLElement {
	constructor() {
		super();
		this.searchInput = null;
		this.itemCards = [];
		this.countElement = null;
		this.debounceTimer = null;
		this.originalCount = 0;
	}

	connectedCallback() {
		// Configuration attributes
		this.placeholderText = this.getAttribute('placeholder') || 'Suchen...';
		this.itemSelector = this.getAttribute('item-selector') || '[data-filter-item]';
		this.searchAttributes = (this.getAttribute('search-attributes') || 'data-filter-text').split(',');
		this.countSelector = this.getAttribute('count-selector') || '[data-filter-count]';
		this.itemType = this.getAttribute('item-type') || 'Einträge';
		this.itemTypeSingular = this.getAttribute('item-type-singular') || 'Eintrag';

		this.render();
		this.setupEventListeners();
		this.initializeItems();
	}


	disconnectedCallback() {
		this.cleanupEventListeners();
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
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
		this.searchInput = this.querySelector('#generic-search');
		if (this.searchInput) {
			this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
		}
	}

	cleanupEventListeners() {
		if (this.searchInput) {
			this.searchInput.removeEventListener('input', this.handleSearchInput.bind(this));
		}
	}

	initializeItems() {
		// Find all items and the count element using semantic containers
		this.itemCards = Array.from(document.querySelectorAll(this.itemSelector));

		// Count element should be in the same semantic container as the filter
		const filterContainer = this.closest('.filter-sidebar') || this.closest('.sidebar') || document;
		this.countElement = filterContainer.querySelector(this.countSelector);

		console.log('GenericFilter initialized:', {
			itemSelector: this.itemSelector,
			itemsFound: this.itemCards.length,
			countElement: this.countElement,
			searchAttributes: this.searchAttributes
		});

		if (this.countElement) {
			this.originalCount = this.itemCards.length;
			// Initially hide the count element since no search is active
			this.countElement.style.display = 'none';
		}
	}

	handleSearchInput(event) {
		// Clear previous debounce timer
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		// Debounce the search to avoid excessive filtering
		this.debounceTimer = setTimeout(() => {
			this.filterItems(event.target.value.trim());
		}, 150);
	}

	filterItems(searchTerm) {
		if (!this.itemCards.length) return;

		const normalizedSearch = searchTerm.toLowerCase();
		let visibleCount = 0;

		this.itemCards.forEach(card => {
			let isMatch = searchTerm === '';

			// Check all configured search attributes
			if (!isMatch) {
				for (const attr of this.searchAttributes) {
					const attrValue = card.getAttribute(attr.trim())?.toLowerCase() || '';
					if (attrValue.includes(normalizedSearch)) {
						isMatch = true;
						break;
					}
				}
			}

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
			// Hide count when no search is active
			this.countElement.style.display = 'none';
		} else {
			// Show count element when searching
			this.countElement.style.display = '';

			if (visibleCount === 0) {
				// Show zero for no results
				this.countElement.textContent = '(0)';
			} else {
				// Show just the filtered count number in parentheses
				this.countElement.textContent = `(${visibleCount})`;
			}
		}
	}
}

// Register the custom element
customElements.define('generic-filter', GenericFilter);