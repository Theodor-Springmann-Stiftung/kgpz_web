package xmlmodels

import (
	"encoding/json"
	"encoding/xml"
	"strconv"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

const (
	PIECE_TYPE = "piece"
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
	data, _ := json.MarshalIndent(p, "", "  ")
	return string(data)
}


func (p Piece) Categories() map[string]bool {
	cats := make(map[string]bool)
	for _, c := range p.CategoryRefs {
		cats[c.Category] = true
	}

	for _, i := range p.IssueRefs {
		cats[i.Category] = true
	}

	for _, i := range p.PlaceRefs {
		cats[i.Category] = true
	}

	for _, i := range p.AgentRefs {
		if i.Category == "" {
			cats["autor"] = true
		}
		cats[i.Category] = true
	}

	for _, i := range p.WorkRefs {
		if i.Category == "" {
			cats["rezension"] = true
		}
		cats[i.Category] = true
	}

	for _, i := range p.PieceRefs {
		cats[i.Category] = true
	}

	return cats
}

func (p Piece) Keys() []string {
	// All pieces now have XML IDs, so we just return the ID
	return []string{p.ID}
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

// INFO: we can't use a pointer reciever here, the interface won't allow it
func (p Piece) References() xmlprovider.ResolvingMap[Piece] {
	refs := make(xmlprovider.ResolvingMap[Piece])
	x := CategoryRef{}

	for _, ref := range p.CategoryRefs {
		if ref.Category != "" {
			refs[x.Type()] = append(refs[x.Type()], xmlprovider.Resolved[Piece]{
				Item:       &p,
				Reference:  ref.Category,
				Cert:       !ref.Unsicher,
				Conjecture: false,
				Comment:    ref.Inner.InnerXML,
			})
		}
	}

	for _, ref := range p.IssueRefs {
		if ref.When.Year == 0 || ref.Nr == 0 {
			continue
		}
		if ref.Category != "" {
			refs[x.Type()] = append(refs[x.Type()], xmlprovider.Resolved[Piece]{
				Item:       &p,
				Reference:  ref.Category,
				Cert:       !ref.Unsicher,
				Conjecture: false,
				Comment:    ref.Inner.InnerXML,
			})
		}
		refs[ref.Type()] = append(refs[ref.Type()], xmlprovider.Resolved[Piece]{
			Item:       &p,
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
			refs[x.Type()] = append(refs[x.Type()], xmlprovider.Resolved[Piece]{
				Item:       &p,
				Reference:  ref.Category,
				Cert:       !ref.Unsicher,
				Conjecture: false,
				Comment:    ref.Inner.InnerXML,
			})
		}
		refs[ref.Type()] = append(refs[ref.Type()], xmlprovider.Resolved[Piece]{
			Item:       &p,
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
			refs[x.Type()] = append(refs[x.Type()], xmlprovider.Resolved[Piece]{
				Item:       &p,
				Reference:  ref.Category,
				Cert:       !ref.Unsicher,
				Conjecture: false,
				Comment:    ref.Inner.InnerXML,
			})
		}
		refs[ref.Type()] = append(refs[ref.Type()], xmlprovider.Resolved[Piece]{
			Item:       &p,
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
			refs[x.Type()] = append(refs[x.Type()], xmlprovider.Resolved[Piece]{
				Item:       &p,
				Reference:  ref.Category,
				Cert:       !ref.Unsicher,
				Conjecture: false,
				Comment:    ref.Inner.InnerXML,
			})
		}
		refs[ref.Type()] = append(refs[ref.Type()], xmlprovider.Resolved[Piece]{
			Item:       &p,
			Reference:  ref.Ref,
			Category:   ref.Category,
			Cert:       !ref.Unsicher,
			Conjecture: false,
			MetaData:   map[string]string{},
		})
	}

	for _, ref := range p.PieceRefs {
		if ref.Category != "" {
			refs[x.Type()] = append(refs[x.Type()], xmlprovider.Resolved[Piece]{
				Item:       &p,
				Reference:  ref.Category,
				Cert:       !ref.Unsicher,
				Conjecture: false,
				Comment:    ref.Inner.InnerXML,
				MetaData:   map[string]string{},
			})
		}
		refs[ref.Type()] = append(refs[ref.Type()], xmlprovider.Resolved[Piece]{
			Item:       &p,
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

func (p Piece) Readable(lib *Library) map[string]interface{} {
	data := make(map[string]interface{})
	data["Title"] = p.Title
	data["Incipit"] = p.Incipit

	for k, v := range p.AnnotationNote.Readable() {
		data[k] = v
	}

	agents := make([]map[string]interface{}, len(p.AgentRefs))
	for k, v := range p.AgentRefs {
		agents[k] = v.Readable(lib)
	}
	data["Agents"] = agents

	works := make([]map[string]interface{}, len(p.WorkRefs))
	for k, v := range p.WorkRefs {
		works[k] = v.Readable(lib)
	}
	data["Works"] = works

	places := make([]map[string]interface{}, len(p.PlaceRefs))
	for k, v := range p.PlaceRefs {
		places[k] = v.Readable(lib)
	}
	data["Places"] = places

	categories := make([]map[string]interface{}, len(p.CategoryRefs))
	for k, v := range p.CategoryRefs {
		categories[k] = v.Readable(lib)
	}
	data["Categories"] = categories

	issuerefs := make([]map[string]interface{}, len(p.IssueRefs))
	for k, v := range p.IssueRefs {
		issuerefs[k] = v.Readable(lib)
	}
	data["Issues"] = issuerefs

	return data
}

func (p Piece) Type() string {
	return PIECE_TYPE
}
