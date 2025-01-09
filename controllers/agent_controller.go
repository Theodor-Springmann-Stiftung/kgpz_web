package controllers

import (
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/viewmodels"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/gofiber/fiber/v2"
)

const (
	DEFAULT_AGENT = "a"
)

func GetAgents(kgpz *xmlmodels.Library) fiber.Handler {
	return func(c *fiber.Ctx) error {
		a := c.Params("letterorid", DEFAULT_AGENT)
		a = strings.ToLower(a)
		agents := viewmodels.AgentsView(a, kgpz)
		if len(agents.Agents) == 0 {
			logging.Error(nil, "No agents found for letter or id: "+a)
			return c.SendStatus(fiber.StatusNotFound)
		}
		return c.Render(
			"/akteure/",
			fiber.Map{"model": agents},
		)
	}
}
