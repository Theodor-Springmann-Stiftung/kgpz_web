package xmlmodels

import (
	"encoding/xml"
	"fmt"
)

type Place struct {
	XMLName  xml.Name `xml:"ort"`
	Names    []string `xml:"name"`
	SortName string   `xml:"sortiername"`
	Geo      string   `xml:"geonames"`
	Identifier
	AnnotationNote
}

func (p Place) String() string {
	return fmt.Sprintf("ID: %s\nNames: %v\nSortName: %s\nGeo: %s\nAnnotations: %v\nNotes: %v\n", p.ID, p.Names, p.SortName, p.Geo, p.Annotations, p.Notes)
}
