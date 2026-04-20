package handlers

import (
	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

func GetPages(c *fiber.Ctx) error {
	db := database.DB
	var pages []models.Page
	
	status := c.Query("status", "all")

	query := db.Order("nav_order asc")
	if status != "all" {
		query = query.Where("status = ?", status)
	}

	showInNav := c.Query("show_in_nav")
	if showInNav == "true" {
		query = query.Where("show_in_nav = ?", true)
	}
	
	query.Find(&pages)

	return c.JSON(pages)
}

func GetPage(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var page models.Page

	query := db
	// Check if provided id is a valid UUID
	if _, err := uuid.Parse(id); err == nil {
		query = query.Where("id = ?", id)
	} else {
		// Not a UUID, so it must be a slug
		query = query.Where("slug = ?", id)
	}

	if err := query.First(&page).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Page not found"})
	}
	
	return c.JSON(page)
}

func CreatePage(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	authorIDStr := claims["user_id"].(string)

	var page models.Page
	if err := c.BodyParser(&page); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	authorID, err := uuid.Parse(authorIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid author ID"})
	}
	page.CreatedBy = authorID

	db := database.DB
	if err := db.Create(&page).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not create page"})
	}

	return c.JSON(page)
}

func UpdatePage(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var page models.Page

	if err := db.Where("id = ?", id).First(&page).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Page not found"})
	}

	var updatedData models.Page
	if err := c.BodyParser(&updatedData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	db.Model(&page).Updates(updatedData)

	return c.JSON(page)
}

func DeletePage(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var page models.Page

	if err := db.Where("id = ?", id).First(&page).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Page not found"})
	}

	if err := db.Delete(&page).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not delete page"})
	}

	return c.JSON(fiber.Map{"message": "Page deleted successfully"})
}
