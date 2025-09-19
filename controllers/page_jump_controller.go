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
			// Get available years for dropdown (simplified for error case)
			availableYears := []int{}
			for y := MINYEAR; y <= MAXYEAR; y++ {
				availableYears = append(availableYears, y)
			}

			return c.Status(fiber.StatusBadRequest).SendString(renderPageJumpFormWithError(
				fmt.Sprintf("Ungültiges Jahr. Bitte wählen Sie ein Jahr zwischen %d und %d.", MINYEAR, MAXYEAR),
				"",
				availableYears,
				MINYEAR,
				pageStr,
			))
		}

		// Validate page
		page, err := strconv.Atoi(pageStr)
		if err != nil || page < 1 {
			logging.Debug("Invalid page in form: " + pageStr)
			// Get available years for dropdown
			availableYears := []int{}
			for y := MINYEAR; y <= MAXYEAR; y++ {
				availableYears = append(availableYears, y)
			}

			return c.Status(fiber.StatusBadRequest).SendString(renderPageJumpFormWithError(
				"",
				"Ungültige Seitenzahl. Bitte geben Sie eine positive Zahl ein.",
				availableYears,
				year,
				"",
			))
		}

		// Find the issue containing this page
		issue, err := FindIssueByYearAndPage(year, page, kgpz)
		if err != nil {
			logging.Debug(fmt.Sprintf("Page %d not found in year %d: %v", page, year, err))
			// Get available years for dropdown
			availableYears := []int{}
			for y := MINYEAR; y <= MAXYEAR; y++ {
				availableYears = append(availableYears, y)
			}

			return c.Status(fiber.StatusNotFound).SendString(renderPageJumpFormWithError(
				"",
				fmt.Sprintf("Seite %s wurde in Jahr %s nicht gefunden.", pageStr, yearStr),
				availableYears,
				year,
				pageStr,
			))
		}

		// Construct the redirect URL
		redirectURL := fmt.Sprintf("/%d/%d/%d", year, issue.Number.No, page)

		logging.Debug(fmt.Sprintf("Page jump form: year=%s, page=%s -> %s", yearStr, pageStr, redirectURL))

		// Return HTMX redirect
		c.Set("HX-Redirect", redirectURL)
		return c.SendStatus(fiber.StatusOK)
	}
}

// renderPageJumpFormWithError generates the page jump form HTML with error messages
func renderPageJumpFormWithError(yearError, pageError string, availableYears []int, currentYear int, pageValue string) string {
	html := `<form hx-post="/jump" hx-swap="outerHTML" class="space-y-4">
	<div class="grid grid-cols-2 gap-4">
		<!-- Year Selection -->
		<div>
			<label for="jump-year" class="block text-sm font-medium text-slate-700 mb-1">Jahr</label>
			<select id="jump-year" name="year" class="w-full px-3 py-2 border `

	if yearError != "" {
		html += `border-red-300`
	} else {
		html += `border-slate-300`
	}

	html += ` rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">`

	for _, year := range availableYears {
		html += fmt.Sprintf(`<option value="%d"`, year)
		if year == currentYear {
			html += ` selected`
		}
		html += fmt.Sprintf(`>%d</option>`, year)
	}

	html += `</select>`

	if yearError != "" {
		html += fmt.Sprintf(`<div class="text-red-600 text-sm mt-1">%s</div>`, yearError)
	}

	html += `</div>

		<!-- Page Input -->
		<div>
			<label for="jump-page" class="block text-sm font-medium text-slate-700 mb-1">Seite</label>
			<input type="number" id="jump-page" name="page" min="1" placeholder="z.B. 42" value="` + pageValue + `" class="w-full px-3 py-2 border `

	if pageError != "" {
		html += `border-red-300`
	} else {
		html += `border-slate-300`
	}

	html += ` rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">`

	if pageError != "" {
		html += fmt.Sprintf(`<div class="text-red-600 text-sm mt-1">%s</div>`, pageError)
	}

	html += `</div>
	</div>

	<!-- Submit Button -->
	<div class="text-center">
		<button type="submit" class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
			<i class="ri-arrow-right-line mr-2"></i>
			Zur Seite springen
		</button>
	</div>
</form>`

	return html
}