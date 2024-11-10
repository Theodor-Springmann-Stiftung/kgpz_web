package providers

import "encoding/xml"

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
	Datum string `xml:"datum,attr"`
	Nr    string `xml:"nr,attr"`
	Von   string `xml:"von,attr"`
	Bis   string `xml:"bis,attr"`
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
	Value string `xml:",chardata"`
}
