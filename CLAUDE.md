# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KGPZ Web is a Go-based web application for serving historical newspaper data from the KGPZ (Königsberger Gelehrte und Politische Zeitung) digital archive. The application combines server-rendered HTML with HTMX for progressive enhancement, providing a modern web interface for browsing historical content.

## Architecture

The application follows a modular Go architecture:

- **Main Application**: `kgpz_web.go` - Entry point and application lifecycle management
- **App Core**: `app/kgpz.go` - Core business logic and data processing
- **Controllers**: Route handlers for different content types (issues, agents, places, categories, search, quickfilters)
- **View Models**: Data structures for template rendering with pre-processed business logic (`viewmodels/`)
- **XML Models**: Data structures for parsing source XML files (`xmlmodels/`)
- **Providers**: External service integrations (Git, GND, Geonames, XML parsing, search)
- **Templating**: Custom template engine with Go template integration and helper functions
- **Views**: Frontend assets and templates in `views/` directory

### Key Components

1. **Data Sources**: XML files from Git repository containing historical newspaper metadata
2. **Search**: Full-text search powered by Bleve search engine
3. **External Integrations**: GND (Gemeinsame Normdatei) for person metadata, Geonames for place data
4. **Template System**: Custom engine supporting layouts and partials with embedded filesystem and helper functions

## Development Commands

### Go Backend
```bash
# Run the application in development mode
go run kgpz_web.go

# Build the application
go build -o kgpz_web kgpz_web.go

# Run tests
go test ./helpers/xsdtime/

# Format code
go fmt ./...

# Check for issues
go vet ./...
```

**Note**: The project maintainer handles all Go compilation, testing, and error reporting. Claude Code should not run Go build commands or tests - any Go-related errors will be reported directly by the maintainer.

### Frontend Assets (from views/ directory)
```bash
cd views/

# Development server with hot reloading
npm run dev

# Build production assets
npm run build

# Build CSS with Tailwind
npm run tailwind

# Build CSS with PostCSS
npm run css

# Preview built assets
npm run preview
```

## Configuration

The application uses JSON configuration files:
- `config.dev.json` - Development configuration (if exists)
- `config.json` - Default configuration (fallback)

Key configuration options:
- `git_url`: Source repository URL for data
- `git_branch`: Branch to use for data
- `webhook_endpoint`: GitHub webhook endpoint for auto-updates
- `debug`: Enable debug mode and logging
- `watch`: Enable file watching for template hot-reloading

## Data Flow

1. **Startup**: Application clones/pulls Git repository with XML data
2. **Parsing**: XML files parsed into structured models (agents, places, works, issues)
3. **Enrichment**: External APIs (GND, Geonames) enrich metadata
4. **Indexing**: Full-text search index built using Bleve
5. **Serving**: HTTP server serves templated content with HTMX interactions

## Key Dependencies

- **Web Framework**: Fiber (high-performance HTTP framework)
- **Search**: Bleve (full-text search engine)
- **Git Operations**: go-git (Git repository operations)
- **Frontend**: HTMX + Tailwind CSS for progressive enhancement
- **Build Tools**: Vite for asset bundling, PostCSS for CSS processing

## Template Structure

Templates are embedded in the binary:
- **Layouts**: `views/layouts/` - Base page structures
- **Routes**: `views/routes/` - Page-specific templates
- **Assets**: `views/assets/` - Compiled CSS and static files

The template system supports nested layouts and automatic reloading in development mode when `watch: true` is enabled.

## Views Directory Structure

The `views/` directory contains all frontend templates, assets, and build configuration:

### Directory Layout
```
views/
├── layouts/                 # Base templates and layouts
│   ├── components/          # Shared layout components (_header, _footer, _menu)
│   └── default/            # Default layout (root.gohtml)
├── routes/                 # Page-specific templates
│   ├── akteure/           # Agents/People pages (body.gohtml, head.gohtml)
│   ├── autoren/           # Authors-only pages (body.gohtml, head.gohtml)
│   ├── ausgabe/           # Issue pages with components
│   │   └── components/    # Issue-specific components (_inhaltsverzeichnis, _bilder, etc.)
│   ├── components/        # Shared route components
│   │   ├── _akteur.gohtml          # Main agent component (uses sub-components)
│   │   ├── _akteur_header.gohtml   # Agent name, dates, professions, links
│   │   ├── _akteur_werke.gohtml    # Works section with categorized pieces
│   │   ├── _akteur_beitraege.gohtml # Contributions/pieces with grouping
│   │   └── _unified_piece_entry.gohtml # Universal piece display component
│   ├── datenschutz/       # Privacy policy
│   ├── edition/           # Edition pages
│   ├── filter/            # Quickfilter system
│   ├── kategorie/         # Category pages
│   ├── kontakt/           # Contact pages
│   ├── ort/               # Places pages with overview/detail split
│   │   ├── overview/      # Places grid view (body.gohtml, head.gohtml)
│   │   ├── detail/        # Individual place view (body.gohtml, head.gohtml)
│   │   └── components/    # Place-specific components (_place_card, _place_header, _place_pieces, _back_navigation)
│   ├── piece/             # Multi-issue piece pages
│   │   └── components/    # Piece-specific components (_piece_inhaltsverzeichnis, _piece_sequential_layout)
│   ├── search/            # Search pages
│   └── zitation/          # Citation pages
├── assets/                # Compiled output assets
│   ├── css/              # Compiled CSS files
│   ├── js/               # JavaScript libraries and compiled scripts
│   ├── fonts/            # Font files
│   ├── logo/             # Logo and favicon files
│   └── xslt/             # XSLT transformation files
├── public/               # Static public assets
├── transform/            # Source files for build process
│   ├── main.js          # Main JavaScript entry point
│   └── site.css         # Source CSS with Tailwind directives
└── node_modules/         # NPM dependencies
```

### Template System

**Layout Templates** (`layouts/`):
- `default/root.gohtml`: Base HTML structure with head, HTMX, Alpine.js setup
- `components/_header.gohtml`: Site header with navigation
- `components/_footer.gohtml`: Site footer
- `components/_menu.gohtml`: Main navigation menu

**Route Templates** (`routes/`):
Each route has dedicated `head.gohtml` and `body.gohtml` files following Go template conventions:
- Pages use German naming: `akteure` (agents), `ausgabe` (issues), `ort` (places), etc.
- Component partials prefixed with `_` (e.g., `_akteur.gohtml`, `_inhaltsverzeichnis.gohtml`)
- HTMX-powered interactions for dynamic content loading

**Template Features**:
- Go template syntax with custom functions from `templating/engine.go`
- Block template inheritance system
- HTMX integration for progressive enhancement
- Conditional development/production asset loading
- Template helper functions for UI components (PageIcon, BeilagePageIcon)
- Pre-processed view models to minimize template logic

### Frontend Assets

**JavaScript Stack**:
- **HTMX**: Core interactivity and AJAX requests
- **Web Components**: Custom elements for self-contained functionality (replaced Alpine.js)
- **Modular Architecture**: ES6 modules with focused responsibilities
- **Event-Driven Architecture**: Custom events for inter-component communication
- **Build Tool**: Vite for module bundling and development server

**CSS Stack**:
- **Tailwind CSS v4**: Utility-first CSS framework
- **PostCSS**: CSS processing pipeline
- **RemixIcon**: Icon font library
- **Custom Fonts**: Typography setup in `assets/css/fonts.css`

**JavaScript Module Structure**:
- **`main.js`**: Entry point, HTMX event handling, citation link management, page backdrop styling
- **`akteure.js`**: AkteureScrollspy web component for agents/authors navigation
- **`issue.js`**: Newspaper layout, page navigation, modal functions, citation generation
- **`single-page-viewer.js`**: SinglePageViewer web component for image modal display
- **`scroll-to-top.js`**: ScrollToTopButton web component for floating scroll button
- **`places.js`**: PlacesFilter web component for real-time place search filtering

**Build Process**:
- **Source**: `transform/main.js` and `transform/site.css`
- **Output**: Compiled to `assets/scripts.js` and `assets/style.css`
- **Vite Config**: Production build targeting ES modules
- **PostCSS Config**: Tailwind CSS processing

### Asset Loading Strategy

The root template conditionally loads assets based on environment:
- Development: Uses dev favicon, enables hot reloading
- Production: Optimized assets, production favicon
- Module imports: ES6 modules with `setup()` function from compiled scripts
- Deferred loading: HTMX and Alpine.js loaded with `defer` attribute

## Template Architecture & Best Practices

### View Model Philosophy
The application follows a **logic-in-Go, presentation-in-templates** approach:

- **View Models** (`viewmodels/issue_view.go`): Pre-process all business logic, calculations, and data transformations
- **Templates**: Focus purely on presentation using pre-calculated data
- **Helper Functions** (`templating/engine.go`): Reusable UI components and formatting

### Key View Model Features
- **Pre-calculated metadata**: Page icons, grid layouts, visibility flags
- **Grouped data structures**: Complex relationships resolved in Go
- **Template helpers**: `PageIcon()`, `BeilagePageIcon()` for consistent UI components

### Template Organization
**Ausgabe (Issue) Templates**:
- `body.gohtml`: Main layout structure with conditional rendering
- `components/_inhaltsverzeichnis.gohtml`: Table of contents with pre-processed page data
- `components/_newspaper_layout.gohtml`: Newspaper page grid with absolute positioning
- `components/_bilder.gohtml`: Simple image gallery fallback
- Interactive highlighting system with intersection observer and scroll detection

### JavaScript Integration
- **Progressive Enhancement**: HTMX + Alpine.js for interactivity
- **Real-time Highlighting**: Intersection Observer API with scroll fallback (issue view)
- **Scrollspy Navigation**: Multi-item highlighting system for agents/authors pages
- **Page Navigation**: Smooth scrolling with visibility detection
- **HTMX Integration**: Automatic cleanup and re-initialization on page swaps
- **Responsive Design**: Mobile-optimized with proper touch interactions

## Development Workflow

1. Backend changes: Modify Go files, restart server
2. Template changes: Edit templates in `views/`, automatic reload if watching enabled
3. CSS changes: Run `npm run css` or `npm run tailwind` in views directory
4. JavaScript changes: Edit `transform/main.js`, run `npm run build`
5. Full rebuild: `go build` for backend, `npm run build` for frontend assets

### Adding New Template Logic
1. **First**: Add business logic to view models in Go
2. **Second**: Create reusable template helper functions if needed
3. **Last**: Use pre-processed data in templates for presentation only

## Multi-Issue Piece View (/beitrag/)

The application supports viewing pieces/articles that span multiple issues through a dedicated piece view interface that aggregates content chronologically.

### URL Structure & Routing

**URL Pattern**: `/beitrag/:id` where ID is the piece's XML ID
- **Example**: `/beitrag/piece-abc123` (piece with XML ID "piece-abc123")
- **Route Definition**: `PIECE_URL = "/beitrag/:id"` in `app/kgpz.go`
- **Controller**: `controllers.GetPiece(k.Library)` handles piece lookup and rendering

### Architecture & Components

**Controller** (`controllers/piece_controller.go`):
- Looks up pieces directly by XML ID
- Handles piece aggregation across multiple issues
- Returns 404 for invalid IDs or non-existent pieces

**View Model** (`viewmodels/piece_view.go`):
- `PieceVM` struct aggregates data from multiple issues
- `AllIssueRefs []xmlmodels.IssueRef` - chronologically ordered issue references
- `AllPages []PiecePageEntry` - sequential page data with image paths
- Pre-processes page icons, grid layouts, and visibility flags
- Resolves image paths using registry system

**Template System** (`views/routes/piece/`):
- `body.gohtml` - Two-column layout with Inhaltsverzeichnis and sequential pages
- `head.gohtml` - Page metadata and title generation
- `components/_piece_inhaltsverzeichnis.gohtml` - Table of contents with piece content
- `components/_piece_sequential_layout.gohtml` - Chronological page display

### Key Features

**Multi-Issue Aggregation**:
- Pieces spanning multiple issues are unified in a single view
- Chronological ordering preserves reading sequence across issue boundaries
- Issue context (year/number) displayed with each page for reference

**Component Reuse**:
- Reuses `_inhaltsverzeichnis_eintrag` template for consistent content display
- Integrates with existing `_newspaper_layout` components for single-page viewer
- Shares highlighting system and navigation patterns with issue view

**Sequential Layout**:
- Two-column responsive design: Inhaltsverzeichnis (1/3) + Page Layout (2/3)
- Left-aligned page indicators with format: `[icon] YYYY Nr. XX, PageNum`
- No grid constraints - simple sequential flow for multi-issue reading

**Highlighting System Integration**:
- Uses same intersection observer system as issue view (`main.js`)
- Page links in Inhaltsverzeichnis turn red when corresponding page is visible
- Page indicators above images also highlight during scroll
- Automatic scroll-to-highlighted functionality

### Template Integration

**Helper Functions** (`templating/engine.go`):
- `GetPieceURL(year, issueNum, page int) string` - generates piece URLs
- Reuses existing `PageIcon()` for consistent icon display
- `getImagePathFromRegistry()` for proper image path resolution

**Data Attributes for JavaScript**:
- `data-page-container` on page containers for scroll detection
- `data-page-number` on Inhaltsverzeichnis links for highlighting
- `newspaper-page-container` class for intersection observer
- `inhalts-entry` class for hover and highlighting behavior

**Responsive Behavior**:
- Mobile: Single column with collapsible Inhaltsverzeichnis
- Desktop: Fixed two-column layout with sticky table of contents
- Single-page viewer integration with proper navigation buttons

### Usage Examples

**Linking to Pieces**:
```gohtml
<a href="{{ GetPieceURL $piece.ID }}">
    gesamten beitrag anzeigen
</a>
```

**Page Navigation in Inhaltsverzeichnis**:
```gohtml
<a href="/{{ $pageEntry.IssueYear }}/{{ $pageEntry.IssueNumber }}/{{ $pageEntry.PageNumber }}"
   class="page-number-inhalts" data-page-number="{{ $pageEntry.PageNumber }}">
   {{ $issueRef.When.Day }}.{{ $issueRef.When.Month }}.{{ $issueRef.When.Year }} [Nr. {{ $pageEntry.IssueNumber }}], {{ $pageEntry.PageNumber }}
</a>
```

### Error Handling

**Invalid IDs**: Returns 404 for non-existent piece IDs
**Missing Pieces**: Returns 404 when piece lookup fails in XML data
**Missing Images**: Graceful fallback with "Keine Bilder verfügbar" message
**Cross-Issue Navigation**: Handles pieces spanning non-consecutive issues

## Direct Page Navigation System

The application provides a direct page navigation system that allows users to jump directly to any page by specifying year and page number, regardless of which issue contains that page.

### URL Structure

**New URL Format**: All page links now use path parameters instead of hash fragments:
- **Before**: `/1771/42#page-166`
- **After**: `/1771/42/166`

This change applies to all page links throughout the application, including:
- Page sharing/citation links
- Inhaltsverzeichnis page navigation
- Single page viewer navigation

### Page Jump Interface

**Location**: Available on year overview pages (`/jahrgang/:year`)

**Features**:
- **Year Selection**: Dropdown with all available years (1764-1779)
- **Page Input**: Numeric input with validation
- **HTMX Integration**: Real-time error feedback without page reload
- **Auto-redirect**: Successful lookups redirect to `/year/issue/page`

**URL Patterns**:
- **Form Submission**: `POST /jump` with form data
- **Direct URL**: `GET /jump/:year/:page` (redirects to found issue)

### Error Handling

**Comprehensive Validation**:
- **Invalid Year**: Years outside 1764-1779 range
- **Invalid Page**: Non-numeric or negative page numbers
- **Page Not Found**: Page doesn't exist in any issue of specified year
- **Form Preservation**: Error responses maintain user input for correction

**HTMX Error Responses**:
- Form replaced with error version showing red borders and error messages
- Specific error targeting (year field vs. page field)
- Graceful degradation with clear user feedback

### Auto-Scroll Implementation

**URL-Based Navigation**:
- Pages accessed via `/year/issue/page` auto-scroll to target page
- JavaScript detects path-based page numbers (not hash fragments)
- Smooth scrolling with proper timing for layout initialization
- Automatic highlighting in Inhaltsverzeichnis

**Technical Implementation**:
```javascript
// Auto-scroll on page load if targetPage is specified
const pathParts = window.location.pathname.split('/');
if (pathParts.length >= 4 && !isNaN(pathParts[pathParts.length - 1])) {
    const pageNumber = pathParts[pathParts.length - 1];
    // Scroll to page container and highlight
}
```

### Controller Architecture

**Page Jump Controller** (`controllers/page_jump_controller.go`):
- `FindIssueByYearAndPage()` - Lookup function for issue containing specific page
- `GetPageJump()` - Handles direct URL navigation (`/jump/:year/:page`)
- `GetPageJumpForm()` - Handles form submissions (`POST /jump`)
- Error rendering with HTML form generation

**Issue Controller Updates** (`controllers/ausgabe_controller.go`):
- Enhanced to handle optional page parameter in `/:year/:issue/:page?`
- Page validation against issue page ranges
- Target page passed to template for auto-scroll JavaScript

### Link Generation Updates

**JavaScript Functions** (`views/transform/main.js`):
- `copyPagePermalink()` - Generates `/year/issue/page` URLs
- `generatePageCitation()` - Uses new URL format for citations
- `scrollToPageFromURL()` - URL-based navigation (replaces hash-based)

**Template Integration**:
- Page links updated throughout templates to use new URL format
- Maintains backward compatibility for beilage/supplement pages (still uses hash)
- HTMX navigation preserved with new URL structure

### Usage Examples

**Direct Page Access**:
```
http://127.0.0.1:8080/1771/42/166  # Direct link to page 166
```

**Page Jump Form**:
```html
<form hx-post="/jump" hx-swap="outerHTML">
    <select name="year">...</select>
    <input type="number" name="page" />
    <button type="submit">Zur Seite springen</button>
</form>
```

**Link Generation**:
```javascript
// New format for regular pages
const pageUrl = `/${year}/${issue}/${pageNumber}`;
// Old format still used for beilage pages
const beilageUrl = `${window.location.pathname}#beilage-1-page-${pageNumber}`;
```

## Quickfilter System (/filter)

The application provides a universal quickfilter system accessible from any page via a header button, offering quick access to common navigation and filtering tools.

### Architecture & Integration

**Header Integration** (`views/layouts/components/_header.gohtml` & `_menu.gohtml`):
- **Universal Access**: Schnellfilter button available in every page header
- **Expandable Design**: Header expands downwards to show filter content
- **HTMX-Powered**: Dynamic loading of filter content without page refresh
- **Seamless UI**: Integrates with existing header styling and layout

**Controller** (`controllers/filter_controller.go`):
- `GetQuickFilter(kgpz *xmlmodels.Library)` - Renders filter interface
- Uses "clear" layout for partial HTML fragments
- Dynamically extracts available years from issue data

**Template System** (`views/routes/filter/body.gohtml`):
- Clean, responsive filter interface with modern styling
- Expandable structure for future filter options
- Integrates existing functionality (page jump) in unified interface

### Current Features

**Page Jump Integration**:
- **Moved from year pages**: "Direkt zu Seite springen" functionality relocated from `/jahrgang/` pages to header
- **Universal availability**: Now accessible from any page in the application
- **Same functionality**: Year dropdown, page input, error handling, HTMX validation
- **Consistent UX**: Maintains all existing behavior and error feedback

**UI Components**:
- **Toggle Button**: Filter icon in header with hover effects and visual feedback
- **Expandable Container**: Header expands naturally to accommodate filter content
- **Responsive Design**: Mobile-friendly with proper touch interactions
- **Click-Outside Close**: Filter closes when clicking outside the container

### Technical Implementation

**URL Structure**:
- **Filter Endpoint**: `GET /filter` - Renders filter interface using clear layout
- **Route Configuration**: `FILTER_URL = "/filter"` defined in `app/kgpz.go`

**JavaScript Functionality** (`views/layouts/components/_menu.gohtml`):
```javascript
// Toggle filter visibility
function toggleFilter() {
    const filterContainer = document.getElementById('filter-container');
    const filterButton = document.getElementById('filter-toggle');

    if (filterContainer.classList.contains('hidden')) {
        filterContainer.classList.remove('hidden');
        filterButton.classList.add('bg-slate-200');
    } else {
        filterContainer.classList.add('hidden');
        filterButton.classList.remove('bg-slate-200');
    }
}

// Close filter when clicking outside
document.addEventListener('click', function(event) {
    // Automatic close functionality
});
```

**HTMX Integration**:
```html
<button id="filter-toggle"
        hx-get="/filter"
        hx-target="#filter-container > div"
        hx-swap="innerHTML"
        onclick="toggleFilter()">
    <i class="ri-filter-2-line"></i> Schnellfilter
</button>
```

### Layout System

**Header Expansion**:
- **Natural Flow**: Filter container expands header downwards using normal document flow
- **Content Displacement**: Page content moves down automatically when filter is open
- **Visual Consistency**: Uses same `bg-slate-50` background as header
- **Centered Content**: Filter content centered within expanded header area

**Template Structure**:
```html
<!-- Header container expands naturally -->
<div id="filter-container" class="mt-6 hidden">
    <div class="flex justify-center">
        <!-- Filter content loaded here via HTMX -->
    </div>
</div>
```

### Extensible Design

**Future Enhancement Ready**:
- Modular template structure allows easy addition of new filter options
- Controller can be extended to handle additional filter types
- Template includes placeholder section for "Weitere Filter"
- Architecture supports complex filtering without performance impact

**Data Processing**:
- Efficient year extraction from issue data using same pattern as `year_view.go`
- Sorted year list generation with proper deduplication
- Ready for additional data aggregation (categories, agents, places)

### Usage Examples

**Template Integration**:
```gohtml
<!-- Filter automatically available in all pages via header -->
<!-- No additional template includes needed -->
```

**Controller Extension**:
```go
// Example of extending filter data
data := fiber.Map{
    "AvailableYears": availableYears,
    "Categories":     categories,     // Future enhancement
    "TopAgents":      topAgents,      // Future enhancement
}
```

### Migration Impact

**Improved User Experience**:
- **Reduced Page Clutter**: Removed page jump form from year overview pages
- **Universal Access**: Page jumping now available from anywhere in the application
- **Cleaner Year Pages**: `/jahrgang/` pages now focus purely on year navigation
- **Consistent Interface**: Single location for all quick navigation tools

## Agents/Authors View System (/akteure/ and /autoren/)

The application provides sophisticated person and organization browsing through dual view systems with advanced navigation and filtering capabilities.

### Dual View Architecture

**General Agents View** (`/akteure/`):
- Displays all persons and organizations mentioned in the newspaper
- Supports letter-based navigation (A-Z)
- Individual person pages with detailed information
- Two-column layout with scrollspy navigation on large screens

**Authors-Only View** (`/autoren/`):
- Filtered view showing only people who authored pieces (Beiträge)
- Single-page display of all authors regardless of starting letter
- No alphabet navigation (all authors shown together)
- Same advanced layout and scrollspy functionality

### URL Structure & Navigation

**URL Patterns**:
- `/akteure/` - All persons overview
- `/akteure/a` - Persons starting with letter "A"
- `/akteure/{id}` - Individual person page
- `/akteure/autoren` - Authors-only filtered view

**Toggle Navigation**:
- Checkbox interface: "Nur Autoren anzeigen" switches between views
- HTMX-powered transitions with URL history management
- Unchecking returns to `/akteure/a` (letter A starting point)

### Template Architecture & Components

**Modular Template System** (`views/routes/components/`):
- `_akteur.gohtml` - Main component using sub-components
- `_akteur_header.gohtml` - Name, life dates, professions, external links
- `_akteur_werke.gohtml` - Works section with categorized pieces
- `_akteur_beitraege.gohtml` - Contributions/pieces with grouping

**Component Benefits**:
- Reusable across different view contexts
- Maintainable separation of concerns
- Consistent styling and behavior
- Easy customization for specific views (authors vs. full agents)

### Advanced Scrollspy Navigation

**Full-Height Sidebar** (2XL+ screens only):
- Fixed 320px width with full viewport height
- Sticky positioning that follows scroll
- Complete name list with smooth scrolling navigation
- Automatic cleanup on HTMX page transitions

**Multi-Item Highlighting**:
- Highlights ALL currently visible authors simultaneously
- Red left border indicating visible items (matches issue view pattern)
- Header visibility detection (name, life data, professions must be fully visible)
- Real-time updates during scroll with 50ms debouncing

**Visual Features**:
- Larger text (`text-base`) for better readability
- Closer spacing (`py-1`) for more names visible
- Smooth transitions and hover effects
- Blue background highlighting for active items

### Controller Architecture

**Unified Controller** (`controllers/akteur_controller.go`):
- Handles both general agents and authors-only views
- Special routing for "autoren" parameter
- Template path switching based on view type
- Letter-based filtering and ID lookup

**View Models** (`viewmodels/agent_view.go`):
- `AgentsView()` - General person lookup by letter/ID
- `AuthorsView()` - Filtered view of piece authors only
- `AuthorsListView` struct with sorting and letter availability
- Pre-processed agent data for efficient template rendering

### Template Features & Data Processing

**Enhanced Data Presentation**:
- Grouped pieces by title and work reference
- Category combination with proper German grammar ("und" vs. "mit")
- Inline citation format: DD.MM.YYYY/ISSUENO, PPP[-PPP]
- Works section showing review/commentary pieces
- External link integration (Wikipedia, GND, VIAF)

**Text Sizing & Hierarchy**:
- Large serif names (`text-2xl font-serif font-bold`)
- Readable life dates and professions (`text-xl`)
- Appropriately sized content text (`text-lg`)
- Larger pill text (`text-sm`) matching issue view standards

### JavaScript Integration

**HTMX-Safe Scrollspy** (`views/transform/main.js`):
- Proper event listener cleanup on page navigation
- Memory leak prevention with timeout management
- Auto-initialization detection for `.author-section` elements
- Smooth scroll behavior for sidebar navigation

**Performance Optimizations**:
- Debounced scroll handling (50ms)
- Efficient viewport calculations using `getBoundingClientRect()`
- Minimal DOM queries with cached element references
- Responsive behavior with automatic sidebar hiding

### Responsive Design

**Desktop Experience** (2XL+ screens):
- Two-column layout: 320px sidebar + flexible content area
- Fixed scrollspy navigation with full name list
- Multi-author highlighting system
- Smooth scrolling between authors

**Mobile Experience** (< 2XL screens):
- Single-column layout with full-width content
- Hidden scrollspy navigation (saves space)
- Touch-optimized interactions
- Same content organization and functionality

### Data Categories & Processing

**Comprehensive Category Support**:
- All 29 XML-defined categories supported
- Dynamic category detection and grouping
- Proper German grammar rules for combinations
- Author filtering for non-current-user pieces

**Helper Functions** (`templating/engine.go`):
- `merge`, `append`, `slice` - Data manipulation
- `sortStrings`, `unique` - Array processing
- `joinWithUnd` - German grammar formatting
- Enhanced data processing for complex template logic

### Usage Examples

**Template Integration**:
```gohtml
{{ template "_akteur_header" $agent }}
{{ template "_akteur_werke" $agent }}
{{ template "_akteur_beitraege" $agent }}
```

**Scrollspy Navigation**:
```gohtml
<a href="#author-{{ $id }}"
   class="scrollspy-link border-l-4 border-transparent"
   data-target="author-{{ $id }}">
   {{ index $agent.Names 0 }}
</a>
```

**HTMX Toggle**:
```gohtml
<input type="checkbox"
       hx-get="/akteure/autoren"
       hx-target="body"
       hx-push-url="true">
```

### Error Handling & Edge Cases

**Template Safety**:
- Null checks for GND data and agent information
- Graceful fallback for missing names or professions
- Safe handling of empty work/piece lists
- Error boundaries for external link data

**Navigation Robustness**:
- 404 handling for invalid agent IDs
- Automatic fallback for missing letters
- Smooth transitions between view modes
- Proper state management across HTMX swaps

## Places System (/ort/) with Geonames Integration

The application provides comprehensive place browsing with sophisticated geographic information integration through the Geonames API, offering modern place names, coordinates, and Wikipedia links.

### Architecture & Data Flow

**Geonames Provider** (`providers/geonames/`):
- Local JSON file caching system for offline operation
- API integration with geonames.org for geographic data enrichment
- Structured data models for places, coordinates, alternate names, and external links
- Automatic fallback between cached data and live API calls

**Places Controller** (`controllers/ort_controller.go`):
- Handles both overview (`/ort/`) and individual place views (`/ort/{id}`)
- Integrates Geonames data with XML place data
- Template rendering with pre-processed geographic information

**View Models** (`viewmodels/place_view.go`):
- `PlaceVM` struct for individual place display with Geonames integration
- `PlacesOverviewVM` for places listing with geographic context
- Pre-processed modern country names and local toponyms

### Geonames Data Integration

**Template Functions** (`app/kgpz.go`):
- `GetGeonames` - Retrieves cached or live Geonames data for places
- Geographic data accessible throughout all templates
- String manipulation functions for name comparisons and formatting

**Data Structure**:
```go
type GeonamesPlace struct {
    GeonameID       int                    `json:"geonameId"`
    Name            string                 `json:"name"`
    ToponymName     string                 `json:"toponymName"`
    CountryName     string                 `json:"countryName"`
    Lat             string                 `json:"lat"`
    Lng             string                 `json:"lng"`
    AlternateNames  []AlternateName        `json:"alternateNames"`
    WikipediaURL    string                 `json:"wikipediaURL"`
}
```

### Modern Place Name Display Logic

**German Name Priority System**:
1. **Primary**: Search for German (`"de"`) alternate names in Geonames data
2. **Preferred Names**: Prioritize names with `IsPreferredName = true`
3. **Fallback**: Use `ToponymName` if no German names available
4. **Display Rule**: Only show modern names if they differ from historical German names

**Implementation**:
```gohtml
{{- $modernName := "" -}}
{{- $hasGermanName := false -}}
{{- range $altName := $geonames.AlternateNames -}}
{{- if eq $altName.Lang "de" -}}
{{- $hasGermanName = true -}}
{{- if $altName.IsPreferredName -}}
{{- $modernName = $altName.Name -}}
{{- break -}}
{{- else if eq $modernName "" -}}
{{- $modernName = $altName.Name -}}
{{- end -}}
{{- end -}}
{{- end -}}
{{- if not $hasGermanName -}}
{{- $modernName = $geonames.ToponymName -}}
{{- end -}}
{{- if and (ne $modernName "") (ne (lower $modernName) (lower $mainPlaceName)) -}}, {{ $modernName }}{{- end }}
```

### Country Name Translations

**Supported Countries with German Translations**:
- **France** → "heutiges Frankreich"
- **United Kingdom** → "heutiges Großbritannien"
- **Russia** → "heutiges Russland"
- **Czech Republic/Czechia** → "heutiges Tschechien"
- **Netherlands/The Netherlands** → "heutige Niederlande"
- **Poland** → "heutiges Polen"
- **Switzerland** → "heutige Schweiz"
- **Latvia** → "heutiges Lettland"
- **Sweden** → "heutiges Schweden"
- **Austria** → "heutiges Österreich"
- **Belgium** → "heutiges Belgien"
- **Slovakia** → "heutige Slowakei"
- **Finland** → "heutiges Finnland"
- **Denmark** → "heutiges Dänemark"

**Display Format**: "heutiges [Country], [Local Name]" (only when local name differs)

### Geographic Features

**Coordinate Integration**:
- Clickable coordinates linking to OpenStreetMap
- Format: `https://www.openstreetmap.org/?mlat={lat}&mlon={lng}&zoom=12`
- Visual styling with map pin icons and hover effects

**External Links**:
- **Wikipedia Integration**: Automatic Wikipedia link detection and display
- **Geonames Links**: Direct links to Geonames.org entries
- Consistent icon styling with external link security (`target="_blank"`, `rel="noopener noreferrer"`)

### Template Structure

**Individual Place View** (`views/routes/ort/body.gohtml`):
- **Header Section**: Place name with back navigation styled like agent pages
- **Geographic Info**: Modern country name with local toponyms when different
- **Coordinates**: Clickable OpenStreetMap links with proper formatting
- **External Links**: Wikipedia and Geonames integration with appropriate icons
- **Linked Articles**: "Verlinkte Beiträge" section showing associated newspaper pieces

**Places Overview** (`views/routes/ort/`):
- **Streamlined Layout**: Removed non-functional alphabet navigation
- **Card Grid**: Responsive place cards with consistent heights (`h-24`)
- **Geographic Context**: Modern country names with local toponyms in overview cards
- **Clean Design**: Focus on essential information without cluttered indicators

### Navigation & UI Improvements

**Back Navigation**:
- **Style Consistency**: Matches agent page back button styling
- **Typography**: Large, bold text with arrow icon (`ri-arrow-left-line`)
- **Simplified Text**: "Orte" instead of "Zurück zur Übersicht"
- **Color Scheme**: Gray text with black hover, transition effects

**External Link Styling**:
- **Consistent Icons**: Smaller Geonames symbols (`text-xl` instead of `text-2xl`)
- **No Underlines**: `no-underline` class for cleaner appearance
- **Hover Effects**: Opacity transitions for better user feedback

### Data Processing & Caching

**Geonames Provider Features**:
- **Local Caching**: JSON files stored locally to reduce API dependency
- **Automatic Fallback**: Graceful degradation when API unavailable
- **Data Enrichment**: Combines XML place data with geographic information
- **Performance**: Cached lookups for frequently accessed places

**Template Integration**:
- **Helper Functions**: Accessible via `GetGeonames` template function
- **Error Handling**: Safe handling of missing or incomplete geographic data
- **Responsive Design**: Geographic information hidden for German places to reduce clutter

### Usage Examples

**Template Integration**:
```gohtml
{{ $geonames := GetGeonames .model.SelectedPlace.Place.ID }}
{{ if and (ne $geonames nil) (ne $geonames.CountryName "Germany") }}
    <p>{{ $geonames.CountryName }}</p>
{{ end }}
```

**External Links**:
```gohtml
{{ if ne $geonames.WikipediaURL "" }}
    <a href="{{ $geonames.WikipediaURL }}" target="_blank" rel="noopener noreferrer">
        <i class="ri-wikipedia-line"></i> Wikipedia
    </a>
{{ end }}
```

**Coordinates**:
```gohtml
{{ if and (ne $geonames.Lat "") (ne $geonames.Lng "") }}
    <a href="https://www.openstreetmap.org/?mlat={{ $geonames.Lat }}&mlon={{ $geonames.Lng }}&zoom=12"
       target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-700 underline">
        {{ $geonames.Lat }}, {{ $geonames.Lng }}
    </a>
{{ end }}
```

### Error Handling & Fallbacks

**Geographic Data Safety**:
- Graceful handling of missing Geonames data
- Safe template evaluation with null checks
- Fallback display for places without geographic information
- Error boundaries for external API failures

**Template Robustness**:
- Case-insensitive name comparisons using `lower` template function
- Proper handling of empty alternate names arrays
- Safe string manipulation with whitespace control
- Consistent behavior across detail and overview templates

## Unified Piece Entry System

The application uses a centralized component for displaying newspaper pieces (Beiträge) consistently across all views, ensuring uniform citation formatting and category-dependent descriptions throughout the interface.

### Core Component

**Central Template** (`views/routes/components/_unified_piece_entry.gohtml`):
- Universal component for piece display across all view contexts
- Handles both `viewmodels.PieceByIssue` and `xmlmodels.Piece` data structures
- Contains comprehensive category-specific descriptions (29+ categories)
- Unified citation formatting and place tag generation
- Supports different display modes for various page contexts

### Data Structure Handling

**Multi-Type Support**:
```gohtml
{{- /* Handle different piece types */ -}}
{{- $piece := $pieceInput -}}
{{- $isContinuation := false -}}
{{- if eq $displayMode "issue" -}}
  {{- $piece = $pieceInput.Piece -}}
  {{- $isContinuation = $pieceInput.IsContinuation -}}
{{- end -}}
```

**Display Mode Parameters**:
- `issue` - For issue table of contents with continuation handling
- `piece` - For multi-issue piece views
- `place` - For place-associated pieces with colon format
- `akteure` - For agent/author contribution lists

### Category-Dependent Descriptions

**Comprehensive Category Support**:
- **Reviews**: "Rezension zu [work title]" with linked authors
- **Obituaries**: "Nachruf auf [person name]" with agent category detection
- **Advertisements**: "Anzeige" with multiple place support
- **Letters**: "Brief" with sender/recipient information
- **Announcements**: Category-specific formatting for each type
- **Academic**: "Dissertation", "Disputation", "Programm" with institutional context

**Special Category Handling**:
```gohtml
{{- range $agentref := $piece.AgentRefs -}}
  {{- if eq $agentref.Category "nachruf" -}}
    {{- $agent := GetAgent $agentref.Ref -}}
    Nachruf auf <a href="/akteure/{{ $agentref.Ref }}">{{ index $agent.Names 0 }}</a>
  {{- end -}}
{{- end -}}
```

### Place Tag Integration

**Clickable Place Links**:
- Automatic place tag generation for all pieces
- Links to place detail pages (`/ort/{id}`)
- Multiple place support for advertisements and events
- Conditional display based on piece category

**Implementation**:
```gohtml
{{ if and (ne (len $piece.PlaceRefs) 0) $ShowPlaceTags }}
  {{ range $index, $placeRef := $piece.PlaceRefs }}
    {{ if gt $index 0 }}, {{ end }}
    <a href="/ort/{{ $placeRef.Ref }}" class="place-tag">{{ $placeName }}</a>
  {{ end }}
{{ end }}
```

### Usage Across Views

**Current Integration Points**:
- **Issue View** (`_inhaltsverzeichnis.gohtml`): Table of contents with continuation handling
- **Agent Views** (`_akteur_beitraege.gohtml`): Author contribution lists
- **Place Views** (`_place_pieces.gohtml`): Place-associated pieces
- **Piece Views** (`_piece_inhaltsverzeichnis.gohtml`): Multi-issue piece displays

**Template Call Pattern**:
```gohtml
{{ template "_unified_piece_entry" (dict
   "Piece" $piece
   "DisplayMode" "issue"
   "ShowPlaceTags" true
   "UseColonFormat" false
   "ShowContinuation" true
) }}
```

### Parameters & Configuration

**Required Parameters**:
- `Piece` - The piece data structure (either type)
- `DisplayMode` - Context for formatting ("issue", "piece", "place", "akteure")

**Optional Parameters**:
- `ShowPlaceTags` (bool) - Whether to display clickable place links
- `UseColonFormat` (bool) - Use colon separator for place-specific formatting
- `ShowContinuation` (bool) - Show continuation indicators for multi-part pieces
- `CurrentActorID` (string) - Exclude current agent from author links in agent views

### Category Formatting Rules

**Natural Language Descriptions**:
- Proper German grammar with gender-appropriate articles
- Work titles in italics with proper author attribution
- Place names as clickable tags when relevant
- Agent references with appropriate relationship indicators

**Title Fallback Logic**:
1. Use piece title if available
2. Fall back to incipit (opening words) if no title
3. Generate category-specific description
4. Handle special cases (reviews, obituaries, advertisements)

### Maintenance & Extension

**Adding New Categories**:
1. Add new category case in the main conditional block
2. Implement category-specific description logic
3. Handle agent/place/work references as needed
4. Test across all view contexts

**Modifying Display Logic**:
- Edit only `_unified_piece_entry.gohtml`
- Changes automatically apply to all views
- Test with different piece types and display modes
- Verify place tag and agent link functionality

### Error Handling

**Template Safety**:
- Null checks for all piece data fields
- Safe handling of missing titles, authors, or places
- Graceful fallback for unknown categories
- Type-safe access to different piece structures

**Data Validation**:
- Proper handling of empty agent/place reference arrays
- Safe string manipulation and concatenation
- Conditional display based on data availability
- Consistent behavior across different piece types

## Agent Relationship System

The application handles complex relationships between agents (persons/organizations) and both works and pieces (Beiträge), with specific formatting for different contributor roles.

### Contributor Categories

**Supported Agent Categories**:
- **Empty/`"autor"`**: Primary authors (no special suffix)
- **`"übersetzer"`**: Translators - displayed with "(Übers.)" suffix
- **`"herausgeber"`**: Editors - displayed with "(Hrsg.)" suffix
- **`"nachruf"`**: Obituary subjects - special handling for "Nachruf auf [person]"

### Work Relationships (`_akteur_werke.gohtml`)

**Role Qualification in Works Bibliography**:
- Works display person's relationship to each work as a prefix
- **Authors**: No prefix (default relationship)
- **Translators**: `(Übers.) [Work Title]`
- **Editors**: `(Hrsg.) [Work Title]`

**Example Output**:
```
Werke
(Übers.) Herrn Johann Ludwigs Bianconi Zehn Sendschreiben an Herrn Marchese Philippo Hercolani...
Rezension: 1.2.1765/9, S. 33-34

Die Aufklärung der Philosophie (Leipzig: Breitkopf 1766)
Rezension: 1.5.1766/15, S. 45-48
```

**Implementation Details**:
- Role detection via `$w.Item.AgentRefs` matching current person ID
- Prefix added before existing `Citation.HTML` content
- Break after finding person's role for performance
- Maintains all existing formatting and external links

### Piece Relationships (Unified System)

**Multi-Role Contributor Display**:
- Authors, translators, and editors can all contribute to single pieces
- Consistent formatting across all view contexts
- Proper comma separation and German conjunction handling

**Display Patterns**:
```
Author1, Author2, Translator1 (Übers.), Editor1 (Hrsg.): [Piece Content]
Schmidt (Übers.), Müller (Hrsg.): Rezension von: Goethe, Faust
Translator1 (Übers.): Übersetzung aus: Voltaire, Candide
```

**Work Citation Enhancement**:
- Work contributors shown with roles in piece citations
- Example: `Rezension von: Giovanni Lodovico Bianconi, Dorothea Henriette Runckel (Übers.), Zehn Sendschreiben`
- Maintains work author, translator, and editor relationships

### Context-Sensitive Display

**Agent Detail Pages** (`/akteure/{id}`):
- **Works Section**: Shows person's role as prefix `(Übers.)` or `(Hrsg.)`
- **Beiträge Section**: Groups pieces by title and contributors, shows other collaborators
- **Current Agent Exclusion**: Hides current person from contributor lists in their own page

**Issue Views** (`/year/issue`):
- Full contributor display with all roles
- Shows piece authors, translators, and editors in table of contents
- Work citations include all work contributors with roles

**Place Views** (`/ort/{id}`):
- Colon format: `Author (Übers.): [Content]`
- Regular format: `Author (Übers.), [Content]`
- Place-specific formatting for associated pieces

**Multi-Issue Piece Views** (`/beitrag/{id}`):
- Consistent contributor display across issue boundaries
- Maintains role information in sequential display
- Work citations preserve contributor relationships

### Technical Implementation

**Variable Collections**:
```gohtml
{{- $authors := slice -}}
{{- $translators := slice -}}
{{- $editors := slice -}}
{{- range $agentref := $piece.AgentRefs -}}
  {{- if eq $agentref.Category "übersetzer" -}}
    {{- $translators = append $translators (dict "ID" $agentref.Ref "Name" $agentName) -}}
  {{- else if eq $agentref.Category "herausgeber" -}}
    {{- $editors = append $editors (dict "ID" $agentref.Ref "Name" $agentName) -}}
  {{- end -}}
{{- end -}}
```

**Role Detection Logic**:
```gohtml
{{- range $workAgentRef := $work.AgentRefs -}}
  {{- if eq $workAgentRef.Ref $currentPersonID -}}
    {{- if eq $workAgentRef.Category "übersetzer" -}}
      {{- $personRole = "(Übers.) " -}}
    {{- else if eq $workAgentRef.Category "herausgeber" -}}
      {{- $personRole = "(Hrsg.) " -}}
    {{- end -}}
  {{- end -}}
{{- end -}}
```

**Formatting Functions**:
- `joinWithUnd` - German conjunction for multiple contributors
- Current actor exclusion logic for agent detail pages
- Comma separation with proper spacing for role suffixes

### Error Handling

**Relationship Safety**:
- Graceful handling of missing agent references
- Safe access to agent data via `GetAgent` function
- Null checks for agent names and IDs
- Fallback display for unknown or malformed relationships

**Performance Considerations**:
- Break statements after finding target relationships
- Efficient grouping by contributor combinations
- Minimal DOM manipulation for role prefixes
- Cached agent lookups where possible