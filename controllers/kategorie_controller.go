package controllers

import (
	"slices"
	"strconv"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/viewmodels"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/gofiber/fiber/v2"
)

const (
	DEFAULT_CATEGORY = ""
)

func GetCategory(kgpz *xmlmodels.Library) fiber.Handler {
	return func(c *fiber.Ctx) error {
		categoryID := c.Params("category", DEFAULT_CATEGORY)
		categoryID = strings.ToLower(categoryID)
		yearParam := c.Params("year", "")

		// Case 1: No category specified - show categories list with years
		if categoryID == "" {
			categories := viewmodels.CategoriesView(kgpz)
			if len(categories.Categories) == 0 {
				logging.Error(nil, "No categories found")
				return c.SendStatus(fiber.StatusNotFound)
			}
			return c.Render("/kategorie/list/", fiber.Map{
				"model": categories,
			})
		}

		// Case 2: Both category and year specified - show pieces
		if yearParam != "" {
			year, err := strconv.Atoi(yearParam)
			if err != nil {
				logging.Error(err, "Invalid year parameter: "+yearParam)
				return c.SendStatus(fiber.StatusBadRequest)
			}

			categoryPieces := viewmodels.NewCategoryPiecesView(categoryID, year, kgpz)
			if categoryPieces == nil {
				logging.Error(nil, "Category not found: "+categoryID)
				return c.SendStatus(fiber.StatusNotFound)
			}

			return c.Render("/kategorie/pieces/", fiber.Map{
				"model": categoryPieces,
			})
		}

		// Case 3: Category specified but no year - find first available year and redirect
		firstYear := findFirstYearForCategory(categoryID, kgpz)
		if firstYear == 0 {
			// Category exists but has no pieces, redirect to category list
			logging.Error(nil, "Category has no pieces: "+categoryID)
			return c.Redirect("/kategorie/")
		}

		// Redirect to category with first available year
		return c.Redirect("/kategorie/" + categoryID + "/" + strconv.Itoa(firstYear))
	}
}

// findFirstYearForCategory finds the earliest year that has pieces for the given category
func findFirstYearForCategory(categoryID string, kgpz *xmlmodels.Library) int {
	categoryYears := make([]int, 0)

	for _, piece := range kgpz.Pieces.Array {
		matchesCategory := false

		// Check direct CategoryRefs
		for _, catRef := range piece.CategoryRefs {
			if catRef.Ref == categoryID {
				matchesCategory = true
				break
			}
		}

		// Check WorkRefs with categories if not found in direct refs
		if !matchesCategory {
			for _, workRef := range piece.WorkRefs {
				if workRef.Category == categoryID || (workRef.Category == "" && categoryID == "rezension") {
					matchesCategory = true
					break
				}
			}
		}

		if matchesCategory {
			// Extract years from IssueRefs
			for _, issueRef := range piece.IssueRefs {
				year := issueRef.When.Year
				if year > 0 {
					categoryYears = append(categoryYears, year)
				}
			}
		}
	}

	if len(categoryYears) == 0 {
		return 0 // No pieces found for this category
	}

	// Find the earliest year
	slices.Sort(categoryYears)
	return categoryYears[0]
}
