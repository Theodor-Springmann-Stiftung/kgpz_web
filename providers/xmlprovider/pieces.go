package xmlprovider

import (
	"encoding/xml"
	"fmt"

	"github.com/google/uuid"
)

type Piece struct {
	XMLName       xml.Name        `xml:"beitrag"`
	IssueRefs     []IssueRef      `xml:"stueck"`
	PlaceRefs     []PlaceRef      `xml:"ort"`
	CategoryRefs  []CategoryRef   `xml:"kategorie"`
	AgentRefs     []AgentRef      `xml:"akteur"`
	WorkRefs      []WorkRef       `xml:"werk"`
	PieceRefs     []PieceRef      `xml:"beitrag"`
	AdditionalRef []AdditionalRef `xml:"beilage"`
	Datum         []KGPZDate      `xml:"datum"`
	Incipit       []string        `xml:"incipit"`
	Title         []string        `xml:"titel"`
	Identifier
	AnnotationNote
	SerializedItem
}

func (p Piece) String() string {
	return fmt.Sprintf("ID: %s\nIssueRefs: %v\nPlaceRefs: %v\nCategoryRefs: %v\nAgentRefs: %v\nWorkRefs: %v\nPieceRefs: %v\nAdditionalRef: %v\nIncipit: %v\nTitle: %v\nAnnotations: %v\nNotes: %v\n", p.ID, p.IssueRefs, p.PlaceRefs, p.CategoryRefs, p.AgentRefs, p.WorkRefs, p.PieceRefs, p.AdditionalRef, p.Incipit, p.Title, p.Annotations, p.Notes)
}

func (p Piece) GetIDs() []string {
	ret := make([]string, 2)
	if p.ID != "" {
		ret = append(ret, p.ID)
	}

	// TODO: sensible IDs
	uid := uuid.New()

	for _, i := range p.IssueRefs {
		ret = append(ret, i.Datum+"-"+i.Nr+"-"+uid.String())
	}

	for _, i := range p.AdditionalRef {
		ret = append(ret, i.Datum+"-"+i.Nr+"-"+uid.String())
	}
	return ret
}

// TODO: We can make this fast depending on which category to look for
// but we'll have to define rules for every single category (~35 of them)
func (p Piece) IsCat(k string) bool {
	for _, c := range p.CategoryRefs {
		if c.Category == k {
			return true
		}
	}

	for _, c := range p.WorkRefs {
		if c.Category == k {
			return true
		}
	}

	for _, c := range p.AgentRefs {
		if c.Category == k {
			return true
		}
	}

	for _, c := range p.PieceRefs {
		if c.Category == k {
			return true
		}
	}

	return false
}
