package viewmodels

import (
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
