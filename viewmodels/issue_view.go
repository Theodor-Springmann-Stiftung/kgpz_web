package viewmodels

import (
	"fmt"
	"maps"
	"os"
	"path/filepath"
	"slices"
	"sort"
	"strconv"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/functions"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
)

type PieceByIssue struct {
	xmlmodels.Piece
	// TODO: this is a bit hacky, but it refences the page number of the piece in the issue
	Reference xmlmodels.IssueRef
	// Indicates if this is a continuation from a previous page
	IsContinuation bool
}

type PiecesByPage struct {
	Items map[int][]PieceByIssue
	Pages []int
}

// IndividualPieceByIssue represents a piece with metadata for individual page display
type IndividualPieceByIssue struct {
	PieceByIssue
	IssueRefs []xmlmodels.IssueRef // All issues this piece appears in
	PageIcon  string               // Icon type: "first", "last", "even", "odd"
}

// IndividualPiecesByPage holds pieces as individual page entries
type IndividualPiecesByPage struct {
	Items map[int][]IndividualPieceByIssue
	Pages []int
}

type IssuePage struct {
	PageNumber  int
	ImagePath   string // Full-quality image path (prefers WebP over JPEG)
	PreviewPath string // Compressed WebP path for layout views
	JpegPath    string // JPEG path for download button
	Available   bool
	GridColumn  int    // 1 or 2 for left/right positioning
	GridRow     int    // Row number in grid
	HasHeader   bool   // Whether this page has a double-spread header
	HeaderText  string // Text for double-spread header
	PageIcon    string // Icon type: "first", "last", "even", "odd"
}

type IssueImages struct {
	MainPages       []IssuePage
	AdditionalPages map[int][]IssuePage // Beilage number -> pages
	HasImages       bool
}

type ImageFile struct {
	Year        int
	Issue       int
	Page        int
	IsBeilage   bool
	BeilageNo   int
	Filename    string
	Path        string        // Primary path (prefers WebP over JPEG)
	PreviewPath string        // Path to compressed WebP version for layout views
	JpegPath    string        // Path to JPEG version (for download button)
}

type ImageRegistry struct {
	Files       []ImageFile
	ByYearIssue map[string][]ImageFile // "year-issue" -> files
	ByYearPage  map[string]ImageFile   // "year-page" -> file
}

var imageRegistry *ImageRegistry

// TODO: Next & Prev
type IssueVM struct {
	xmlmodels.Issue
	Next             *xmlmodels.Issue
	Prev             *xmlmodels.Issue
	Pieces           IndividualPiecesByPage
	AdditionalPieces IndividualPiecesByPage
	Images           IssueImages
	HasBeilageButton bool // Whether to show beilage navigation button
}

func NewSingleIssueView(y, no int, lib *xmlmodels.Library) (*IssueVM, error) {
	lib.Issues.Lock()
	var issue *xmlmodels.Issue = nil
	var next *xmlmodels.Issue = nil
	var prev *xmlmodels.Issue = nil

	for i, iss := range lib.Issues.Array {
		if iss.Datum.When.Year == y && iss.Number.No == no {
			issue = &iss
			if i > 0 {
				prev = &lib.Issues.Array[i-1]
			}
			if i < len(lib.Issues.Array)-1 {
				next = &lib.Issues.Array[i+1]
			}
		}
	}

	if issue == nil {
		return nil, fmt.Errorf("No issue found for %v-%v", y, no)
	}

	sivm := IssueVM{Issue: *issue, Next: next, Prev: prev}

	lib.Issues.Unlock()
	ppi, ppa, err := PiecesForIssue(lib, *issue)
	if err != nil {
		return nil, err
	}

	slices.Sort(ppi.Pages)
	slices.Sort(ppa.Pages)

	images, err := LoadIssueImages(*issue)
	if err != nil {
		return nil, err
	}
	sivm.Images = images

	// Group consecutive continuation pieces, including empty pages from images
	sivm.Pieces = CreateIndividualPagesWithMetadata(ppi, lib)
	sivm.AdditionalPieces = CreateIndividualPagesWithMetadataIncludingEmpty(ppa, lib, images.AdditionalPages)
	sivm.HasBeilageButton = len(sivm.AdditionalPieces.Pages) > 0

	return &sivm, nil
}

func PiecesForIssue(lib *xmlmodels.Library, issue xmlmodels.Issue) (PiecesByPage, PiecesByPage, error) {
	year := issue.Datum.When.Year

	ppi := PiecesByPage{Items: make(map[int][]PieceByIssue)}
	ppa := PiecesByPage{Items: make(map[int][]PieceByIssue)}

	lib.Pieces.Lock()
	defer lib.Pieces.Unlock()

	for _, piece := range lib.Pieces.Array {
		// Process ALL IssueRefs for this piece, not just the first match
		for _, issueRef := range piece.IssueRefs {
			if issueRef.Nr == issue.Number.No && issueRef.When.Year == year {
				// DEBUG: Log piece details for specific issue
				if year == 1771 && issue.Number.No == 29 {
					fmt.Printf("DEBUG PiecesForIssue: Piece ID=%s, Von=%d, Bis=%d, Beilage=%d\n", piece.Identifier.ID, issueRef.Von, issueRef.Bis, issueRef.Beilage)
				}

				// Add main entry on starting page
				p := PieceByIssue{Piece: piece, Reference: issueRef, IsContinuation: false}
				if issueRef.Beilage > 0 {
					functions.MapArrayInsert(ppa.Items, issueRef.Von, p)
				} else {
					functions.MapArrayInsert(ppi.Items, issueRef.Von, p)
				}

				// Add continuation entries for subsequent pages (if Bis > Von)
				if issueRef.Bis > issueRef.Von {
					for page := issueRef.Von + 1; page <= issueRef.Bis; page++ {
						pContinuation := PieceByIssue{Piece: piece, Reference: issueRef, IsContinuation: true}
						if issueRef.Beilage > 0 {
							functions.MapArrayInsert(ppa.Items, page, pContinuation)
						} else {
							functions.MapArrayInsert(ppi.Items, page, pContinuation)
						}
					}
				}
			}
		}
	}

	ppi.Pages = slices.Collect(maps.Keys(ppi.Items))
	ppa.Pages = slices.Collect(maps.Keys(ppa.Items))

	return ppi, ppa, nil
}

// pagesHaveIdenticalContent checks if two pages have the same pieces (ignoring continuation status)
func pagesHaveIdenticalContent(items1, items2 []PieceByIssue) bool {
	if len(items1) != len(items2) {
		return false
	}

	// Create maps for comparison (ignore IsContinuation flag)
	pieces1 := make(map[string]bool)
	pieces2 := make(map[string]bool)

	for _, piece := range items1 {
		// Use piece ID and reference range as key (ignore continuation status)
		key := piece.ID + "|" + strconv.Itoa(piece.Reference.Von) + "|" + strconv.Itoa(piece.Reference.Bis)
		pieces1[key] = true
	}

	for _, piece := range items2 {
		key := piece.ID + "|" + strconv.Itoa(piece.Reference.Von) + "|" + strconv.Itoa(piece.Reference.Bis)
		pieces2[key] = true
	}

	// Check if maps are identical
	for key := range pieces1 {
		if !pieces2[key] {
			return false
		}
	}

	for key := range pieces2 {
		if !pieces1[key] {
			return false
		}
	}

	return true
}

// sortPiecesOnPage sorts pieces on a given page according to the ordering rules:
// 1. Continuation pieces come first
// 2. Within the same category (continuation/new), pieces are sorted by Order field if > 0
// 3. If no Order field or Order = 0, maintain current order
func sortPiecesOnPage(pieces []PieceByIssue, pageNumber int) []PieceByIssue {
	if len(pieces) <= 1 {
		return pieces
	}

	// Create a copy to avoid modifying the original slice
	sorted := make([]PieceByIssue, len(pieces))
	copy(sorted, pieces)

	sort.Slice(sorted, func(i, j int) bool {
		pieceA := sorted[i]
		pieceB := sorted[j]

		// Rule 1: Continuation pieces come before new pieces
		if pieceA.IsContinuation != pieceB.IsContinuation {
			return pieceA.IsContinuation // true comes before false
		}

		// Rule 2: Within same category, use Order field if both have valid orders
		orderA := pieceA.Reference.Order
		orderB := pieceB.Reference.Order

		// Both have valid orders (> 0)
		if orderA > 0 && orderB > 0 {
			return orderA < orderB
		}

		// Only A has valid order
		if orderA > 0 && orderB <= 0 {
			return true
		}

		// Only B has valid order
		if orderA <= 0 && orderB > 0 {
			return false
		}

		// Rule 3: Neither has valid order, maintain original order
		// This is automatically handled by the stable sort
		return false
	})

	return sorted
}

// CreateIndividualPagesWithMetadata creates individual page entries with metadata
func CreateIndividualPagesWithMetadata(pieces PiecesByPage, lib *xmlmodels.Library) IndividualPiecesByPage {
	individual := IndividualPiecesByPage{
		Items: make(map[int][]IndividualPieceByIssue),
		Pages: []int{},
	}

	if len(pieces.Pages) == 0 {
		return individual
	}

	// Process each page individually
	for _, page := range pieces.Pages {
		pageItems := pieces.Items[page]


		// Sort pieces according to the ordering rules
		sortedPageItems := sortPiecesOnPage(pageItems, page)

		individualItems := []IndividualPieceByIssue{}

		// Convert sorted pieces to individual pieces
		for _, piece := range sortedPageItems {
			individualPiece := IndividualPieceByIssue{
				PieceByIssue: piece,
				IssueRefs:    getPieceIssueRefs(piece.Piece, lib),
				PageIcon:     determinePageIcon(page, pieces.Pages),
			}
			individualItems = append(individualItems, individualPiece)
		}

		if len(individualItems) > 0 {
			individual.Items[page] = individualItems
			individual.Pages = append(individual.Pages, page)
		}
	}

	slices.Sort(individual.Pages)
	return individual
}

// CreateIndividualPagesWithMetadataIncludingEmpty creates individual page entries with metadata, including empty pages that have images
func CreateIndividualPagesWithMetadataIncludingEmpty(pieces PiecesByPage, lib *xmlmodels.Library, imagePages map[int][]IssuePage) IndividualPiecesByPage {
	individual := IndividualPiecesByPage{
		Items: make(map[int][]IndividualPieceByIssue),
		Pages: []int{},
	}

	// Collect all page numbers that should be included (from pieces and from images)
	allPageNumbers := make(map[int]bool)

	// Add pages with content
	for _, page := range pieces.Pages {
		allPageNumbers[page] = true
	}

	// Add pages with images (even if they have no content)
	for _, pages := range imagePages {
		for _, page := range pages {
			if page.Available {
				allPageNumbers[page.PageNumber] = true
			}
		}
	}

	// Create sorted list of all page numbers for icon determination
	allPagesList := make([]int, 0, len(allPageNumbers))
	for pageNum := range allPageNumbers {
		allPagesList = append(allPagesList, pageNum)
	}
	slices.Sort(allPagesList)

	// Process each page
	for pageNum := range allPageNumbers {
		pageItems := pieces.Items[pageNum]

		if len(pageItems) > 0 {
			// Page has content - process normally
			sortedPageItems := sortPiecesOnPage(pageItems, pageNum)
			individualItems := []IndividualPieceByIssue{}

			for _, piece := range sortedPageItems {
				individualPiece := IndividualPieceByIssue{
					PieceByIssue: piece,
					IssueRefs:    getPieceIssueRefs(piece.Piece, lib),
					PageIcon:     determinePageIcon(pageNum, allPagesList),
				}
				individualItems = append(individualItems, individualPiece)
			}

			individual.Items[pageNum] = individualItems
		} else {
			// Page is empty but has images - create empty entry
			individual.Items[pageNum] = []IndividualPieceByIssue{}
		}

		individual.Pages = append(individual.Pages, pageNum)
	}

	slices.Sort(individual.Pages)
	return individual
}

// determinePageIcon determines the icon type for a page based on newspaper layout positioning
func determinePageIcon(pageNum int, allPages []int) string {
	if len(allPages) == 0 {
		return "first"
	}

	// Create a copy to avoid modifying the original slice
	sortedPages := make([]int, len(allPages))
	copy(sortedPages, allPages)
	slices.Sort(sortedPages)
	firstPage := sortedPages[0]
	lastPage := sortedPages[len(sortedPages)-1]

	// Newspaper layout logic based on physical page positioning
	if pageNum == firstPage {
		return "first" // Front page - normal icon
	} else if pageNum == lastPage {
		return "last" // Back page - mirrored icon
	} else {
		// For middle pages in a 4-page newspaper layout:
		// Page 2 (left side of middle spread) should be "even"
		// Page 3 (right side of middle spread) should be "odd"
		// But we need to consider the actual page position in layout
		if pageNum == firstPage+1 {
			return "even" // Page 2 - black + mirrored grey
		} else if pageNum == lastPage-1 {
			return "odd" // Page 3 - grey + black
		} else {
			// For newspapers with more than 4 pages, use alternating pattern
			if pageNum%2 == 0 {
				return "even"
			} else {
				return "odd"
			}
		}
	}
}

// getPieceIssueRefs gets all issue references for a piece
func getPieceIssueRefs(piece xmlmodels.Piece, lib *xmlmodels.Library) []xmlmodels.IssueRef {
	refs := []xmlmodels.IssueRef{}

	for _, ref := range piece.IssueRefs {
		refs = append(refs, ref)
	}

	return refs
}

// calculateGridLayout calculates grid positioning for newspaper pages
func calculateGridLayout(pages []IssuePage) []IssuePage {
	if len(pages) == 0 {
		return pages
	}

	result := make([]IssuePage, len(pages))
	copy(result, pages)

	for i := range result {
		page := &result[i]
		pageNum := i + 1 // 1-based page numbers

		// Determine grid position based on newspaper layout logic
		switch pageNum {
		case 1:
			// Page 1: Left, Row 1
			page.GridColumn = 1
			page.GridRow = 1
			page.PageIcon = "first"
		case 2, 3:
			// Pages 2-3: Double spread with header, Row 2
			if pageNum == 2 {
				page.GridColumn = 1
				page.HasHeader = true
				page.HeaderText = fmt.Sprintf("%d-%d", pageNum, pageNum+1)
			} else {
				page.GridColumn = 2
			}
			page.GridRow = 2
			page.PageIcon = determinePageIconForLayout(pageNum)
		case 4:
			// Page 4: Right, Row 3
			page.GridColumn = 2
			page.GridRow = 3
			page.PageIcon = "last"
		default:
			// Handle additional pages if needed
			page.GridColumn = ((pageNum - 1) % 2) + 1
			page.GridRow = ((pageNum - 1) / 2) + 1
			page.PageIcon = determinePageIconForLayout(pageNum)
		}
	}

	return result
}

// determinePageIconForLayout determines icon for layout positioning
func determinePageIconForLayout(pageNum int) string {
	if pageNum%2 == 0 {
		return "even"
	}
	return "odd"
}

func LoadIssueImages(issue xmlmodels.Issue) (IssueImages, error) {
	// Initialize registry if not already done
	if err := initImageRegistry(); err != nil {
		return IssueImages{}, err
	}

	year := issue.Datum.When.Year
	issueNo := issue.Number.No

	images := IssueImages{
		MainPages:       make([]IssuePage, 0),
		AdditionalPages: make(map[int][]IssuePage),
		HasImages:       false,
	}

	// Get all image files for this year-issue combination
	yearIssueKey := fmt.Sprintf("%d-%d", year, issueNo)
	issueFiles := imageRegistry.ByYearIssue[yearIssueKey]

	// Separate main pages from beilage pages
	var mainFiles []ImageFile
	var beilageFiles []ImageFile

	for _, file := range issueFiles {
		if file.IsBeilage {
			beilageFiles = append(beilageFiles, file)
		} else {
			mainFiles = append(mainFiles, file)
		}
	}

	// Create main pages - match with issue page range
	for page := issue.Von; page <= issue.Bis; page++ {
		var foundFile *ImageFile

		// Look for a file that has this page number
		for _, file := range mainFiles {
			if file.Page == page {
				foundFile = &file
				break
			}
		}

		if foundFile != nil {
			images.HasImages = true
			// Use preview path if available, otherwise fallback to original
			previewPath := foundFile.PreviewPath
			if previewPath == "" {
				previewPath = foundFile.Path
			}
			// Use JPEG path if available, otherwise fallback to primary
			jpegPath := foundFile.JpegPath
			if jpegPath == "" {
				jpegPath = foundFile.Path
			}
			images.MainPages = append(images.MainPages, IssuePage{
				PageNumber:  page,
				ImagePath:   foundFile.Path,
				PreviewPath: previewPath,
				JpegPath:    jpegPath,
				Available:   true,
			})
		} else {
			images.MainPages = append(images.MainPages, IssuePage{
				PageNumber:  page,
				ImagePath:   "",
				PreviewPath: "",
				JpegPath:    "",
				Available:   false,
			})
		}
	}

	// Create beilage pages - use ALL detected beilage files regardless of XML definitions
	if len(beilageFiles) > 0 {
		beilagePages := make([]IssuePage, 0)

		// Add ALL beilage files found for this issue
		for _, file := range beilageFiles {
			images.HasImages = true
			// Use preview path if available, otherwise fallback to original
			previewPath := file.PreviewPath
			if previewPath == "" {
				previewPath = file.Path
			}
			// Use JPEG path if available, otherwise fallback to primary
			jpegPath := file.JpegPath
			if jpegPath == "" {
				jpegPath = file.Path
			}
			beilagePages = append(beilagePages, IssuePage{
				PageNumber:  file.Page,
				ImagePath:   file.Path,
				PreviewPath: previewPath,
				JpegPath:    jpegPath,
				Available:   true,
			})
		}

		if len(beilagePages) > 0 {
			// Calculate grid layout for beilage pages
			beilagePages = calculateGridLayout(beilagePages)
			// Use beilage number 1 as default
			images.AdditionalPages[1] = beilagePages
		}
	}

	// Calculate grid layout for main pages
	if len(images.MainPages) > 0 {
		images.MainPages = calculateGridLayout(images.MainPages)
	}

	return images, nil
}

func initImageRegistry() error {
	if imageRegistry != nil {
		return nil
	}

	imageRegistry = &ImageRegistry{
		Files:       make([]ImageFile, 0),
		ByYearIssue: make(map[string][]ImageFile),
		ByYearPage:  make(map[string]ImageFile),
	}

	// Temporary map to collect all files by their base name (year-issue-page)
	tempFiles := make(map[string]*ImageFile)

	err := filepath.Walk("pictures", func(path string, info os.FileInfo, err error) error {
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
		currentPath := fmt.Sprintf("/static/pictures/%s", path[9:]) // Remove "pictures/" prefix
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
		previewFullPath := filepath.Join("pictures", fmt.Sprintf("%d", imageFile.Year), previewFilename)
		if _, err := os.Stat(previewFullPath); err == nil {
			imageFile.PreviewPath = fmt.Sprintf("/static/pictures/%d/%s", imageFile.Year, previewFilename)
		}
	}

	// Convert temp map to final registry structures
	for _, imageFile := range tempFiles {
		imageRegistry.Files = append(imageRegistry.Files, *imageFile)

		yearIssueKey := fmt.Sprintf("%d-%d", imageFile.Year, imageFile.Issue)
		imageRegistry.ByYearIssue[yearIssueKey] = append(imageRegistry.ByYearIssue[yearIssueKey], *imageFile)

		if !imageFile.IsBeilage {
			yearPageKey := fmt.Sprintf("%d-%d", imageFile.Year, imageFile.Page)
			imageRegistry.ByYearPage[yearPageKey] = *imageFile
		}
	}

	return nil
}
