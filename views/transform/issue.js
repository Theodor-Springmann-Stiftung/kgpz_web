// ===========================
// ISSUE/NEWSPAPER LAYOUT FUNCTIONS
// ===========================

// Global variables for state management
window.currentPageContainers = window.currentPageContainers || [];
window.currentActiveIndex = window.currentActiveIndex || 0;
window.pageObserver = window.pageObserver || null;

// Modal functions
export function enlargePage(imgElement, pageNumber, isFromSpread, partNumber = null) {
	// Get or create the single page viewer component
	let viewer = document.querySelector("single-page-viewer");
	if (!viewer) {
		viewer = document.createElement("single-page-viewer");
		document.body.appendChild(viewer);
	}

	// Determine if this is a beilage page
	const isBeilage = imgElement.closest('[data-beilage="true"]') !== null;

	// Get target page from template data if available
	const targetPage =
		window.templateData && window.templateData.targetPage ? window.templateData.targetPage : 0;

	// Extract existing icon type and heading from the page container
	const pageContainer = imgElement.closest('.newspaper-page-container, .piece-page-container');
	let extractedIconType = null;
	let extractedHeading = null;

	if (pageContainer) {
		// Extract icon type from data attribute
		extractedIconType = pageContainer.getAttribute('data-page-icon-type');

		// For piece view: check if part number should override icon
		const partNumberElement = pageContainer.querySelector('.part-number');
		if (partNumberElement) {
			extractedIconType = 'part-number';
		}

		// Extract heading text from page indicator
		const pageIndicator = pageContainer.querySelector('.page-indicator');
		if (pageIndicator) {
			// Clone the page indicator to extract text without buttons/icons
			const indicatorClone = pageIndicator.cloneNode(true);
			// Remove any icons to get just the text
			const icons = indicatorClone.querySelectorAll('i');
			icons.forEach(icon => icon.remove());
			// Remove any link indicators
			const linkIndicators = indicatorClone.querySelectorAll('[class*="target-page-dot"], .target-page-indicator');
			linkIndicators.forEach(indicator => indicator.remove());
			extractedHeading = indicatorClone.textContent.trim();
		}
	}

	// Use full-quality image if available, otherwise use current src
	const fullImageSrc = imgElement.getAttribute('data-full-image') || imgElement.src;

	// Show the page in the viewer with extracted data
	viewer.show(fullImageSrc, imgElement.alt, pageNumber, isBeilage, targetPage, partNumber, extractedIconType, extractedHeading);
}

export function closeModal() {
	const modal = document.getElementById("pageModal");
	modal.classList.add("hidden");
}

// Page navigation functions
export function initializePageTracking() {
	// Clean up existing observer
	if (window.pageObserver) {
		window.pageObserver.disconnect();
		window.pageObserver = null;
	}

	// Reset state
	window.currentPageContainers = Array.from(document.querySelectorAll(".newspaper-page-container"));
	window.currentActiveIndex = 0;
	updateButtonStates();

	// Set up new observer
	const existingObserver = document.querySelector(".newspaper-page-container");
	if (existingObserver) {
		let visibleContainers = new Set();

		window.pageObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const containerIndex = window.currentPageContainers.indexOf(entry.target);
					if (containerIndex !== -1) {
						if (entry.isIntersecting) {
							visibleContainers.add(containerIndex);
						} else {
							visibleContainers.delete(containerIndex);
						}
					}
				});

				// Update currentActiveIndex to the first (topmost) visible container
				if (visibleContainers.size > 0) {
					const sortedVisible = Array.from(visibleContainers).sort((a, b) => a - b);
					const newActiveIndex = sortedVisible[0];
					if (newActiveIndex !== window.currentActiveIndex) {
						window.currentActiveIndex = newActiveIndex;
						updateButtonStates();
					}
				}
			},
			{
				rootMargin: "-20% 0px -70% 0px",
			},
		);

		window.currentPageContainers.forEach((container) => {
			window.pageObserver.observe(container);
		});
	}
}

export function scrollToPreviousPage() {
	if (window.currentActiveIndex > 0) {
		// Find the first page that's not currently visible
		let targetIndex = -1;

		// Check which pages are currently visible
		const visibleIndexes = [];
		window.currentPageContainers.forEach((container, index) => {
			const containerRect = container.getBoundingClientRect();
			const viewportHeight = window.innerHeight;

			const visibleTop = Math.max(containerRect.top, 0);
			const visibleBottom = Math.min(containerRect.bottom, viewportHeight);
			const visibleHeight = Math.max(0, visibleBottom - visibleTop);
			const containerHeight = containerRect.height;

			const visibilityRatio = visibleHeight / containerHeight;
			if (visibilityRatio >= 0.3) {
				// Consider visible if 30% or more is showing
				visibleIndexes.push(index);
			}
		});

		// Find the first non-visible page before the current visible range
		const minVisibleIndex = Math.min(...visibleIndexes);
		for (let i = minVisibleIndex - 1; i >= 0; i--) {
			if (!visibleIndexes.includes(i)) {
				targetIndex = i;
				break;
			}
		}

		// If no non-visible page found, go to the page just before the visible range
		if (targetIndex === -1 && minVisibleIndex > 0) {
			targetIndex = minVisibleIndex - 1;
		}

		if (targetIndex >= 0) {
			window.currentActiveIndex = targetIndex;
			window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
				block: "start",
			});

			// Update button states after a brief delay to let intersection observer catch up
			setTimeout(() => {
				updateButtonStates();
			}, 100);
		}
	}
}

export function scrollToNextPage() {
	if (window.currentActiveIndex < window.currentPageContainers.length - 1) {
		// Find the first page that's not currently visible
		let targetIndex = -1;

		// Check which pages are currently visible
		const visibleIndexes = [];
		window.currentPageContainers.forEach((container, index) => {
			const containerRect = container.getBoundingClientRect();
			const viewportHeight = window.innerHeight;

			const visibleTop = Math.max(containerRect.top, 0);
			const visibleBottom = Math.min(containerRect.bottom, viewportHeight);
			const visibleHeight = Math.max(0, visibleBottom - visibleTop);
			const containerHeight = containerRect.height;

			const visibilityRatio = visibleHeight / containerHeight;
			if (visibilityRatio >= 0.3) {
				// Consider visible if 30% or more is showing
				visibleIndexes.push(index);
			}
		});

		// Find the first non-visible page after the current visible range
		const maxVisibleIndex = Math.max(...visibleIndexes);
		for (let i = maxVisibleIndex + 1; i < window.currentPageContainers.length; i++) {
			if (!visibleIndexes.includes(i)) {
				targetIndex = i;
				break;
			}
		}

		// If no non-visible page found, go to the page just after the visible range
		if (targetIndex === -1 && maxVisibleIndex < window.currentPageContainers.length - 1) {
			targetIndex = maxVisibleIndex + 1;
		}

		if (targetIndex >= 0 && targetIndex < window.currentPageContainers.length) {
			window.currentActiveIndex = targetIndex;
			window.currentPageContainers[window.currentActiveIndex].scrollIntoView({
				block: "start",
			});

			// Update button states after a brief delay to let intersection observer catch up
			setTimeout(() => {
				updateButtonStates();
			}, 100);
		}
	}
}

export function scrollToBeilage() {
	// Check if we're currently viewing a Beilage section
	const isViewingBeilage = isCurrentlyInBeilageSection();

	if (isViewingBeilage) {
		// Go back to main issue (first main page)
		const firstMainPage = document.querySelector("#newspaper-content .newspaper-page-container");
		if (firstMainPage) {
			firstMainPage.scrollIntoView({
				block: "start",
			});
		}
	} else {
		// Go to first beilage container - look for the first beilage page container
		const beilageContainer = document.querySelector('[data-beilage="true"]');
		if (beilageContainer) {
			beilageContainer.scrollIntoView({
				block: "start",
			});
		} else {
			// Fallback: try to find beilage header section
			const beilageHeader = document.querySelector('.bg-amber-50');
			if (beilageHeader) {
				beilageHeader.scrollIntoView({
					block: "start",
				});
			}
		}
	}
}

function isCurrentlyInBeilageSection() {
	// Check which pages are currently visible
	const visibleIndexes = [];
	window.currentPageContainers.forEach((container, index) => {
		const containerRect = container.getBoundingClientRect();
		const viewportHeight = window.innerHeight;

		const visibleTop = Math.max(containerRect.top, 0);
		const visibleBottom = Math.min(containerRect.bottom, viewportHeight);
		const visibleHeight = Math.max(0, visibleBottom - visibleTop);
		const containerHeight = containerRect.height;

		const visibilityRatio = visibleHeight / containerHeight;
		if (visibilityRatio >= 0.3) {
			// Consider visible if 30% or more is showing
			visibleIndexes.push(index);
		}
	});

	// Check if any visible page is a Beilage page
	for (const index of visibleIndexes) {
		const container = window.currentPageContainers[index];
		if (container && container.id && container.id.includes("beilage-")) {
			return true;
		}
	}

	return false;
}

export function updateButtonStates() {
	const prevBtn = document.getElementById("prevPageBtn");
	const nextBtn = document.getElementById("nextPageBtn");
	const beilageBtn = document.getElementById("beilageBtn");

	if (prevBtn) {
		// Always show button, but disable when at first page
		prevBtn.style.display = "flex";
		if (window.currentActiveIndex <= 0) {
			prevBtn.disabled = true;
			prevBtn.classList.add("opacity-50", "cursor-not-allowed");
			prevBtn.classList.remove("hover:bg-gray-200");
		} else {
			prevBtn.disabled = false;
			prevBtn.classList.remove("opacity-50", "cursor-not-allowed");
			prevBtn.classList.add("hover:bg-gray-200");
		}
	}

	if (nextBtn) {
		// Always show button, but disable when at last page
		nextBtn.style.display = "flex";
		if (window.currentActiveIndex >= window.currentPageContainers.length - 1) {
			nextBtn.disabled = true;
			nextBtn.classList.add("opacity-50", "cursor-not-allowed");
			nextBtn.classList.remove("hover:bg-gray-200");
		} else {
			nextBtn.disabled = false;
			nextBtn.classList.remove("opacity-50", "cursor-not-allowed");
			nextBtn.classList.add("hover:bg-gray-200");
		}
	}

	// Update Beilage button based on current location
	if (beilageBtn) {
		const isViewingBeilage = isCurrentlyInBeilageSection();
		const icon = beilageBtn.querySelector("i");

		if (isViewingBeilage) {
			// Show "Go to Main Issue" state - use gray styling
			beilageBtn.title = "Zur Hauptausgabe";
			beilageBtn.className =
				"w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-800 border border-gray-300 transition-colors duration-200 flex items-center justify-center cursor-pointer";
			if (icon) {
				icon.className = "ri-file-text-line text-lg lg:text-xl";
			}
		} else {
			// Show "Go to Beilage" state - use amber styling
			beilageBtn.title = "Zu Beilage";
			beilageBtn.className =
				"w-14 h-10 lg:w-16 lg:h-12 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 hover:text-amber-800 border border-amber-300 transition-colors duration-200 flex items-center justify-center cursor-pointer";
			if (icon) {
				icon.className = "ri-attachment-line text-lg lg:text-xl";
			}
		}
	}
}

// Share and citation functions
export function shareCurrentPage() {
	const button = document.getElementById("shareLinkBtn");

	// Get current page information
	let pageInfo = "";

	// Try to get the currently visible page number from active containers
	if (
		window.currentActiveIndex !== undefined &&
		window.currentPageContainers &&
		window.currentPageContainers[window.currentActiveIndex]
	) {
		const activeContainer = window.currentPageContainers[window.currentActiveIndex];
		const pageElement = activeContainer.querySelector("[data-page]");
		if (pageElement) {
			const pageNumber = pageElement.getAttribute("data-page");
			pageInfo = `/${pageNumber}`;
		}
	}

	// Construct the shareable URL
	const currentUrl = window.location.origin + window.location.pathname + pageInfo;

	// Try to use Web Share API if available (mobile browsers)
	if (navigator.share) {
		navigator
			.share({
				title: document.title,
				url: currentUrl,
			})
			.catch((err) => {
				// Fallback to clipboard
				copyToClipboard(currentUrl, button);
			});
	} else {
		// Fallback: copy to clipboard
		copyToClipboard(currentUrl, button);
	}
}

function copyToClipboard(text, button) {
	if (navigator.clipboard) {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				showSimplePopup(button, "Link kopiert!");
			})
			.catch((err) => {
				showSimplePopup(button, "Kopieren fehlgeschlagen");
			});
	} else {
		// Fallback for older browsers
		const textarea = document.createElement("textarea");
		textarea.value = text;
		document.body.appendChild(textarea);
		textarea.select();
		try {
			const successful = document.execCommand("copy");
			showSimplePopup(button, successful ? "Link kopiert!" : "Kopieren fehlgeschlagen");
		} catch (err) {
			showSimplePopup(button, "Kopieren fehlgeschlagen");
		} finally {
			document.body.removeChild(textarea);
		}
	}
}

export function generateCitation() {
	const button = document.getElementById("citationBtn");

	// Get current page and issue information
	const issueInfo = document.title || "KGPZ";

	// Use clean URL without hash fragments
	let cleanUrl = window.location.origin + window.location.pathname;

	// Remove any hash fragments that might still exist
	if (cleanUrl.includes("#")) {
		cleanUrl = cleanUrl.split("#")[0];
	}

	// Basic citation format (can be expanded later)
	const currentDate = new Date().toLocaleDateString("de-DE");
	const citation = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${issueInfo}. Digital verfügbar unter: ${cleanUrl} (Zugriff: ${currentDate}).`;

	// Copy to clipboard
	if (navigator.clipboard) {
		navigator.clipboard
			.writeText(citation)
			.then(() => {
				showSimplePopup(button, "Zitation kopiert!");
			})
			.catch((err) => {
				showSimplePopup(button, "Kopieren fehlgeschlagen");
			});
	} else {
		// Fallback for older browsers
		const textarea = document.createElement("textarea");
		textarea.value = citation;
		document.body.appendChild(textarea);
		textarea.select();
		try {
			const successful = document.execCommand("copy");
			showSimplePopup(button, successful ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
		} catch (err) {
			showSimplePopup(button, "Kopieren fehlgeschlagen");
		} finally {
			document.body.removeChild(textarea);
		}
	}
}

function showSimplePopup(button, message) {
	// Remove any existing popup
	const existingPopup = document.querySelector(".simple-popup");
	if (existingPopup) {
		existingPopup.remove();
	}

	// Create popup element
	const popup = document.createElement("div");
	popup.className = "simple-popup";
	popup.textContent = message;

	// Style the popup
	popup.style.cssText = `
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

	// Position popup next to button
	const buttonRect = button.getBoundingClientRect();
	const viewportHeight = window.innerHeight;
	const viewportWidth = window.innerWidth;

	// Calculate position relative to viewport (since we're using fixed positioning)
	let left = buttonRect.left - 10;
	let top = buttonRect.bottom + 8;

	// Ensure popup doesn't go off-screen
	const popupWidth = 120; // Estimated popup width
	const popupHeight = 32; // Estimated popup height

	// Adjust horizontal position if too far right
	if (left + popupWidth > viewportWidth) {
		left = buttonRect.right - popupWidth + 10;
	}

	// Adjust vertical position if too far down (show above button instead)
	if (top + popupHeight > viewportHeight) {
		top = buttonRect.top - popupHeight - 8;
	}

	popup.style.left = Math.max(5, left) + "px";
	popup.style.top = Math.max(5, top) + "px";

	// Add to page
	document.body.appendChild(popup);

	// Fade in
	setTimeout(() => {
		popup.style.opacity = "1";
	}, 10);

	// Auto-remove after 2 seconds
	setTimeout(() => {
		popup.style.opacity = "0";
		setTimeout(() => {
			if (popup.parentNode) {
				popup.remove();
			}
		}, 200);
	}, 2000);
}

// Page-specific utilities
export function copyPagePermalink(pageNumber, button, isBeilage = false) {
	let pageUrl = "";
	if (isBeilage) {
		// For beilage pages, still use hash for now until beilage URLs are updated
		pageUrl = window.location.origin + window.location.pathname + `#beilage-1-page-${pageNumber}`;
	} else {
		// For regular pages, use the new URL format
		const pathParts = window.location.pathname.split("/");
		if (pathParts.length >= 3) {
			// Current URL format: /year/issue or /year/issue/page
			// New format: /year/issue/page
			const year = pathParts[1];
			const issue = pathParts[2];
			pageUrl = `${window.location.origin}/${year}/${issue}/${pageNumber}`;
		} else {
			// Fallback to current URL with page appended
			pageUrl = window.location.origin + window.location.pathname + `/${pageNumber}`;
		}
	}

	const currentUrl = pageUrl;

	// Copy to clipboard
	if (navigator.clipboard) {
		navigator.clipboard
			.writeText(currentUrl)
			.then(() => {
				showSimplePopup(button, "Link kopiert!");
			})
			.catch((err) => {
				showSimplePopup(button, "Kopieren fehlgeschlagen");
			});
	} else {
		// Fallback for older browsers
		const textarea = document.createElement("textarea");
		textarea.value = currentUrl;
		document.body.appendChild(textarea);
		textarea.select();
		try {
			const successful = document.execCommand("copy");
			showSimplePopup(button, successful ? "Link kopiert!" : "Kopieren fehlgeschlagen");
		} catch (err) {
			showSimplePopup(button, "Kopieren fehlgeschlagen");
		} finally {
			document.body.removeChild(textarea);
		}
	}
}

export function generatePageCitation(pageNumber, button) {
	// Get current issue information
	const issueInfo = document.title || "KGPZ";

	// Generate page URL in new format
	const pathParts = window.location.pathname.split("/");
	let pageUrl;
	if (pathParts.length >= 3) {
		const year = pathParts[1];
		const issue = pathParts[2];
		pageUrl = `${window.location.origin}/${year}/${issue}/${pageNumber}`;
	} else {
		pageUrl = `${window.location.origin}${window.location.pathname}/${pageNumber}`;
	}

	const currentUrl = pageUrl;

	// Basic citation format for specific page
	const currentDate = new Date().toLocaleDateString("de-DE");
	const citation = `Königsberger Gelehrte und Politische Zeitung (KGPZ). ${issueInfo}, Seite ${pageNumber}. Digital verfügbar unter: ${currentUrl} (Zugriff: ${currentDate}).`;

	// Copy to clipboard
	if (navigator.clipboard) {
		navigator.clipboard
			.writeText(citation)
			.then(() => {
				showSimplePopup(button, "Zitation kopiert!");
			})
			.catch((err) => {
				showSimplePopup(button, "Kopieren fehlgeschlagen");
			});
	} else {
		// Fallback for older browsers
		const textarea = document.createElement("textarea");
		textarea.value = citation;
		document.body.appendChild(textarea);
		textarea.select();
		try {
			const successful = document.execCommand("copy");
			showSimplePopup(button, successful ? "Zitation kopiert!" : "Kopieren fehlgeschlagen");
		} catch (err) {
			showSimplePopup(button, "Kopieren fehlgeschlagen");
		} finally {
			document.body.removeChild(textarea);
		}
	}
}

// Initialize newspaper layout functionality
export function initializeNewspaperLayout() {
	// Initialize page tracking
	initializePageTracking();

	// Set up scroll handler
	window.addEventListener("scroll", function () {
		clearTimeout(window.scrollTimeout);
		window.scrollTimeout = setTimeout(() => {
			updateButtonStates(); // Update button states including Beilage toggle
		}, 50);
	});

	// Set up keyboard shortcuts
	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape") {
			closeModal();
		}
	});
}