package xmlprovider

import "encoding/xml"

type AgentRef struct {
	XMLName xml.Name `xml:"akteur"`
	Reference
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
