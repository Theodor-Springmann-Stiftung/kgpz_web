package controllers

import (
	"strconv"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/app"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/viewmodels"
	"github.com/gofiber/fiber/v2"
)

func GetYear(kgpz *app.KGPZ) fiber.Handler {
	return func(c *fiber.Ctx) error {
		y := c.Params("year", strconv.Itoa(MINYEAR))
		yi, err := strconv.Atoi(y)

		if err != nil || yi < MINYEAR || yi > MAXYEAR {
			logging.Debug("Jahr nicht gefunden: " + y)
			return c.SendStatus(fiber.StatusNotFound)
		}

		view, err := viewmodels.YearView(yi, kgpz.Library)
		if err != nil {
			logging.ErrorDebug(err, "Keine Ausgaben für das Jahr "+y)
			return c.SendStatus(fiber.StatusNotFound)
		}

		return c.Render("/", fiber.Map{"model": view})
	}
}
