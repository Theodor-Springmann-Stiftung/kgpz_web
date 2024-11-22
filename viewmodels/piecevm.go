package viewmodels

import (
	"slices"
	"strconv"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

type PieceViewModel struct {
	xmlprovider.Piece
	// TODO: this is a bit hacky, but it refences the page number of the piece in the issue
	Von int
	Bis int
}

func NewPieceView(p xmlprovider.Piece) (PieceViewModel, error) {
	return PieceViewModel{Piece: p}, nil
}

type PieceListViewModel struct {
	IssuePieces      []PieceViewModel
	AdditionalPieces []PieceViewModel
}

func PieceListViewModelForIssue(lib *xmlprovider.Library, y string, No string) (*PieceListViewModel, error) {
	p := PieceListViewModel{}
	err := p.piecesForIsssue(y, No, lib)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (plvm *PieceListViewModel) piecesForIsssue(y string, No string, lib *xmlprovider.Library) error {
	lookfor := y + "-" + No + "-"
	noi, err := strconv.Atoi(No)
	if err != nil {
		return err
	}

	lib.Pieces.Items.Range(func(key, value interface{}) bool {
		k := key.(string)
		if strings.HasPrefix(k, lookfor) {
			a := value.(xmlprovider.Piece)
			p, err := NewPieceView(a)
			if err != nil {
				logging.ObjErr(&a, err)
				return true
			}

			if strings.HasPrefix(k, lookfor+"b-") {
				for _, i := range p.AdditionalRef {
					if i.Datum == y && i.Nr == noi {
						p.Von = i.Von
						p.Bis = i.Bis
					}
				}
				plvm.AdditionalPieces = append(plvm.AdditionalPieces, p)
			} else {
				for _, i := range p.IssueRefs {
					if i.Datum == y && i.Nr == noi {
						p.Von = i.Von
						p.Bis = i.Bis
					}
				}
				plvm.IssuePieces = append(plvm.IssuePieces, p)
			}
		}
		return true
	})

	return nil
}

func (plvm *PieceListViewModel) Sort(y string, no int) {
	SortPiecesByPage(&plvm.IssuePieces, y, no)
	SortPiecesByPage(&plvm.AdditionalPieces, y, no)
}

func SortPiecesByPage(pieces *[]PieceViewModel, y string, no int) {
	slices.SortFunc(*pieces, func(i, j PieceViewModel) int {
		if i.Von == j.Von {
			if i.Bis >= 0 {
				return 1
			} else if j.Bis >= 0 {
				return -1
			} else {
				return 0
			}
		}

		if i.Von > j.Von {
			return 1
		}

		return -1
	})
}
