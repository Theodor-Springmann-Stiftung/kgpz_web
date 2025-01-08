package xmlmodels

import (
	"encoding/json"
	"encoding/xml"
	"strconv"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
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

func (p Piece) Name() string {
	return "piece"
}

func (p Piece) String() string {
	data, _ := json.MarshalIndent(p, "", "  ")
	return string(data)
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

func (p Piece) References() xmlprovider.ResolvingMap[Piece] {
	refs := make(xmlprovider.ResolvingMap[Piece])
	x := CategoryRef{}

	for _, ref := range p.IssueRefs {
		if ref.When.Year == 0 || ref.Nr == 0 {
			continue
		}
		if ref.Category != "" {
			refs[x.Name()] = append(refs[x.Name()], xmlprovider.Resolved[Piece]{
				Reference:  ref.Category,
				Cert:       !ref.Unsicher,
				Conjecture: false,
				Comment:    ref.Inner.InnerXML,
			})
		}
		refs[ref.Name()] = append(refs[ref.Name()], xmlprovider.Resolved[Piece]{
			Reference:  strconv.Itoa(ref.When.Year) + "-" + strconv.Itoa(ref.Nr),
			Category:   ref.Category,
			Cert:       !ref.Unsicher,
			Conjecture: false,
			Comment:    ref.Inner.InnerXML,
			MetaData:   map[string]string{"Von": strconv.Itoa(ref.Von), "Bis": strconv.Itoa(ref.Bis)},
		})
	}

	for _, ref := range p.PlaceRefs {
		if ref.Category != "" {
			refs[x.Name()] = append(refs[x.Name()], xmlprovider.Resolved[Piece]{
				Reference:  ref.Category,
				Cert:       !ref.Unsicher,
				Conjecture: false,
				Comment:    ref.Inner.InnerXML,
			})
		}
		refs[ref.Name()] = append(refs[ref.Name()], xmlprovider.Resolved[Piece]{
			Reference:  ref.Ref,
			Category:   ref.Category,
			Cert:       !ref.Unsicher,
			Conjecture: false,
			Comment:    ref.Inner.InnerXML,
			MetaData:   map[string]string{},
		})
	}

	for _, ref := range p.AgentRefs {
		if ref.Category != "" {
			refs[x.Name()] = append(refs[x.Name()], xmlprovider.Resolved[Piece]{
				Reference:  ref.Category,
				Cert:       !ref.Unsicher,
				Conjecture: false,
				Comment:    ref.Inner.InnerXML,
			})
		}
		refs[ref.Name()] = append(refs[ref.Name()], xmlprovider.Resolved[Piece]{
			Reference:  ref.Ref,
			Category:   ref.Category,
			Cert:       !ref.Unsicher,
			Conjecture: false,
			Comment:    ref.Inner.InnerXML,
			MetaData:   map[string]string{},
		})
	}

	for _, ref := range p.WorkRefs {
		if ref.Category != "" {
			refs[x.Name()] = append(refs[x.Name()], xmlprovider.Resolved[Piece]{
				Reference:  ref.Category,
				Cert:       !ref.Unsicher,
				Conjecture: false,
				Comment:    ref.Inner.InnerXML,
			})
		}
		refs[ref.Name()] = append(refs[ref.Name()], xmlprovider.Resolved[Piece]{
			Reference:  ref.Ref,
			Category:   ref.Category,
			Cert:       !ref.Unsicher,
			Conjecture: false,
			MetaData:   map[string]string{},
		})
	}

	for _, ref := range p.PieceRefs {
		if ref.Category != "" {
			refs[x.Name()] = append(refs[x.Name()], xmlprovider.Resolved[Piece]{
				Reference:  ref.Category,
				Cert:       !ref.Unsicher,
				Conjecture: false,
				Comment:    ref.Inner.InnerXML,
				MetaData:   map[string]string{},
			})
		}
		refs[ref.Name()] = append(refs[ref.Name()], xmlprovider.Resolved[Piece]{
			Reference:  ref.Ref,
			Category:   ref.Category,
			Cert:       !ref.Unsicher,
			Conjecture: false,
			Comment:    ref.Inner.InnerXML,
			MetaData:   map[string]string{},
		})
	}

	return refs
}

func (p Piece) ReferencesAgent(a string) (*AgentRef, bool) {
	for _, i := range p.AgentRefs {
		if strings.HasPrefix(i.Ref, a) {
			return &i, true
		}
	}
	return nil, false
}

func (p Piece) ReferencesWork(id string) (*WorkRef, bool) {
	for _, w := range p.WorkRefs {
		if w.Ref == id {
			return &w, true
		}
	}
	return nil, false
}
