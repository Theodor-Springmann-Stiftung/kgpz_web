// ===========================
// SCROLL TO TOP COMPONENT
// ===========================

// Scroll to Top Web Component
export class ScrollToTopButton extends HTMLElement {
	constructor() {
		super();
		this.isVisible = false;
		this.scrollHandler = null;
		this.htmxAfterSwapHandler = null;
	}

	connectedCallback() {
		// Create the button without shadow DOM so Tailwind works
		this.innerHTML = `
			<button
				id="scroll-to-top-btn"
				class="fixed bottom-6 right-6 w-12 h-12 bg-gray-700 hover:bg-gray-800 text-gray-100 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center cursor-pointer z-50 opacity-0 pointer-events-none"
				title="Nach oben scrollen"
				onclick="this.closest('scroll-to-top-button').scrollToTop()">
				<i class="ri-arrow-up-line text-xl font-bold"></i>
			</button>
		`;

		// Set up scroll listener
		this.scrollHandler = () => {
			this.handleScroll();
		};

		// Set up HTMX event listener
		this.htmxAfterSwapHandler = () => {
			this.reassessScrollPosition();
		};

		window.addEventListener('scroll', this.scrollHandler);
		document.body.addEventListener('htmx:afterSettle', this.htmxAfterSwapHandler);

		// Initial check
		this.handleScroll();
	}

	disconnectedCallback() {
		// Clean up event listeners
		if (this.scrollHandler) {
			window.removeEventListener('scroll', this.scrollHandler);
			this.scrollHandler = null;
		}

		if (this.htmxAfterSwapHandler) {
			document.body.removeEventListener('htmx:afterSettle', this.htmxAfterSwapHandler);
			this.htmxAfterSwapHandler = null;
		}
	}

	// Method to reassess scroll position (called after HTMX swaps)
	reassessScrollPosition() {
		// Small delay to ensure DOM is settled after HTMX swap
		setTimeout(() => {
			this.handleScroll();
		}, 100);
	}

	handleScroll() {
		const button = this.querySelector('#scroll-to-top-btn');
		if (!button) return;

		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const viewportHeight = window.innerHeight;
		const shouldShow = scrollTop > viewportHeight;

		if (shouldShow && !this.isVisible) {
			// Show button
			this.isVisible = true;
			button.classList.remove('opacity-0', 'pointer-events-none');
			button.classList.add('opacity-100', 'pointer-events-auto');
		} else if (!shouldShow && this.isVisible) {
			// Hide button
			this.isVisible = false;
			button.classList.remove('opacity-100', 'pointer-events-auto');
			button.classList.add('opacity-0', 'pointer-events-none');
		}
	}

	scrollToTop() {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	}
}

// Register the scroll to top component
customElements.define('scroll-to-top-button', ScrollToTopButton);