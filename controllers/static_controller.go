package controllers

import "github.com/gofiber/fiber/v2"

func Get(path string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.Render(path, nil)
	}
}
