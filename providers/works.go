package providers

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
	XMLName  xml.Name   `xml:"werk"`
	URLs     []URL      `xml:"url"`
	Citation []string   `xml:"zitation"`
	Akteur   []AgentRef `xml:"akteur"`
	Identifier
	AnnotationNote
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
	return fmt.Sprintf("ID: %s\nURLs: %v\nCitation: %v\nAnnotations: %v\nNotes: %v\n", w.ID, w.URLs, w.Citation, w.Annotations, w.Notes)
}

func NewWorkProvider(paths []string) *WorkProvider {
	return &WorkProvider{XMLProvider: XMLProvider[Works]{paths: paths}}
}
