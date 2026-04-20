package handlers

import (
	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
)

func GetFeatures(c *fiber.Ctx) error {
	db := database.DB
	var features []models.FeatureItem
	
	db.Order("sort_order asc").Find(&features)
	return c.JSON(features)
}

func CreateFeature(c *fiber.Ctx) error {
	var feature models.FeatureItem
	if err := c.BodyParser(&feature); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	db := database.DB
	if err := db.Create(&feature).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not create feature"})
	}

	return c.JSON(feature)
}

func UpdateFeature(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var feature models.FeatureItem

	if err := db.Where("id = ?", id).First(&feature).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Feature not found"})
	}

	var updatedData models.FeatureItem
	if err := c.BodyParser(&updatedData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	db.Model(&feature).Updates(updatedData)

	return c.JSON(feature)
}

func DeleteFeature(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var feature models.FeatureItem

	if err := db.Where("id = ?", id).First(&feature).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Feature not found"})
	}

	if err := db.Delete(&feature).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not delete feature"})
	}

	return c.JSON(fiber.Map{"message": "Feature deleted successfully"})
}
