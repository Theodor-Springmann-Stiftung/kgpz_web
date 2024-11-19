package viewmodels

import (
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

type SingleIssueViewModel struct {
	IssueViewModel
	No          string
	Year        string
	Additionals []PieceViewModel
	Pieces      []PieceViewModel
	Next        IssueViewModel
	Prev        IssueViewModel
}

func NewSingleIssueView(y string, No string, lib *xmlprovider.Library) (*SingleIssueViewModel, error) {
	ivm, err := IssueView(y, No, lib)
	if err != nil {
		return nil, err
	}

	sivm := SingleIssueViewModel{IssueViewModel: *ivm}

	for _, a := range lib.Pieces.Items.Piece {
		for _, r := range a.IssueRefs {
			if r.Datum == y && r.Nr == No {
				p, err := NewPieceView(a)
				if err != nil {
					logging.ObjErr(&a, err)
					continue
				}
				sivm.Pieces = append(sivm.Pieces, p)
			}
		}

		for _, r := range a.AdditionalRef {
			if r.Datum == y && r.Nr == No {
				p, err := NewPieceView(a)
				if err != nil {
					logging.ObjErr(&a, err)
					continue
				}
				sivm.Additionals = append(sivm.Additionals, p)
			}
		}
	}

	return &sivm, nil
}
