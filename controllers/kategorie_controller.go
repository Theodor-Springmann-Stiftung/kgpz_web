package controllers

import (
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/gofiber/fiber/v2"
)

func GetCategory(kgpz *xmlmodels.Library) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.Render("/kategorie/", nil)
	}
}
