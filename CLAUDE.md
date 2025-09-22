# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KGPZ Web is a Go-based web application for serving historical newspaper data from the KGPZ (Königsberger Gelehrte und Politische Zeitung) digital archive. The application combines server-rendered HTML with HTMX for progressive enhancement, providing a modern web interface for browsing historical content.

## Architecture

The application follows a modular Go architecture:

- **Main Application**: `kgpz_web.go` - Entry point and application lifecycle management
- **App Core**: `app/kgpz.go` - Core business logic and data processing
- **Controllers**: Route handlers for different content types (issues, agents, places, categories, search)
- **View Models**: Data structures for template rendering with pre-processed business logic (`viewmodels/`)
- **XML Models**: Data structures for parsing source XML files (`xmlmodels/`)
- **Providers**: External service integrations (Git, GND, XML parsing, search)
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
│   │   └── _piece_summary.gohtml   # Individual piece display logic
│   ├── datenschutz/       # Privacy policy
│   ├── edition/           # Edition pages
│   ├── kategorie/         # Category pages
│   ├── kontakt/           # Contact pages
│   ├── ort/               # Places pages
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
- **Alpine.js**: Lightweight reactivity for UI components
- **Modular Architecture**: ES6 modules with focused responsibilities
- **Web Components**: Custom elements for self-contained functionality
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

**URL Pattern**: `/beitrag/:id` where ID format is `YYYY-NNN-PPP` (year-issue-page)
- **Example**: `/beitrag/1768-020-079` (piece starting at year 1768, issue 20, page 79)
- **Route Definition**: `PIECE_URL = "/beitrag/:id"` in `app/kgpz.go`
- **Controller**: `controllers.GetPiece(k.Library)` handles piece lookup and rendering

### Architecture & Components

**Controller** (`controllers/piece_controller.go`):
- Parses YYYY-NNN-PPP ID format using regex pattern matching
- Looks up pieces by year/issue/page when XML IDs aren't reliable
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
<a href="{{ GetPieceURL $piece.Reference.When.Year $piece.Reference.Nr $piece.Reference.Von }}">
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

**Invalid IDs**: Returns 404 for malformed YYYY-NNN-PPP format
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