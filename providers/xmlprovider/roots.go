package xmlprovider

import "encoding/xml"

// INFO: These are just root elements that hold the data of the XML files.
// They get discarded after a parse.
type XMLRootElement[T any] interface {
	Children() []T
}

type AgentRoot struct {
	XMLName xml.Name `xml:"akteure"`
	Agents  []Agent  `xml:"akteur"`
}

func NewAgentRoot() *AgentRoot {
	return &AgentRoot{}
}

func (a AgentRoot) New() *AgentRoot {
	return NewAgentRoot()
}

func (a AgentRoot) Children() []Agent {
	return a.Agents
}

type PlaceRoot struct {
	XMLName xml.Name `xml:"orte"`
	Place   []Place  `xml:"ort"`
}

func NewPlaceRoot() *PlaceRoot {
	return &PlaceRoot{}
}

func (p PlaceRoot) New() *PlaceRoot {
	return NewPlaceRoot()
}

func (p PlaceRoot) Children() []Place {
	return p.Place
}

type CategoryRoot struct {
	XMLName  xml.Name   `xml:"kategorien"`
	Category []Category `xml:"kategorie"`
}

func NewCategoryRoot() *CategoryRoot {
	return &CategoryRoot{}
}

func (c CategoryRoot) New() XMLRootElement[Category] {
	return NewCategoryRoot()
}

func (c CategoryRoot) Children() []Category {
	return c.Category
}

type PieceRoot struct {
	XMLName xml.Name `xml:"beitraege"`
	Piece   []Piece  `xml:"beitrag"`
}

func NewPieceRoot() *PieceRoot {
	return &PieceRoot{}
}

func (p PieceRoot) New() XMLRootElement[Piece] {
	return NewPieceRoot()
}

func (p PieceRoot) Children() []Piece {
	return p.Piece
}

type IssueRoot struct {
	XMLName xml.Name `xml:"stuecke"`
	Issues  []Issue  `xml:"stueck"`
}

func NewIssueRoot() *IssueRoot {
	return &IssueRoot{}
}

func (i IssueRoot) New() XMLRootElement[Issue] {
	return NewIssueRoot()
}

func (i IssueRoot) Children() []Issue {
	return i.Issues
}

type WorkRoot struct {
	XMLName xml.Name `xml:"werke"`
	Work    []Work   `xml:"werk"`
}

func NewWorkRoot() *WorkRoot {
	return &WorkRoot{}
}

func (w WorkRoot) New() XMLRootElement[Work] {
	return NewWorkRoot()
}

func (w WorkRoot) Children() []Work {
	return w.Work
}
