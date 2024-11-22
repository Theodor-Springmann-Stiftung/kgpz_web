package viewmodels

import (
	"strconv"
	"strings"

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
	logging.Info(strconv.Itoa(len(lib.Pieces.Everything())) + "pieces in library")

	lookfor := y + "-" + No
	lib.Pieces.Items.Range(func(key, value interface{}) bool {
		k := key.(string)
		if strings.HasPrefix(k, lookfor) {
			a := value.(xmlprovider.Piece)
			p, err := NewPieceView(a)
			if err != nil {
				logging.ObjErr(&a, err)
				return true
			}
			sivm.Pieces = append(sivm.Pieces, p)
		}
		return true
	})

	return &sivm, nil
}
