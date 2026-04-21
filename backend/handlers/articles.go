package handlers

import (
	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

func GetArticles(c *fiber.Ctx) error {
	db := database.DB
	var articles []models.Article
	
	status := c.Query("status", "all")
	limit := c.QueryInt("limit", 100)

	query := db.Order("created_at desc").Limit(limit)
	if status != "all" {
		query = query.Where("status = ?", status)
	}

	if c.Query("featured") == "true" {
		query = query.Where("is_featured = ?", true)
	}
	
	query.Find(&articles)

	// Fetch author names and comment counts
	for i := range articles {
		var p models.Profile
		db.Where("user_id = ?", articles[i].AuthorID).First(&p)
		articles[i].AuthorName = p.DisplayName

		var count int64
		db.Model(&models.Comment{}).Where("article_id = ?", articles[i].ID).Count(&count)
		articles[i].CommentCount = count
	}

	return c.JSON(articles)
}

func GetArticle(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var article models.Article

	query := db
	if _, err := uuid.Parse(id); err == nil {
		query = query.Where("id = ?", id)
	} else {
		query = query.Where("slug = ?", id)
	}

	if err := query.First(&article).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Article not found"})
	}
	
	db.Model(&article).Update("views", article.Views+1)

	var p models.Profile
	db.Where("user_id = ?", article.AuthorID).First(&p)
	article.AuthorName = p.DisplayName

	var count int64
	db.Model(&models.Comment{}).Where("article_id = ?", article.ID).Count(&count)
	article.CommentCount = count

	return c.JSON(article)
}

func CreateArticle(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	authorIDStr := claims["user_id"].(string)

	var article models.Article
	if err := c.BodyParser(&article); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	authorID, err := uuid.Parse(authorIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid author ID"})
	}
	article.AuthorID = authorID

	db := database.DB
	if err := db.Create(&article).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not create article"})
	}

	return c.JSON(article)
}

func UpdateArticle(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var article models.Article

	if err := db.Where("id = ?", id).First(&article).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Article not found"})
	}

	var updatedData models.Article
	if err := c.BodyParser(&updatedData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	if updatedData.Title != "" { article.Title = updatedData.Title }
	if updatedData.Slug != "" { article.Slug = updatedData.Slug }
	if updatedData.Content != "" { article.Content = updatedData.Content }
	if updatedData.Excerpt != "" { article.Excerpt = updatedData.Excerpt }
	if updatedData.Category != "" { article.Category = updatedData.Category }
	if updatedData.CoverImage != "" { article.CoverImage = updatedData.CoverImage }
	if updatedData.Status != "" { article.Status = updatedData.Status }
	
	// Handle is_featured correctly (explicit check since it's a bool)
	if c.BodyParser(&struct {
		IsFeatured *bool `json:"is_featured"`
	}{}); true {
		article.IsFeatured = updatedData.IsFeatured
	}

	if err := db.Save(&article).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not update article"})
	}

	return c.JSON(article)
}

func DeleteArticle(c *fiber.Ctx) error {
	id := c.Params("id")
	db := database.DB
	var article models.Article

	if err := db.Where("id = ?", id).First(&article).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Article not found"})
	}

	if err := db.Delete(&article).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not delete article"})
	}

	return c.JSON(fiber.Map{"message": "Article deleted successfully"})
}

func BulkDeleteArticles(c *fiber.Ctx) error {
	db := database.DB
	
	category := c.Query("category")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	query := db.Model(&models.Article{})

	if category != "" && category != "all" {
		query = query.Where("category = ?", category)
	}

	if startDate != "" {
		query = query.Where("created_at >= ?", startDate)
	}

	if endDate != "" {
		query = query.Where("created_at <= ?", endDate)
	}

	if err := query.Delete(&models.Article{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not bulk delete articles"})
	}

	return c.JSON(fiber.Map{"message": "Articles deleted successfully"})
}

// BulkUpdateArticleImage updates cover_image for all articles in a given category
func BulkUpdateArticleImage(c *fiber.Ctx) error {
	db := database.DB

	var body struct {
		Category   string `json:"category"`
		CoverImage string `json:"cover_image"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}
	if body.CoverImage == "" {
		return c.Status(400).JSON(fiber.Map{"error": "cover_image is required"})
	}

	query := db.Model(&models.Article{})
	if body.Category != "" && body.Category != "all" {
		query = query.Where("category = ?", body.Category)
	}

	result := query.Update("cover_image", body.CoverImage)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update images"})
	}

	return c.JSON(fiber.Map{
		"message":        "Berhasil mengupdate gambar artikel",
		"affected_count": result.RowsAffected,
		"category":       body.Category,
	})
}

