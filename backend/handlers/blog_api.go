package handlers

import (
	"backend/database"
	"backend/models"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// GetLatestArticles for Mobile Slider/Feed
func GetLatestArticles(c *fiber.Ctx) error {
	var articles []models.Article
	database.DB.Where("status = ?", "published").Order("published_at desc").Limit(10).Find(&articles)

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
	database.DB.Where("status = ? AND (category_id = ? OR category = ?)", "published", category.ID, category.Name).
		Order("published_at desc").Find(&articles)

	return c.JSON(fiber.Map{
		"status":   "success",
		"category": category.Name,
		"data":     articles,
	})
}

// SearchArticles for Mobile Search Bar & Web Search with Relevance Ranking & Postgres Full-Text Search
func SearchArticles(c *fiber.Ctx) error {
	query := strings.TrimSpace(c.Query("q"))
	if query == "" {
		return c.JSON(fiber.Map{"data": []models.Article{}})
	}

	limit := c.QueryInt("limit", 20)
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	var articles []models.Article
	likeQuery := "%" + query + "%"

	// Relevance ranking:
	// 1. Exact match in title (50 pts)
	// 2. Title partial match (30 pts)
	// 3. Excerpt match (15 pts)
	// 4. Content match (5 pts)
	// 5. Postgres ts_rank full-text search score
	orderClause := `
		(CASE 
			WHEN LOWER(title) = LOWER(?) THEN 50
			WHEN title ILIKE ? THEN 30
			WHEN excerpt ILIKE ? THEN 15
			WHEN content ILIKE ? THEN 5
			ELSE 0
		END) + 
		ts_rank(
			setweight(to_tsvector('simple', coalesce(title, '')), 'A') || 
			setweight(to_tsvector('simple', coalesce(excerpt, '')), 'B') || 
			setweight(to_tsvector('simple', coalesce(content, '')), 'C'),
			plainto_tsquery('simple', ?)
		) * 10 DESC, views DESC, published_at DESC
	`

	err := database.DB.Where(
		"status = 'published' AND (title ILIKE ? OR excerpt ILIKE ? OR content ILIKE ? OR to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, '')) @@ plainto_tsquery('simple', ?))",
		likeQuery, likeQuery, likeQuery, query,
	).Order(
		database.DB.Raw(orderClause, query, likeQuery, likeQuery, likeQuery, query),
	).Limit(limit).Find(&articles).Error

	if err != nil {
		// Fallback safe ILIKE search
		database.DB.Where("status = 'published' AND (title ILIKE ? OR excerpt ILIKE ? OR content ILIKE ?)", likeQuery, likeQuery, likeQuery).
			Order("published_at desc").Limit(limit).Find(&articles)
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"query":  query,
		"data":   articles,
	})
}

// GetPopularArticles for "Must Read" Section
func GetPopularArticles(c *fiber.Ctx) error {
	var articles []models.Article
	database.DB.Where("status = ?", "published").Order("views desc, published_at desc").Limit(5).Find(&articles)

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   articles,
	})
}
