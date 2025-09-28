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
		this.searchInput = this.querySelector("#places-search");
		if (this.searchInput) {
			this.searchInput.addEventListener("input", this.handleSearchInput.bind(this));
		}
	}

	cleanupEventListeners() {
		if (this.searchInput) {
			this.searchInput.removeEventListener("input", this.handleSearchInput.bind(this));
		}
	}

	initializePlaceCards() {
		// Find all place cards and the count element
		const container = this.closest(".bg-white") || document;
		this.placeCards = Array.from(container.querySelectorAll("[data-place-name]"));
		this.countElement = container.querySelector("[data-places-count]");

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

		this.placeCards.forEach((card) => {
			const placeName = card.getAttribute("data-place-name")?.toLowerCase() || "";
			const modernName = card.getAttribute("data-modern-name")?.toLowerCase() || "";

			// Check if search term matches either the place name or modern name
			const isMatch =
				searchTerm === "" ||
				placeName.includes(normalizedSearch) ||
				modernName.includes(normalizedSearch);

			if (isMatch) {
				card.style.display = "";
				visibleCount++;
			} else {
				card.style.display = "none";
			}
		});

		// Update the count display
		this.updateCountDisplay(visibleCount, searchTerm);
	}

	updateCountDisplay(visibleCount, searchTerm) {
		if (!this.countElement) return;

		if (searchTerm === "") {
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

		// Bind event handlers to maintain consistent references
		this.boundHandleClick = this.handleClick.bind(this);
		this.boundHandleMapClick = this.handleMapClick.bind(this);
		this.boundHandleHeadingHover = this.handleHeadingHover.bind(this);
		this.boundHandleHeadingLeave = this.handleHeadingLeave.bind(this);
	}

	connectedCallback() {
		this.setupAccordion();
		this.setupEventListeners();
		this.updateBorders();
		this.setupMapEventListeners();
		this.setupHoverEvents();
	}

	disconnectedCallback() {
		this.cleanupEventListeners();
		this.cleanupMapEventListeners();
	}

	cleanupMapEventListeners() {
		// Clean up map event listeners
		document.removeEventListener("place-map-clicked", this.boundHandleMapClick);

		// Clean up hover event listeners
		this.removeEventListener("mouseenter", this.boundHandleHeadingHover);
		this.removeEventListener("mouseleave", this.boundHandleHeadingLeave);
	}

	setupAccordion() {
		// Add chevron icon if not already present
		if (!this.querySelector(".accordion-chevron")) {
			const chevron = document.createElement("i");
			chevron.className =
				"ri-chevron-down-line accordion-chevron transition-transform duration-200 text-slate-400";

			// Find the badge and insert chevron before it
			const badge = this.querySelector('[class*="bg-slate-100"]');
			if (badge) {
				badge.parentNode.insertBefore(chevron, badge);
			}
		}

		// Create content container if not exists
		if (!this.querySelector("[data-content]")) {
			const placeId = this.getAttribute("data-place-id");
			const contentContainer = document.createElement("div");
			contentContainer.setAttribute("data-content", "");
			contentContainer.className =
				"accordion-content overflow-hidden transition-all duration-300 max-h-0";

			// Add HTMX attributes to override body defaults
			contentContainer.setAttribute("hx-get", `/ort/fragment/${placeId}`);
			contentContainer.setAttribute("hx-trigger", "load-content");
			contentContainer.setAttribute("hx-swap", "innerHTML");
			contentContainer.setAttribute("hx-target", "this");
			contentContainer.setAttribute("hx-select", ".place-fragment-content");
			contentContainer.setAttribute("hx-boost", "false"); // Override body's hx-boost="true"

			this.appendChild(contentContainer);
		}
	}

	setupEventListeners() {
		// Add click listener to the entire component
		this.addEventListener("click", this.boundHandleClick);
	}

	cleanupEventListeners() {
		this.removeEventListener("click", this.boundHandleClick);
	}

	setupMapEventListeners() {
		// Listen for map click events
		document.addEventListener("place-map-clicked", this.boundHandleMapClick);
	}

	setupHoverEvents() {
		// Add hover listeners to the entire accordion element (including expanded content)
		this.addEventListener("mouseenter", this.boundHandleHeadingHover);
		this.addEventListener("mouseleave", this.boundHandleHeadingLeave);
	}

	handleHeadingHover() {
		const placeId = this.getAttribute("data-place-id");
		if (placeId) {
			// Emit event to show tooltip on map
			const showTooltipEvent = new CustomEvent("place-heading-hover", {
				detail: { placeId, action: "show" },
				bubbles: true,
			});
			document.dispatchEvent(showTooltipEvent);
		}
	}

	handleHeadingLeave() {
		const placeId = this.getAttribute("data-place-id");
		if (placeId) {
			// Emit event to hide tooltip on map
			const hideTooltipEvent = new CustomEvent("place-heading-hover", {
				detail: { placeId, action: "hide" },
				bubbles: true,
			});
			document.dispatchEvent(hideTooltipEvent);
		}
	}

	handleMapClick(event) {
		const clickedPlaceId = event.detail.placeId;
		const myPlaceId = this.getAttribute("data-place-id");

		// If this accordion matches the clicked place, expand it
		if (clickedPlaceId === myPlaceId && !this.isExpanded) {
			// Add a small delay to allow scrolling to complete first
			setTimeout(() => {
				this.expand();
			}, 800); // Delay matches scroll animation + highlight effect
		}
	}

	handleClick(event) {
		// Only handle clicks on the place name area, not on expanded content
		const contentContainer = this.querySelector("[data-content]");
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
		this.updateBorders();

		const contentContainer = this.querySelector("[data-content]");
		if (!contentContainer) return;

		// Load content if not already loaded
		if (!this.hasLoaded) {
			this.loadContent();
		} else {
			// Just show existing content
			contentContainer.style.maxHeight = contentContainer.scrollHeight + "px";
		}
	}

	collapse() {
		this.isExpanded = false;
		this.updateChevron();
		this.updateBorders();

		const contentContainer = this.querySelector("[data-content]");
		if (contentContainer) {
			contentContainer.style.maxHeight = "0px";
		}
	}

	loadContent() {
		this.isLoading = true;
		const contentContainer = this.querySelector("[data-content]");

		// Show loading state
		contentContainer.innerHTML = '<div class="p-4 text-center text-slate-500">Lädt...</div>';
		contentContainer.style.maxHeight = contentContainer.scrollHeight + "px";

		// Set up event listeners for HTMX events
		const handleAfterRequest = () => {
			this.hasLoaded = true;
			this.isLoading = false;
			// Adjust height after content loads
			setTimeout(() => {
				contentContainer.style.maxHeight = contentContainer.scrollHeight + "px";
			}, 10);
			contentContainer.removeEventListener("htmx:afterRequest", handleAfterRequest);
		};

		const handleResponseError = () => {
			this.isLoading = false;
			contentContainer.innerHTML =
				'<div class="p-4 text-center text-red-500">Fehler beim Laden</div>';
			contentContainer.removeEventListener("htmx:responseError", handleResponseError);
		};

		contentContainer.addEventListener("htmx:afterRequest", handleAfterRequest);
		contentContainer.addEventListener("htmx:responseError", handleResponseError);

		// Trigger the HTMX request
		htmx.trigger(contentContainer, "load-content");
	}

	updateChevron() {
		const chevron = this.querySelector(".accordion-chevron");
		if (chevron) {
			if (this.isExpanded) {
				chevron.style.transform = "rotate(180deg)";
			} else {
				chevron.style.transform = "rotate(0deg)";
			}
		}
	}

	updateBorders() {
		if (this.isExpanded) {
			// When expanded: remove border from header, add border to whole component
			this.classList.add("border-b", "border-slate-100");
		} else {
			// When collapsed: add border to component (for separation between items)
			this.classList.add("border-b", "border-slate-100");
		}

		// Remove border from last item if it's the last child
		const isLastChild = !this.nextElementSibling;
		if (isLastChild) {
			this.classList.remove("border-b");
		}
	}
}

/**
 * Places Map Web Component
 * Embeds an SVG map with plotted geographical places
 */
export class PlacesMap extends HTMLElement {
	constructor() {
		super();
		this.places = [];
		this.mapElement = null;
		this.pointsContainer = null;
		this.intersectionObserver = null;
		this.mapPoints = new Map(); // Map of placeId -> point element
		this.tooltip = null;

		// New tooltip system properties
		this.showTimeout = null;
		this.hideTimeout = null;
		this.isTooltipVisible = false;

		// Simple place ID tracking
		this.currentHoveredPlaceId = "";

		// Bind event handlers to maintain consistent references
		this.boundHandleHeadingHoverEvent = this.handleHeadingHoverEvent.bind(this);
	}

	connectedCallback() {
		this.parseData();
		this.render();
		this.initializeMap();
		// Delay scrollspy initialization to ensure DOM is ready
		setTimeout(() => {
			this.initializeScrollspy();
		}, 200);
		this.setupHeadingHoverListener();
	}

	parseData() {
		try {
			const placesData = this.dataset.places;
			if (placesData) {
				this.places = JSON.parse(placesData);
			}
		} catch (error) {
			console.error("Failed to parse places data:", error);
			this.places = [];
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
		`;

		this.mapElement = this.querySelector(".map-container");
		this.pointsContainer = this.querySelector(".points-container");
		this.tooltip = this.querySelector(".map-tooltip");
	}

	initializeMap() {
		if (!this.places.length || !this.pointsContainer) {
			return;
		}

		// Map extent constants
		const MAP_EXTENT_METERS = { xmin: 2555000, ymin: 1350000, xmax: 7405000, ymax: 5500000 };
		const PROJECTION_CENTER = { lon: 10, lat: 52 };

		// Convert lat/lng to % calculation
		const convertLatLngToPercent = (lat, lng) => {
			const R = 6371000;
			const FE = 4321000;
			const FN = 3210000;
			const lon_0_rad = (PROJECTION_CENTER.lon * Math.PI) / 180;
			const lat_0_rad = (PROJECTION_CENTER.lat * Math.PI) / 180;
			const lon_rad = (lng * Math.PI) / 180;
			const lat_rad = (lat * Math.PI) / 180;
			const k_prime = Math.sqrt(
				2 /
					(1 +
						Math.sin(lat_0_rad) * Math.sin(lat_rad) +
						Math.cos(lat_0_rad) * Math.cos(lat_rad) * Math.cos(lon_rad - lon_0_rad)),
			);
			const x_proj = R * k_prime * Math.cos(lat_rad) * Math.sin(lon_rad - lon_0_rad);
			const y_proj =
				R *
				k_prime *
				(Math.cos(lat_0_rad) * Math.sin(lat_rad) -
					Math.sin(lat_0_rad) * Math.cos(lat_rad) * Math.cos(lon_rad - lon_0_rad));
			const finalX = x_proj + FE;
			const finalY = y_proj + FN;
			const mapWidthMeters = MAP_EXTENT_METERS.xmax - MAP_EXTENT_METERS.xmin;
			const mapHeightMeters = MAP_EXTENT_METERS.ymax - MAP_EXTENT_METERS.ymin;
			const xPercent = ((finalX - MAP_EXTENT_METERS.xmin) / mapWidthMeters) * 100;
			const yPercent = ((MAP_EXTENT_METERS.ymax - finalY) / mapHeightMeters) * 100;
			return { x: xPercent, y: yPercent };
		};

		// Create points and track positions
		const pointPositions = [];
		this.places.forEach((place) => {
			if (place.lat && place.lng) {
				const lat = parseFloat(place.lat);
				const lng = parseFloat(place.lng);
				const position = convertLatLngToPercent(lat, lng);

				// Only add points that are within the visible map area
				if (position.x >= 0 && position.x <= 100 && position.y >= 0 && position.y <= 100) {
					pointPositions.push(position);

					const point = document.createElement("div");
					point.className = "map-point hidden";
					point.style.left = `${position.x}%`;
					point.style.top = `${position.y}%`;
					point.style.transformOrigin = "center";
					const tooltipText = `${place.name}${place.toponymName && place.toponymName !== place.name ? ` (${place.toponymName})` : ""}`;
					point.dataset.placeId = place.id;
					point.dataset.tooltipText = tooltipText;

					// Add hover and click event listeners
					point.addEventListener("mouseenter", (e) => this.showTooltip(e));
					point.addEventListener("mouseleave", () => this.hideTooltip());
					point.addEventListener("mousemove", (e) => this.updateTooltipPosition(e));
					point.addEventListener("click", (e) => this.scrollToPlace(e));

					this.pointsContainer.appendChild(point);

					// Store reference to point for scrollspy
					this.mapPoints.set(place.id, point);
				}
			}
		});

		// Auto-zoom
		if (pointPositions.length > 0) {
			this.autoZoomToPoints(pointPositions);
		}
	}

	// Calculate bounding box of all points for the auto-zoom
	autoZoomToPoints(pointPositions) {
		let minX = 100,
			maxX = 0,
			minY = 100,
			maxY = 0;
		pointPositions.forEach((pos) => {
			if (pos.x < minX) minX = pos.x;
			if (pos.x > maxX) maxX = pos.x;
			if (pos.y < minY) minY = pos.y;
			if (pos.y > maxY) maxY = pos.y;
		});

		// 5% padding
		const PADDING = 0.06;
		const width = maxX - minX;
		const height = maxY - minY;
		const paddingX = width * PADDING;
		const paddingY = height * PADDING;

		const paddedMinX = Math.max(0, minX - paddingX);
		const paddedMaxX = Math.min(100, maxX + paddingX);
		const paddedMinY = Math.max(0, minY - paddingY);
		const paddedMaxY = Math.min(100, maxY + paddingY);

		const newWidth = paddedMaxX - paddedMinX;
		const newHeight = paddedMaxY - paddedMinY;

		// Maintain 5:7 aspect ratio
		const ASPECT_RATIO = 5 / 7;
		const pointsAspectRatio = newWidth / newHeight;

		let finalViewBox = { x: paddedMinX, y: paddedMinY, width: newWidth, height: newHeight };

		if (pointsAspectRatio > ASPECT_RATIO) {
			const newTargetHeight = newWidth / ASPECT_RATIO;
			finalViewBox.y = paddedMinY - (newTargetHeight - newHeight) / 2;
			finalViewBox.height = newTargetHeight;
		} else {
			const newTargetWidth = newHeight * ASPECT_RATIO;
			finalViewBox.x = paddedMinX - (newTargetWidth - newWidth) / 2;
			finalViewBox.width = newTargetWidth;
		}

		// Apply transformation
		const scale = 100 / finalViewBox.width;
		const translateX = -finalViewBox.x;
		const translateY = -finalViewBox.y;

		const transformValue = `scale(${scale}) translate(${translateX}%, ${translateY}%)`;
		const transformWrapper = this.querySelector(".transform-wrapper");
		if (transformWrapper) {
			transformWrapper.style.transform = transformValue;
		}
	}

	initializeScrollspy() {
		// Find all place containers in the places list
		const placeContainers = document.querySelectorAll("place-accordion[data-place-id]");
		if (!placeContainers.length) return;

		// First, ensure all points start in inactive state
		this.mapPoints.forEach((point) => {
			this.setPointInactive(point);
		});

		// Create intersection observer
		this.intersectionObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const placeId = entry.target.getAttribute("data-place-id");
					const mapPoint = this.mapPoints.get(placeId);

					if (mapPoint) {
						if (entry.isIntersecting) {
							// Activate the point when place is in view
							this.setPointActive(mapPoint);
						} else {
							// Deactivate the point when place is out of view
							this.setPointInactive(mapPoint);
						}
					}
				});
			},
			{
				// Trigger when any part enters viewport - better for small elements
				threshold: 0,
				// Add some margin to trigger slightly before/after entering viewport
				rootMargin: "10px 0px",
			},
		);

		// Observe all place containers
		placeContainers.forEach((container) => {
			this.intersectionObserver.observe(container);
		});

	}

	setPointActive(point) {
		// Active state: larger, full color, full opacity, higher z-index
		point.className =
			"map-point absolute w-1.5 h-1.5 bg-red-500 border border-red-700 rounded-full shadow-md -translate-x-1/2 -translate-y-1/2 transition-all duration-300 opacity-100 saturate-100 z-20 cursor-pointer hover:w-2 hover:h-2 hover:bg-red-600 hover:z-30";
	}

	setPointInactive(point) {
		// Inactive state: small light red dots, no border
		point.className =
			"map-point absolute w-[0.18rem] h-[0.18rem] bg-white opacity-[0.7]  rounded-full shadow-sm -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-10 cursor-pointer hover:w-1.5 hover:h-1.5 hover:bg-red-400 hover:z-30 hover:opacity-[1.0]";
	}

	showTooltip(event) {
		const point = event.target;
		const tooltipText = point.dataset.tooltipText;
		const placeId = point.dataset.placeId;

		// Don't show NEW tooltip if scrolling blocked (behavior 4)
		if (this.isNewPopupBlocked(placeId)) {
			return;
		}


		if (this.tooltip && tooltipText) {
			// Set tooltip content and position
			this.tooltip.textContent = tooltipText;
			this.updateTooltipPosition(event);

			// Show immediately for map points (behavior 1)
			this.clearTimeouts();
			this.tooltip.classList.remove("opacity-0");
			this.tooltip.classList.add("opacity-100");
			this.isTooltipVisible = true;
		}
	}

	hideTooltip() {
		// Hide after 150ms delay (behavior 3)
		// NOTE: This is NOT blocked during scroll - existing popup should close when mouse leaves
		this.clearTimeouts();
		this.hideTimeout = setTimeout(() => {
			if (this.tooltip) {
				this.tooltip.classList.remove("opacity-100");
				this.tooltip.classList.add("opacity-0");
				this.isTooltipVisible = false;
			}
		}, 150);
	}

	updateTooltipPosition(event) {
		if (!this.tooltip) return;

		const mapRect = this.mapElement.getBoundingClientRect();
		const x = event.clientX - mapRect.left;
		const y = event.clientY - mapRect.top;

		// Position tooltip relative to the map container
		this.tooltip.style.left = `${x}px`;
		this.tooltip.style.top = `${y}px`;
	}

	scrollToPlace(event) {
		const placeId = event.target.dataset.placeId;
		if (!placeId) return;

		// Emit custom event for place selection
		const placeSelectedEvent = new CustomEvent("place-map-clicked", {
			detail: { placeId },
			bubbles: true,
		});
		this.dispatchEvent(placeSelectedEvent);

		// Find the corresponding place container in the list
		const placeContainer = document.querySelector(`place-accordion[data-place-id="${placeId}"]`);
		if (placeContainer) {
			// Smooth scroll to the place container
			placeContainer.scrollIntoView({
				behavior: "smooth",
				block: "center",
				inline: "nearest",
			});

			// Optional: Add a brief highlight effect
			placeContainer.style.transition = "background-color 0.3s ease";
			placeContainer.style.backgroundColor = "rgb(248 250 252)";
			setTimeout(() => {
				placeContainer.style.backgroundColor = "";
			}, 1000);
		}
	}

	setupHeadingHoverListener() {
		// Listen for heading hover events from place accordions
		document.addEventListener("place-heading-hover", this.boundHandleHeadingHoverEvent);
	}

	clearTimeouts() {
		if (this.showTimeout) {
			clearTimeout(this.showTimeout);
			this.showTimeout = null;
		}
		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout);
			this.hideTimeout = null;
		}
		if (this.scrollBlockTimeout) {
			clearTimeout(this.scrollBlockTimeout);
			this.scrollBlockTimeout = null;
		}
	}

	checkMousePositionAfterScroll() {
		// Check if mouse is currently over a place title
		if (this.currentHoveredPlaceId) {
			// Simulate a heading hover event to show the tooltip
			const showEvent = new CustomEvent("place-heading-hover", {
				detail: { placeId: this.currentHoveredPlaceId, action: "show" },
				bubbles: true,
			});
			document.dispatchEvent(showEvent);
		}
	}

	checkExistingPopupAfterScroll() {
		// Check if mouse is still over the tile that had the popup before scroll
		if (this.currentHoveredPlaceId !== this.placeIdBeforeScroll) {
			// Mouse is no longer over the original tile - hide the popup
			if (this.tooltip && this.isTooltipVisible) {
				this.tooltip.classList.remove("opacity-100");
				this.tooltip.classList.add("opacity-0");
				this.isTooltipVisible = false;
			}
		}
		// If mouse is still over the same tile, keep the popup open
	}

	isScrollBlocked() {
		// Block NEW popups during and 300ms after scrolling (behavior 4)
		const isInScrollPeriod = Date.now() - this.lastScrollTime < 300;
		return isInScrollPeriod;
	}

	isNewPopupBlocked(placeId) {
		// Block new popups, but allow existing popup to stay
		const isInScrollPeriod = Date.now() - this.lastScrollTime < 300;
		if (!isInScrollPeriod) return false;

		// Allow if this is the same popup that was visible before scroll
		return placeId !== this.placeIdBeforeScroll;
	}

	handleHeadingHoverEvent(event) {
		const { placeId, action } = event.detail;
		const mapPoint = this.mapPoints.get(placeId);

		if (!mapPoint) return;

		if (action === "show") {
			// Track the currently hovered place ID
			this.currentHoveredPlaceId = placeId;

			// Give the point a more visible highlight by making it larger immediately
			mapPoint.classList.remove("w-1", "h-1", "w-1.5", "h-1.5");
			mapPoint.classList.add("w-2.5", "h-2.5");
			mapPoint.style.zIndex = "25";

			// No tooltip when hovering over place titles - only visual feedback
		} else if (action === "hide") {
			// Clear the currently hovered place ID
			this.currentHoveredPlaceId = "";

			// Remove point highlight - restore original size based on current state
			mapPoint.classList.remove("w-2.5", "h-2.5");
			// Check if this point is currently active or inactive
			if (mapPoint.className.includes("bg-red-500")) {
				// Active point
				mapPoint.classList.add("w-1.5", "h-1.5");
			} else {
				// Inactive point
				mapPoint.classList.add("w-1", "h-1");
			}
			mapPoint.style.zIndex = ""; // Reset to default
		}
	}

	disconnectedCallback() {
		// Clean up intersection observer
		if (this.intersectionObserver) {
			this.intersectionObserver.disconnect();
			this.intersectionObserver = null;
		}

		// Clean up new tooltip timeouts
		this.clearTimeouts();

		// Clean up heading hover listener
		document.removeEventListener("place-heading-hover", this.boundHandleHeadingHoverEvent);

		// Clean up scroll listeners
		window.removeEventListener("scroll", this.boundHandleScroll);
		document.removeEventListener("scroll", this.boundHandleScroll);
	}
}

/**
 * Places Map Single Web Component
 * Embeds an SVG map with a single highlighted place
 */
export class PlacesMapSingle extends HTMLElement {
	constructor() {
		super();
		this.place = null;
		this.mapElement = null;
		this.pointsContainer = null;
		this.tooltip = null;
	}

	connectedCallback() {
		this.parseData();
		this.render();
		this.initializeMap();
	}

	parseData() {
		try {
			const placeData = this.dataset.place;
			if (placeData) {
				this.place = JSON.parse(placeData);
			}
		} catch (error) {
			console.error("Failed to parse place data:", error);
			this.place = null;
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
		`;

		this.mapElement = this.querySelector(".map-container");
		this.pointsContainer = this.querySelector(".points-container");
		this.tooltip = this.querySelector(".map-tooltip");
	}

	initializeMap() {
		if (!this.place || !this.place.lat || !this.place.lng || !this.pointsContainer) {
			return;
		}

		// Map extent constants
		const MAP_EXTENT_METERS = { xmin: 2555000, ymin: 1350000, xmax: 7405000, ymax: 5500000 };
		const PROJECTION_CENTER = { lon: 10, lat: 52 };

		// Convert lat/lng to % calculation
		const convertLatLngToPercent = (lat, lng) => {
			const R = 6371000;
			const FE = 4321000;
			const FN = 3210000;
			const lon_0_rad = (PROJECTION_CENTER.lon * Math.PI) / 180;
			const lat_0_rad = (PROJECTION_CENTER.lat * Math.PI) / 180;
			const lon_rad = (lng * Math.PI) / 180;
			const lat_rad = (lat * Math.PI) / 180;
			const k_prime = Math.sqrt(
				2 /
					(1 +
						Math.sin(lat_0_rad) * Math.sin(lat_rad) +
						Math.cos(lat_0_rad) * Math.cos(lat_rad) * Math.cos(lon_rad - lon_0_rad)),
			);
			const x_proj = R * k_prime * Math.cos(lat_rad) * Math.sin(lon_rad - lon_0_rad);
			const y_proj =
				R *
				k_prime *
				(Math.cos(lat_0_rad) * Math.sin(lat_rad) -
					Math.sin(lat_0_rad) * Math.cos(lat_rad) * Math.cos(lon_rad - lon_0_rad));
			const finalX = x_proj + FE;
			const finalY = y_proj + FN;
			const mapWidthMeters = MAP_EXTENT_METERS.xmax - MAP_EXTENT_METERS.xmin;
			const mapHeightMeters = MAP_EXTENT_METERS.ymax - MAP_EXTENT_METERS.ymin;
			const xPercent = ((finalX - MAP_EXTENT_METERS.xmin) / mapWidthMeters) * 100;
			const yPercent = ((MAP_EXTENT_METERS.ymax - finalY) / mapHeightMeters) * 100;
			return { x: xPercent, y: yPercent };
		};

		const lat = parseFloat(this.place.lat);
		const lng = parseFloat(this.place.lng);
		const position = convertLatLngToPercent(lat, lng);

		// Only add point if it's within the visible map area
		if (position.x >= 0 && position.x <= 100 && position.y >= 0 && position.y <= 100) {
			const point = document.createElement("div");
			point.style.left = `${position.x}%`;
			point.style.top = `${position.y}%`;
			point.style.transformOrigin = "center";

			// Single highlighted point - moderately sized for zoomed view
			point.className = "absolute w-2 h-2 bg-red-500 border border-red-700 rounded-full shadow-md -translate-x-1/2 -translate-y-1/2 z-20";

			const tooltipText = `${this.place.name}${this.place.toponymName && this.place.toponymName !== this.place.name ? ` (${this.place.toponymName})` : ""}`;
			point.dataset.tooltipText = tooltipText;

			// Add hover event listeners
			point.addEventListener("mouseenter", (e) => this.showTooltip(e));
			point.addEventListener("mouseleave", () => this.hideTooltip());
			point.addEventListener("mousemove", (e) => this.updateTooltipPosition(e));

			this.pointsContainer.appendChild(point);

			// Auto-zoom to the single point with some padding
			this.autoZoomToPoint(position);
		}
	}

	autoZoomToPoint(position) {
		// Create a balanced area around the point for zooming
		const PADDING = 20; // 20% padding around the point
		let minX = Math.max(0, position.x - PADDING);
		let maxX = Math.min(100, position.x + PADDING);
		let minY = Math.max(0, position.y - PADDING);
		let maxY = Math.min(100, position.y + PADDING);

		let width = maxX - minX;
		let height = maxY - minY;

		// Maintain 5:7 aspect ratio
		const ASPECT_RATIO = 5 / 7;
		const pointsAspectRatio = width / height;

		let finalViewBox = { x: minX, y: minY, width: width, height: height };

		if (pointsAspectRatio > ASPECT_RATIO) {
			const newTargetHeight = width / ASPECT_RATIO;
			finalViewBox.y = minY - (newTargetHeight - height) / 2;
			finalViewBox.height = newTargetHeight;
		} else {
			const newTargetWidth = height * ASPECT_RATIO;
			finalViewBox.x = minX - (newTargetWidth - width) / 2;
			finalViewBox.width = newTargetWidth;
		}

		// Ensure the final viewbox stays within map boundaries (0-100%)
		if (finalViewBox.x < 0) {
			finalViewBox.width += finalViewBox.x;
			finalViewBox.x = 0;
		}
		if (finalViewBox.y < 0) {
			finalViewBox.height += finalViewBox.y;
			finalViewBox.y = 0;
		}
		if (finalViewBox.x + finalViewBox.width > 100) {
			finalViewBox.width = 100 - finalViewBox.x;
		}
		if (finalViewBox.y + finalViewBox.height > 100) {
			finalViewBox.height = 100 - finalViewBox.y;
		}

		// Ensure minimum zoom level - don't zoom in too much if constrained by boundaries
		const MIN_VIEWPORT_SIZE = 30; // Minimum 30% of map should be visible
		if (finalViewBox.width < MIN_VIEWPORT_SIZE) {
			const expansion = (MIN_VIEWPORT_SIZE - finalViewBox.width) / 2;
			finalViewBox.x = Math.max(0, finalViewBox.x - expansion);
			finalViewBox.width = Math.min(MIN_VIEWPORT_SIZE, 100 - finalViewBox.x);
		}
		if (finalViewBox.height < MIN_VIEWPORT_SIZE) {
			const expansion = (MIN_VIEWPORT_SIZE - finalViewBox.height) / 2;
			finalViewBox.y = Math.max(0, finalViewBox.y - expansion);
			finalViewBox.height = Math.min(MIN_VIEWPORT_SIZE, 100 - finalViewBox.y);
		}

		// Apply transformation
		const scale = 100 / finalViewBox.width;
		const translateX = -finalViewBox.x;
		const translateY = -finalViewBox.y;

		const transformValue = `scale(${scale}) translate(${translateX}%, ${translateY}%)`;
		const transformWrapper = this.querySelector(".transform-wrapper");
		if (transformWrapper) {
			transformWrapper.style.transform = transformValue;
		}
	}

	showTooltip(event) {
		const point = event.target;
		const tooltipText = point.dataset.tooltipText;

		if (this.tooltip && tooltipText) {
			this.tooltip.textContent = tooltipText;
			this.updateTooltipPosition(event);
			this.tooltip.classList.remove("opacity-0");
			this.tooltip.classList.add("opacity-100");
		}
	}

	hideTooltip() {
		if (this.tooltip) {
			this.tooltip.classList.remove("opacity-100");
			this.tooltip.classList.add("opacity-0");
		}
	}

	updateTooltipPosition(event) {
		if (!this.tooltip) return;

		const mapRect = this.mapElement.getBoundingClientRect();
		const x = event.clientX - mapRect.left;
		const y = event.clientY - mapRect.top;

		this.tooltip.style.left = `${x}px`;
		this.tooltip.style.top = `${y}px`;
	}
}

// Register the custom elements
customElements.define("places-filter", PlacesFilter);
customElements.define("place-accordion", PlaceAccordion);
customElements.define("places-map", PlacesMap);
customElements.define("places-map-single", PlacesMapSingle);
