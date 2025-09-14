package controllers

import (
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

		issue, err := viewmodels.NewSingleIssueView(yi, di, kgpz)

		if err != nil {
			logging.Error(err, "Issue could not be found")
			return c.SendStatus(fiber.StatusNotFound)
		}

		return c.Render("/ausgabe/", fiber.Map{"model": issue, "year": yi, "issue": di}, "fullwidth")
	}
}
