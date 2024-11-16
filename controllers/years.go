package controllers

import (
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/app"
	"github.com/gofiber/fiber/v2"
)

func GetYear(kgpz *app.KGPZ) fiber.Handler {
	return func(c *fiber.Ctx) error {
		y := c.Params("year", "1764")
		if len(y) != 4 {
			return c.SendStatus(fiber.StatusBadRequest)
		}

		issues := kgpz.Library.Issues.GetYear(y)
		if len(issues.Issues) == 0 {
			return c.SendStatus(fiber.StatusNotFound)
		}
		return c.Render("/", fiber.Map{"model": issues})
	}
}
