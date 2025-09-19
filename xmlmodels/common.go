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

// HTML returns the HTML-transformed version of the URL text
func (u URL) HTML() string {
	if u.Inner.InnerXML != "" {
		return transformToHTML(u.Inner.InnerXML)
	}
	return u.Value.Chardata
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

// ReadableHTML returns HTML versions of annotations and notes
func (an AnnotationNote) ReadableHTML() map[string]interface{} {
	ret := make(map[string]interface{})
	annnotations := make([]string, len(an.Annotations))
	for _, a := range an.Annotations {
		annnotations = append(annnotations, a.HTML())
	}

	ret["AnnotationsHTML"] = annnotations

	nots := make([]string, len(an.Notes))
	for _, n := range an.Notes {
		nots = append(nots, n.HTML())
	}

	ret["NotesHTML"] = nots
	return ret
}

type Annotation struct {
	XMLName xml.Name `xml:"anmerkung"`
	Value
	Inner
}

// HTML returns the HTML-transformed version of the annotation
func (a Annotation) HTML() string {
	if a.Inner.InnerXML != "" {
		return transformToHTML(a.Inner.InnerXML)
	}
	return a.Value.Chardata
}

type Note struct {
	XMLName xml.Name `xml:"vermerk"`
	Value
	Inner
}

// HTML returns the HTML-transformed version of the note
func (n Note) HTML() string {
	if n.Inner.InnerXML != "" {
		return transformToHTML(n.Inner.InnerXML)
	}
	return n.Value.Chardata
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

// HTML returns the HTML-transformed version of the reference
func (r Reference) HTML() string {
	if r.Inner.InnerXML != "" {
		return transformToHTML(r.Inner.InnerXML)
	}
	return ""
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
	data["ReferenceCommentHTML"] = r.HTML()
	return data
}

type Value struct {
	Chardata string `xml:",chardata"`
}

type Inner struct {
	InnerXML string `xml:",innerxml"`
}


// transformToHTML converts XML content to HTML
func transformToHTML(xmlContent string) string {
	if xmlContent == "" {
		return ""
	}

	// Simple string replacements for now
	html := xmlContent

	// Transform wwwlink tags to anchor tags
	// This is a simple regex replacement - for production you might want more robust parsing
	html = strings.ReplaceAll(html, `<wwwlink address="`, `<a href="`)
	html = strings.ReplaceAll(html, `</wwwlink>`, `</a>`)
	html = strings.ReplaceAll(html, `">`, `">`) // Keep the closing of the opening tag

	// Transform title tags to em tags
	html = strings.ReplaceAll(html, `<title>`, `<em>`)
	html = strings.ReplaceAll(html, `</title>`, `</em>`)

	// Remove year tags but keep content
	html = strings.ReplaceAll(html, `<year>`, ``)
	html = strings.ReplaceAll(html, `</year>`, ``)

	return html
}

