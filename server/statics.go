package server

import (
	"io/fs"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
)

func static(fs *fs.FS) fiber.Handler {
	return filesystem.New(filesystem.Config{
		Root:   http.FS(*fs),
		Browse: false,
		Index:  "index.html",
		MaxAge: 3600,
	})
}
