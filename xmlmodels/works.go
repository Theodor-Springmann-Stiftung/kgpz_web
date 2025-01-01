package xmlmodels

import (
	"encoding/xml"
	"fmt"
	"strings"
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

func (p Work) ReferencesAgent(a string) (*AgentRef, bool) {
	for _, i := range p.AgentRefs {
		if strings.HasPrefix(i.Ref, a) {
			return &i, true
		}
	}
	return nil, false
}

type Citation struct {
	XMLName xml.Name `xml:"zitation"`
	Title   string   `xml:"title"`
	Year    []string `xml:"year"`
	Value
	Inner
}

func (w Work) String() string {
	return fmt.Sprintf("URLs: %v, Citation: %v, PreferredTitle: %s, Akteur: %v, Identifier: %v, AnnotationNote: %v\n", w.URLs, w.Citation, w.PreferredTitle, w.AgentRefs, w.Identifier, w.AnnotationNote)
}
