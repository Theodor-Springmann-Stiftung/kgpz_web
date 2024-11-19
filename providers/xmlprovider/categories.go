package xmlprovider

import (
	"encoding/xml"
	"fmt"
)

type CategoryProvider struct {
	XMLProvider[Categories]
}

type Categories struct {
	XMLName  xml.Name   `xml:"kategorien"`
	Category []Category `xml:"kategorie"`
}

type Category struct {
	XMLName  xml.Name `xml:"kategorie"`
	Names    []string `xml:"name"`
	SortName string   `xml:"sortiername"`
	Identifier
	AnnotationNote
}

func (c Categories) Append(data Categories) Categories {
	c.Category = append(c.Category, data.Category...)
	return c
}

func (c Categories) String() string {
	var res []string
	for _, category := range c.Category {
		res = append(res, category.String())
	}

	return fmt.Sprintf("Categories: %v", res)
}

func (c *Category) String() string {
	return fmt.Sprintf("ID: %s\nNames: %v\nSortName: %s\nAnnotations: %v\nNotes: %v\n", c.ID, c.Names, c.SortName, c.Annotations, c.Notes)
}

func NewCategoryProvider(paths []string) *CategoryProvider {
	return &CategoryProvider{XMLProvider: XMLProvider[Categories]{paths: paths}}
}
