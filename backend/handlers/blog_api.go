package handlers

import (
	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
)

// GetLatestArticles for Mobile Slider/Feed
func GetLatestArticles(c *fiber.Ctx) error {
	var articles []models.Article
	database.DB.Order("created_at desc").Limit(10).Find(&articles)
	
	return c.JSON(fiber.Map{
		"status": "success",
		"data":   articles,
	})
}

// GetArticlesByCategory for Mobile Category Tabs
func GetArticlesByCategory(c *fiber.Ctx) error {
	categorySlug := c.Params("slug")
	
	var category models.Category
	if err := database.DB.Where("slug = ?", categorySlug).First(&category).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Kategori tidak ditemukan"})
	}

	var articles []models.Article
	database.DB.Where("category_id = ?", category.ID).Order("created_at desc").Find(&articles)

	return c.JSON(fiber.Map{
		"status":   "success",
		"category": category.Name,
		"data":     articles,
	})
}

// SearchArticles for Mobile Search Bar
func SearchArticles(c *fiber.Ctx) error {
	query := c.Query("q")
	if query == "" {
		return c.JSON(fiber.Map{"data": []models.Article{}})
	}

	var articles []models.Article
	database.DB.Where("title ILIKE ? OR content ILIKE ?", "%"+query+"%", "%"+query+"%").Limit(20).Find(&articles)

	return c.JSON(fiber.Map{
		"status": "success",
		"query":  query,
		"data":   articles,
	})
}

// GetPopularArticles for "Must Read" Section
func GetPopularArticles(c *fiber.Ctx) error {
	var articles []models.Article
	// For now, let's just use random/latest as a placeholder for popular
	database.DB.Order("views desc").Limit(5).Find(&articles)

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   articles,
	})
}
