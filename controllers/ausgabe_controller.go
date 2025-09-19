package controllers

import (
	"fmt"
	"strconv"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/viewmodels"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/gofiber/fiber/v2"
)

const (
	MINYEAR = 1764
	MAXYEAR = 1779
)

func GetIssue(kgpz *xmlmodels.Library) fiber.Handler {
	return func(c *fiber.Ctx) error {
		y := c.Params("year")
		yi, err := strconv.Atoi(y)
		if err != nil || yi < MINYEAR || yi > MAXYEAR {
			logging.Error(err, "Year is not a valid number")
			return c.SendStatus(fiber.StatusNotFound)
		}

		d := c.Params("issue")
		di, err := strconv.Atoi(d)
		if err != nil || di < 1 {
			logging.Error(err, "Issue is not a valid number")
			return c.SendStatus(fiber.StatusNotFound)
		}

		// Handle optional page parameter
		pageParam := c.Params("page")
		var targetPage int
		if pageParam != "" {
			pi, err := strconv.Atoi(pageParam)
			if err != nil || pi < 1 {
				logging.Error(err, "Page is not a valid number")
				return c.SendStatus(fiber.StatusNotFound)
			}
			targetPage = pi
		}

		issue, err := viewmodels.NewSingleIssueView(yi, di, kgpz)

		if err != nil {
			logging.Error(err, "Issue could not be found")
			return c.SendStatus(fiber.StatusNotFound)
		}

		// If a page was specified, validate it exists in this issue
		if targetPage > 0 {
			if targetPage < issue.Issue.Von || targetPage > issue.Issue.Bis {
				logging.Debug(fmt.Sprintf("Page %d not found in issue %d/%d (range: %d-%d)", targetPage, yi, di, issue.Issue.Von, issue.Issue.Bis))
				return c.SendStatus(fiber.StatusNotFound)
			}
		}

		return c.Render("/ausgabe/", fiber.Map{"model": issue, "year": yi, "issue": di, "targetPage": targetPage}, "fullwidth")
	}
}
