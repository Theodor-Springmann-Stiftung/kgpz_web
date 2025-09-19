package controllers

import (
	"fmt"
	"strconv"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/gofiber/fiber/v2"
)

// FindIssueByYearAndPage finds the first issue in a given year that contains the specified page
func FindIssueByYearAndPage(year, page int, library *xmlmodels.Library) (*xmlmodels.Issue, error) {
	library.Issues.Lock()
	defer library.Issues.Unlock()

	var foundIssues []xmlmodels.Issue

	// Find all issues in the given year that contain the page
	for _, issue := range library.Issues.Array {
		if issue.Datum.When.Year == year && page >= issue.Von && page <= issue.Bis {
			foundIssues = append(foundIssues, issue)
		}
	}

	if len(foundIssues) == 0 {
		return nil, fmt.Errorf("no issue found containing page %d in year %d", page, year)
	}

	// Return the first issue chronologically (by issue number)
	firstIssue := foundIssues[0]
	for _, issue := range foundIssues {
		if issue.Number.No < firstIssue.Number.No {
			firstIssue = issue
		}
	}

	return &firstIssue, nil
}

func GetPageJump(kgpz *xmlmodels.Library) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Parse year parameter
		yearStr := c.Params("year")
		year, err := strconv.Atoi(yearStr)
		if err != nil || year < MINYEAR || year > MAXYEAR {
			logging.Debug("Invalid year for page jump: " + yearStr)
			return c.Status(fiber.StatusBadRequest).SendString(`
				<div id="year-error" class="text-red-600 text-sm mt-1">
					Ungültiges Jahr. Bitte wählen Sie ein Jahr zwischen ` + strconv.Itoa(MINYEAR) + ` und ` + strconv.Itoa(MAXYEAR) + `.
				</div>
			`)
		}

		// Parse page parameter
		pageStr := c.Params("page")
		page, err := strconv.Atoi(pageStr)
		if err != nil || page < 1 {
			logging.Debug("Invalid page for page jump: " + pageStr)
			return c.Status(fiber.StatusBadRequest).SendString(`
				<div id="page-error" class="text-red-600 text-sm mt-1">
					Ungültige Seitenzahl. Bitte geben Sie eine positive Zahl ein.
				</div>
			`)
		}

		// Find the issue containing this page
		issue, err := FindIssueByYearAndPage(year, page, kgpz)
		if err != nil {
			logging.Debug(fmt.Sprintf("Page %d not found in year %d: %v", page, year, err))
			return c.Status(fiber.StatusNotFound).SendString(`
				<div id="page-error" class="text-red-600 text-sm mt-1">
					Seite ` + pageStr + ` wurde in Jahr ` + yearStr + ` nicht gefunden.
				</div>
			`)
		}

		// Construct the redirect URL
		redirectURL := fmt.Sprintf("/%d/%d/%d", year, issue.Number.No, page)

		logging.Debug(fmt.Sprintf("Page jump: %s -> %s", c.OriginalURL(), redirectURL))

		// Return HTMX redirect
		c.Set("HX-Redirect", redirectURL)
		return c.SendStatus(fiber.StatusOK)
	}
}

// GetPageJumpForm handles POST requests for the page jump form
func GetPageJumpForm(kgpz *xmlmodels.Library) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Parse form data
		yearStr := c.FormValue("year")
		pageStr := c.FormValue("page")

		// Validate year
		year, err := strconv.Atoi(yearStr)
		if err != nil || year < MINYEAR || year > MAXYEAR {
			logging.Debug("Invalid year in form: " + yearStr)
			return c.Status(fiber.StatusBadRequest).Render("/errors/jump_error/", fiber.Map{
				"Message": fmt.Sprintf("Ungültiges Jahr. Bitte wählen Sie ein Jahr zwischen %d und %d.", MINYEAR, MAXYEAR),
			}, "clear")
		}

		// Validate page
		page, err := strconv.Atoi(pageStr)
		if err != nil || page < 1 {
			logging.Debug("Invalid page in form: " + pageStr)
			return c.Status(fiber.StatusBadRequest).Render("/errors/jump_error/", fiber.Map{
				"Message": "Ungültige Seitenzahl. Bitte geben Sie eine positive Zahl ein.",
			}, "clear")
		}

		// Find the issue containing this page
		issue, err := FindIssueByYearAndPage(year, page, kgpz)
		if err != nil {
			logging.Debug(fmt.Sprintf("Page %d not found in year %d: %v", page, year, err))
			return c.Status(fiber.StatusNotFound).Render("/errors/jump_error/", fiber.Map{
				"Message": fmt.Sprintf("Seite %s wurde in Jahr %s nicht gefunden.", pageStr, yearStr),
			}, "clear")
		}

		// Construct the redirect URL
		redirectURL := fmt.Sprintf("/%d/%d/%d", year, issue.Number.No, page)

		logging.Debug(fmt.Sprintf("Page jump form: year=%s, page=%s -> %s", yearStr, pageStr, redirectURL))

		// Clear any existing errors and redirect
		c.Set("HX-Redirect", redirectURL)
		c.Set("HX-Retarget", "#jump-errors")
		c.Set("HX-Reswap", "innerHTML")
		return c.SendString("")
	}
}
