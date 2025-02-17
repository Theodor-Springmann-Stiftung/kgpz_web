package xmlmodels

import (
	"encoding/xml"
	"strconv"
)

type AgentRef struct {
	XMLName xml.Name `xml:"akteur"`
	Reference
}

func (ar AgentRef) Name() string {
	var x Agent
	return x.Name()
}

func (ar AgentRef) Readable(lib *Library) map[string]interface{} {
	data := make(map[string]interface{})
	agent := lib.Agents.Item(ar.Ref)
	if agent != nil {
		data["AgentNames"] = agent.Names
	}

	for k, v := range ar.Reference.Readable(lib) {
		data[k] = v
	}
	return data
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

func (ir IssueRef) Readable(lib *Library) map[string]interface{} {
	data := make(map[string]interface{})
	if ir.When.Year != 0 {
		data["IssueYear"] = ir.When.Year
	} else {
		return data
	}

	issuekey := strconv.Itoa(ir.When.Year) + "-" + strconv.Itoa(ir.Nr)
	issue := lib.Issues.Item(issuekey)
	if issue != nil {
		data["IssueDate"] = issue.Datum.When.String()
	}

	data["IssueNumber"] = ir.Nr

	return data
}

func (ir IssueRef) Name() string {
	var x Issue
	return x.Name()
}

type PlaceRef struct {
	XMLName xml.Name `xml:"ort"`
	Reference
}

func (pr *PlaceRef) Readable(lib *Library) map[string]interface{} {
	data := make(map[string]interface{})
	place := lib.Places.Item(pr.Ref)
	if place != nil {
		data["PlaceNames"] = place.Names
	}

	for k, v := range pr.Reference.Readable(lib) {
		data[k] = v
	}
	return data
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

func (cr CategoryRef) Readable(lib *Library) map[string]interface{} {
	data := make(map[string]interface{})
	cat := lib.Categories.Item(cr.Ref)
	if cat != nil {
		data["CategoryNames"] = cat.Names
	}

	for k, v := range cr.Reference.Readable(lib) {
		data[k] = v
	}
	return data
}

type WorkRef struct {
	XMLName xml.Name `xml:"werk"`
	Page    string   `xml:"s,attr"`
	Reference
}

func (wr WorkRef) Readable(lib *Library) map[string]interface{} {
	data := make(map[string]interface{})
	work := lib.Works.Item(wr.Ref)
	if work != nil {
		data["WorkTitle"] = work.Citation.Title
		data["WorkYear"] = work.Citation.Year
		data["WorkPreferredTitle"] = work.PreferredTitle
		prefs := make([]map[string]interface{}, len(work.AgentRefs))
		for k, v := range work.AgentRefs {
			prefs[k] = v.Readable(lib)
		}
		data["WorkAgents"] = prefs
	}

	for k, v := range wr.Reference.Readable(lib) {
		data[k] = v
	}
	return data
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
