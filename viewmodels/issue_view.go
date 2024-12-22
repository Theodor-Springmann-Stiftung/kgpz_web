package viewmodels

import (
	"fmt"
	"log/slog"
	"maps"
	"slices"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/functions"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

type PieceListitemVM struct {
	xmlprovider.Piece
	// TODO: this is a bit hacky, but it refences the page number of the piece in the issue
	Reference xmlprovider.IssueRef
}

type PiecesByPage struct {
	Items map[int][]PieceListitemVM
	Pages []int
}

// TODO: Next & Prev
type IssueVM struct {
	IssueListitemVM
	Pieces           PiecesByPage
	AdditionalPieces PiecesByPage
}

func NewSingleIssueView(y string, no string, lib *xmlprovider.Library) (*IssueVM, error) {
	issue := lib.Issues.Item(y + "-" + no)
	if issue == nil {
		return nil, fmt.Errorf("No issue found for %v-%v", y, no)
	}

	ivm, err := ListitemFromIssue(*issue)
	if err != nil {
		return nil, err
	}

	sivm := IssueVM{IssueListitemVM: *ivm}

	ppi, ppa, err := PiecesForIsssue(lib, *issue)

	slices.Sort(ppi.Pages)
	slices.Sort(ppa.Pages)

	sivm.Pieces = *ppi
	sivm.AdditionalPieces = *ppa

	return &sivm, nil
}

func PiecesForIsssue(lib *xmlprovider.Library, issue xmlprovider.Issue) (*PiecesByPage, *PiecesByPage, error) {
	date := issue.Datum.Date()
	if date == nil {
		return nil, nil, fmt.Errorf("Issue has no date")
	}

	year := date.Year()

	ppi := PiecesByPage{Items: make(map[int][]PieceListitemVM)}
	ppa := PiecesByPage{Items: make(map[int][]PieceListitemVM)}

	slog.Debug(fmt.Sprintf("Checking piece for year %v, number %v", year, issue.Number.No))
	for _, piece := range lib.Pieces.Array {

		if d, ok := piece.ReferencesIssue(year, issue.Number.No); ok {
			slog.Debug(fmt.Sprintf("Found piece %v in issue %v-%v", piece, year, issue.Number.No))
			p := PieceListitemVM{Piece: piece, Reference: *d}
			if d.Beilage > 0 {
				functions.MapArrayInsert(ppa.Items, d.Von, p)
			} else {
				functions.MapArrayInsert(ppi.Items, d.Von, p)
			}
		}
	}

	ppi.Pages = slices.Collect(maps.Keys(ppi.Items))
	ppa.Pages = slices.Collect(maps.Keys(ppa.Items))

	return &ppi, &ppa, nil
}
