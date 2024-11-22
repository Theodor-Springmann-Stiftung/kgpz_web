package xmlprovider

import (
	"encoding/xml"
	"fmt"
)

type Agent struct {
	XMLName  xml.Name `xml:"akteur"`
	Names    []string `xml:"name"`
	SortName string   `xml:"sortiername"`
	Life     string   `xml:"lebensdaten"`
	GND      string   `xml:"gnd"`
	Org      bool     `xml:"org,attr"`
	Identifier
	AnnotationNote
	SerializedItem
}

func (a Agent) String() string {
	return fmt.Sprintf("ID: %s\nNames: %v\nSortName: %s\nLife: %s\nGND: %s\nAnnotations: %v\nNotes: %v\n", a.ID, a.Names, a.SortName, a.Life, a.GND, a.Annotations, a.Notes)
}
