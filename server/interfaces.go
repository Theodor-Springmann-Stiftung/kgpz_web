package server

import "github.com/gofiber/fiber/v2"

type MuxProvider interface {
	Routes(app *fiber.App) error
}

type PreMuxProvider interface {
	Pre(app *fiber.App) error
}
