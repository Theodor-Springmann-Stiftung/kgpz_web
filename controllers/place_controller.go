package controllers

import (
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/app"
	"github.com/gofiber/fiber/v2"
)

func GetPlace(kgpz *app.KGPZ) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.Render("/ort/", nil)
	}
}
