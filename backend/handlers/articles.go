package handlers

import (
	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"github.com/lib/pq"
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

	var input struct {
		Title        *string         `json:"title"`
		Slug         *string         `json:"slug"`
		Content      *string         `json:"content"`
		Excerpt      *string         `json:"excerpt"`
		Category     *string         `json:"category"`
		CoverImage   *string         `json:"cover_image"`
		Status       *string         `json:"status"`
		IsFeatured   *bool           `json:"is_featured"`
		LocationName *string         `json:"location_name"`
		Latitude     *float64        `json:"latitude"`
		Longitude    *float64        `json:"longitude"`
		YoutubeURL   *string         `json:"youtube_url"`
		Tags         *pq.StringArray `json:"tags"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	if input.Title != nil { article.Title = *input.Title }
	if input.Slug != nil { article.Slug = *input.Slug }
	if input.Content != nil { article.Content = *input.Content }
	if input.Excerpt != nil { article.Excerpt = *input.Excerpt }
	if input.Category != nil { article.Category = *input.Category }
	if input.CoverImage != nil { article.CoverImage = *input.CoverImage }
	if input.Status != nil { article.Status = *input.Status }
	if input.IsFeatured != nil { article.IsFeatured = *input.IsFeatured }
	if input.LocationName != nil { article.LocationName = *input.LocationName }
	if input.Latitude != nil { article.Latitude = *input.Latitude }
	if input.Longitude != nil { article.Longitude = *input.Longitude }
	if input.YoutubeURL != nil { article.YoutubeURL = *input.YoutubeURL }
	if input.Tags != nil { article.Tags = *input.Tags }

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

