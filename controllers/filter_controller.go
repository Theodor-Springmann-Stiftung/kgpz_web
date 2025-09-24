package controllers

import (
	"encoding/json"
	"fmt"
	"maps"
	"slices"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/gofiber/fiber/v2"
)

// GetQuickFilter handles the request to display the quick filter interface
func GetQuickFilter(kgpz *xmlmodels.Library) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get all available years and issues for filters
		years := make(map[int]bool)
		issuesByYear := make(map[int][]IssueSummary)

		kgpz.Issues.Lock()
		for _, issue := range kgpz.Issues.Array {
			year := issue.Datum.When.Year
			years[year] = true

			// Format date for display (DD.MM.YYYY)
			dateStr := fmt.Sprintf("%02d.%02d.%d",
				issue.Datum.When.Day,
				issue.Datum.When.Month,
				issue.Datum.When.Year)

			issueSummary := IssueSummary{
				Number: issue.Number.No,
				Date:   dateStr,
			}

			issuesByYear[year] = append(issuesByYear[year], issueSummary)
		}
		kgpz.Issues.Unlock()

		// Convert map to sorted slice using the same approach as year_view.go
		availableYears := slices.Collect(maps.Keys(years))
		slices.Sort(availableYears)

		// Sort issues within each year by issue number
		for year := range issuesByYear {
			slices.SortFunc(issuesByYear[year], func(a, b IssueSummary) int {
				return a.Number - b.Number
			})
		}

		// Convert issuesByYear to JSON string for the web component
		issuesByYearJSON, err := json.Marshal(issuesByYear)
		if err != nil {
			issuesByYearJSON = []byte("{}")
		}

		// Get all persons and identify authors
		persons := make([]PersonSummary, 0)
		authors := make([]PersonSummary, 0)

		// Find all agents who have pieces (same logic as AuthorsView)
		authorIDs := make(map[string]bool)
		for _, piece := range kgpz.Pieces.Array {
			for _, agentRef := range piece.AgentRefs {
				if agentRef.Category == "" || agentRef.Category == "autor" {
					authorIDs[agentRef.Ref] = true
				}
			}
		}

		kgpz.Agents.Lock()
		for _, agent := range kgpz.Agents.Array {
			// Get the primary name (first name in the list)
			var name string
			if len(agent.Names) > 0 {
				name = agent.Names[0]
			} else {
				name = agent.ID // fallback to ID if no names
			}

			person := PersonSummary{
				ID:   agent.ID,
				Name: name,
				Life: agent.Life,
			}

			persons = append(persons, person)

			// Add to authors list if this person is an author
			if authorIDs[agent.ID] {
				authors = append(authors, person)
			}
		}
		kgpz.Agents.Unlock()

		// Sort both lists by ID
		slices.SortFunc(persons, func(a, b PersonSummary) int {
			return strings.Compare(a.ID, b.ID)
		})
		slices.SortFunc(authors, func(a, b PersonSummary) int {
			return strings.Compare(a.ID, b.ID)
		})

		// Prepare data for the filter template
		data := fiber.Map{
			"AvailableYears":    availableYears,
			"Persons":           persons,
			"Authors":           authors,
			"IssuesByYearJSON":  string(issuesByYearJSON),
		}

		// Render the filter body using clear layout (no page layout)
		return c.Render("/filter/", data, "clear")
	}
}

// PersonSummary represents a simplified person for the filter list
type PersonSummary struct {
	ID   string
	Name string
	Life string
}

// IssueSummary represents an issue for the Jahr/Ausgabe filter
type IssueSummary struct {
	Number int    `json:"number"`
	Date   string `json:"date"`
}