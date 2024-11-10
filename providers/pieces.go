package providers

import (
	"encoding/xml"
	"fmt"
)

type PieceProvider struct {
	XMLProvider[Pieces]
}

type Pieces struct {
	XMLName xml.Name `xml:"beitraege"`
	Piece   []Piece  `xml:"beitrag"`
}

type Piece struct {
	XMLName       xml.Name        `xml:"beitrag"`
	IssueRefs     []IssueRef      `xml:"stueck"`
	PlaceRefs     []PlaceRef      `xml:"ort"`
	CategoryRefs  []CategoryRef   `xml:"kategorie"`
	AgentRefs     []AgentRef      `xml:"akteur"`
	WorkRefs      []WorkRef       `xml:"werk"`
	PieceRefs     []PieceRef      `xml:"beitrag"`
	AdditionalRef []AdditionalRef `xml:"beilage"`
	Incipit       []string        `xml:"incipit"`
	Title         []string        `xml:"titel"`
	Identifier
	AnnotationNote
}

func (p Pieces) Append(data Pieces) Pieces {
	p.Piece = append(p.Piece, data.Piece...)
	return p
}

func (p Pieces) String() string {
	var res []string
	for _, piece := range p.Piece {
		res = append(res, piece.String())
	}

	return fmt.Sprintf("Pieces: %v", res)
}

func (p *Piece) String() string {
	return fmt.Sprintf("ID: %s\nIssueRefs: %v\nPlaceRefs: %v\nCategoryRefs: %v\nAgentRefs: %v\nWorkRefs: %v\nPieceRefs: %v\nAdditionalRef: %v\nIncipit: %v\nTitle: %v\nAnnotations: %v\nNotes: %v\n", p.ID, p.IssueRefs, p.PlaceRefs, p.CategoryRefs, p.AgentRefs, p.WorkRefs, p.PieceRefs, p.AdditionalRef, p.Incipit, p.Title, p.Annotations, p.Notes)
}

func NewPieceProvider(paths []string) *PieceProvider {
	return &PieceProvider{XMLProvider: XMLProvider[Pieces]{paths: paths}}
}
