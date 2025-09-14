package server

import "github.com/gofiber/fiber/v2"

func CacheFunc(c *fiber.Ctx) bool {
	return c.Query("noCache") == "true" || c.Response().StatusCode() != fiber.StatusOK
}
