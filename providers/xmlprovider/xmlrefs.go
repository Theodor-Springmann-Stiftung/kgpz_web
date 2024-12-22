package xmlprovider

import "encoding/xml"

type AgentRef struct {
	XMLName xml.Name `xml:"akteur"`
	Reference
}

type AdditionalRef struct {
	XMLName      xml.Name `xml:"beilage"`
	Reference             // Ist nicht im Schema
	Datum        string   `xml:"datum,attr"`
	Nr           int      `xml:"nr,attr"`
	AdditionalNo int      `xml:"beilage,attr"`
	Von          int      `xml:"von,attr"`
	Bis          int      `xml:"bis,attr"`
}

type IssueRef struct {
	XMLName   xml.Name `xml:"stueck"`
	Reference          // Ist nicht im Schema
	DateAttributes
	Nr      int `xml:"nr,attr"`
	Von     int `xml:"von,attr"`
	Bis     int `xml:"bis,attr"`
	Beilage int `xml:"beilage,attr"`
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
