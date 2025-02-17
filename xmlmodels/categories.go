package xmlmodels

import (
	"encoding/json"
	"encoding/xml"
	"strings"
)

const (
	CATEGORY_TYPE = "category"
)

type Category struct {
	XMLName  xml.Name `xml:"kategorie"`
	Names    []string `xml:"name"`
	SortName string   `xml:"sortiername"`
	Identifier
	AnnotationNote
}

func (c Category) String() string {
	data, _ := json.MarshalIndent(c, "", "  ")
	return string(data)
}

func (c Category) Readable(_ *Library) map[string]interface{} {
	ret := map[string]interface{}{
		"ID":    c.ID,
		"Names": strings.Join(c.Names, "; "),
	}

	for k, v := range c.AnnotationNote.Readable() {
		ret[k] = v
	}

	return ret
}

func (c Category) Type() string {
	return CATEGORY_TYPE
}
