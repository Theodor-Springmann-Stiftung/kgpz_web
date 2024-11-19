package controllers

import (
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/app"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/viewmodels"
	"github.com/gofiber/fiber/v2"
)

func GetIssue(kgpz *app.KGPZ) fiber.Handler {
	return func(c *fiber.Ctx) error {
		y := c.Params("year")
		if len(y) != 4 {
			logging.Error(nil, "Year is not 4 characters long")
			return c.SendStatus(fiber.StatusNotFound)
		}

		d := c.Params("issue")
		if d == "" {
			logging.Error(nil, "Issue number is empty")
			return c.SendStatus(fiber.StatusNotFound)
		}

		issue, err := viewmodels.IssueView(y, d, kgpz.Library)

		if err != nil {
			logging.Error(err, "Issue could not be found")
			return c.SendStatus(fiber.StatusNotFound)
		}

		return c.Render("/issue/", fiber.Map{"model": issue})
	}
}
