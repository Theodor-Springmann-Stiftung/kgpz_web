package controllers

import (
	"slices"
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

		// Handle special "autoren" route
		if a == "autoren" {
			agents := viewmodels.AuthorsView(kgpz)
			if len(agents.Agents) == 0 {
				logging.Error(nil, "No authors found")
				return c.SendStatus(fiber.StatusNotFound)
			}
			return c.Render(
				"/akteure/autoren/",
				fiber.Map{"model": agents},
			)
		}

		// Handle special "anonym" route
		if a == "anonym" {
			anonymAgent := viewmodels.AnonymView(kgpz)

			// Build available letters list (same logic as AgentsView)
			av := make(map[string]bool)
			for _, agent := range kgpz.Agents.Array {
				av[strings.ToUpper(agent.ID[:1])] = true
			}
			availableLetters := make([]string, 0, len(av))
			for letter := range av {
				availableLetters = append(availableLetters, letter)
			}
			slices.Sort(availableLetters)

			return c.Render(
				"/akteure/anonym/",
				fiber.Map{"model": &viewmodels.AgentsListView{
					Search:           "anonym",
					AvailableLetters: availableLetters,
					Agents:          map[string]xmlmodels.Agent{"anonym": *anonymAgent},
					Sorted:          []string{"anonym"},
				}},
			)
		}

		// Handle single letter (letter view) vs individual person ID (person view)
		if len(a) == 1 {
			// Letter view - show all people starting with this letter
			agents := viewmodels.AgentsView(a, kgpz)
			if len(agents.Agents) == 0 {
				logging.Error(nil, "No agents found for letter: "+a)
				return c.SendStatus(fiber.StatusNotFound)
			}
			return c.Render(
				"/akteure/letter/",
				fiber.Map{"model": agents},
			)
		} else {
			// Individual person view - show specific person
			agents := viewmodels.AgentsView(a, kgpz)
			if len(agents.Agents) == 0 {
				logging.Error(nil, "No agents found for id: "+a)
				return c.SendStatus(fiber.StatusNotFound)
			}
			return c.Render(
				"/akteure/person/",
				fiber.Map{"model": agents},
			)
		}
	}
}