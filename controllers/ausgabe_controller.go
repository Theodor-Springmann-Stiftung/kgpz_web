package controllers

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/pictures"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/viewmodels"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/gofiber/fiber/v2"
)

const (
	MINYEAR = 1764
	MAXYEAR = 1779
)

func GetIssue(kgpz *xmlmodels.Library, pics *pictures.PicturesProvider) fiber.Handler {
	return func(c *fiber.Ctx) error {
		y := c.Params("year")
		yi, err := strconv.Atoi(y)
		if err != nil {
			return c.SendStatus(fiber.StatusNotFound)
		}
		if yi < MINYEAR || yi > MAXYEAR {
			return c.SendStatus(fiber.StatusNotFound)
		}

		d := c.Params("issue")
		di, err := strconv.Atoi(d)
		if err != nil {
			return c.SendStatus(fiber.StatusNotFound)
		}
		if di < 1 {
			return c.SendStatus(fiber.StatusNotFound)
		}

		// Handle optional page parameter (supports regular pages and Beilage format like b1-1, b2-2)
		pageParam := c.Params("page")
		var targetPage int
		var beilageNumber int
		var isBeilage bool
		if pageParam != "" {
			if strings.HasPrefix(pageParam, "b") {
				// Handle Beilage format: b1-1, b2-2, etc.
				parts := strings.Split(pageParam[1:], "-")
				if len(parts) == 2 {
					beilageNum, beilageErr := strconv.Atoi(parts[0])
					pageNum, pageErr := strconv.Atoi(parts[1])
					if beilageErr == nil && pageErr == nil && beilageNum > 0 && pageNum > 0 {
						beilageNumber = beilageNum
						targetPage = pageNum
						isBeilage = true
					} else {
						logging.Error(nil, "Beilage page format is invalid")
						return c.SendStatus(fiber.StatusNotFound)
					}
				} else {
					logging.Error(nil, "Beilage page format is invalid")
					return c.SendStatus(fiber.StatusNotFound)
				}
			} else {
				// Handle regular page number
				pi, err := strconv.Atoi(pageParam)
				if err != nil || pi < 1 {
					logging.Error(err, "Page is not a valid number")
					return c.SendStatus(fiber.StatusNotFound)
				}
				targetPage = pi
			}
		}

		issue, err := viewmodels.NewSingleIssueView(yi, di, kgpz, pics)

		if err != nil {
			logging.Error(err, "Issue could not be found")
			return c.SendStatus(fiber.StatusNotFound)
		}

		// If a page was specified, validate it exists in this issue
		if targetPage > 0 {
			if isBeilage {
				// For Beilage pages, check if the issue has supplements and validate the page range
				// This validation is more complex as it depends on the actual Beilage structure
				// For now, we'll accept any valid Beilage format and let the template handle validation
				logging.Debug(fmt.Sprintf("Accessing Beilage %d, page %d in issue %d/%d", beilageNumber, targetPage, yi, di))
			} else {
				// For regular pages, validate against the issue's page range
				if targetPage < issue.Issue.Von || targetPage > issue.Issue.Bis {
					logging.Debug(fmt.Sprintf("Page %d not found in issue %d/%d (range: %d-%d)", targetPage, yi, di, issue.Issue.Von, issue.Issue.Bis))
					return c.SendStatus(fiber.StatusNotFound)
				}
			}
		}

		return c.Render("/ausgabe/", fiber.Map{"model": issue, "year": yi, "issue": di, "targetPage": targetPage, "beilageNumber": beilageNumber, "isBeilage": isBeilage}, "fullwidth")
	}
}
