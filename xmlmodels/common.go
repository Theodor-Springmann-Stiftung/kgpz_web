package xmlmodels

import (
	"encoding/xml"
	"errors"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/xsdtime"
)

var InvalidDateError = errors.New("Invalid date")

const DateLayout = "2006-01-02"

type KGPZDate struct {
	XMLName xml.Name `xml:"datum"`
	DateAttributes
	Value
}

type DateAttributes struct {
	When      xsdtime.XSDDate `xml:"when,attr"`
	NotBefore xsdtime.XSDDate `xml:"notBefore,attr"`
	NotAfter  xsdtime.XSDDate `xml:"notAfter,attr"`
	From      xsdtime.XSDDate `xml:"from,attr"`
	To        xsdtime.XSDDate `xml:"to,attr"`
	Cert      string          `xml:"cert,attr"`
}

type URL struct {
	XMLName xml.Name `xml:"url"`
	Address string   `xml:"address,attr"`
	Value
}

type AnnotationNote struct {
	Annotations []Annotation `xml:"anmerkung"`
	Notes       []Note       `xml:"vermerk"`
}

type Annotation struct {
	XMLName xml.Name `xml:"anmerkung"`
	Value
	Inner
}

type Note struct {
	XMLName xml.Name `xml:"vermerk"`
	Value
	Inner
}

type Identifier struct {
	ID   string `xml:"id,attr"`
	keys []string
}

func (i Identifier) Keys() []string {
	if len(i.keys) > 0 {
		return i.keys
	}
	i.keys = []string{i.ID}
	return i.keys
}

type Value struct {
	Chardata string `xml:",chardata"`
}

type Inner struct {
	InnerXML string `xml:",innerxml"`
}
