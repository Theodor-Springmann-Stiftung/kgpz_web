package xmlmodels

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"sort"
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

// generateContentBasedID creates a deterministic ID based on piece content
func (p Piece) generateContentBasedID() string {
	var parts []string

	// Add title if available
	if len(p.Title) > 0 && p.Title[0] != "" {
		parts = append(parts, "title:"+strings.ToLower(strings.TrimSpace(p.Title[0])))
	}

	// Add incipit if available
	if len(p.Incipit) > 0 && p.Incipit[0] != "" {
		incipit := strings.ToLower(strings.TrimSpace(p.Incipit[0]))
		// Limit incipit to first 50 characters to avoid overly long IDs
		if len(incipit) > 50 {
			incipit = incipit[:50]
		}
		parts = append(parts, "incipit:"+incipit)
	}

	// Add author references
	var authors []string
	for _, agent := range p.AgentRefs {
		if agent.Category == "" || agent.Category == "autor" {
			authors = append(authors, agent.Ref)
		}
	}
	sort.Strings(authors) // Ensure consistent ordering
	if len(authors) > 0 {
		parts = append(parts, "authors:"+strings.Join(authors, ","))
	}

	// Add categories
	var categories []string
	for _, cat := range p.CategoryRefs {
		if cat.Category != "" {
			categories = append(categories, cat.Category)
		}
	}
	sort.Strings(categories) // Ensure consistent ordering
	if len(categories) > 0 {
		parts = append(parts, "categories:"+strings.Join(categories, ","))
	}

	// If we have no meaningful content, create a minimal hash from issue refs
	if len(parts) == 0 {
		// Use issue references as fallback content
		for _, issue := range p.IssueRefs {
			parts = append(parts, fmt.Sprintf("issue:%d-%d-%d-%d", issue.When.Year, issue.Nr, issue.Von, issue.Bis))
		}
		// If still no content, use a generic identifier
		if len(parts) == 0 {
			parts = append(parts, "unknown-piece")
		}
	}

	// Create hash of combined content
	content := strings.Join(parts, "|")
	hash := sha256.Sum256([]byte(content))

	// Return first 12 characters of hex hash for reasonable ID length
	return hex.EncodeToString(hash[:])[:12]
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
	// Always regenerate keys to ensure we use the new content-based logic
	ret := make([]string, 0, 3)

	// Primary ID: Use existing ID if available, otherwise content-based ID
	var primaryID string
	if p.ID != "" {
		primaryID = p.ID
	} else {
		primaryID = p.generateContentBasedID()
	}
	ret = append(ret, primaryID)

	// Create issue-specific keys using the primary ID for lookup
	for _, i := range p.IssueRefs {
		ret = append(ret, strconv.Itoa(i.When.Year)+"-"+strconv.Itoa(i.Nr)+"-"+primaryID)
	}

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
