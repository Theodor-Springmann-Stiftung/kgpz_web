package xmlmodels

import (
	"encoding/json"
	"encoding/xml"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

const (
	WORK_TYPE = "work"
)

type Work struct {
	XMLName        xml.Name   `xml:"werk"`
	URLs           []URL      `xml:"url"`
	Citation       Citation   `xml:"zitation"`
	PreferredTitle string     `xml:"preferred"`
	AgentRefs      []AgentRef `xml:"akteur"`
	Identifier
	AnnotationNote
}

type Citation struct {
	XMLName xml.Name `xml:"zitation"`
	Title   string   `xml:"title"`
	Year    []string `xml:"year"`
	Value
	Inner
}

// HTML returns the HTML-transformed version of the citation
func (c Citation) HTML() string {
	if c.Inner.InnerXML != "" {
		return transformToHTML(c.Inner.InnerXML)
	}
	return c.Value.Chardata
}

func (w Work) References() xmlprovider.ResolvingMap[Work] {
	refs := make(xmlprovider.ResolvingMap[Work])

	for _, ref := range w.AgentRefs {
		refs[ref.Type()] = append(refs[ref.Type()], xmlprovider.Resolved[Work]{
			Item:       &w,            // Reference to the current Work item
			Reference:  ref.Ref,       // Reference ID
			Category:   ref.Category,  // Category of the reference
			Cert:       !ref.Unsicher, // Certainty flag (true if not unsure)
			Conjecture: false,
			Comment:    ref.Inner.InnerXML,
		})
	}

	return refs
}
func (w Work) String() string {
	data, _ := json.MarshalIndent(w, "", "  ")
	return string(data)
}

func (w Work) Readable(lib *Library) map[string]interface{} {
	ret := map[string]interface{}{
		"ID":             w.ID,
		"PreferredTitle": w.PreferredTitle,
		"Title":          w.Citation.Title,
		"Year":           w.Citation.Year,
		"CitationTitle":  w.Citation.Title,
		"CitationHTML":   w.Citation.HTML(),
	}

	for k, v := range w.AnnotationNote.Readable() {
		ret[k] = v
	}

	// Add HTML versions
	for k, v := range w.AnnotationNote.ReadableHTML() {
		ret[k] = v
	}

	agents := make([]map[string]interface{}, len(w.AgentRefs))
	for k, v := range w.AgentRefs {
		agents[k] = v.Readable(lib)
	}

	ret["Agents"] = agents

	return ret
}

func (w Work) Type() string {
	return WORK_TYPE
}
