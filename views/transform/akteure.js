// ===========================
// AKTEURE/AUTHORS SCROLLSPY WEB COMPONENT
// ===========================

export class AkteureScrollspy extends HTMLElement {
	constructor() {
		super();
		this.scrollHandler = null;
		this.scrollTimeout = null;
		this.clickHandlers = [];
		this.manualNavigation = false;
	}

	connectedCallback() {
		// Small delay to ensure DOM is fully rendered after HTMX swap
		setTimeout(() => {
			this.initializeScrollspyAfterDelay();
		}, 100);
	}

	initializeScrollspyAfterDelay() {
		// Find sections and nav links
		this.sections = document.querySelectorAll(".author-section");
		this.navLinks = document.querySelectorAll(".scrollspy-link");

		if (this.sections.length === 0 || this.navLinks.length === 0) {
			// Retry after a bit more time if elements not found
			setTimeout(() => {
				this.sections = document.querySelectorAll(".author-section");
				this.navLinks = document.querySelectorAll(".scrollspy-link");
				if (this.sections.length > 0 && this.navLinks.length > 0) {
					this.initializeScrollspy();
				}
			}, 200);
			return;
		}

		this.initializeScrollspy();
	}

	disconnectedCallback() {
		this.cleanup();
	}

	initializeScrollspy() {
		// Set up scroll handler
		this.scrollHandler = () => {
			clearTimeout(this.scrollTimeout);
			this.scrollTimeout = setTimeout(() => {
				this.updateActiveLink();
				this.updateSidebarScrollToTopButton();
			}, 50);
		};

		window.addEventListener("scroll", this.scrollHandler);

		// Add smooth scroll on link click
		this.navLinks.forEach((link) => {
			const clickHandler = (e) => {
				e.preventDefault();
				const targetId = link.getAttribute("data-target");
				const target = document.getElementById(targetId);
				if (target) {
					// Immediately update the active link highlighting on click
					this.updateActiveLinkImmediate(targetId);

					// Temporarily disable automatic sidebar scrolling during manual navigation
					this.manualNavigation = true;

					target.scrollIntoView({
						behavior: "smooth",
						block: "start",
					});

					// Re-enable automatic scrolling after navigation completes
					setTimeout(() => {
						this.manualNavigation = false;
						// Ensure the full marker is visible after scroll settles
						this.ensureMarkerVisibility();
					}, 1000);
				}
			};

			this.clickHandlers.push({ link, handler: clickHandler });
			link.addEventListener("click", clickHandler);
		});

		// Initial active link update
		this.updateActiveLink();

		// Initial scroll-to-top button update
		this.updateSidebarScrollToTopButton();
	}

	ensureMarkerVisibility() {
		const slider = document.getElementById("scrollspy-slider");
		const nav = document.getElementById("scrollspy-nav");

		if (!slider || !nav || slider.style.opacity === "0") {
			return;
		}

		const navRect = nav.getBoundingClientRect();
		const sliderTop = parseFloat(slider.style.top);
		const sliderHeight = parseFloat(slider.style.height);
		const sliderBottom = sliderTop + sliderHeight;

		// Check if the marker extends beyond the visible area
		const navScrollTop = nav.scrollTop;
		const navVisibleBottom = navScrollTop + navRect.height;

		if (sliderBottom > navVisibleBottom) {
			// Marker extends below visible area - scroll down to show the bottom
			const scrollTarget = sliderBottom - navRect.height + 20; // 20px padding
			nav.scrollTo({
				top: scrollTarget,
				behavior: "smooth",
			});
		} else if (sliderTop < navScrollTop) {
			// Marker extends above visible area - scroll up to show the top
			const scrollTarget = sliderTop - 20; // 20px padding
			nav.scrollTo({
				top: Math.max(0, scrollTarget),
				behavior: "smooth",
			});
		}
	}

	updateActiveLink() {
		// Safety check: ensure DOM elements still exist
		if (!this.sections || !this.navLinks) {
			return;
		}

		const visibleSections = [];
		const viewportTop = window.scrollY;
		const viewportBottom = viewportTop + window.innerHeight;

		// Check which sections have any part of their Werke or Beiträge visible
		try {
			this.sections.forEach((section) => {
				if (!section || !section.getAttribute) return;
				const sectionId = section.getAttribute("id");

				// Find Werke and Beiträge sections within this author section
				const werkeSection = section.querySelector(".akteur-werke-section");
				const beitraegeSection = section.querySelector(".akteur-beitraege-section");

				let isVisible = false;

				// Check if any part of Werke section is visible
				if (werkeSection) {
					const werkeRect = werkeSection.getBoundingClientRect();
					const werkeTopVisible = werkeRect.top < window.innerHeight;
					const werkeBottomVisible = werkeRect.bottom > 0;
					if (werkeTopVisible && werkeBottomVisible) {
						isVisible = true;
					}
				}

				// Check if any part of Beiträge section is visible
				if (beitraegeSection && !isVisible) {
					const beitraegeRect = beitraegeSection.getBoundingClientRect();
					const beitraegeTopVisible = beitraegeRect.top < window.innerHeight;
					const beitraegeBottomVisible = beitraegeRect.bottom > 0;
					if (beitraegeTopVisible && beitraegeBottomVisible) {
						isVisible = true;
					}
				}

				// Fallback: if no Werke/Beiträge sections, check header visibility (for authors without content)
				if (!werkeSection && !beitraegeSection) {
					const headerElement = section.querySelector("div:first-child");
					if (headerElement) {
						const headerRect = headerElement.getBoundingClientRect();
						const headerTopVisible = headerRect.top >= 0;
						const headerBottomVisible = headerRect.bottom <= window.innerHeight;
						if (headerTopVisible && headerBottomVisible) {
							isVisible = true;
						}
					}
				}

				if (isVisible) {
					visibleSections.push(sectionId);
				}
			});
		} catch (e) {
			// Handle case where sections became stale during DOM manipulation
			return;
		}

		// Update highlighting with sliding background animation
		const activeLinks = [];
		const slider = document.getElementById("scrollspy-slider");

		// Reset all links to default state (no background, just font weight for active)
		this.navLinks.forEach((link) => {
			link.classList.remove("font-medium");

			const targetId = link.getAttribute("data-target");
			if (visibleSections.includes(targetId)) {
				link.classList.add("font-medium");
				activeLinks.push(link);
			}
		});

		// Calculate and animate the sliding background
		if (activeLinks.length > 0 && slider) {
			// Get the nav container for relative positioning
			const nav = document.getElementById("scrollspy-nav");
			const navRect = nav.getBoundingClientRect();

			// Calculate the combined area of all active links
			let minTop = Infinity;
			let maxBottom = -Infinity;

			activeLinks.forEach((link) => {
				const linkRect = link.getBoundingClientRect();
				const relativeTop = linkRect.top - navRect.top + nav.scrollTop;
				const relativeBottom = relativeTop + linkRect.height;

				minTop = Math.min(minTop, relativeTop);
				maxBottom = Math.max(maxBottom, relativeBottom);
			});

			// Handle gaps between non-consecutive active links
			let totalHeight = maxBottom - minTop;

			// Position and size the slider
			slider.style.top = `${minTop}px`;
			slider.style.height = `${totalHeight}px`;
			slider.style.opacity = "1";

			// Ensure the full marker is visible
			setTimeout(() => this.ensureMarkerVisibility(), 100);
		} else if (slider) {
			// Hide slider when no active links
			slider.style.opacity = "0";
		}

		// Implement proportional scrolling to keep active links visible
		if (activeLinks.length > 0) {
			this.updateSidebarScroll(activeLinks);
		}
	}

	updateActiveLinkImmediate(targetId) {
		// Safety check: ensure DOM elements still exist
		if (!this.navLinks) return;

		const slider = document.getElementById("scrollspy-slider");

		// Reset all links
		try {
			this.navLinks.forEach((link) => {
				if (link && link.classList) {
					link.classList.remove("font-medium");
				}
			});
		} catch (e) {
			// Handle case where navLinks became stale
			return;
		}

		// Highlight the clicked link
		const clickedLink = document.querySelector(`[data-target="${targetId}"]`);
		if (clickedLink) {
			clickedLink.classList.add("font-medium");

			// Update slider position for the single clicked link
			if (slider) {
				const nav = document.getElementById("scrollspy-nav");
				if (nav) {
					const navRect = nav.getBoundingClientRect();
					const linkRect = clickedLink.getBoundingClientRect();

					const relativeTop = linkRect.top - navRect.top + nav.scrollTop;
					slider.style.top = `${relativeTop}px`;
					slider.style.height = `${linkRect.height}px`;
					slider.style.opacity = "1";
				}
			}
		}
	}

	updateSidebarScroll(activeLinks) {
		// Skip automatic scrolling during manual navigation
		if (this.manualNavigation) return;

		const sidebar = document.getElementById("scrollspy-nav");
		if (!sidebar) return;

		// Get the first active link as reference
		const firstActiveLink = activeLinks[0];

		// Calculate the main content scroll progress
		const documentHeight = Math.max(
			document.body.scrollHeight,
			document.body.offsetHeight,
			document.documentElement.clientHeight,
			document.documentElement.scrollHeight,
			document.documentElement.offsetHeight,
		);
		const viewportHeight = window.innerHeight;
		const maxScroll = documentHeight - viewportHeight;
		const scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;

		// Calculate sidebar scroll dimensions
		const sidebarHeight = sidebar.clientHeight;
		const sidebarScrollHeight = sidebar.scrollHeight;
		const maxSidebarScroll = sidebarScrollHeight - sidebarHeight;

		if (maxSidebarScroll > 0) {
			// Calculate proportional scroll position
			const targetSidebarScroll = scrollProgress * maxSidebarScroll;

			// Get the position of the first active link within the sidebar
			const linkRect = firstActiveLink.getBoundingClientRect();
			const sidebarRect = sidebar.getBoundingClientRect();
			const linkOffsetInSidebar = linkRect.top - sidebarRect.top + sidebar.scrollTop;

			// Calculate the desired position (center the active link in the sidebar viewport)
			const sidebarCenter = sidebarHeight / 2;
			const centeredPosition = linkOffsetInSidebar - sidebarCenter;

			// Use a blend of proportional scrolling and centering for smooth behavior
			const blendFactor = 0.7; // 70% proportional, 30% centering
			const finalScrollPosition =
				blendFactor * targetSidebarScroll + (1 - blendFactor) * centeredPosition;

			// Clamp to valid scroll range
			const clampedPosition = Math.max(0, Math.min(maxSidebarScroll, finalScrollPosition));

			// Apply smooth scrolling, but only if the difference is significant
			const currentScrollTop = sidebar.scrollTop;
			const scrollDifference = Math.abs(clampedPosition - currentScrollTop);

			if (scrollDifference > 10) {
				// Only scroll if more than 10px difference
				sidebar.scrollTo({
					top: clampedPosition,
					behavior: "smooth",
				});
			}
		}
	}

	updateSidebarScrollToTopButton() {
		const button = document.getElementById("sidebar-scroll-to-top");
		if (!button) return;

		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const viewportHeight = window.innerHeight;
		const shouldShow = scrollTop > viewportHeight * 0.5; // Show after scrolling 50% of viewport

		if (shouldShow) {
			button.classList.remove("opacity-0");
			button.classList.add("opacity-100");
		} else {
			button.classList.remove("opacity-100");
			button.classList.add("opacity-0");
		}
	}

	cleanup() {
		// Remove scroll listener
		if (this.scrollHandler) {
			window.removeEventListener("scroll", this.scrollHandler);
			this.scrollHandler = null;
		}

		// Clear timeout
		if (this.scrollTimeout) {
			clearTimeout(this.scrollTimeout);
			this.scrollTimeout = null;
		}

		// Remove click handlers
		if (this.clickHandlers && this.clickHandlers.length > 0) {
			this.clickHandlers.forEach(({ link, handler }) => {
				if (link && handler) {
					link.removeEventListener("click", handler);
				}
			});
		}

		// Reset slider
		const slider = document.getElementById("scrollspy-slider");
		if (slider) {
			slider.style.opacity = "0";
			slider.style.height = "0";
		}

		// Clear all references to DOM elements and state
		this.sections = null;
		this.navLinks = null;
		this.clickHandlers = [];
		this.manualNavigation = false;
	}
}

// Register the web component
customElements.define("akteure-scrollspy", AkteureScrollspy);

