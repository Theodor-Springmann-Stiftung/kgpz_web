package xmlmodels

import "encoding/xml"

type Reference struct {
	Ref      string `xml:"ref,attr"`
	Category string `xml:"kat,attr"`
	Unsicher bool   `xml:"unsicher,attr"`
	Value
}

type AgentRef struct {
	XMLName xml.Name `xml:"akteur"`
	Reference
}

type IssueRef struct {
	XMLName xml.Name `xml:"stueck"`
	Nr      int      `xml:"nr,attr"`
	Von     int      `xml:"von,attr"`
	Bis     int      `xml:"bis,attr"`
	Beilage int      `xml:"beilage,attr"`
	DateAttributes
	Reference // Nicht im Schema
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
	Page    string   `xml:"s,attr"`
	Reference
}

type PieceRef struct {
	XMLName xml.Name `xml:"beitrag"`
	Page    string   `xml:"s,attr"`
	Reference
}
