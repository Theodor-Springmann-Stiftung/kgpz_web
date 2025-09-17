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
│   ├── ausgabe/           # Issue pages with components
│   │   └── components/    # Issue-specific components (_inhaltsverzeichnis, _bilder, etc.)
│   ├── components/        # Shared route components (_akteur.gohtml)
│   ├── datenschutz/       # Privacy policy
│   ├── edition/           # Edition pages
│   ├── kategorie/         # Category pages
│   ├── kontakt/           # Contact pages
│   ├── ort/               # Places pages
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
- **Custom Extensions**: HTMX plugins for response targets, client-side templates, loading states
- **Build Tool**: Vite for module bundling and development server

**CSS Stack**:
- **Tailwind CSS v4**: Utility-first CSS framework
- **PostCSS**: CSS processing pipeline
- **RemixIcon**: Icon font library
- **Custom Fonts**: Typography setup in `assets/css/fonts.css`

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
- **Real-time Highlighting**: Intersection Observer API with scroll fallback
- **Page Navigation**: Smooth scrolling with visibility detection
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