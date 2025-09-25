package controllers

import (
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/gofiber/fiber/v2"
)

func GetPlace(kgpz *xmlmodels.Library) fiber.Handler {
	return func(c *fiber.Ctx) error {
		placeID := c.Params("place")
		place := kgpz.Places.Item(placeID)

		if place == nil {
			return c.SendStatus(fiber.StatusNotFound)
		}

		return c.Render("/ort/", fiber.Map{"place": place})
	}
}
