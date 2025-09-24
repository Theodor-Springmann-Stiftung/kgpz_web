package controllers

import (
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/viewmodels"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/gofiber/fiber/v2"
)

const (
	DEFAULT_PLACE = ""
)

func GetPlace(kgpz *xmlmodels.Library) fiber.Handler {
	return func(c *fiber.Ctx) error {
		placeID := c.Params("place", DEFAULT_PLACE)
		placeID = strings.ToLower(placeID)

		// Get places data using view model
		places := viewmodels.PlacesView(placeID, kgpz)

		// If no places found at all, return 404
		if len(places.Places) == 0 {
			logging.Error(nil, "No places found")
			return c.SendStatus(fiber.StatusNotFound)
		}

		// If a specific place was requested but not found, return 404
		if placeID != "" && len(placeID) > 1 && places.SelectedPlace == nil {
			logging.Error(nil, "Place not found: "+placeID)
			return c.SendStatus(fiber.StatusNotFound)
		}

		return c.Render("/ort/", fiber.Map{
			"model": places,
		})
	}
}
