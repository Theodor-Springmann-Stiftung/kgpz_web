package xmlmodels

import (
	"encoding/json"
	"encoding/xml"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
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

func (w Work) Name() string {
	return "work"
}

type Citation struct {
	XMLName xml.Name `xml:"zitation"`
	Title   string   `xml:"title"`
	Year    []string `xml:"year"`
	Value
	Inner
}

func (w Work) References() xmlprovider.ResolvingMap[Work] {
	refs := make(xmlprovider.ResolvingMap[Work])

	for _, ref := range w.AgentRefs {
		refs[ref.Name()] = append(refs[ref.Name()], xmlprovider.Resolved[Work]{
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
