package controllers

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/pictures"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/viewmodels"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/gofiber/fiber/v2"
)

func GetPiece(kgpz *xmlmodels.Library, pics *pictures.PicturesProvider) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id := c.Params("id")
		if id == "" {
			logging.Error(nil, "Piece ID is missing")
			return c.SendStatus(fiber.StatusNotFound)
		}

		piece := kgpz.Pieces.Item(id)
		if piece == nil {
			logging.Error(nil, "Piece could not be found with ID: "+id)
			return c.SendStatus(fiber.StatusNotFound)
		}

		pieceView, err := viewmodels.NewPieceView(*piece, kgpz, pics)
		if err != nil {
			logging.Error(err, "Piece view could not be created")
			return c.SendStatus(fiber.StatusInternalServerError)
		}

		return c.Render("/piece/", fiber.Map{"model": pieceView, "pieceId": id}, "fullwidth")
	}
}

// GetPieceWithPage handles piece URLs with optional page parameter: /beitrag/:id/:page?
func GetPieceWithPage(kgpz *xmlmodels.Library, pics *pictures.PicturesProvider) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id := c.Params("id")
		if id == "" {
			logging.Error(nil, "Piece ID is missing")
			return c.SendStatus(fiber.StatusNotFound)
		}

		// Handle optional page parameter (supports regular pages and Beilage format like b1-1, b2-2)
		pageParam := c.Params("page")
		var targetPage int
		var beilageNumber int
		var isBeilage bool
		if pageParam != "" {
			if strings.HasPrefix(pageParam, "b") {
				// Handle Beilage format: b1-1, b2-2, etc.
				parts := strings.Split(pageParam[1:], "-")
				if len(parts) == 2 {
					beilageNum, beilageErr := strconv.Atoi(parts[0])
					pageNum, pageErr := strconv.Atoi(parts[1])
					if beilageErr == nil && pageErr == nil && beilageNum > 0 && pageNum > 0 {
						beilageNumber = beilageNum
						targetPage = pageNum
						isBeilage = true
					} else {
						logging.Error(nil, "Beilage page format is invalid")
						return c.SendStatus(fiber.StatusNotFound)
					}
				} else {
					logging.Error(nil, "Beilage page format is invalid")
					return c.SendStatus(fiber.StatusNotFound)
				}
			} else {
				// Handle regular page number
				pi, err := strconv.Atoi(pageParam)
				if err != nil || pi < 1 {
					logging.Error(err, "Page is not a valid number")
					return c.SendStatus(fiber.StatusNotFound)
				}
				targetPage = pi
			}
		}

		piece := kgpz.Pieces.Item(id)

		if piece == nil {
			logging.Error(nil, "Piece could not be found with ID: "+id)
			return c.SendStatus(fiber.StatusNotFound)
		}

		pieceView, err := viewmodels.NewPieceView(*piece, kgpz, pics)
		if err != nil {
			logging.Error(err, "Piece view could not be created")
			return c.SendStatus(fiber.StatusInternalServerError)
		}

		// If a page was specified, validate it exists in this piece
		if targetPage > 0 {
			if isBeilage {
				// For Beilage pages, validation is more complex
				// For now, we'll accept any valid Beilage format and let the template handle validation
				logging.Debug(fmt.Sprintf("Accessing Beilage %d, page %d in piece %s", beilageNumber, targetPage, id))
			} else {
				// For regular pages, validate against the piece's page range
				pageExists := false
				for _, pageEntry := range pieceView.AllPages {
					if pageEntry.PageNumber == targetPage {
						pageExists = true
						break
					}
				}
				if !pageExists {
					logging.Debug(fmt.Sprintf("Page %d not found in piece %s", targetPage, id))
					return c.SendStatus(fiber.StatusNotFound)
				}
			}
		}

		return c.Render("/piece/", fiber.Map{"model": pieceView, "pieceId": id, "targetPage": targetPage, "beilageNumber": beilageNumber, "isBeilage": isBeilage}, "fullwidth")
	}
}

