package pictures

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
)

// ImageFile represents a single image file with its metadata
type ImageFile struct {
	Year        int
	Issue       int
	Page        int
	IsBeilage   bool
	BeilageNo   int
	Filename    string
	Path        string // Primary path (prefers WebP over JPEG)
	PreviewPath string // Path to compressed WebP version for layout views
	JpegPath    string // Path to JPEG version (for download button)
}

// imageRegistry holds all image files organized by different keys for fast lookup
type imageRegistry struct {
	Files       []ImageFile
	ByYearIssue map[string][]ImageFile // "year-issue" -> files
	ByYearPage  map[string]ImageFile   // "year-page" -> file (only for non-beilage)
}

// PicturesProvider manages all newspaper picture images with thread-safe access
type PicturesProvider struct {
	mu       sync.RWMutex
	registry *imageRegistry
}

// NewPicturesProvider creates a new PicturesProvider
func NewPicturesProvider() *PicturesProvider {
	return &PicturesProvider{
		registry: nil,
	}
}

// Scan scans the pictures directory and builds the image registry
func (p *PicturesProvider) Scan(path string) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	registry := &imageRegistry{
		Files:       make([]ImageFile, 0),
		ByYearIssue: make(map[string][]ImageFile),
		ByYearPage:  make(map[string]ImageFile),
	}

	// Temporary map to collect all files by their base name (year-issue-page)
	tempFiles := make(map[string]*ImageFile)

	err := filepath.Walk(path, func(filePath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		filename := info.Name()
		filenamelower := strings.ToLower(filename)

		// Only process .jpg and .webp files (but skip preview files)
		var nameWithoutExt string
		var isWebP bool

		if strings.HasSuffix(filenamelower, ".jpg") {
			nameWithoutExt = strings.TrimSuffix(filename, ".jpg")
			isWebP = false
		} else if strings.HasSuffix(filenamelower, ".webp") && !strings.HasSuffix(filenamelower, "-preview.webp") {
			nameWithoutExt = strings.TrimSuffix(filename, ".webp")
			isWebP = true
		} else {
			return nil // Skip non-image files and preview files
		}

		parts := strings.Split(nameWithoutExt, "-")

		// Need at least 3 parts: year-issue-page
		if len(parts) != 3 {
			return nil
		}

		// Parse year
		year, err := strconv.Atoi(strings.TrimSpace(parts[0]))
		if err != nil {
			return nil
		}

		// Check if second part ends with 'b' (beilage)
		issueStr := strings.TrimSpace(parts[1])
		isBeilage := strings.HasSuffix(issueStr, "b")

		if isBeilage {
			issueStr = strings.TrimSuffix(issueStr, "b")
		}

		// Parse issue number
		issue, err := strconv.Atoi(issueStr)
		if err != nil {
			return nil
		}

		// Parse page number
		page, err := strconv.Atoi(strings.TrimSpace(parts[2]))
		if err != nil {
			return nil
		}

		// Create unique key for this image (handles both regular and beilage)
		var uniqueKey string
		if isBeilage {
			uniqueKey = fmt.Sprintf("%d-%db-%d", year, issue, page)
		} else {
			uniqueKey = fmt.Sprintf("%d-%d-%d", year, issue, page)
		}

		// Get or create the ImageFile entry
		imageFile, exists := tempFiles[uniqueKey]
		if !exists {
			imageFile = &ImageFile{
				Year:      year,
				Issue:     issue,
				Page:      page,
				IsBeilage: isBeilage,
				BeilageNo: 1, // Default beilage number
			}
			tempFiles[uniqueKey] = imageFile
		}

		// Set paths based on file type
		currentPath := fmt.Sprintf("/static/pictures/%s", filePath[len(path)+1:]) // Remove path prefix
		if isWebP {
			// WebP is the primary path for single page viewer
			imageFile.Path = currentPath
			imageFile.Filename = filename
		} else {
			// JPEG is the fallback path for download
			imageFile.JpegPath = currentPath
			// If no WebP path is set yet, use JPEG as primary
			if imageFile.Path == "" {
				imageFile.Path = currentPath
				imageFile.Filename = filename
			}
		}

		return nil
	})

	if err != nil {
		return err
	}

	// Second pass: set PreviewPath for each ImageFile by checking for preview files
	for _, imageFile := range tempFiles {
		// Extract the base name from the filename to preserve original format
		baseNameWithExt := imageFile.Filename
		var baseName string

		// Remove extension to get base name
		if strings.HasSuffix(strings.ToLower(baseNameWithExt), ".webp") {
			baseName = strings.TrimSuffix(baseNameWithExt, ".webp")
		} else if strings.HasSuffix(strings.ToLower(baseNameWithExt), ".jpg") {
			baseName = strings.TrimSuffix(baseNameWithExt, ".jpg")
		} else {
			baseName = baseNameWithExt
		}

		// Generate preview filename using the original base name format
		previewFilename := baseName + "-preview.webp"

		// Check if preview file exists
		previewFullPath := filepath.Join(path, fmt.Sprintf("%d", imageFile.Year), previewFilename)
		if _, err := os.Stat(previewFullPath); err == nil {
			imageFile.PreviewPath = fmt.Sprintf("/static/pictures/%d/%s", imageFile.Year, previewFilename)
		}
	}

	// Convert temp map to final registry structures
	for _, imageFile := range tempFiles {
		registry.Files = append(registry.Files, *imageFile)

		yearIssueKey := fmt.Sprintf("%d-%d", imageFile.Year, imageFile.Issue)
		registry.ByYearIssue[yearIssueKey] = append(registry.ByYearIssue[yearIssueKey], *imageFile)

		if !imageFile.IsBeilage {
			yearPageKey := fmt.Sprintf("%d-%d", imageFile.Year, imageFile.Page)
			registry.ByYearPage[yearPageKey] = *imageFile
		}
	}

	p.registry = registry
	return nil
}

// GetByYearIssuePage returns an image file for a specific year, issue, and page
// For beilage pages, isBeilage should be true
func (p *PicturesProvider) GetByYearIssuePage(year, issue, page int, isBeilage bool) (*ImageFile, bool) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.registry == nil {
		return nil, false
	}

	// For regular pages, use year-page lookup
	if !isBeilage {
		key := fmt.Sprintf("%d-%d", year, page)
		if imageFile, exists := p.registry.ByYearPage[key]; exists {
			return &imageFile, true
		}
		return nil, false
	}

	// For beilage pages, search through all files for this year-issue
	yearIssueKey := fmt.Sprintf("%d-%d", year, issue)
	if issueFiles, exists := p.registry.ByYearIssue[yearIssueKey]; exists {
		for _, file := range issueFiles {
			if file.IsBeilage && file.Page == page {
				return &file, true
			}
		}
	}

	return nil, false
}

// GetByYearIssue returns all image files for a specific year and issue
func (p *PicturesProvider) GetByYearIssue(year, issue int) []ImageFile {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.registry == nil {
		return nil
	}

	yearIssueKey := fmt.Sprintf("%d-%d", year, issue)
	if files, exists := p.registry.ByYearIssue[yearIssueKey]; exists {
		// Return a copy to prevent external modification
		result := make([]ImageFile, len(files))
		copy(result, files)
		return result
	}

	return nil
}

// GetByYearPage returns an image file for a specific year and page (non-beilage only)
func (p *PicturesProvider) GetByYearPage(year, page int) (*ImageFile, bool) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	if p.registry == nil {
		return nil, false
	}

	key := fmt.Sprintf("%d-%d", year, page)
	if imageFile, exists := p.registry.ByYearPage[key]; exists {
		return &imageFile, true
	}

	return nil, false
}

// HasImages returns true if the registry has been initialized and contains images
func (p *PicturesProvider) HasImages() bool {
	p.mu.RLock()
	defer p.mu.RUnlock()

	return p.registry != nil && len(p.registry.Files) > 0
}