package viewmodels

import "github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"

type PieceViewModel struct {
	xmlprovider.Piece
}

func NewPieceView(p xmlprovider.Piece) (PieceViewModel, error) {
	return PieceViewModel{Piece: p}, nil
}
