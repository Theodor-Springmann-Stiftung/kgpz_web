package controllers

import (
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	searchprovider "github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/search"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/viewmodels"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/gofiber/fiber/v2"
)

func GetSearch(kgpz *xmlmodels.Library, sp *searchprovider.SearchProvider) fiber.Handler {
	return func(c *fiber.Ctx) error {
		search := c.Query("q")
		if search == "" {
			return c.SendStatus(fiber.StatusNotFound)
		}

		view, err := viewmodels.NewSearchView(search, kgpz, sp)
		if err != nil {
			logging.Error(err)
			return c.SendStatus(fiber.StatusNotFound)
		}

		return c.Render("/search/", fiber.Map{"model": view, "search": search})
	}
}
