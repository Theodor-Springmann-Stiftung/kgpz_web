package viewmodels

import (
	"fmt"
	"maps"
	"os"
	"path/filepath"
	"slices"
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
	ImagePath   string
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
	Year      int
	Issue     int
	Page      int
	IsBeilage bool
	BeilageNo int
	Filename  string
	Path      string
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
	Next                 *xmlmodels.Issue
	Prev                 *xmlmodels.Issue
	Pieces               IndividualPiecesByPage
	AdditionalPieces     IndividualPiecesByPage
	Images               IssueImages
	HasBeilageButton     bool   // Whether to show beilage navigation button
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

	var Next *xmlmodels.Issue = nil
	var Prev *xmlmodels.Issue = nil
	if next != nil {
		Next = &*next
	}
	if prev != nil {
		Prev = &*prev
	}

	sivm := IssueVM{Issue: *issue, Next: Next, Prev: Prev}

	lib.Issues.Unlock()
	ppi, ppa, err := PiecesForIsssue(lib, *issue)
	if err != nil {
		return nil, err
	}

	slices.Sort(ppi.Pages)
	slices.Sort(ppa.Pages)

	// Group consecutive continuation pieces
	sivm.Pieces = CreateIndividualPagesWithMetadata(ppi, lib)
	sivm.AdditionalPieces = CreateIndividualPagesWithMetadata(ppa, lib)

	images, err := LoadIssueImages(*issue)
	if err != nil {
		return nil, err
	}
	sivm.Images = images
	sivm.HasBeilageButton = len(sivm.AdditionalPieces.Pages) > 0

	return &sivm, nil
}

func PiecesForIsssue(lib *xmlmodels.Library, issue xmlmodels.Issue) (PiecesByPage, PiecesByPage, error) {
	year := issue.Datum.When.Year

	ppi := PiecesByPage{Items: make(map[int][]PieceByIssue)}
	ppa := PiecesByPage{Items: make(map[int][]PieceByIssue)}

	// TODO: will we have to lock this, if we shutdown the server while loading the library?
	lib.Pieces.Lock()
	defer lib.Pieces.Unlock()

	for _, piece := range lib.Pieces.Array {
		if d, ok := piece.ReferencesIssue(year, issue.Number.No); ok {
			// Add main entry on starting page
			p := PieceByIssue{Piece: piece, Reference: *d, IsContinuation: false}
			if d.Beilage > 0 {
				functions.MapArrayInsert(ppa.Items, d.Von, p)
			} else {
				functions.MapArrayInsert(ppi.Items, d.Von, p)
			}

			// Add continuation entries for subsequent pages (if Bis > Von)
			if d.Bis > d.Von {
				for page := d.Von + 1; page <= d.Bis; page++ {
					pContinuation := PieceByIssue{Piece: piece, Reference: *d, IsContinuation: true}
					if d.Beilage > 0 {
						functions.MapArrayInsert(ppa.Items, page, pContinuation)
					} else {
						functions.MapArrayInsert(ppi.Items, page, pContinuation)
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
		individualItems := []IndividualPieceByIssue{}

		// First add all continuation pieces
		for _, piece := range pageItems {
			if piece.IsContinuation {
				individualPiece := IndividualPieceByIssue{
					PieceByIssue: piece,
					IssueRefs:    getPieceIssueRefs(piece.Piece, lib),
					PageIcon:     determinePageIcon(page, pieces.Pages),
				}
				individualItems = append(individualItems, individualPiece)
			}
		}

		// Then add all non-continuation pieces
		for _, piece := range pageItems {
			if !piece.IsContinuation {
				individualPiece := IndividualPieceByIssue{
					PieceByIssue: piece,
					IssueRefs:    getPieceIssueRefs(piece.Piece, lib),
					PageIcon:     determinePageIcon(page, pieces.Pages),
				}
				individualItems = append(individualItems, individualPiece)
			}
		}

		if len(individualItems) > 0 {
			individual.Items[page] = individualItems
			individual.Pages = append(individual.Pages, page)
		}
	}

	slices.Sort(individual.Pages)
	return individual
}


// determinePageIcon determines the icon type for a page based on newspaper layout positioning
func determinePageIcon(pageNum int, allPages []int) string {
	if len(allPages) == 0 {
		return "first"
	}

	slices.Sort(allPages)
	firstPage := allPages[0]
	lastPage := allPages[len(allPages)-1]

	// Newspaper layout logic based on physical page positioning
	if pageNum == firstPage {
		return "first"  // Front page - normal icon
	} else if pageNum == lastPage {
		return "last"   // Back page - mirrored icon
	} else {
		// For middle pages in a 4-page newspaper layout:
		// Page 2 (left side of middle spread) should be "even"
		// Page 3 (right side of middle spread) should be "odd"
		// But we need to consider the actual page position in layout
		if pageNum == firstPage+1 {
			return "even"  // Page 2 - black + mirrored grey
		} else if pageNum == lastPage-1 {
			return "odd"   // Page 3 - grey + black
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
			images.MainPages = append(images.MainPages, IssuePage{
				PageNumber: page,
				ImagePath:  foundFile.Path,
				Available:  true,
			})
		} else {
			images.MainPages = append(images.MainPages, IssuePage{
				PageNumber: page,
				ImagePath:  "",
				Available:  false,
			})
		}
	}

	// Create beilage pages - use ALL detected beilage files regardless of XML definitions
	if len(beilageFiles) > 0 {
		beilagePages := make([]IssuePage, 0)

		// Add ALL beilage files found for this issue
		for _, file := range beilageFiles {
			images.HasImages = true
			beilagePages = append(beilagePages, IssuePage{
				PageNumber: file.Page,
				ImagePath:  file.Path,
				Available:  true,
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

	return filepath.Walk("pictures", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		filename := info.Name()

		// Skip non-jpg files
		if !strings.HasSuffix(strings.ToLower(filename), ".jpg") {
			return nil
		}

		// Remove .jpg extension and split by -
		nameWithoutExt := strings.TrimSuffix(filename, ".jpg")
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

		imageFile := ImageFile{
			Year:      year,
			Issue:     issue,
			Page:      page,
			IsBeilage: isBeilage,
			BeilageNo: 1, // Default beilage number
			Filename:  filename,
			Path:      fmt.Sprintf("/static/pictures/%s", path[9:]), // Remove "pictures/" prefix
		}

		imageRegistry.Files = append(imageRegistry.Files, imageFile)

		yearIssueKey := fmt.Sprintf("%d-%d", year, issue)
		imageRegistry.ByYearIssue[yearIssueKey] = append(imageRegistry.ByYearIssue[yearIssueKey], imageFile)

		if !isBeilage {
			yearPageKey := fmt.Sprintf("%d-%d", year, page)
			imageRegistry.ByYearPage[yearPageKey] = imageFile
		}

		return nil
	})
}
