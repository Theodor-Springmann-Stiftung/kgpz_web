package providers

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

type AgentRef struct {
	XMLName xml.Name `xml:"akteur"`
	Reference
}

type URL struct {
	XMLName xml.Name `xml:"url"`
	Address string   `xml:"address,attr"`
	Value
}

type AdditionalRef struct {
	XMLName xml.Name `xml:"beilage"`
	Reference
	Datum        string `xml:"datum,attr"`
	Nr           string `xml:"nr,attr"`
	AdditionalNo string `xml:"beilage,attr"`
	Von          string `xml:"von,attr"`
	Bis          string `xml:"bis,attr"`
}

type IssueRef struct {
	XMLName xml.Name `xml:"stueck"`
	Reference
	Datum string `xml:"datum,attr"`
	Nr    string `xml:"nr,attr"`
	Von   string `xml:"von,attr"`
	Bis   string `xml:"bis,attr"`
}

type PlaceRef struct {
	XMLName xml.Name `xml:"ort"`
	Reference
}

type CategoryRef struct {
	XMLName xml.Name `xml:"kategorie"`
	Reference
}

type WorkRef struct {
	XMLName xml.Name `xml:"werk"`
	Reference
	Page string `xml:"s,attr"`
}

type PieceRef struct {
	XMLName xml.Name `xml:"beitrag"`
	Page    string   `xml:"s,attr"`
	Reference
}

type AnnotationNote struct {
	Annotations []string `xml:"anmerkung"`
	Notes       []string `xml:"vermerk"`
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
