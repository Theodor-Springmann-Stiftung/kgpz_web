package xmlprovider

import (
	"encoding/xml"
	"fmt"
)

type Work struct {
	XMLName        xml.Name   `xml:"werk"`
	URLs           []URL      `xml:"url"`
	Citation       Citation   `xml:"zitation"`
	PreferredTitle string     `xml:"preferred"`
	Akteur         []AgentRef `xml:"akteur"`
	Identifier
	AnnotationNote
	SerializedItem
}

type Citation struct {
	XMLName xml.Name `xml:"zitation"`
	Title   string   `xml:"title"`
	Year    []string `xml:"year"`
	Value
	Inner
}

func (w Work) String() string {
	return fmt.Sprintf("URLs: %v, Citation: %v, PreferredTitle: %s, Akteur: %v, Identifier: %v, AnnotationNote: %v\n", w.URLs, w.Citation, w.PreferredTitle, w.Akteur, w.Identifier, w.AnnotationNote)
}
