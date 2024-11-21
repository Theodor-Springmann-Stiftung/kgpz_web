package xmlprovider

import (
	"encoding/xml"
	"fmt"
)

type Category struct {
	XMLName  xml.Name `xml:"kategorie"`
	Names    []string `xml:"name"`
	SortName string   `xml:"sortiername"`
	Identifier
	AnnotationNote
}

func (c Category) String() string {
	return fmt.Sprintf("ID: %s\nNames: %v\nSortName: %s\nAnnotations: %v\nNotes: %v\n", c.ID, c.Names, c.SortName, c.Annotations, c.Notes)
}
