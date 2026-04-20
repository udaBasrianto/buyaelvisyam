package handlers

import (
	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
)

func GetWidgets(c *fiber.Ctx) error {
	db := database.DB
	var widgets []models.Widget
	isActive := c.Query("is_active")
	
	query := db.Order("sort_order asc")
	if isActive == "true" {
		query = query.Where("is_active = ?", true)
	}

	query.Find(&widgets)
	return c.JSON(widgets)
}

func CreateWidget(c *fiber.Ctx) error {
	var widget models.Widget
	if err := c.BodyParser(&widget); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	db := database.DB
	if err := db.Create(&widget).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not create widget"})
	}

	return c.JSON(widget)
}

func UpdateWidget(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var widget models.Widget

	if err := db.Where("id = ?", id).First(&widget).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Widget not found"})
	}

	var updatedData models.Widget
	if err := c.BodyParser(&updatedData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	db.Model(&widget).Updates(updatedData)

	return c.JSON(widget)
}

func DeleteWidget(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var widget models.Widget

	if err := db.Where("id = ?", id).First(&widget).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Widget not found"})
	}

	if err := db.Delete(&widget).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not delete widget"})
	}

	return c.JSON(fiber.Map{"message": "Widget deleted successfully"})
}
