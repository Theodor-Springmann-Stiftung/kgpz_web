package xmlmodels

import "encoding/xml"

type AgentRef struct {
	XMLName xml.Name `xml:"akteur"`
	Reference
}

func (ar AgentRef) Name() string {
	var x Agent
	return x.Name()
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

func (ir IssueRef) Name() string {
	var x Issue
	return x.Name()
}

type PlaceRef struct {
	XMLName xml.Name `xml:"ort"`
	Reference
}

func (pr PlaceRef) Name() string {
	var x Place
	return x.Name()
}

type CategoryRef struct {
	XMLName xml.Name `xml:"kategorie"`
	Reference
}

func (cr CategoryRef) Name() string {
	var x Category
	return x.Name()
}

type WorkRef struct {
	XMLName xml.Name `xml:"werk"`
	Page    string   `xml:"s,attr"`
	Reference
}

func (wr WorkRef) Name() string {
	var x Work
	return x.Name()
}

type PieceRef struct {
	XMLName xml.Name `xml:"beitrag"`
	Page    string   `xml:"s,attr"`
	Reference
}

func (pr PieceRef) Name() string {
	var x Piece
	return x.Name()
}
