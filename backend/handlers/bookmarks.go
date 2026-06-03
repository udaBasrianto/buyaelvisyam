package handlers

import (
	"backend/database"
	"backend/models"
	"strings"
	"time"

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

func UpsertReadingProgress(c *fiber.Ctx) error {
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))

	var body struct {
		ArticleID string  `json:"article_id"`
		Progress  float64 `json:"progress"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	aid, err := uuid.Parse(strings.TrimSpace(body.ArticleID))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid article ID"})
	}

	p := body.Progress
	if p < 0 {
		p = 0
	}
	if p > 1 {
		p = 1
	}

	db := database.DB
	var rp models.ReadingProgress
	if err := db.Where("user_id = ? AND article_id = ?", userID, aid).First(&rp).Error; err == nil {
		if p < rp.Progress {
			p = rp.Progress
		}
		rp.Progress = p
		rp.UpdatedAt = time.Now()
		db.Save(&rp)
		return c.JSON(rp)
	}

	rp = models.ReadingProgress{
		ID:        uuid.New(),
		UserID:    userID,
		ArticleID: aid,
		Progress:  p,
		UpdatedAt: time.Now(),
	}
	db.Create(&rp)
	return c.JSON(rp)
}

func GetContinueReading(c *fiber.Ctx) error {
	userToken := c.Locals("user").(*jwt.Token)
	claims := userToken.Claims.(jwt.MapClaims)
	userID, _ := uuid.Parse(claims["user_id"].(string))

	limit := c.QueryInt("limit", 6)
	if limit <= 0 {
		limit = 6
	}
	if limit > 20 {
		limit = 20
	}

	type Row struct {
		ArticleID uuid.UUID
		Progress  float64
		UpdatedAt time.Time
	}
	var rows []Row
	if err := database.DB.Model(&models.ReadingProgress{}).
		Select("article_id, progress, updated_at").
		Where("user_id = ?", userID).
		Order("updated_at desc").
		Limit(limit).
		Scan(&rows).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal memuat progres"})
	}

	articleIDs := make([]uuid.UUID, 0, len(rows))
	for _, r := range rows {
		articleIDs = append(articleIDs, r.ArticleID)
	}

	articleByID := map[uuid.UUID]models.Article{}
	if len(articleIDs) > 0 {
		var articles []models.Article
		database.DB.Where("id IN ?", articleIDs).Find(&articles)
		for _, a := range articles {
			articleByID[a.ID] = a
		}
	}

	out := make([]fiber.Map, 0, len(rows))
	for _, r := range rows {
		a, ok := articleByID[r.ArticleID]
		if !ok {
			continue
		}
		out = append(out, fiber.Map{
			"article":    a,
			"progress":   r.Progress,
			"updated_at": r.UpdatedAt,
		})
	}

	return c.JSON(out)
}
