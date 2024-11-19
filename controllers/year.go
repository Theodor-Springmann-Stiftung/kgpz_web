package controllers

import (
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/app"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/viewmodels"
	"github.com/gofiber/fiber/v2"
)

const (
	START_YEAR = "1764"
)

func GetYear(kgpz *app.KGPZ) fiber.Handler {
	return func(c *fiber.Ctx) error {
		y := c.Params("year", START_YEAR)
		if len(y) != 4 {
			return c.SendStatus(fiber.StatusBadRequest)
		}

		issues, err := viewmodels.YearView(y, kgpz.Library)
		if err != nil {
			logging.Error(err, "Keine Ausgaben für das Jahr "+y)
			return c.SendStatus(fiber.StatusNotFound)
		}

		return c.Render("/", fiber.Map{"model": issues})
	}
}
