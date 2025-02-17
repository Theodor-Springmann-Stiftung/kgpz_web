package xmlmodels

import (
	"encoding/xml"
	"errors"
	"strings"

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
	Inner
}

type AnnotationNote struct {
	Annotations []Annotation `xml:"anmerkung"`
	Notes       []Note       `xml:"vermerk"`
}

func (an AnnotationNote) Readable() map[string]interface{} {
	ret := make(map[string]interface{})
	annnotations := make([]string, len(an.Annotations))
	for _, a := range an.Annotations {
		annnotations = append(annnotations, a.Chardata)
	}

	ret["Annotations"] = strings.Join(annnotations, "; ")

	nots := make([]string, len(an.Notes))
	for _, n := range an.Notes {
		nots = append(nots, n.Chardata)
	}

	ret["Notes"] = strings.Join(nots, "; ")
	return ret
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
	if len(i.keys) == 0 {
		i.keys = []string{i.ID}
	}
	return i.keys
}

type Reference struct {
	Ref      string `xml:"ref,attr"`
	Category string `xml:"kat,attr"`
	Unsicher bool   `xml:"unsicher,attr"`
	Inner    Inner
}

func (r Reference) Readable(lib *Library) map[string]interface{} {
	data := make(map[string]interface{})
	if r.Category != "" {
		cat := lib.Categories.Item(r.Category)
		if cat != nil {
			data["ReferenceCategory"] = cat.Names
		}
	}

	data["ReferenceComment"] = r.Inner.InnerXML
	return data
}

type Value struct {
	Chardata string `xml:",chardata"`
}

type Inner struct {
	InnerXML string `xml:",innerxml"`
}
