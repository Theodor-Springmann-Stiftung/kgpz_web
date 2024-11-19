package xmlprovider

import "encoding/xml"

type KGPZDate struct {
	XMLName   xml.Name `xml:"datum"`
	When      string   `xml:"when,attr"`
	NotBefore string   `xml:"notBefore,attr"`
	NotAfter  string   `xml:"notAfter,attr"`
	From      string   `xml:"from,attr"`
	To        string   `xml:"to,attr"`
	Value
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
	ID string `xml:"id,attr"`
}

type Reference struct {
	Ref      string `xml:"ref,attr"`
	Category string `xml:"kat,attr"`
	Unsicher bool   `xml:"unsicher,attr"`
	Value
}

type Value struct {
	Chardata string `xml:",chardata"`
}

type Inner struct {
	InnerXML string `xml:",innerxml"`
}
