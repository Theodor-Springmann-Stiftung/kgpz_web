package xmlprovider

import (
	"encoding/xml"
	"fmt"
)

type WorkProvider struct {
	XMLProvider[Works]
}

type Works struct {
	XMLName xml.Name `xml:"werke"`
	Work    []Work   `xml:"werk"`
}

type Work struct {
	XMLName        xml.Name   `xml:"werk"`
	URLs           []URL      `xml:"url"`
	Citation       Citation   `xml:"zitation"`
	PreferredTitle string     `xml:"preferred"`
	Akteur         []AgentRef `xml:"akteur"`
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

func (w Works) Append(data Works) Works {
	w.Work = append(w.Work, data.Work...)
	return w
}

func (w Works) String() string {
	var res []string
	for _, work := range w.Work {
		res = append(res, work.String())
	}

	return fmt.Sprintf("Works: %v", res)
}

func (w *Work) String() string {
	return fmt.Sprintf("URLs: %v, Citation: %v, PreferredTitle: %s, Akteur: %v, Identifier: %v, AnnotationNote: %v\n", w.URLs, w.Citation, w.PreferredTitle, w.Akteur, w.Identifier, w.AnnotationNote)
}

func NewWorkProvider(paths []string) *WorkProvider {
	return &WorkProvider{XMLProvider: XMLProvider[Works]{paths: paths}}
}
