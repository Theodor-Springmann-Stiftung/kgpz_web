import "./site.css";

const ATTR_XSLT_ONLOAD = "script[xslt-onload]";
const ATTR_XSLT_TEMPLATE = "xslt-template";
const ATTR_XSLT_STATE = "xslt-transformed";

const xslt_processors = new Map();

function setup_xslt() {
	let els = htmx.findAll(ATTR_XSLT_ONLOAD);
	for (let element of els) {
		transform_xslt(element);
	}
}

function transform_xslt(element) {
	if (
		element.getAttribute(ATTR_XSLT_STATE) === "true" ||
		!element.hasAttribute(ATTR_XSLT_TEMPLATE)
	) {
		return;
	}

	let templateId = "#" + element.getAttribute(ATTR_XSLT_TEMPLATE);
	let processor = xslt_processors.get(templateId);
	if (!processor) {
		let template = htmx.find(templateId);
		if (template) {
			let content = template.innerHTML
				? new DOMParser().parseFromString(template.innerHTML, "application/xml")
				: template.contentDocument;
			processor = new XSLTProcessor();
			processor.importStylesheet(content);
			xslt_processors.set(templateId, processor);
		} else {
			throw new Error("Unknown XSLT template: " + templateId);
		}
	}

	let data = new DOMParser().parseFromString(element.innerHTML, "application/xml");
	let frag = processor.transformToFragment(data, document);
	let s = new XMLSerializer().serializeToString(frag);
	element.outerHTML = s;
}

function setup_templates() {
	let templates = document.querySelectorAll("template[simple]");
	templates.forEach((template) => {
		let templateId = template.getAttribute("id");
		let templateContent = template.content;

		customElements.define(
			templateId,
			class extends HTMLElement {
				constructor() {
					super();
					this.appendChild(templateContent.cloneNode(true));
					this.slots = this.querySelectorAll("slot");
				}

				connectedCallback() {
					let toremove = [];
					this.slots.forEach((tslot) => {
						let slotName = tslot.getAttribute("name");
						let slotContent = this.querySelector(`[slot="${slotName}"]`);
						if (slotContent) {
							tslot.replaceWith(slotContent.cloneNode(true));
							toremove.push(slotContent);
						}
					});
					toremove.forEach((element) => {
						element.remove();
					});
				}
			},
		);
	});
}

// ===========================
// NEWSPAPER LAYOUT FUNCTIONS
// ===========================

// Global variables for state management
window.highlightObserver = window.highlightObserver || null;
window.currentPageContainers = window.currentPageContainers || [];
window.currentActiveIndex = window.currentActiveIndex || 0;
window.pageObserver = window.pageObserver || null;
window.scrollTimeout = window.scrollTimeout || null;

// Page highlighting functionality
function initializePageHighlighting() {
	// Clean up existing observer
	if (window.highlightObserver) {
		window.highlightObserver.disconnect();
		window.highlightObserver = null;
	}

	// Get all page containers
	const pageContainers = document.querySelectorAll(".newspaper-page-container");

	// Set up intersection observer for active page tracking
	window.highlightObserver = new IntersectionObserver(
		(entries) => {
			checkAndHighlightVisiblePages();
		},
		{
			rootMargin: "-20% 0px -70% 0px",
		},
	);

	// Observe all page containers
	pageContainers.forEach((container) => {
		window.highlightObserver.observe(container);
	});
}

function checkAndHighlightVisiblePages() {
	const visiblePageNumbers = [];
	const allPageContainers = document.querySelectorAll(".newspaper-page-container");

	// Find visible page numbers
	allPageContainers.forEach((container) => {
		const containerRect = container.getBoundingClientRect();
		const viewportHeight = window.innerHeight;

		const visibleTop = Math.max(containerRect.top, 0);
		const visibleBottom = Math.min(containerRect.bottom, viewportHeight);
		const visibleHeight = Math.max(0, visibleBottom - visibleTop);
		const containerHeight = containerRect.height;

		const visibilityRatio = visibleHeight / containerHeight;
		const isVisible = visibilityRatio >= 0.5;

		const pageImg = container.querySelector("img[data-page]");
		const pageNumber = pageImg ? pageImg.getAttribute("data-page") : "unknown";

		if (isVisible && pageImg && pageNumber && !visiblePageNumbers.includes(pageNumber)) {
			visiblePageNumbers.push(pageNumber);
		}
	});

	// Show continuations only for visible pages
	showContinuationsForVisiblePages(visiblePageNumbers);

	// Highlight visible pages
	if (visiblePageNumbers.length > 0) {
		markCurrentPagesInInhaltsverzeichnis(visiblePageNumbers);
	}
}

function showContinuationsForVisiblePages(visiblePageNumbers) {
	// Hide all continuation entries by default
	document.querySelectorAll(".continuation-entry").forEach((entry) => {
		entry.style.display = "none";
	});

	// Show continuation entries only for visible pages
	visiblePageNumbers.forEach((pageNumber) => {
		const pageEntry = document.querySelector(`[data-page-container="${pageNumber}"]`);
		if (pageEntry) {
			const continuationEntries = pageEntry.querySelectorAll(".continuation-entry");
			continuationEntries.forEach((entry) => {
				entry.style.display = "";
			});
		}
	});

	// Update work titles based on highlighted state
	updateWorkTitles(visiblePageNumbers);

	// Update page entry visibility after showing/hiding continuations
	updatePageEntryVisibility();
}

function updateWorkTitles(visiblePageNumbers) {
	// Reset all work titles to short form
	document.querySelectorAll(".work-title").forEach((titleElement) => {
		const shortTitle = titleElement.getAttribute("data-short-title");
		if (shortTitle) {
			titleElement.textContent = shortTitle;
		}
	});

	// Update work titles to full form for highlighted pages
	visiblePageNumbers.forEach((pageNumber) => {
		const pageEntry = document.querySelector(`[data-page-container="${pageNumber}"]`);
		if (pageEntry) {
			const workTitles = pageEntry.querySelectorAll(".work-title");
			workTitles.forEach((titleElement) => {
				const fullTitle = titleElement.getAttribute("data-full-title");
				if (fullTitle && fullTitle !== titleElement.getAttribute("data-short-title")) {
					titleElement.textContent = fullTitle;
				}
			});
		}
	});
}

function updatePageEntryVisibility() {
	// Check each page entry to see if it has any visible content
	document.querySelectorAll(".page-entry").forEach((pageEntry) => {
		const allEntries = pageEntry.querySelectorAll(".inhalts-entry");
		let hasVisibleContent = false;

		// Check if any entry is visible
		allEntries.forEach((entry) => {
			const computedStyle = window.getComputedStyle(entry);
			if (computedStyle.display !== "none") {
				hasVisibleContent = true;
			}
		});

		// Hide the entire page entry if it has no visible content
		if (hasVisibleContent) {
			pageEntry.style.display = "";
		} else {
			pageEntry.style.display = "none";
		}
	});
}

function markCurrentPageInInhaltsverzeichnis(pageNumber) {
	markCurrentPagesInInhaltsverzeichnis([pageNumber]);
}

function markCurrentPagesInInhaltsverzeichnis(pageNumbers) {
	console.log("markCurrentPagesInInhaltsverzeichnis called with:", pageNumbers);

	// Reset all page container borders to default
	document.querySelectorAll("[data-page-container]").forEach((container) => {
		if (container.hasAttribute("data-beilage")) {
			container.classList.remove("border-red-500");
			container.classList.add("border-amber-400");
		} else {
			container.classList.remove("border-red-500");
			container.classList.add("border-slate-300");
		}
	});

	// Reset all page numbers in Inhaltsverzeichnis
	document.querySelectorAll(".page-number-inhalts").forEach((pageNum) => {
		pageNum.classList.remove("text-red-600", "font-bold");
		pageNum.classList.add("text-slate-700", "font-semibold");
		pageNum.style.textDecoration = "";
		pageNum.style.pointerEvents = "";
		// Restore hover effects
		if (pageNum.classList.contains("bg-blue-50")) {
			pageNum.classList.add("hover:bg-blue-100");
		} else if (pageNum.classList.contains("bg-amber-50")) {
			pageNum.classList.add("hover:bg-amber-100");
		}
		// Keep original background colors
		if (!pageNum.classList.contains("bg-amber-50") && !pageNum.classList.contains("bg-blue-50")) {
			pageNum.classList.add("bg-blue-50");
		}
	});

	// Reset all containers and links in Inhaltsverzeichnis
	document.querySelectorAll(".inhalts-entry").forEach((container) => {
		container.classList.add("hover:bg-slate-100");
		container.style.cursor = "";
	});

	document.querySelectorAll('.inhalts-entry a[href*="/"]').forEach((link) => {
		link.classList.remove("no-underline");
		if (link.classList.contains("bg-blue-50")) {
			link.classList.add("hover:bg-blue-100");
		}
	});

	// Find and highlight the current page numbers
	const highlightedElements = [];

	pageNumbers.forEach((pageNumber) => {
		// Find the exact page entry for this page number
		const pageNumElement = document.querySelector(
			`.page-number-inhalts[data-page-number="${pageNumber}"]`,
		);

		if (pageNumElement) {
			// Highlight the page number
			pageNumElement.classList.remove("text-slate-700", "hover:bg-blue-100", "hover:bg-amber-100");
			pageNumElement.classList.add("text-red-600", "font-bold");
			pageNumElement.style.textDecoration = "none";
			pageNumElement.style.pointerEvents = "none";
			highlightedElements.push(pageNumElement);

			// Highlight the page container's left border
			const pageContainer = document.querySelector(`[data-page-container="${pageNumber}"]`);
			if (pageContainer) {
				pageContainer.classList.remove("border-slate-300", "border-amber-400");
				pageContainer.classList.add("border-red-500");
			}

			// Make links in the current page non-clickable and remove hover effects
			const parentEntry = pageNumElement.closest(".page-entry");
			if (parentEntry) {
				// Remove hover effects from the container
				const entryContainers = parentEntry.querySelectorAll(".inhalts-entry");
				entryContainers.forEach((container) => {
					container.classList.remove("hover:bg-slate-100");
					container.style.cursor = "default";
				});

				// Also handle issue reference links
				parentEntry.querySelectorAll('a[href*="/"]').forEach((link) => {
					if (link.getAttribute("aria-current") === "page") {
						link.style.textDecoration = "none";
						link.style.pointerEvents = "none";
						link.classList.add("no-underline");
						link.classList.remove("hover:bg-blue-100");
					}
				});
			}
		}
	});

	// Auto-scroll to first highlighted element if it exists
	if (highlightedElements.length > 0) {
		scrollToHighlightedPage(highlightedElements[0]);
	}

	// Also highlight page indicators
	document.querySelectorAll(".page-indicator").forEach((indicator) => {
		indicator.classList.remove("text-red-600", "font-bold");
		indicator.classList.add("text-slate-600", "font-semibold");
		// Keep original backgrounds
		if (!indicator.classList.contains("bg-amber-50")) {
			indicator.classList.add("bg-blue-50");
		}
	});

	// Highlight page indicators for all current pages
	pageNumbers.forEach((pageNumber) => {
		const pageIndicator = document.querySelector(`.page-indicator[data-page="${pageNumber}"]`);
		if (pageIndicator) {
			pageIndicator.classList.remove("text-slate-600");
			pageIndicator.classList.add("text-red-600", "font-bold");
		}
	});
}

function scrollToHighlightedPage(element) {
	// Check if the element is in a scrollable container
	const inhaltsContainer = element.closest(".lg\\:overflow-y-auto");
	if (inhaltsContainer) {
		// Calculate position
		const containerRect = inhaltsContainer.getBoundingClientRect();
		const elementRect = element.getBoundingClientRect();

		// Check if element is not fully visible
		const isAboveContainer = elementRect.top < containerRect.top;
		const isBelowContainer = elementRect.bottom > containerRect.bottom;

		if (isAboveContainer || isBelowContainer) {
			// Scroll to make element visible with some padding
			element.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}
	}
}

// Modal functions
function enlargePage(imgElement, pageNumber, isFromSpread, partNumber = null) {
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

	// Show the page in the viewer
	viewer.show(imgElement.src, imgElement.alt, pageNumber, isBeilage, targetPage, partNumber);
}

function closeModal() {
	const modal = document.getElementById("pageModal");
	modal.classList.add("hidden");
}

// Page navigation functions
function initializePageTracking() {
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

function scrollToPreviousPage() {
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
				behavior: "smooth",
				block: "start",
			});

			// Update button states after a brief delay to let intersection observer catch up
			setTimeout(() => {
				updateButtonStates();
			}, 100);
		}
	}
}

function scrollToNextPage() {
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
				behavior: "smooth",
				block: "start",
			});

			// Update button states after a brief delay to let intersection observer catch up
			setTimeout(() => {
				updateButtonStates();
			}, 100);
		}
	}
}

function scrollToBeilage() {
	// Check if we're currently viewing a Beilage section
	const isViewingBeilage = isCurrentlyInBeilageSection();

	if (isViewingBeilage) {
		// Go back to main issue (first main page)
		const firstMainPage = document.querySelector("#newspaper-content .newspaper-page-container");
		if (firstMainPage) {
			firstMainPage.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}
	} else {
		// Go to first beilage container
		const beilageContainer = document.querySelector('[class*="border-t-2 border-amber-200"]');
		if (beilageContainer) {
			beilageContainer.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
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

function updateButtonStates() {
	const prevBtn = document.getElementById("prevPageBtn");
	const nextBtn = document.getElementById("nextPageBtn");
	const beilageBtn = document.getElementById("beilageBtn");

	if (prevBtn) {
		if (window.currentActiveIndex <= 0) {
			prevBtn.style.display = "none";
		} else {
			prevBtn.style.display = "flex";
		}
	}

	if (nextBtn) {
		if (window.currentActiveIndex >= window.currentPageContainers.length - 1) {
			nextBtn.style.display = "none";
		} else {
			nextBtn.style.display = "flex";
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
function shareCurrentPage() {
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

function generateCitation() {
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

// URL navigation functions
function scrollToPageFromURL() {
	let pageNumber = "";
	let targetContainer = null;

	// Check if URL ends with a page number (e.g., /1768/42/166)
	const pathParts = window.location.pathname.split("/");
	if (pathParts.length >= 4 && !isNaN(pathParts[pathParts.length - 1])) {
		pageNumber = pathParts[pathParts.length - 1];

		// Try to find exact page container first
		targetContainer = document.getElementById(`page-${pageNumber}`);

		// If not found, try to find container that contains this page
		if (!targetContainer) {
			// Look for double-spread containers that contain this page
			const containers = document.querySelectorAll(".newspaper-page-container[data-pages]");
			for (const container of containers) {
				const pages = container.getAttribute("data-pages");
				if (pages && pages.split(",").includes(pageNumber)) {
					targetContainer = container;
					break;
				}
			}
		}

		// If still not found, try beilage containers
		if (!targetContainer) {
			targetContainer =
				document.getElementById(`beilage-1-page-${pageNumber}`) ||
				document.getElementById(`beilage-2-page-${pageNumber}`) ||
				document.querySelector(`[id*="beilage"][id*="page-${pageNumber}"]`);
		}
	}

	if (targetContainer && pageNumber) {
		setTimeout(() => {
			targetContainer.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});

			// Highlight the specific page in the table of contents
			markCurrentPageInInhaltsverzeichnis(pageNumber);
		}, 300);
	}
}

// Page-specific utilities
function copyPagePermalink(pageNumber, button, isBeilage = false) {
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

function generatePageCitation(pageNumber, button) {
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

// Initialize scrollspy functionality for author/agent pages
function initializeScrollspy() {
	// Clean up any existing scrollspy
	cleanupScrollspy();

	const sections = document.querySelectorAll('.author-section');
	const navLinks = document.querySelectorAll('.scrollspy-link');

	if (sections.length === 0 || navLinks.length === 0) {
		return;
	}

	function updateActiveLink() {
		const visibleSections = [];
		const viewportTop = window.scrollY;
		const viewportBottom = viewportTop + window.innerHeight;

		// Check which sections are fully visible (header must be completely visible)
		sections.forEach(section => {
			const sectionRect = section.getBoundingClientRect();
			const sectionTop = sectionRect.top + window.scrollY;

			// Find the header element (name, life data, professions)
			const headerElement = section.querySelector('div:first-child');
			if (headerElement) {
				const headerRect = headerElement.getBoundingClientRect();
				const headerTop = headerRect.top + window.scrollY;
				const headerBottom = headerTop + headerRect.height;

				// Check if the entire header is visible in the viewport
				const headerTopVisible = headerRect.top >= 0;
				const headerBottomVisible = headerRect.bottom <= window.innerHeight;

				if (headerTopVisible && headerBottomVisible) {
					visibleSections.push(section.getAttribute('id'));
				}
			}
		});

		// Update highlighting for all visible sections
		const activeLinks = [];
		navLinks.forEach(link => {
			link.classList.remove('bg-blue-100', 'text-blue-700', 'font-medium', 'border-red-500');
			link.classList.add('text-gray-600', 'border-transparent');

			const targetId = link.getAttribute('data-target');
			if (visibleSections.includes(targetId)) {
				link.classList.remove('text-gray-600', 'border-transparent');
				link.classList.add('bg-blue-100', 'text-blue-700', 'font-medium', 'border-red-500');
				activeLinks.push(link);
			}
		});

		// Implement proportional scrolling to keep active links visible
		if (activeLinks.length > 0) {
			updateSidebarScroll(activeLinks);
		}
	}

	function updateSidebarScroll(activeLinks) {
		// Skip automatic scrolling during manual navigation
		if (window.scrollspyManualNavigation) return;

		const sidebar = document.getElementById('scrollspy-nav');
		if (!sidebar) return;

		// Get the first active link as reference
		const firstActiveLink = activeLinks[0];

		// Calculate the main content scroll progress
		const documentHeight = Math.max(
			document.body.scrollHeight,
			document.body.offsetHeight,
			document.documentElement.clientHeight,
			document.documentElement.scrollHeight,
			document.documentElement.offsetHeight
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
			const finalScrollPosition = (blendFactor * targetSidebarScroll) + ((1 - blendFactor) * centeredPosition);

			// Clamp to valid scroll range
			const clampedPosition = Math.max(0, Math.min(maxSidebarScroll, finalScrollPosition));

			// Apply smooth scrolling, but only if the difference is significant
			const currentScrollTop = sidebar.scrollTop;
			const scrollDifference = Math.abs(clampedPosition - currentScrollTop);

			if (scrollDifference > 10) { // Only scroll if more than 10px difference
				sidebar.scrollTo({
					top: clampedPosition,
					behavior: 'smooth'
				});
			}
		}
	}

	// Store scroll handler reference for cleanup
	window.scrollspyScrollHandler = function() {
		clearTimeout(window.scrollspyTimeout);
		window.scrollspyTimeout = setTimeout(updateActiveLink, 50);
	};

	// Add scroll listener
	window.addEventListener('scroll', window.scrollspyScrollHandler);

	// Store click handlers for cleanup
	window.scrollspyClickHandlers = [];

	// Add smooth scroll on link click
	navLinks.forEach(link => {
		const clickHandler = function(e) {
			e.preventDefault();
			const target = document.getElementById(this.getAttribute('data-target'));
			if (target) {
				// Temporarily disable automatic sidebar scrolling during manual navigation
				window.scrollspyManualNavigation = true;

				target.scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});

				// Re-enable automatic scrolling after navigation completes
				setTimeout(() => {
					window.scrollspyManualNavigation = false;
				}, 1000);
			}
		};

		window.scrollspyClickHandlers.push({ link, handler: clickHandler });
		link.addEventListener('click', clickHandler);
	});

	// Initial active link update
	updateActiveLink();
}

// Cleanup scrollspy functionality
function cleanupScrollspy() {
	// Remove scroll listener
	if (window.scrollspyScrollHandler) {
		window.removeEventListener('scroll', window.scrollspyScrollHandler);
		window.scrollspyScrollHandler = null;
	}

	// Clear timeout
	if (window.scrollspyTimeout) {
		clearTimeout(window.scrollspyTimeout);
		window.scrollspyTimeout = null;
	}

	// Remove click handlers
	if (window.scrollspyClickHandlers) {
		window.scrollspyClickHandlers.forEach(({ link, handler }) => {
			link.removeEventListener('click', handler);
		});
		window.scrollspyClickHandlers = null;
	}

	// Reset manual navigation flag
	window.scrollspyManualNavigation = false;
}

// Initialize newspaper layout functionality
function initializeNewspaperLayout() {
	// Initialize page highlighting
	initializePageHighlighting();

	// Initialize page tracking
	initializePageTracking();

	// Set up scroll handler
	window.addEventListener("scroll", function () {
		clearTimeout(window.scrollTimeout);
		window.scrollTimeout = setTimeout(() => {
			checkAndHighlightVisiblePages();
			updateButtonStates(); // Update button states including Beilage toggle
		}, 50);
	});

	// Initialize URL-based page navigation
	scrollToPageFromURL();

	// Set up keyboard shortcuts
	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape") {
			closeModal();
		}
	});
}

// Export functions for global access
window.enlargePage = enlargePage;
window.closeModal = closeModal;
window.scrollToPreviousPage = scrollToPreviousPage;
window.scrollToNextPage = scrollToNextPage;
window.scrollToBeilage = scrollToBeilage;
window.shareCurrentPage = shareCurrentPage;
window.generateCitation = generateCitation;
window.copyPagePermalink = copyPagePermalink;
window.generatePageCitation = generatePageCitation;

// INFO: This is intended to be called once on website load
function setup() {
	setup_xslt();
	setup_templates();

	// Initialize newspaper layout if present
	if (document.querySelector(".newspaper-page-container")) {
		initializeNewspaperLayout();
	}

	// Initialize scrollspy if author/agent sections are present
	if (document.querySelector(".author-section")) {
		initializeScrollspy();
	}

	// Set up HTMX event handlers
	htmx.on("htmx:load", function (_) {
		// INFO: We can instead use afterSettle; and also clear the map with
		// xslt_processors.clear();
		setup_xslt();
	});


	// HTMX event handling for newspaper layout and scrollspy
	document.body.addEventListener("htmx:afterSwap", function (event) {
		setTimeout(() => {
			if (document.querySelector(".newspaper-page-container")) {
				initializeNewspaperLayout();
			}
			if (document.querySelector(".author-section")) {
				initializeScrollspy();
			}
		}, 100);
	});

	document.body.addEventListener("htmx:afterSettle", function (event) {
		setTimeout(() => {
			if (document.querySelector(".newspaper-page-container")) {
				initializeNewspaperLayout();
			}
			if (document.querySelector(".author-section")) {
				initializeScrollspy();
			}
		}, 200);
	});

	document.body.addEventListener("htmx:load", function (event) {
		setTimeout(() => {
			if (document.querySelector(".newspaper-page-container")) {
				initializeNewspaperLayout();
			}
			if (document.querySelector(".author-section")) {
				initializeScrollspy();
			}
		}, 100);
	});
}

// Single Page Viewer Web Component
class SinglePageViewer extends HTMLElement {
	constructor() {
		super();
		// No shadow DOM - use regular DOM to allow Tailwind CSS
		this.resizeObserver = null;
	}

	// Dynamically detect sidebar width in pixels
	detectSidebarWidth() {
		// Find the actual sidebar element in the current layout
		const sidebar = document.querySelector('.lg\\:w-1\\/4, .lg\\:w-1\\/3, [class*="lg:w-1/"]');

		if (sidebar) {
			const sidebarRect = sidebar.getBoundingClientRect();
			const sidebarWidth = sidebarRect.width;
			console.log("Detected sidebar width:", sidebarWidth, "px");
			return `${sidebarWidth}px`;
		}

		// Fallback: calculate based on viewport width and responsive breakpoints
		const viewportWidth = window.innerWidth;

		if (viewportWidth < 1024) {
			// Below lg breakpoint - no sidebar space needed
			return "0px";
		} else if (viewportWidth < 1280) {
			// lg breakpoint: assume 1/4 of viewport (similar to both layouts)
			return `${Math.floor(viewportWidth * 0.25)}px`;
		} else {
			// xl breakpoint: assume 1/5 of viewport (narrower on larger screens)
			return `${Math.floor(viewportWidth * 0.2)}px`;
		}
	}

	connectedCallback() {
		// Detect sidebar width dynamically
		const sidebarWidth = this.detectSidebarWidth();

		this.innerHTML = `
			<div class="fixed inset-0 z-50 flex pointer-events-none">
				<!-- Keep Inhaltsverzeichnis area empty/transparent (collapsible) -->
				<div id="sidebar-spacer" style="width: ${sidebarWidth};" class="flex-shrink-0 transition-all duration-300"></div>

				<!-- Cover the right columns with the zoomed view -->
				<div class="flex-1 bg-slate-50 overflow-auto pointer-events-auto">
					<div class="relative min-h-full flex flex-col">
						<!-- Header with page info and buttons -->
						<div class="flex items-center justify-between p-4">
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

						<!-- Image container that can scroll -->
						<div class="flex-1 flex items-center justify-center p-4 pb-8">
							<img
								id="single-page-image"
								src=""
								alt=""
								class="w-full h-auto rounded-lg shadow-2xl cursor-pointer"
								onclick="this.closest('single-page-viewer').close()"
								title="Klicken zum Schließen"
							/>
						</div>
					</div>
				</div>
			</div>
		`;

		// Set up resize observer to handle window resizing
		this.setupResizeObserver();
	}

	// Set up resize observer to dynamically update sidebar width
	setupResizeObserver() {
		// Clean up existing observer
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}

		// Create new resize observer
		this.resizeObserver = new ResizeObserver(() => {
			this.updateSidebarWidth();
		});

		// Observe window resizing by watching the document body
		this.resizeObserver.observe(document.body);
	}

	// Update sidebar width when window is resized
	updateSidebarWidth() {
		const sidebarSpacer = this.querySelector("#sidebar-spacer");
		if (sidebarSpacer && !sidebarSpacer.style.width.includes("0px")) {
			// Only update if sidebar is not collapsed (not 0px width)
			const newWidth = this.detectSidebarWidth();
			sidebarSpacer.style.width = newWidth;
			console.log("Updated sidebar width to:", newWidth);
		}
	}

	show(imgSrc, imgAlt, pageNumber, isBeilage = false, targetPage = 0, partNumber = null) {
		const img = this.querySelector("#single-page-image");
		const pageNumberSpan = this.querySelector("#page-number");
		const pageIconSpan = this.querySelector("#page-icon");
		const pageIndicator = this.querySelector("#page-indicator");

		img.src = imgSrc;
		img.alt = imgAlt;

		// Store current page info for button actions
		this.currentPageNumber = pageNumber;
		this.currentIsBeilage = isBeilage;
		this.currentPartNumber = partNumber;

		// Get issue context from document title or URL
		const issueContext = this.getIssueContext(pageNumber);

		// Set page number with issue context in the box
		pageNumberSpan.innerHTML = issueContext ? `${issueContext}, ${pageNumber}` : `${pageNumber}`;

		// Add red dot if this is the target page
		if (targetPage && pageNumber === targetPage) {
			pageNumberSpan.style.position = "relative";
			// Remove any existing red dot
			const existingDot = pageNumberSpan.querySelector(".target-page-dot");
			if (existingDot) {
				existingDot.remove();
			}
			// Add new red dot
			const redDot = document.createElement("span");
			redDot.className =
				"target-page-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10";
			redDot.title = "verlinkte Seite";
			pageNumberSpan.appendChild(redDot);
		}

		// Set page icon or part number based on view type
		if (partNumber !== null) {
			// Piece view: Show part number instead of icon
			pageIconSpan.innerHTML = `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${partNumber}. Teil</span>`;
		} else {
			// Issue view: Show icon based on position and type
			const iconType = this.determinePageIconType(pageNumber, isBeilage);
			pageIconSpan.innerHTML = this.getPageIconHTML(iconType);
		}

		// Page indicator styling is now consistent (white background)

		// Update navigation button visibility
		this.updateNavigationButtons();

		this.style.display = "block";

		// Prevent background scrolling but allow scrolling within the viewer
		document.body.style.overflow = "hidden";

		// Mark current page in Inhaltsverzeichnis
		markCurrentPageInInhaltsverzeichnis(pageNumber);
	}

	close() {
		this.style.display = "none";

		// Restore background scrolling
		document.body.style.overflow = "";
	}

	// Clean up component completely
	destroy() {
		// Clean up resize observer
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}

		// Restore background scrolling
		document.body.style.overflow = "";

		// Remove the component from DOM
		if (this.parentNode) {
			this.parentNode.removeChild(this);
		}
	}

	// Determine page icon type based on page position and whether it's beilage
	determinePageIconType(pageNumber, isBeilage) {
		// Get all page containers to determine position
		const containerSelector = isBeilage
			? '.newspaper-page-container[data-beilage="true"]'
			: ".newspaper-page-container:not([data-beilage])";
		const pageContainers = Array.from(document.querySelectorAll(containerSelector));

		// Extract page numbers and sort them
		const allPages = pageContainers
			.map((container) => {
				const pageAttr = container.getAttribute("data-page-container");
				return pageAttr ? parseInt(pageAttr) : null;
			})
			.filter((p) => p !== null)
			.sort((a, b) => a - b);

		if (allPages.length === 0) {
			return "first";
		}

		const firstPage = allPages[0];
		const lastPage = allPages[allPages.length - 1];

		// Same logic as Go determinePageIcon function
		if (pageNumber === firstPage) {
			return "first"; // Front page - normal icon
		} else if (pageNumber === lastPage) {
			return "last"; // Back page - mirrored icon
		} else {
			// For middle pages in newspaper layout
			if (pageNumber === firstPage + 1) {
				return "even"; // Page 2 - black + mirrored grey
			} else if (pageNumber === lastPage - 1) {
				return "odd"; // Page 3 - grey + black
			} else {
				// For newspapers with more than 4 pages, use alternating pattern
				if (pageNumber % 2 === 0) {
					return "even";
				} else {
					return "odd";
				}
			}
		}
	}

	// Generate page icon HTML based on type (same as Go PageIcon function)
	getPageIconHTML(iconType) {
		const baseClass = "ri-file-text-line text-lg";

		switch (iconType) {
			case "first":
				return `<i class="${baseClass} text-black"></i>`;
			case "last":
				return `<i class="${baseClass} text-black" style="transform: scaleX(-1); display: inline-block;"></i>`;
			case "even":
				return `<i class="${baseClass} text-black" style="margin-left: 2px; transform: scaleX(-1); display: inline-block;"></i><i class="${baseClass} text-slate-400"></i>`;
			case "odd":
				return `<i class="${baseClass} text-slate-400" style="margin-left: 2px; transform: scaleX(-1); display: inline-block;"></i><i class="${baseClass} text-black"></i>`;
			default:
				return `<i class="${baseClass} text-black"></i>`;
		}
	}

	// Share current page
	shareCurrentPage() {
		if (typeof copyPagePermalink === "function") {
			// Use the actual button element
			const shareBtn = this.querySelector("#share-btn");
			copyPagePermalink(this.currentPageNumber, shareBtn, this.currentIsBeilage);
		}
	}

	// Generate citation for current page
	generatePageCitation() {
		if (typeof generatePageCitation === "function") {
			// Use the actual button element
			const citeBtn = this.querySelector("#cite-btn");
			generatePageCitation(this.currentPageNumber, citeBtn);
		}
	}

	// Update navigation button visibility based on available pages
	updateNavigationButtons() {
		const prevBtn = this.querySelector("#prev-page-btn");
		const nextBtn = this.querySelector("#next-page-btn");

		const { prevPage, nextPage } = this.getAdjacentPages();

		// Enable/disable previous page button
		if (prevPage !== null) {
			prevBtn.disabled = false;
			prevBtn.className = prevBtn.className.replace("opacity-50 cursor-not-allowed", "");
			prevBtn.className = prevBtn.className.replace(
				"bg-gray-50 text-gray-400",
				"bg-gray-100 text-gray-700",
			);
		} else {
			prevBtn.disabled = true;
			if (!prevBtn.className.includes("opacity-50")) {
				prevBtn.className += " opacity-50 cursor-not-allowed";
			}
			prevBtn.className = prevBtn.className.replace(
				"bg-gray-100 text-gray-700",
				"bg-gray-50 text-gray-400",
			);
		}

		// Enable/disable next page button
		if (nextPage !== null) {
			nextBtn.disabled = false;
			nextBtn.className = nextBtn.className.replace("opacity-50 cursor-not-allowed", "");
			nextBtn.className = nextBtn.className.replace(
				"bg-gray-50 text-gray-400",
				"bg-gray-100 text-gray-700",
			);
		} else {
			nextBtn.disabled = true;
			if (!nextBtn.className.includes("opacity-50")) {
				nextBtn.className += " opacity-50 cursor-not-allowed";
			}
			nextBtn.className = nextBtn.className.replace(
				"bg-gray-100 text-gray-700",
				"bg-gray-50 text-gray-400",
			);
		}
	}

	// Get previous and next page numbers
	getAdjacentPages() {
		// Get all page containers of the same type (main or beilage)
		let containerSelector;
		if (this.currentIsBeilage) {
			containerSelector = '.newspaper-page-container[data-beilage="true"]';
		} else {
			containerSelector = ".newspaper-page-container:not([data-beilage])";
		}

		const pageContainers = Array.from(document.querySelectorAll(containerSelector));
		console.log(
			"Found containers:",
			pageContainers.length,
			"for",
			this.currentIsBeilage ? "beilage" : "main",
		);

		// Extract page numbers and sort them
		const allPages = pageContainers
			.map((container) => {
				const pageAttr = container.getAttribute("data-page-container");
				const pageNum = pageAttr ? parseInt(pageAttr) : null;
				console.log("Container page:", pageAttr, "parsed:", pageNum);
				return pageNum;
			})
			.filter((p) => p !== null)
			.sort((a, b) => a - b);

		console.log("All pages found:", allPages);
		console.log("Current page:", this.currentPageNumber);

		const currentIndex = allPages.indexOf(this.currentPageNumber);
		console.log("Current index:", currentIndex);

		let prevPage = null;
		let nextPage = null;

		if (currentIndex > 0) {
			prevPage = allPages[currentIndex - 1];
		}

		if (currentIndex < allPages.length - 1) {
			nextPage = allPages[currentIndex + 1];
		}

		console.log("Adjacent pages - prev:", prevPage, "next:", nextPage);
		return { prevPage, nextPage };
	}

	// Navigate to previous page
	goToPreviousPage() {
		const { prevPage } = this.getAdjacentPages();
		if (prevPage !== null) {
			this.navigateToPage(prevPage);
		}
	}

	// Navigate to next page
	goToNextPage() {
		const { nextPage } = this.getAdjacentPages();
		if (nextPage !== null) {
			this.navigateToPage(nextPage);
		}
	}

	// Navigate to a specific page
	navigateToPage(pageNumber) {
		// Find the image element for the target page
		const containerSelector = this.currentIsBeilage
			? '.newspaper-page-container[data-beilage="true"]'
			: ".newspaper-page-container:not([data-beilage])";
		const targetContainer = document.querySelector(
			`${containerSelector}[data-page-container="${pageNumber}"]`,
		);

		if (targetContainer) {
			const imgElement = targetContainer.querySelector(".newspaper-page-image");
			if (imgElement) {
				// Determine part number for piece view
				let newPartNumber = null;
				if (this.currentPartNumber !== null) {
					// We're in piece view, try to find the part number for the new page
					newPartNumber = this.getPartNumberForPage(pageNumber);
				}

				// Update the current view with the new page
				this.show(
					imgElement.src,
					imgElement.alt,
					pageNumber,
					this.currentIsBeilage,
					0,
					newPartNumber,
				);
			}
		}
	}

	// Get part number for a specific page in piece view
	getPartNumberForPage(pageNumber) {
		// Try to find the part number from the page container in piece view
		const pageContainer = document.querySelector(`[data-page-container="${pageNumber}"]`);
		if (pageContainer) {
			const partNumberElement = pageContainer.querySelector(".part-number");
			if (partNumberElement) {
				// Extract just the number from "X. Teil" format
				const match = partNumberElement.textContent.match(/(\d+)\./);
				if (match) {
					return parseInt(match[1]);
				}
			}
		}

		// Fallback: if we can't find it, return null to show icon instead
		return null;
	}

	// Toggle sidebar visibility
	toggleSidebar() {
		const sidebarSpacer = this.querySelector("#sidebar-spacer");
		const toggleBtn = this.querySelector("#sidebar-toggle-btn");
		const toggleIcon = toggleBtn.querySelector("i");

		// Check if sidebar is currently collapsed by looking at width
		const currentWidth = sidebarSpacer.style.width;
		const isCollapsed = currentWidth === "0px" || currentWidth === "0";

		console.log("Current state - isCollapsed:", isCollapsed);
		console.log("Current width:", currentWidth);

		if (isCollapsed) {
			// Sidebar is collapsed, expand it
			const fullWidth = this.detectSidebarWidth();
			sidebarSpacer.style.width = fullWidth;

			// Update button to normal state (sidebar visible)
			toggleBtn.className =
				"w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer";
			toggleIcon.className = "ri-sidebar-fold-line text-lg font-bold";
			toggleBtn.title = "Inhaltsverzeichnis ausblenden";
			console.log("Expanding sidebar to:", fullWidth);
		} else {
			// Sidebar is expanded, collapse it
			sidebarSpacer.style.width = "0px";

			// Update button to active state (sidebar hidden - orange highlight)
			toggleBtn.className =
				"w-10 h-10 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer";
			toggleIcon.className = "ri-sidebar-unfold-line text-lg font-bold";
			toggleBtn.title = "Inhaltsverzeichnis einblenden";
			console.log("Collapsing sidebar");
		}

		console.log("New width:", sidebarSpacer.style.width);
	}

	// Extract issue context from document title, URL, or page container
	getIssueContext(pageNumber) {
		// Determine if we're in a piece view (beitrag) or issue view (ausgabe)
		const path = window.location.pathname;
		const isPieceView = path.includes("/beitrag/");

		if (isPieceView) {
			// For piece view: Return full format "1765 Nr. 2"
			// Try to get context from page container first (for piece view)
			const pageContainer = document.querySelector(`[data-page-container="${pageNumber}"]`);
			if (pageContainer) {
				// Look for existing page indicator with context
				const pageIndicator = pageContainer.querySelector(".page-indicator");
				if (pageIndicator) {
					const text = pageIndicator.textContent.trim();
					// Extract full date and issue from text like "3.7.1767 Nr. 53, 213"
					const fullDateMatch = text.match(/(\d{1,2}\.\d{1,2}\.\d{4}\s+Nr\.\s+\d+)/);
					if (fullDateMatch) {
						return fullDateMatch[1];
					}
					// Fallback: Extract year and issue from text like "1768 Nr. 20, 79"
					const yearMatch = text.match(/(\d{4})\s+Nr\.\s+(\d+)/);
					if (yearMatch) {
						return `${yearMatch[1]} Nr. ${yearMatch[2]}`;
					}
				}
			}

			// Fallback: Try to extract from document title
			const title = document.title;
			const titleMatch = title.match(/(\d{4}).*Nr\.\s*(\d+)/);
			if (titleMatch) {
				return `${titleMatch[1]} Nr. ${titleMatch[2]}`;
			}
		} else {
			// For issue view: Return just empty string (page number only)
			return "";
		}

		// Final fallback: Try to extract from URL path
		const urlMatch = path.match(/\/(\d{4})\/(\d+)/);
		if (urlMatch) {
			return isPieceView ? `${urlMatch[1]} Nr. ${urlMatch[2]}` : "";
		}

		// Fallback - try to get from any visible page context
		const anyPageIndicator = document.querySelector(".page-indicator");
		if (anyPageIndicator) {
			const text = anyPageIndicator.textContent.trim();
			const match = text.match(/(\d{4})\s+Nr\.\s+(\d+)/);
			if (match) {
				return `${match[1]} Nr. ${match[2]}`;
			}
		}

		// Ultimate fallback
		return "KGPZ";
	}
}

// Register the web component
customElements.define("single-page-viewer", SinglePageViewer);

// Clean up single page viewer on HTMX navigation
document.body.addEventListener("htmx:beforeRequest", function (event) {
	// Find any active single page viewer
	const viewer = document.querySelector("single-page-viewer");
	if (viewer && viewer.style.display !== "none") {
		console.log("Cleaning up single page viewer before HTMX navigation");
		viewer.destroy();
	}

	// Clean up scrollspy before navigating
	cleanupScrollspy();
});

// Also clean up on page unload as fallback
window.addEventListener("beforeunload", function () {
	const viewer = document.querySelector("single-page-viewer");
	if (viewer) {
		viewer.destroy();
	}
});

export { setup };
