package xmlmodels

import (
	"encoding/xml"
)

// INFO: These are just root elements to hold the data of a file
// They get discarded after a parse.
type AgentRoot struct {
	XMLName xml.Name `xml:"akteure"`
	Agents  []Agent  `xml:"akteur"`
}

func (a AgentRoot) Children() []Agent {
	return a.Agents
}

type PlaceRoot struct {
	XMLName xml.Name `xml:"orte"`
	Place   []Place  `xml:"ort"`
}

func (p PlaceRoot) Children() []Place {
	return p.Place
}

type CategoryRoot struct {
	XMLName  xml.Name   `xml:"kategorien"`
	Category []Category `xml:"kategorie"`
}

func (c CategoryRoot) Children() []Category {
	return c.Category
}

type PieceRoot struct {
	XMLName xml.Name `xml:"beitraege"`
	Piece   []Piece  `xml:"beitrag"`
}

func (p PieceRoot) Children() []Piece {
	return p.Piece
}

type IssueRoot struct {
	XMLName xml.Name `xml:"stuecke"`
	Issues  []Issue  `xml:"stueck"`
}

func (i IssueRoot) Children() []Issue {
	return i.Issues
}

type WorkRoot struct {
	XMLName xml.Name `xml:"werke"`
	Work    []Work   `xml:"werk"`
}

func (w WorkRoot) Children() []Work {
	return w.Work
}
