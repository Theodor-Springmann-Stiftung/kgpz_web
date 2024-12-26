package xmlprovider

import (
	"encoding/xml"
	"fmt"
	"strconv"
	"strings"

	"github.com/google/uuid"
)

type Piece struct {
	XMLName      xml.Name      `xml:"beitrag"`
	IssueRefs    []IssueRef    `xml:"stueck"`
	PlaceRefs    []PlaceRef    `xml:"ort"`
	CategoryRefs []CategoryRef `xml:"kategorie"`
	AgentRefs    []AgentRef    `xml:"akteur"`
	WorkRefs     []WorkRef     `xml:"werk"`
	PieceRefs    []PieceRef    `xml:"beitrag"`
	Datum        []KGPZDate    `xml:"datum"`
	Incipit      []string      `xml:"incipit"`
	Title        []string      `xml:"titel"`
	Identifier
	AnnotationNote
}

func (p Piece) String() string {
	return fmt.Sprintf("ID: %s\nIssueRefs: %v\nPlaceRefs: %v\nCategoryRefs: %v\nAgentRefs: %v\nWorkRefs: %v\nPieceRefs: %v\nIncipit: %v\nTitle: %v\nAnnotations: %v\nNotes: %v\n", p.ID, p.IssueRefs, p.PlaceRefs, p.CategoryRefs, p.AgentRefs, p.WorkRefs, p.PieceRefs, p.Incipit, p.Title, p.Annotations, p.Notes)
}

func (p Piece) Keys() []string {
	if len(p.keys) > 0 {
		return p.keys
	}

	ret := make([]string, 2)
	if p.ID != "" {
		ret = append(ret, p.ID)
	}

	// TODO: sensible IDs
	uid := uuid.New()

	for _, i := range p.IssueRefs {
		ret = append(ret, strconv.Itoa(i.When.Year)+"-"+strconv.Itoa(i.Nr)+"-"+uid.String())
	}

	p.keys = ret
	return ret
}

func (p Piece) ReferencesIssue(y, no int) (*IssueRef, bool) {
	for _, i := range p.IssueRefs {
		if i.Nr == no {
			if i.When.Year == y {
				return &i, true
			}
		}
	}

	return nil, false
}

func (p Piece) ReferencesAgent(a string) (*AgentRef, bool) {
	for _, i := range p.AgentRefs {
		if strings.HasPrefix(i.Ref, a) {
			return &i, true
		}
	}
	return nil, false
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
