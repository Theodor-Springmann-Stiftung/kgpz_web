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

## Development Commands

The user runs a dev server in the background rebuilding assets & go code on file changes

**Note**: The project maintainer handles all Go compilation, testing, and error reporting. Claude Code should not run Go build commands or tests - any Go-related errors will be reported directly by the maintainer.

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

## Route Details

### Issues/Ausgabe (`/:year/:issue/:page?`)
- **Controller**: `controllers/ausgabe_controller.go`
- **URL Structure**: `/1771/42` or `/1771/42/166` (with page)
- **Components**: `views/routes/ausgabe/body.gohtml`, `head.gohtml`, `components/_inhaltsverzeichnis.gohtml`, `_newspaper_layout.gohtml`, `_bilder.gohtml`
- **JavaScript**: `issue.js` (newspaper layout, page navigation, modals, citation generation)
- **Template**: `views/routes/ausgabe/`

### Agents/Akteure (`/akteure/:letter?/:id?`)
- **Controller**: `controllers/akteur_controller.go`
- **URL Structure**: `/akteure/a`, `/akteure/person-123`, `/akteure/autoren`
- **Components**: `views/routes/components/_akteur.gohtml`, `_akteur_header.gohtml`, `_akteur_werke.gohtml`, `_akteur_beitraege.gohtml`
- **JavaScript**: `akteure.js` (AkteureScrollspy web component)
- **Template**: `views/routes/akteure/`

### Places/Orte (`/ort/:id?`)
- **Controller**: `controllers/ort_controller.go`
- **URL Structure**: `/ort/` (overview), `/ort/place-123` (detail)
- **Components**: `views/routes/ort/overview/`, `ort/detail/`, `components/_place_card.gohtml`, `_place_header.gohtml`, `_place_pieces.gohtml`
- **JavaScript**: `places.js` (PlacesFilter web component for search filtering)
- **Template**: `views/routes/ort/`

### Multi-Issue Pieces (`/beitrag/:id`)
- **Controller**: `controllers/piece_controller.go`
- **URL Structure**: `/beitrag/piece-abc123`
- **Components**: `views/routes/piece/body.gohtml`, `head.gohtml`, `components/_piece_inhaltsverzeichnis.gohtml`, `_piece_sequential_layout.gohtml`
- **JavaScript**: `main.js` (highlighting system, shared with issue view)
- **Template**: `views/routes/piece/`

### Search (`/search`)
- **Controller**: `controllers/search_controller.go`
- **URL Structure**: `/search?q=term`
- **Components**: `views/routes/search/body.gohtml`, `head.gohtml`
- **JavaScript**: `main.js` (basic HTMX handling)
- **Template**: `views/routes/search/`

### Quickfilter (`/filter`)
- **Controller**: `controllers/filter_controller.go`
- **URL Structure**: `/filter` (HTMX endpoint)
- **Components**: `views/routes/filter/body.gohtml`
- **JavaScript**: `main.js` (toggle functionality in `_menu.gohtml`)
- **Template**: `views/routes/filter/`

### Page Jump (`/jump/:year?/:page?`)
- **Controller**: `controllers/page_jump_controller.go`
- **URL Structure**: `/jump` (form), `/jump/1771/166` (direct)
- **Components**: Integrated into filter system
- **JavaScript**: `main.js` (auto-scroll functionality)
- **Template**: Part of filter system

### Year Overview (`/jahrgang/:year`)
- **Controller**: `controllers/year_controller.go`
- **URL Structure**: `/jahrgang/1771`
- **Components**: `views/routes/year/body.gohtml`, `head.gohtml`
- **JavaScript**: `main.js` (basic navigation)
- **Template**: `views/routes/year/`

### Categories (`/kategorie/:id`)
- **Controller**: `controllers/kategorie_controller.go`
- **URL Structure**: `/kategorie/category-name`
- **Components**: `views/routes/kategorie/body.gohtml`, `head.gohtml`
- **JavaScript**: `main.js` (basic functionality)
- **Template**: `views/routes/kategorie/`

### Citation (`/zitation`)
- **Controller**: `controllers/zitation_controller.go`
- **URL Structure**: `/zitation`
- **Components**: `views/routes/zitation/body.gohtml`, `head.gohtml`
- **JavaScript**: `main.js` (citation link management)
- **Template**: `views/routes/zitation/`

### Static Pages
- **Datenschutz**: `views/routes/datenschutz/` (Privacy policy)
- **Kontakt**: `views/routes/kontakt/` (Contact)
- **Edition**: `views/routes/edition/` (Edition info)

## Template Structure

Templates are embedded in the binary:
- **Layouts**: `views/layouts/` - Base page structures
- **Routes**: `views/routes/` - Page-specific templates
- **Assets**: `views/assets/` - Compiled CSS and static files

### Shared Components
- `views/routes/components/_unified_piece_entry.gohtml` - Universal piece display component
- `views/layouts/components/_header.gohtml`, `_footer.gohtml`, `_menu.gohtml` - Layout components

### Frontend Assets

**JavaScript Stack**:
- **HTMX**: Core interactivity and AJAX requests - **IMPORTANT**: Content swapping requires careful event handling
- **Web Components**: Custom elements for self-contained functionality with proper lifecycle management
- **Build Tool**: Vite for module bundling and development server
- **Module Architecture**: ES6 modules with focused responsibilities for different page types

**CSS Stack**:
- **Tailwind CSS v4**: Utility-first CSS framework
- **PostCSS**: CSS processing pipeline
- **RemixIcon**: Icon font library

**HTMX Considerations**:
- Links swap content dynamically, requiring proper cleanup of event listeners
- Web components must handle HTMX page swaps with cleanup and re-initialization
- JavaScript modules need to be HTMX-safe with proper memory management
- Event delegation and component lifecycle management are critical

**JavaScript Modules** (`views/transform/`):
- **`main.js`**: Entry point, imports all modules, HTMX event handling, citation link highlighting
- **`issue.js`**: Newspaper layout, page navigation, modal functions, citation generation
- **`akteure.js`**: AkteureScrollspy web component for agents/authors navigation
- **`places.js`**: PlacesFilter web component for real-time place search filtering
- **`single-page-viewer.js`**: Modal component for full-screen page viewing
- **`scroll-to-top.js`**: ScrollToTopButton web component for floating scroll button
- **`inhaltsverzeichnis-scrollspy.js`**: Table of contents highlighting system
- **`search.js`**: Search functionality and result handling
- **`error-modal.js`**: Error display modal component
- **`helpers.js`**: Utility functions and shared helpers

## Citation System

**Universal Citation Format**: Used throughout the application for consistent newspaper references

**Citation Template** (`views/routes/components/_citation.gohtml`):
- **Format**: `DD.MM.YYYY/ISSUE, S. PAGE-PAGE` (or `Beil. PAGE` for supplements)
- **Input**: `xmlmodels.IssueRef` with date, issue number, page range, optional supplement
- **Output**: Clickable links to specific pages with current page highlighting
- **Auto-detection**: Automatically highlights citations referring to the currently viewed page

**Example Citations**:
- Regular pages: `1.2.1765/9, S. 33-34`
- Single page: `15.3.1771/42, S. 166`
- Supplement: `1.5.1766/15, Beil. 2-3`

**Usage**: `{{ template "_citation" $issueRef }}` - Used in table of contents, agent pages, place listings, search results

## Template Structure & Format

**Standard Template Pattern**: Almost all views follow a consistent two-file structure:

### Standard Files
- **`head.gohtml`**: Page-specific `<title>` and meta information
- **`body.gohtml`**: Main page content using layout system

### Layout System
- **Base Layout**: `views/layouts/default/root.gohtml` provides HTML structure
- **Shared Components**: Header, footer, navigation in `views/layouts/components/`
- **Responsive Design**: Mobile-first with Tailwind CSS classes
- **Three-column pattern**: Many views use sidebar + content + navigation layout

### Template Features
- **Go Template Syntax**: Standard Go templates with custom helper functions
- **HTMX Integration**: `hx-*` attributes for dynamic content loading
- **Component Reuse**: Shared components like `_unified_piece_entry.gohtml` for consistency
- **Conditional Rendering**: Based on data availability and user context
- **Typography**: Serif fonts for names/titles, sans-serif for UI, appropriate text sizing

## Development Workflow

1. Backend changes: Modify Go files, restart server
2. Template changes: Edit templates in `views/`, automatic reload if watching enabled
3. CSS changes: Run `npm run css` or `npm run tailwind` in views directory
4. JavaScript changes: Edit `transform/main.js`, run `npm run build`
5. Full rebuild: `go build` for backend, `npm run build` for frontend assets

**Note**: The user runs a dev server in the background rebuilding assets & go code on file changes
