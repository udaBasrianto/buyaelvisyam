package handlers

import (
	"backend/database"
	"backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

func ToggleBookmark(c *fiber.Ctx) error {
	articleIDStr := c.Params("articleId")
	articleID, err := uuid.Parse(articleIDStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid article ID"})
	}

	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))

	var bookmark models.Bookmark
	err = database.DB.Where("user_id = ? AND article_id = ?", userID, articleID).First(&bookmark).Error

	if err == nil {
		// Already bookmarked, so remove it
		database.DB.Delete(&bookmark)
		return c.JSON(fiber.Map{"status": "removed", "message": "Bookmark dihapus"})
	}

	// Not bookmarked, so add it
	newBookmark := models.Bookmark{
		ID:        uuid.New(),
		UserID:    userID,
		ArticleID: articleID,
	}
	database.DB.Create(&newBookmark)
	return c.JSON(fiber.Map{"status": "added", "message": "Berhasil disimpan ke Bookmark"})
}

func GetUserBookmarks(c *fiber.Ctx) error {
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))

	var articles []models.Article
	database.DB.Table("articles").
		Joins("JOIN bookmarks ON bookmarks.article_id = articles.id").
		Where("bookmarks.user_id = ?", userID).
		Order("bookmarks.created_at desc").
		Find(&articles)

	return c.JSON(articles)
}

func CheckBookmark(c *fiber.Ctx) error {
	articleID := c.Params("articleId")
	userToken, ok := c.Locals("user").(*jwt.Token)
	if !ok {
		return c.JSON(fiber.Map{"is_bookmarked": false})
	}

	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))

	var count int64
	database.DB.Model(&models.Bookmark{}).Where("user_id = ? AND article_id = ?", userID, articleID).Count(&count)

	return c.JSON(fiber.Map{"is_bookmarked": count > 0})
}
